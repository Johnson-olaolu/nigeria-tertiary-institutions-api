import express from "express";
import { getInstitutionsByCourse, globalSearch } from "../controllers/searchController.js";

const router = express.Router();

// Global keyword search for institutions (e.g., /api/search?keyword=Ahmadu)
router.get('/', globalSearch);

// Find institutions offering a specific course code/ID (e.g., /api/search/courses/CIVIL_LAW)
router.get('/courses/:courseId', getInstitutionsByCourse);

export default router;