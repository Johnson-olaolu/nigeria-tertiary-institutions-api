import express from "express";
import { getAllInstitutions, getInstitutionByCode } from "../controllers/institutionController.js";

const router = express.Router();

// Restrict institution lookups to the Polytechnic category
const setCategory = (req, res, next) => {
    req.category = "Polytechnic";
    next();
};

/**
 * @openapi
 * /api/polytechnics:
 *   get:
 *     tags: [Institutions]
 *     operationId: listPolytechnics
 *     summary: List all polytechnics
 *     parameters:
 *       - $ref: '#/components/parameters/StateQuery'
 *       - $ref: '#/components/parameters/OwnershipQuery'
 *     responses:
 *       200:
 *         description: List of polytechnics
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
router.get('/polytechnics', setCategory, getAllInstitutions);

/**
 * @openapi
 * /api/polytechnics/{code}:
 *   get:
 *     tags: [Institutions]
 *     operationId: getPolytechnicByCode
 *     summary: Get one of the polytechnics by code, with its faculties and courses
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
router.get('/polytechnics/:code', setCategory, getInstitutionByCode);

export default router;
