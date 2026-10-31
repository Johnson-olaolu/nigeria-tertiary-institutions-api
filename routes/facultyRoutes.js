import express from "express";
import { getAllFaculties, getFacultyCourses } from "../controllers/facultyController.js";

const router = express.Router();

/**
 * @openapi
 * /api/faculties:
 *   get:
 *     tags: [Faculties]
 *     operationId: listFaculties
 *     summary: List faculties/schools
 *     parameters:
 *       - $ref: '#/components/parameters/CategoryQuery'
 *     responses:
 *       200:
 *         description: List of faculties
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Faculty'
 */
router.get('/faculties', getAllFaculties);

/**
 * @openapi
 * /api/faculties/{id}/courses:
 *   get:
 *     tags: [Faculties]
 *     operationId: listFacultyCourses
 *     summary: List the courses under a faculty
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Faculty ObjectId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Courses in the faculty
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 faculty:
 *                   $ref: '#/components/schemas/Faculty'
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Course'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/faculties/:id/courses', getFacultyCourses);

export default router;
