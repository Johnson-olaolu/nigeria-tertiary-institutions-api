import {
    checkCredentials,
    clearFailedLogins,
    endSession,
    isAdminConfigured,
    isLockedOut,
    recordFailedLogin,
    startSession,
} from "../middleware/adminAuth.js";
import { clientIp } from "../middleware/requestLogger.js";
import { GROUPS, LOG_RANGES, ROLLUP_RANGES, getLogStats, getRecentRequests, getRollupStats } from "../utils/analytics.js";
import { rollupPendingDays } from "../utils/rollup.js";

const renderLogin = (res, error, status = 200) =>
    res.status(status).render("admin/login", { error, configured: isAdminConfigured() });

export const showLogin = (req, res) => renderLogin(res);

export const login = (req, res) => {
    const ip = clientIp(req);

    if (isLockedOut(ip)) return renderLogin(res, "Too many failed attempts. Try again in 15 minutes.", 429);

    if (!checkCredentials(req.body?.username ?? "", req.body?.password ?? "")) {
        recordFailedLogin(ip);
        return renderLogin(res, "Invalid username or password.", 401);
    }

    clearFailedLogins(ip);
    startSession(res);
    res.redirect("/admin");
};

export const logout = (req, res) => {
    endSession(res);
    res.redirect("/admin/login");
};

export const showDashboard = (req, res) => res.render("admin/dashboard", { username: process.env.ADMIN_USERNAME });

// GET /admin/api/stats?range=24h|7d|30d|90d|12m|all&group=day|week|month
export const getStats = async (req, res, next) => {
    try {
        const range = String(req.query.range || "24h");

        if (range in LOG_RANGES) return res.json(await getLogStats(range));

        if (range in ROLLUP_RANGES) {
            const group = GROUPS.includes(req.query.group) ? req.query.group : "day";
            // Catch up on any day the cron missed before reading rollups
            await rollupPendingDays();
            return res.json(await getRollupStats(range, group));
        }

        res.statusCode = 400;
        throw new Error(`Invalid range "${range}"`);
    } catch (error) {
        next(error);
    }
};

export const getRecent = async (req, res, next) => {
    try {
        res.json(await getRecentRequests());
    } catch (error) {
        next(error);
    }
};

// GET /admin/cron/rollup, called daily by Vercel Cron
export const runRollup = async (req, res, next) => {
    try {
        const days = await rollupPendingDays();
        res.json({ rolledUp: days.length, days });
    } catch (error) {
        next(error);
    }
};
