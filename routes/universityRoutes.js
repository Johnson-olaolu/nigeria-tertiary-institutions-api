import express from "express";
import { getAllInstitutions, getInstitutionByCode } from "../controllers/institutionController.js";

const router = express.Router();

// Restrict institution lookups to the University category
const setCategory = (req, res, next) => {
    req.category = "University";
    next();
};

/**
 * @openapi
 * /api/universities:
 *   get:
 *     tags: [Institutions]
 *     operationId: listUniversitys
 *     summary: List all universities
 *     parameters:
 *       - $ref: '#/components/parameters/StateQuery'
 *       - $ref: '#/components/parameters/OwnershipQuery'
 *     responses:
 *       200:
 *         description: List of universities
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
router.get('/universities', setCategory, getAllInstitutions);

/**
 * @openapi
 * /api/universities/{code}:
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
router.get('/universities/:code', setCategory, getInstitutionByCode);

export default router;
