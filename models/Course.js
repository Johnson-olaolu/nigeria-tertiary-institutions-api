import mongoose from "mongoose";

/**
 * @openapi
 * components:
 *   schemas:
 *     Course:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         code:
 *           type: string
 *           example: LAW
 *         name:
 *           type: string
 *           example: Law
 *         faculty:
 *           type: string
 *           description: Faculty ObjectId
 *     MatchedCourse:
 *       description: A course that satisfied a course/faculty/institution filter
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         code:
 *           type: string
 *           example: LAW
 *         name:
 *           type: string
 *           example: Law
 *     CourseListItem:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         code:
 *           type: string
 *           example: LAW
 *         name:
 *           type: string
 *           example: Law
 *         faculty:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             code:
 *               type: string
 *               example: LAW
 *             name:
 *               type: string
 *               example: Faculty/School/College of Law
 *             category:
 *               $ref: '#/components/schemas/Category'
 *         institutionCount:
 *           type: integer
 *           description: Number of institutions offering the course
 *           example: 112
 *         offeredBy:
 *           type: object
 *           description: Number of offering institutions of each type
 *           properties:
 *             University:
 *               type: integer
 *               example: 112
 *             Polytechnic:
 *               type: integer
 *               example: 0
 *             College of Education:
 *               type: integer
 *               example: 0
 *     CourseDetail:
 *       description: A course with its faculty and the institutions that offer it
 *       allOf:
 *         - $ref: '#/components/schemas/Course'
 *         - type: object
 *           properties:
 *             faculty:
 *               $ref: '#/components/schemas/Faculty'
 *             institutions:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InstitutionSummary'
 */
const courseSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: [true, "Course code is required"],
            trim: true,
        },
        name: {
            type: String,
            required: [true, "Course name is required"],
            trim: true,
        },
        faculty: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Faculty",
            required: [true, "Associated faculty reference is required"],
        },
        institutions: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Institution",
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Same course code can live under more than one faculty (e.g. ACCOUNTING)
courseSchema.index({ faculty: 1, code: 1 }, { unique: true });
courseSchema.index({ code: 1 });
courseSchema.index({ institutions: 1 });

export default mongoose.model("Course", courseSchema);
