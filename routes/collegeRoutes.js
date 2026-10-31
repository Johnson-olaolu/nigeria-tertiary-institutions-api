import express from "express";
import { getAllInstitutions, getInstitutionByCode } from "../controllers/institutionController.js";

const router = express.Router();

// Restrict institution lookups to the College of Education category
const setCategory = (req, res, next) => {
    req.category = "College of Education";
    next();
};

/**
 * @openapi
 * /api/college-of-education:
 *   get:
 *     tags: [Institutions]
 *     operationId: listCollegesOfEducation
 *     summary: List all colleges of education
 *     parameters:
 *       - $ref: '#/components/parameters/StateQuery'
 *       - $ref: '#/components/parameters/OwnershipQuery'
 *     responses:
 *       200:
 *         description: List of colleges of education
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
 *                     $ref: '#/components/schemas/Institution'
 */
router.get('/college-of-education', setCategory, getAllInstitutions);

/**
 * @openapi
 * /api/college-of-education/{code}:
 *   get:
 *     tags: [Institutions]
 *     operationId: getCollegeOfEducationByCode
 *     summary: Get one of the colleges of education by code, with its faculties and courses
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
 *         description: Institution profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/InstitutionProfile'
 *       404:
 *         description: Institution not found in this category
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/college-of-education/:code', setCategory, getInstitutionByCode);

export default router;
