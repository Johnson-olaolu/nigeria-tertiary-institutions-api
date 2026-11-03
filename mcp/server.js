// MCP server exposing the API's query logic as read-only tools; mounted at /mcp in index.js
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import Institution, { CATEGORIES, OWNERSHIPS } from "../models/Institution.js";
import Faculty from "../models/Faculty.js";
import Course from "../models/Course.js";
import {
    SORT_FIELDS as INSTITUTION_SORT_FIELDS,
    getInstitutionProfile,
    searchInstitutions,
} from "../controllers/institutionController.js";
import { SORT_FIELDS as FACULTY_SORT_FIELDS, getFacultyWithCourses, searchFaculties } from "../controllers/facultyController.js";
import { SORT_FIELDS as COURSE_SORT_FIELDS, getCourseDetail, searchCourses } from "../controllers/courseController.js";
import { MAX_LIMIT } from "../utils/queryHelpers.js";
import { recordApiLog } from "../middleware/requestLogger.js";

// Smaller than the REST default so an unfiltered search doesn't flood the model's context
const MCP_DEFAULT_LIMIT = 20;

const INSTRUCTIONS = [
    "Data on Nigerian tertiary institutions: universities, polytechnics and colleges of education, their faculties/schools, and the courses each institution offers.",
    "",
    "- Institutions are identified by a unique code (e.g. ABU, LAGOS, YABATECH). Use search_institutions to find a code, then get_institution for the full profile.",
    "- Universities have faculties, polytechnics call them schools, and colleges of education share a single NCE school.",
    "- course, faculty and institution filters accept a code (exact match, e.g. COMPUTER_SCIENCE, LAW, ABU) or any text, which matches names containing it (e.g. engineering).",
    "- String filters accept comma-separated values, matched as any of them (state: \"Lagos,Ogun\"). Different filters must all match.",
    "- Text filters are case-insensitive. state must be a full state name.",
    `- Search results are paginated (default ${MCP_DEFAULT_LIMIT}, max ${MAX_LIMIT} per page). Check total and pages, and request further pages if needed.`,
    "- Call get_dataset_overview to see the valid states, categories and ownership types.",
].join("\n");

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

// Fields that only cost tokens
const NOISE_FIELDS = new Set(["__v", "createdAt", "updatedAt"]);
const stripNoise = (key, value) => (NOISE_FIELDS.has(key) ? undefined : value);

const sortSchema = (fields) =>
    z
        .enum(fields.flatMap((field) => [field, `-${field}`]))
        .optional()
        .describe("Field to sort by, prefixed with - for descending. Defaults to name.");

const paginationSchema = {
    page: z.number().int().min(1).default(1).describe("Page number, starting at 1"),
    limit: z.number().int().min(1).max(MAX_LIMIT).default(MCP_DEFAULT_LIMIT).describe(`Results per page (max ${MAX_LIMIT})`),
};

const categorySchema = z.array(z.enum(CATEGORIES)).optional().describe("Institution categories, matched as any of them");
const ownershipSchema = z.array(z.enum(OWNERSHIPS)).optional().describe("Ownership types, matched as any of them");
const text = (description) => z.string().optional().describe(description);

// Tool args -> the REST query object the controllers expect (arrays become comma-separated lists)
const toQuery = (args) =>
    Object.fromEntries(
        Object.entries(args)
            .filter(([, value]) => value !== undefined && !(Array.isArray(value) && !value.length))
            .map(([key, value]) => [key, Array.isArray(value) ? value.join(",") : value])
    );

