import express from "express";
import { getAllInstitutions, getInstitutionByCode } from "../controllers/institutionController.js";

const router = express.Router();

// Get all institutions
router.get('/institutions', getAllInstitutions);

// Get single institution by its code (e.g. /api/institutions/ABU)
router.get('/institutions/:code', getInstitutionByCode);

export default router;
