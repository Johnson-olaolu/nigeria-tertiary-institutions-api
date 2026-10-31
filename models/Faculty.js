import mongoose from "mongoose";
import { CATEGORIES } from "./Institution.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     Faculty:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         code:
 *           type: string
 *           example: LAW
 *         name:
 *           type: string
 *           example: Faculty/School/College of Law
 *         category:
 *           $ref: '#/components/schemas/Category'
 *         degreeAwarded:
 *           type: string
 *           example: LLB. (HONS)
 *     FacultyListItem:
 *       allOf:
 *         - $ref: '#/components/schemas/Faculty'
 *         - type: object
 *           properties:
 *             courseCount:
 *               type: integer
 *               description: Courses in the whole faculty
 *               example: 4
 *             institutionCount:
 *               type: integer
 *               description: Institutions offering at least one course in the faculty
 *               example: 119
 *             matchedCourses:
 *               type: array
 *               description: Only present when filtering by `institution` or `course`
 *               items:
 *                 $ref: '#/components/schemas/MatchedCourse'
 */
const facultySchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: [true, "Faculty code is required"],
            trim: true,
        },
        name: {
            type: String,
            required: [true, "Faculty name is required"],
            trim: true,
        },
        category: {
            type: String,
            enum: CATEGORIES, // Institution type this faculty/school belongs to
            required: [true, "Faculty category is required"],
            trim: true,
        },
        degreeAwarded: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

facultySchema.index({ category: 1, code: 1 }, { unique: true });

export default mongoose.model("Faculty", facultySchema);
