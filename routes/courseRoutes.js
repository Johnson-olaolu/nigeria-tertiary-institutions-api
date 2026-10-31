import express from "express";
import { getAllCourses, getCourseById } from "../controllers/courseController.js";

const router = express.Router();

// Get all courses (e.g. /api/courses?category=University&faculty=<facultyId>)
router.get('/courses', getAllCourses);

// Get single course with offering institutions
router.get('/courses/:id', getCourseById);

export default router;
