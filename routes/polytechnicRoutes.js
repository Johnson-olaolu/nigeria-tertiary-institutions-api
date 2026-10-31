import express from "express";
import { getAllInstitutions, getInstitutionByCode } from "../controllers/institutionController.js";

const router = express.Router();

// Restrict institution lookups to the Polytechnic category
const setCategory = (req, res, next) => {
    req.category = "Polytechnic";
    next();
};

// Get all polytechnics
router.get('/polytechnics', setCategory, getAllInstitutions);

// Get single Polytechnic by its code
router.get('/polytechnics/:code', setCategory, getInstitutionByCode);

export default router;
