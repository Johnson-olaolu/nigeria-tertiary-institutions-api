import express from "express";
import { getAllFaculties, getFacultyCourses } from "../controllers/facultyController.js";

const router = express.Router();

// Get all faculties/schools (e.g. /api/faculties?category=Polytechnic)
router.get('/faculties', getAllFaculties);

// Get courses under a faculty
router.get('/faculties/:id/courses', getFacultyCourses);

export default router;
