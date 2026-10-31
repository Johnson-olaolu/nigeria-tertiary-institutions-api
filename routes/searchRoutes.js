import express from "express";
import { getInstitutionsByCourse, getInstitutionsByFaculty, globalSearch } from "../controllers/searchController.js";

const router = express.Router();

/**
 * @openapi
 * /api/search:
 *   get:
 *     tags: [Search]
 *     operationId: searchInstitutions
 *     summary: Search institutions by name, code or state
 *     parameters:
 *       - name: keyword
 *         in: query
 *         required: true
 *         description: Case-insensitive text to match
 *         schema:
 *           type: string
 *         example: ahmadu
 *     responses:
 *       200:
 *         description: Matching institutions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 keyword:
 *                   type: string
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Institution'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/', globalSearch);

/**
 * @openapi
 * /api/search/courses/{courseId}:
 *   get:
 *     tags: [Search]
 *     operationId: searchByCourse
 *     summary: Find institutions offering a course code
 *     description: A course code can exist under more than one faculty (e.g. ACCOUNTING), so `data` is an array of courses.
 *     parameters:
 *       - name: courseId
 *         in: path
 *         required: true
 *         description: Course code
 *         schema:
 *           type: string
 *         example: LAW
 *     responses:
 *       200:
 *         description: Courses with that code and their institutions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 courseId:
 *                   type: string
 *                 count:
 *                   type: integer
 *                   description: Total institution listings across the matched courses
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CourseDetail'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/courses/:courseId', getInstitutionsByCourse);

/**
 * @openapi
 * /api/search/faculties/{facultyId}:
 *   get:
 *     tags: [Search]
 *     operationId: searchByFaculty
 *     summary: Find institutions offering courses under faculties matching a code or name
 *     parameters:
 *       - name: facultyId
 *         in: path
 *         required: true
 *         description: Faculty code or part of its name (case-insensitive)
 *         schema:
 *           type: string
 *         example: LAW
 *     responses:
 *       200:
 *         description: Matching faculties and institutions grouped by category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 facultyId:
 *                   type: string
 *                 faculties:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Faculty'
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: object
 *                   description: Institutions keyed by category
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/InstitutionSummary'
 */
router.get("/faculties/:facultyId", getInstitutionsByFaculty);

export default router;
