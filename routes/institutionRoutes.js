import express from "express";
import { getAllInstitutions, getInstitutionByCode } from "../controllers/institutionController.js";

const router = express.Router();

/**
 * @openapi
 * /api/institutions:
 *   get:
 *     tags: [Institutions]
 *     operationId: listInstitutions
 *     summary: List institutions
 *     parameters:
 *       - $ref: '#/components/parameters/CategoryQuery'
 *       - $ref: '#/components/parameters/StateQuery'
 *       - $ref: '#/components/parameters/OwnershipQuery'
 *     responses:
 *       200:
 *         description: List of institutions
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
router.get('/institutions', getAllInstitutions);

/**
 * @openapi
 * /api/institutions/{code}:
 *   get:
 *     tags: [Institutions]
 *     operationId: getInstitutionByCode
 *     summary: Get an institution by code, with its faculties and courses
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
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/institutions/:code', getInstitutionByCode);

export default router;