export const createMcpServer = (req) => {
    const server = new McpServer({ name: "nigeria-tertiary-institutions", version: "1.0.0" }, { instructions: INSTRUCTIONS });

    // Runs a tool, logs it to ApiLog like a REST request, and returns the result (or error) as JSON text
    const register = (name, config, run) =>
        server.registerTool(name, { ...config, annotations: { title: config.title, ...READ_ONLY } }, async (args = {}) => {
            const start = process.hrtime.bigint();
            const query = toQuery(args);
            let status = 200;
            let result;
            let errorMessage;

            try {
                result = await run(query);
            } catch (error) {
                status = error.status ?? 500;
                errorMessage = error.message;
            }

            recordApiLog(req, {
                method: "MCP",
                route: `mcp:${name}`,
                path: `/mcp/${name}`,
                status,
                durationMs: Number(process.hrtime.bigint() - start) / 1e6,
                query,
                resultCount: result?.total ?? result?.count,
                institutionCode: name === "get_institution" ? query.code : undefined,
                errorMessage,
                clientType: "mcp",
            });

            if (errorMessage) return { isError: true, content: [{ type: "text", text: errorMessage }] };
            return { content: [{ type: "text", text: JSON.stringify(result, stripNoise) }] };
        });

    register(
        "search_institutions",
        {
            title: "Search institutions",
            description:
                "Find universities, polytechnics and colleges of education by name, location, ownership, or what they offer. " +
                "Each result includes courseCount and facultyCount. When filtering by course or faculty, each result also lists the matchedCourses.",
            inputSchema: {
                q: text("Free text matched against name, code, state and address"),
                name: text("Text contained in the institution name"),
                address: text("Text contained in the address, e.g. a town"),
                code: text("Exact institution code(s), comma-separated"),
                state: text("Full state name(s), comma-separated, e.g. Lagos,Ogun"),
                ownership: ownershipSchema,
                category: categorySchema,
                course: text("Offers this course (code or name)"),
                faculty: text("Offers a course in this faculty/school (code or name)"),
                sort: sortSchema(INSTITUTION_SORT_FIELDS),
                ...paginationSchema,
            },
        },
        (query) => searchInstitutions(query)
    );

    register(
        "get_institution",
        {
            title: "Get institution profile",
            description: "Full profile of one institution by code: details, website, and every faculty/school with the courses it offers there.",
            inputSchema: { code: z.string().describe("Institution code, e.g. ABU") },
        },
        ({ code }) => getInstitutionProfile(code)
    );

    register(
        "search_faculties",
        {
            title: "Search faculties and schools",
            description:
                "Find faculties (universities) and schools (polytechnics, and the NCE school of colleges of education). " +
                "Each result includes courseCount and institutionCount for the whole faculty. When filtering by institution or course, each result also lists the matchedCourses.",
            inputSchema: {
                q: text("Free text matched against faculty code and name"),
                category: categorySchema,
                degree: text("Text contained in the degree awarded, e.g. HND, B.Sc"),
                institution: text("Has a course offered by this institution (code or name)"),
                course: text("Contains this course (code or name)"),
                sort: sortSchema(FACULTY_SORT_FIELDS),
                ...paginationSchema,
            },
        },
        (query) => searchFaculties(query)
    );

    register(
        "get_faculty_courses",
        {
            title: "List a faculty's courses",
            description: "A faculty/school and every course under it. Get the id from search_faculties.",
            inputSchema: { id: z.string().describe("Faculty _id from search_faculties") },
        },
        async ({ id }) => {
            const { faculty, courses } = await getFacultyWithCourses(id);
            return { faculty, count: courses.length, courses };
        }
    );

    register(
        "search_courses",
        {
            title: "Search courses",
            description:
                "Find courses by name, faculty, or the institutions that offer them. " +
                "category, state and ownership must all hold for the same offering institution: category University with ownership Private and state Lagos means 'offered by a private university in Lagos'. " +
                "Each result includes institutionCount and an offeredBy breakdown by category.",
            inputSchema: {
                q: text("Free text matched against course code and name"),
                faculty: text("Faculty/school _id, code or name"),
                institution: text("Offered by this institution (code or name)"),
                category: categorySchema,
                state: text("Offered by an institution in this state (full name, comma-separated for several)"),
                ownership: ownershipSchema,
                sort: sortSchema(COURSE_SORT_FIELDS),
                ...paginationSchema,
            },
        },
        (query) => searchCourses(query)
    );

    register(
        "get_course",
        {
            title: "Get course detail",
            description: "One course with its faculty and every institution that offers it. Get the id from search_courses.",
            inputSchema: { id: z.string().describe("Course _id from search_courses") },
        },
        ({ id }) => getCourseDetail(id)
    );

    register(
        "get_dataset_overview",
        {
            title: "Dataset overview",
            description: "Counts by category, and the valid values for the category, ownership, state and sort filters. Call this first if unsure what to pass.",
            // Empty rather than omitted: without a schema the SDK passes request context as the first argument
            inputSchema: {},
        },
        async () => {
            const [institutions, faculties, courses, states] = await Promise.all([
                Institution.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]),
                Faculty.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]),
                Course.estimatedDocumentCount(),
                Institution.distinct("state"),
            ]);
            const byCategory = (rows) => Object.fromEntries(CATEGORIES.map((c) => [c, rows.find((r) => r._id === c)?.count ?? 0]));

            return {
                institutions: byCategory(institutions),
                faculties: byCategory(faculties),
                courses,
                categories: CATEGORIES,
                ownerships: OWNERSHIPS,
                states: states.sort(),
                sortFields: {
                    search_institutions: INSTITUTION_SORT_FIELDS,
                    search_faculties: FACULTY_SORT_FIELDS,
                    search_courses: COURSE_SORT_FIELDS,
                },
            };
        }
    );

    return server;
};
