import express from "express";
import {
    getRecent,
    getStats,
    login,
    logout,
    runRollup,
    showDashboard,
    showLogin,
} from "../controllers/adminController.js";
import { requireAdmin, requireCronSecret } from "../middleware/adminAuth.js";

// Admin dashboard; deliberately left out of the OpenAPI docs
const router = express.Router();

router.get("/login", showLogin);
router.post("/login", login);
router.post("/logout", logout);

router.get("/", requireAdmin, showDashboard);
router.get("/api/stats", requireAdmin, getStats);
router.get("/api/recent", requireAdmin, getRecent);

router.get("/cron/rollup", requireCronSecret, runRollup);

export default router;
