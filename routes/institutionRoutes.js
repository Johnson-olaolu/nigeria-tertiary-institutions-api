import express from "express";
import { getAllInstitutions, getInstitutionById } from "../controllers/institutionController.js";

const router = express.Router();

// Get all institutions
router.get('/institutions', getAllInstitutions);

// Get single institution
router.get('/institutions/:id', getInstitutionById);

export default router;