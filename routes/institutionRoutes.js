import express from "express";
import { getAllInstitutions, getInstitutionByCode, queryInstitutions } from "../controllers/institutionController.js";
import { setCategory } from "../middleware/setCategory.js";
import { CATEGORY_ALIASES } from "../utils/queryHelpers.js";

const router = express.Router();

/**
 * @openapi
 * /api/institutions:
 *   get:
 *     tags: [Institutions]
 *     operationId: listInstitutions
 *     summary: List all institutions
 *     description: Use `/api/institutions/query` to filter.
 *     parameters:
 *       - $ref: '#/components/parameters/InstitutionSort'
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/Limit'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/InstitutionList'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/institutions', getAllInstitutions);

/**
 * @openapi
 * /api/institutions/query:
 *   get:
 *     tags: [Institutions]
 *     operationId: queryInstitutions
 *     summary: Query institutions
 *     description: |
 *       Filter institutions by their own details and by what they offer. Examples:
 *       - `?state=Lagos&ownership=Private`: private institutions in Lagos
 *       - `?course=COMPUTER_SCIENCE`: institutions offering Computer Science
 *       - `?faculty=LAW&category=University`: universities with a law faculty
 *       - `?address=zaria`: institutions with "zaria" in their address
 *
 *       When `course` or `faculty` is used, each result includes the `matchedCourses` that satisfied it.
 *     parameters:
 *       - $ref: '#/components/parameters/InstitutionQ'
 *       - $ref: '#/components/parameters/InstitutionName'
 *       - $ref: '#/components/parameters/InstitutionAddress'
 *       - $ref: '#/components/parameters/InstitutionCode'
 *       - $ref: '#/components/parameters/StateQuery'
 *       - $ref: '#/components/parameters/OwnershipQuery'
 *       - $ref: '#/components/parameters/CategoryQuery'
 *       - $ref: '#/components/parameters/FacultyFilter'
 *       - $ref: '#/components/parameters/CourseFilter'
 *       - $ref: '#/components/parameters/InstitutionSort'
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/Limit'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/InstitutionList'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/institutions/query', queryInstitutions);

/**
 * @openapi
 * /api/institutions/universities:
 *   get:
 *     tags: [Institutions]
 *     operationId: queryUniversities
 *     summary: Query universities
 *     description: Same filters as `/api/institutions/query`, limited to universities.
 *     parameters:
 *       - $ref: '#/components/parameters/InstitutionQ'
 *       - $ref: '#/components/parameters/InstitutionName'
 *       - $ref: '#/components/parameters/InstitutionAddress'
 *       - $ref: '#/components/parameters/InstitutionCode'
 *       - $ref: '#/components/parameters/StateQuery'
 *       - $ref: '#/components/parameters/OwnershipQuery'
 *       - $ref: '#/components/parameters/FacultyFilter'
 *       - $ref: '#/components/parameters/CourseFilter'
 *       - $ref: '#/components/parameters/InstitutionSort'
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/Limit'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/InstitutionList'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 * /api/institutions/polytechnics:
 *   get:
 *     tags: [Institutions]
 *     operationId: queryPolytechnics
 *     summary: Query polytechnics
 *     description: Same filters as `/api/institutions/query`, limited to polytechnics.
 *     parameters:
 *       - $ref: '#/components/parameters/InstitutionQ'
 *       - $ref: '#/components/parameters/InstitutionName'
 *       - $ref: '#/components/parameters/InstitutionAddress'
 *       - $ref: '#/components/parameters/InstitutionCode'
 *       - $ref: '#/components/parameters/StateQuery'
 *       - $ref: '#/components/parameters/OwnershipQuery'
 *       - $ref: '#/components/parameters/FacultyFilter'
 *       - $ref: '#/components/parameters/CourseFilter'
 *       - $ref: '#/components/parameters/InstitutionSort'
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/Limit'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/InstitutionList'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 * /api/institutions/college-of-education:
 *   get:
 *     tags: [Institutions]
 *     operationId: queryCollegesOfEducation
 *     summary: Query colleges of education
 *     description: Same filters as `/api/institutions/query`, limited to colleges of education.
 *     parameters:
 *       - $ref: '#/components/parameters/InstitutionQ'
 *       - $ref: '#/components/parameters/InstitutionName'
 *       - $ref: '#/components/parameters/InstitutionAddress'
 *       - $ref: '#/components/parameters/InstitutionCode'
 *       - $ref: '#/components/parameters/StateQuery'
 *       - $ref: '#/components/parameters/OwnershipQuery'
 *       - $ref: '#/components/parameters/FacultyFilter'
 *       - $ref: '#/components/parameters/CourseFilter'
 *       - $ref: '#/components/parameters/InstitutionSort'
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/Limit'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/InstitutionList'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 * /api/institutions/universities/{code}:
 *   get:
 *     tags: [Institutions]
 *     operationId: getUniversityByCode
 *     summary: Get one of the universities by code, with its faculties and courses
 *     parameters:
 *       - name: code
 *         in: path
 *         required: true
 *         description: Institution code
 *         schema:
 *           type: string
 *         example: ABU
 *     responses:
 *       200:
 *         $ref: '#/components/responses/InstitutionProfile'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * /api/institutions/polytechnics/{code}:
 *   get:
 *     tags: [Institutions]
 *     operationId: getPolytechnicByCode
 *     summary: Get one of the polytechnics by code, with its schools and courses
 *     parameters:
 *       - name: code
 *         in: path
 *         required: true
 *         description: Institution code
 *         schema:
 *           type: string
 *         example: YABATECH
 *     responses:
 *       200:
 *         $ref: '#/components/responses/InstitutionProfile'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * /api/institutions/college-of-education/{code}:
 *   get:
 *     tags: [Institutions]
 *     operationId: getCollegeOfEducationByCode
 *     summary: Get one of the colleges of education by code, with its NCE school and courses
 *     parameters:
 *       - name: code
 *         in: path
 *         required: true
 *         description: Institution code
 *         schema:
 *           type: string
 *         example: IJANIKIN
 *     responses:
 *       200:
 *         $ref: '#/components/responses/InstitutionProfile'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
for (const [segment, category] of Object.entries(CATEGORY_ALIASES)) {
    router.get(`/institutions/${segment}`, setCategory(category), queryInstitutions);
    router.get(`/institutions/${segment}/:code`, setCategory(category), getInstitutionByCode);
}

/**
 * @openapi
 * /api/institutions/{code}:
 *   get:
 *     tags: [Institutions]
 *     operationId: getInstitutionByCode
 *     summary: Get an institution by code, with its faculties and courses
 *     parameters:
 *       - $ref: '#/components/parameters/InstitutionCodePath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/InstitutionProfile'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/institutions/:code', getInstitutionByCode);

export default router;
