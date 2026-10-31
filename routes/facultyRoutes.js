import express from "express";
import { getAllFaculties, getFacultyCourses, queryFaculties } from "../controllers/facultyController.js";
import { setCategory } from "../middleware/setCategory.js";
import { CATEGORY_ALIASES } from "../utils/queryHelpers.js";

const router = express.Router();

/**
 * @openapi
 * /api/faculties:
 *   get:
 *     tags: [Faculties]
 *     operationId: listFaculties
 *     summary: List all faculties/schools
 *     description: Use `/api/faculties/query` to filter.
 *     parameters:
 *       - $ref: '#/components/parameters/FacultySort'
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/Limit'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/FacultyList'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/faculties', getAllFaculties);

/**
 * @openapi
 * /api/faculties/query:
 *   get:
 *     tags: [Faculties]
 *     operationId: queryFaculties
 *     summary: Query faculties/schools
 *     description: |
 *       Filter faculties (universities) and schools (polytechnics). Examples:
 *       - `?institution=ABU`: faculties at Ahmadu Bello University
 *       - `?course=ACCOUNTING`: faculties/schools containing Accounting
 *       - `?category=Polytechnic&degree=HND`: polytechnic schools awarding an HND
 *
 *       When `institution` or `course` is used, each result includes the `matchedCourses` that satisfied it.
 *       `courseCount` and `institutionCount` always describe the whole faculty.
 *     parameters:
 *       - $ref: '#/components/parameters/FacultyQ'
 *       - $ref: '#/components/parameters/CategoryQuery'
 *       - $ref: '#/components/parameters/Degree'
 *       - $ref: '#/components/parameters/InstitutionFilter'
 *       - $ref: '#/components/parameters/CourseFilter'
 *       - $ref: '#/components/parameters/FacultySort'
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/Limit'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/FacultyList'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/faculties/query', queryFaculties);

/**
 * @openapi
 * /api/faculties/universities:
 *   get:
 *     tags: [Faculties]
 *     operationId: queryUniversityFaculties
 *     summary: University faculties
 *     description: Same filters as `/api/faculties/query`, limited to faculties belonging to universities.
 *     parameters:
 *       - $ref: '#/components/parameters/FacultyQ'
 *       - $ref: '#/components/parameters/Degree'
 *       - $ref: '#/components/parameters/InstitutionFilter'
 *       - $ref: '#/components/parameters/CourseFilter'
 *       - $ref: '#/components/parameters/FacultySort'
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/Limit'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/FacultyList'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 * /api/faculties/polytechnics:
 *   get:
 *     tags: [Faculties]
 *     operationId: queryPolytechnicSchools
 *     summary: Polytechnic schools
 *     description: Same filters as `/api/faculties/query`, limited to schools belonging to polytechnics (polytechnics call their faculties schools).
 *     parameters:
 *       - $ref: '#/components/parameters/FacultyQ'
 *       - $ref: '#/components/parameters/Degree'
 *       - $ref: '#/components/parameters/InstitutionFilter'
 *       - $ref: '#/components/parameters/CourseFilter'
 *       - $ref: '#/components/parameters/FacultySort'
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/Limit'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/FacultyList'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 * /api/faculties/college-of-education:
 *   get:
 *     tags: [Faculties]
 *     operationId: queryCollegeOfEducationSchools
 *     summary: College of education schools
 *     description: Same filters as `/api/faculties/query`, limited to the NCE school used by colleges of education.
 *     parameters:
 *       - $ref: '#/components/parameters/FacultyQ'
 *       - $ref: '#/components/parameters/Degree'
 *       - $ref: '#/components/parameters/InstitutionFilter'
 *       - $ref: '#/components/parameters/CourseFilter'
 *       - $ref: '#/components/parameters/FacultySort'
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/Limit'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/FacultyList'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
for (const [segment, category] of Object.entries(CATEGORY_ALIASES)) {
    router.get(`/faculties/${segment}`, setCategory(category), queryFaculties);
}

/**
 * @openapi
 * /api/faculties/{id}/courses:
 *   get:
 *     tags: [Faculties]
 *     operationId: listFacultyCourses
 *     summary: List the courses under a faculty/school
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
