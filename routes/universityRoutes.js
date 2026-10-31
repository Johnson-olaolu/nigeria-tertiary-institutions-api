import express from "express";
import { getAllInstitutions, getInstitutionByCode } from "../controllers/institutionController.js";

const router = express.Router();

// Restrict institution lookups to the University category
const setCategory = (req, res, next) => {
    req.category = "University";
    next();
};

// Get all universities
router.get('/universities', setCategory, getAllInstitutions);

// Get single University by its code
router.get('/universities/:code', setCategory, getInstitutionByCode);

export default router;
