import express from "express";
import { getAllCollegesOfEducation, getCollegeOfEducationById } from "../controllers/collegeController.js";

const router = express.Router();

// GET all College of Education
router.get("/college-of-education", getAllCollegesOfEducation);

// Get single College of Education
router.get("/college-of-education/:id", getCollegeOfEducationById);

export default router;