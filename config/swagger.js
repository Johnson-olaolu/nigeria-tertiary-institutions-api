import path from "path";
import { fileURLToPath } from "url";
import swaggerJsdoc from "swagger-jsdoc";
import { CATEGORIES } from "../models/Institution.js";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

// Shared pieces referenced from the @openapi comments in routes/, models/ and middleware/
const definition = {
    openapi: "3.0.3",
    info: {
        title: "Nigeria Tertiary Institutions API",
        version: "1.0.0",
        description:
            "Universities, polytechnics and colleges of education in Nigeria, with their faculties/schools and the courses they offer.",
    },
    servers: [{ url: "/" }],
    security: [], // Public API, no authentication
    tags: [
        { name: "Institutions", description: "Institutions, looked up by their unique code (e.g. ABU)" },
        { name: "Faculties", description: "Faculties (universities), schools (polytechnics) and the NCE school (colleges of education)" },
        { name: "Courses", description: "Courses and the institutions that offer them" },
        { name: "Search", description: "Find institutions by keyword, course code or faculty" },
    ],
    components: {
        schemas: {
            Category: { type: "string", enum: CATEGORIES },
            Ownership: { type: "string", enum: ["Federal", "State", "Private"] },
        },
        parameters: {
            CategoryQuery: {
                name: "category",
                in: "query",
                description: "Filter by institution category",
                schema: { $ref: "#/components/schemas/Category" },
            },
            StateQuery: {
                name: "state",
                in: "query",
                description: "Filter by state (exact match)",
                schema: { type: "string" },
                example: "Lagos",
            },
            OwnershipQuery: {
                name: "ownership",
                in: "query",
                description: "Filter by ownership",
                schema: { $ref: "#/components/schemas/Ownership" },
            },
        },
        responses: {
            BadRequest: {
                description: "Invalid or missing input",
                content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
            NotFound: {
                description: "Resource not found",
                content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
        },
    },
};

const swaggerSpec = swaggerJsdoc({
    definition,
    apis: ["routes/*.js", "models/*.js", "middleware/*.js"].map((pattern) => path.join(rootDir, pattern)),
});

export default swaggerSpec;
