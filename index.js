import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

// Import Route Files
import institutionRoutes from "./routes/institutionRoutes.js";
import universityRoutes from "./routes/universityRoutes.js";
import polytechnicRoutes from "./routes/polytechnicRoutes.js";
import collegeRoutes from "./routes/collegeRoutes.js";
import facultyRoutes from "./routes/facultyRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";

// Import Error Handler Middleware
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Mount API Routes
app.use("/api", institutionRoutes);
app.use("/api", universityRoutes);
app.use("/api", polytechnicRoutes);
app.use("/api", collegeRoutes);
app.use("/api", facultyRoutes);
app.use("/api", courseRoutes);
app.use("/api/search", searchRoutes);

// Global Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});