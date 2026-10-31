import path from "path";
import { fileURLToPath } from "url";
import swaggerJsdoc from "swagger-jsdoc";
import { CATEGORIES, OWNERSHIPS } from "../models/Institution.js";
import { SORT_FIELDS as INSTITUTION_SORT_FIELDS } from "../controllers/institutionController.js";
import { SORT_FIELDS as FACULTY_SORT_FIELDS } from "../controllers/facultyController.js";
import { SORT_FIELDS as COURSE_SORT_FIELDS } from "../controllers/courseController.js";
import { DEFAULT_LIMIT, MAX_LIMIT } from "../utils/queryHelpers.js";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const schemaRef = (name) => ({ $ref: `#/components/schemas/${name}` });

const queryParam = (name, description, schema = { type: "string" }, example) => ({
    name,
    in: "query",
    description,
    schema,
    ...(example !== undefined && { example }),
});

const sortParam = (fields) =>
    queryParam(
        "sort",
        "Field to sort by. Prefix with `-` for descending.",
        { type: "string", enum: fields.flatMap((field) => [field, `-${field}`]), default: "name" }
    );

// List responses share one envelope; total/page/pages only appear when paginating
const listResponse = (description, item) => ({
    description,
    content: {
        "application/json": {
            schema: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    count: { type: "integer", description: "Number of items in `data`" },
                    total: { type: "integer", description: "Total matches (only when paginating)" },
                    page: { type: "integer", description: "Current page (only when paginating)" },
                    pages: { type: "integer", description: "Total pages (only when paginating)" },
                    data: { type: "array", items: schemaRef(item) },
                },
            },
        },
    },
});

const errorResponse = (description) => ({
    description,
    content: { "application/json": { schema: schemaRef("Error") } },
});

// Shared pieces referenced from the @openapi comments in routes/, models/ and middleware/
const definition = {
    openapi: "3.0.3",
    info: {
        title: "Nigeria Tertiary Institutions API",
        version: "1.0.0",
        description: [
            "Universities, polytechnics and colleges of education in Nigeria, with their faculties/schools and the courses they offer.",
            "",
            "**Query conventions**",
            "- Text filters (`q`, `name`, `address`, `degree`) are case-insensitive and match anywhere in the field.",
            "- Code-or-name filters (`faculty`, `course`, `institution`): a value that is an existing code (e.g. `LAW`, `ABU`) matches only that code; any other text matches names containing it (e.g. `engineering`).",
            "- Most filters accept comma-separated values, matched as *any of*: `state=Lagos,Ogun`, `course=LAW,MEDICINE`.",
            "- Different filters combine as *all of*.",
            `- Pagination is optional: results are unpaginated unless \`page\` or \`limit\` is passed (default limit ${DEFAULT_LIMIT}, max ${MAX_LIMIT}).`,
        ].join("\n"),
    },
    servers: [{ url: "/" }],
    security: [], // Public API, no authentication
    tags: [
        { name: "Institutions", description: "Institutions, identified by their unique code (e.g. ABU)" },
        {
            name: "Faculties",
            description:
                "Faculties group courses. Universities call them faculties, polytechnics call them **schools**, and colleges of education share a single NCE school.",
        },
        { name: "Courses", description: "Courses and the institutions that offer them" },
    ],
    components: {
        schemas: {
            Category: { type: "string", enum: CATEGORIES },
            Ownership: { type: "string", enum: OWNERSHIPS },
        },
        parameters: {
            Page: queryParam("page", "Page number (enables pagination)", { type: "integer", minimum: 1 }),
            Limit: queryParam("limit", `Items per page (enables pagination). Default ${DEFAULT_LIMIT}, max ${MAX_LIMIT}.`, {
                type: "integer",
                minimum: 1,
                maximum: MAX_LIMIT,
            }),
            InstitutionSort: sortParam(INSTITUTION_SORT_FIELDS),
            FacultySort: sortParam(FACULTY_SORT_FIELDS),
            CourseSort: sortParam(COURSE_SORT_FIELDS),
            CategoryQuery: queryParam(
                "category",
                `Institution category. Comma-separated for several: ${CATEGORIES.join(", ")}`,
                { type: "string" },
                "University"
            ),
            StateQuery: queryParam("state", "State name, exact match (comma-separated for several)", { type: "string" }, "Lagos"),
            OwnershipQuery: queryParam(
                "ownership",
                `Ownership. Comma-separated for several: ${OWNERSHIPS.join(", ")}`,
                { type: "string" },
                "Federal"
            ),
            InstitutionQ: queryParam("q", "Free text matched against name, code, state and address", { type: "string" }, "technology"),
            InstitutionName: queryParam("name", "Text contained in the institution name"),
            InstitutionAddress: queryParam("address", "Text contained in the address", { type: "string" }, "Zaria"),
            InstitutionCode: queryParam("code", "Exact institution code (comma-separated for several)", { type: "string" }, "ABU,UNILAG"),
            FacultyFilter: queryParam(
                "faculty",
                "Institutions with a course in this faculty/school (code or name)",
                { type: "string" },
                "ENG_ENV_TECH"
            ),
            CourseFilter: queryParam("course", "Code or name of a course", { type: "string" }, "COMPUTER_SCIENCE"),
            FacultyQ: queryParam("q", "Free text matched against faculty code and name"),
            Degree: queryParam("degree", "Text contained in the degree awarded", { type: "string" }, "HND"),
            InstitutionFilter: queryParam("institution", "Code or name of an institution offering the course(s)", { type: "string" }, "ABU"),
            CourseQ: queryParam("q", "Free text matched against course code and name"),
            CourseFacultyFilter: queryParam("faculty", "Faculty/school ObjectId, code or name", { type: "string" }, "LAW"),
            InstitutionCodePath: {
                name: "code",
                in: "path",
                required: true,
                description: "Institution code",
                schema: { type: "string" },
                example: "ABU",
            },
        },
        responses: {
            InstitutionList: listResponse("Institutions", "InstitutionListItem"),
            FacultyList: listResponse("Faculties/schools", "FacultyListItem"),
            CourseList: listResponse("Courses", "CourseListItem"),
            InstitutionProfile: {
                description: "Institution profile with its faculties and courses",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean", example: true },
                                data: schemaRef("InstitutionProfile"),
                            },
                        },
                    },
                },
            },
            BadRequest: errorResponse("Invalid query parameter (e.g. unknown category, ownership or sort field)"),
            NotFound: errorResponse("Resource not found"),
        },
    },
};

const swaggerSpec = swaggerJsdoc({
    definition,
    apis: ["routes/*.js", "models/*.js", "middleware/*.js"].map((pattern) => path.join(rootDir, pattern)),
});

export default swaggerSpec;
