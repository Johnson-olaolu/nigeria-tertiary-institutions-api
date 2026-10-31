import express from "express";
import { getAllInstitutions, getInstitutionByCode } from "../controllers/institutionController.js";

const router = express.Router();

// Restrict institution lookups to the College of Education category
const setCategory = (req, res, next) => {
    req.category = "College of Education";
    next();
};

// Get all colleges of education
router.get('/college-of-education', setCategory, getAllInstitutions);

// Get single College of Education by its code
router.get('/college-of-education/:code', setCategory, getInstitutionByCode);

export default router;
