import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import swaggerSpec from "./config/swagger.js";
import docsPage from "./config/docsPage.js";

// Import Route Files
import institutionRoutes from "./routes/institutionRoutes.js";
import facultyRoutes from "./routes/facultyRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

// Import Request Logger Middleware
import { requestLogger } from "./middleware/requestLogger.js";

// Import Error Handler Middleware
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Handlebars views for the admin dashboard
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log every API request for the admin dashboard
app.use("/api", requestLogger);

// Mount API Routes
app.use("/api", institutionRoutes);
app.use("/api", facultyRoutes);
app.use("/api", courseRoutes);

// API Documentation (Swagger UI) and the raw OpenAPI spec
app.get("/docs.json", (req, res) => res.json(swaggerSpec));
app.get("/docs", (req, res) => res.type("html").send(docsPage));

// Admin dashboard for API usage
app.use("/admin", adminRoutes);

// Global Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});