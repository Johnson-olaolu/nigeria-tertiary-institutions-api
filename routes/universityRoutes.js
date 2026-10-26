import express from "express";
import { getAllUniversities, getUniversityById } from "../controllers/universityController.js";

const router = express.Router();

// Get all universities
router.get('/universities', getAllUniversities);

// Get single university by ID
router.get('/universities/:id', getUniversityById);

export default router;