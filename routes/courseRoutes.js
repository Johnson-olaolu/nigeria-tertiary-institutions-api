import express from "express";
import { getAllCourses, getCourseById } from "../controllers/courseController.js";

const router = express.Router();

/**
 * @openapi
 * /api/courses:
 *   get:
 *     tags: [Courses]
 *     operationId: listCourses
 *     summary: List courses
 *     parameters:
 *       - $ref: '#/components/parameters/CategoryQuery'
 *       - name: faculty
 *         in: query
 *         description: Filter by faculty ObjectId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of courses
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
 *                     $ref: '#/components/schemas/CourseWithFaculty'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/courses', getAllCourses);

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
