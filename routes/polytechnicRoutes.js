import express from "express";
import { getAllPolytechnics, getPolytechnicById } from "../controllers/polytechnicController.js";

const router = express.Router();

// Get all polytechnics
router.get('/polytechnics', getAllPolytechnics);

// Get single polytechnic
router.get('/polytechnics/:id', getPolytechnicById);

export default router;