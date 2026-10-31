import express from "express";
import { getAllCourses, getCourseById, queryCourses } from "../controllers/courseController.js";
import { setCategory } from "../middleware/setCategory.js";
import { CATEGORY_ALIASES } from "../utils/queryHelpers.js";

const router = express.Router();

/**
 * @openapi
 * /api/courses:
 *   get:
 *     tags: [Courses]
 *     operationId: listCourses
 *     summary: List all courses
 *     description: Use `/api/courses/query` to filter.
 *     parameters:
 *       - $ref: '#/components/parameters/CourseSort'
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/Limit'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/CourseList'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/courses', getAllCourses);

/**
 * @openapi
 * /api/courses/query:
 *   get:
 *     tags: [Courses]
 *     operationId: queryCourses
 *     summary: Query courses
 *     description: |
 *       Filter courses by faculty and by the institutions that offer them. Examples:
 *       - `?institution=ABU`: courses offered at Ahmadu Bello University
 *       - `?faculty=LAW`: courses in law faculties
 *       - `?category=Polytechnic&state=Lagos`: courses offered by a polytechnic in Lagos
 *
 *       `category`, `state` and `ownership` must all hold for the **same** offering institution,
 *       so `?category=University&ownership=Private` means "offered by a private university".
 *       Each result's `offeredBy` breaks down how many institutions of each type offer it.
 *     parameters:
 *       - $ref: '#/components/parameters/CourseQ'
 *       - $ref: '#/components/parameters/CourseFacultyFilter'
 *       - $ref: '#/components/parameters/InstitutionFilter'
 *       - $ref: '#/components/parameters/CategoryQuery'
 *       - $ref: '#/components/parameters/StateQuery'
 *       - $ref: '#/components/parameters/OwnershipQuery'
 *       - $ref: '#/components/parameters/CourseSort'
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/Limit'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/CourseList'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/courses/query', queryCourses);

/**
 * @openapi
 * /api/courses/universities:
 *   get:
 *     tags: [Courses]
 *     operationId: queryUniversityCourses
 *     summary: Courses offered by universities
 *     description: Same filters as `/api/courses/query`, limited to courses offered by at least one of the universities.
 *     parameters:
 *       - $ref: '#/components/parameters/CourseQ'
 *       - $ref: '#/components/parameters/CourseFacultyFilter'
 *       - $ref: '#/components/parameters/InstitutionFilter'
 *       - $ref: '#/components/parameters/StateQuery'
 *       - $ref: '#/components/parameters/OwnershipQuery'
 *       - $ref: '#/components/parameters/CourseSort'
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/Limit'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/CourseList'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 * /api/courses/polytechnics:
 *   get:
 *     tags: [Courses]
 *     operationId: queryPolytechnicCourses
 *     summary: Courses offered by polytechnics
 *     description: Same filters as `/api/courses/query`, limited to courses offered by at least one of the polytechnics.
 *     parameters:
 *       - $ref: '#/components/parameters/CourseQ'
 *       - $ref: '#/components/parameters/CourseFacultyFilter'
 *       - $ref: '#/components/parameters/InstitutionFilter'
 *       - $ref: '#/components/parameters/StateQuery'
 *       - $ref: '#/components/parameters/OwnershipQuery'
 *       - $ref: '#/components/parameters/CourseSort'
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/Limit'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/CourseList'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 * /api/courses/college-of-education:
 *   get:
 *     tags: [Courses]
 *     operationId: queryCollegeOfEducationCourses
 *     summary: Courses offered by colleges of education
 *     description: Same filters as `/api/courses/query`, limited to courses offered by at least one of the colleges of education.
 *     parameters:
 *       - $ref: '#/components/parameters/CourseQ'
 *       - $ref: '#/components/parameters/CourseFacultyFilter'
 *       - $ref: '#/components/parameters/InstitutionFilter'
 *       - $ref: '#/components/parameters/StateQuery'
 *       - $ref: '#/components/parameters/OwnershipQuery'
 *       - $ref: '#/components/parameters/CourseSort'
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/Limit'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/CourseList'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
for (const [segment, category] of Object.entries(CATEGORY_ALIASES)) {
    router.get(`/courses/${segment}`, setCategory(category), queryCourses);
}

/**
 * @openapi
 * /api/courses/{id}:
 *   get:
 *     tags: [Courses]
 *     operationId: getCourseById
 *     summary: Get a course with the institutions that offer it
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Course ObjectId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CourseDetail'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/courses/:id', getCourseById);

export default router;
