import crypto from "node:crypto";

export const SESSION_COOKIE = "admin_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
// Per-instance only: on serverless each instance keeps its own counts, so this slows guessing rather than stopping it
const failedLogins = new Map();

export const isAdminConfigured = () =>
    Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET);

// Signing the credentials too means changing the password logs out existing sessions
const sign = (expiry) =>
    crypto
        .createHmac("sha256", process.env.ADMIN_SESSION_SECRET)
        .update(`${expiry}:${process.env.ADMIN_USERNAME}:${process.env.ADMIN_PASSWORD}`)
        .digest("hex");

// Compares digests so the inputs can differ in length without leaking timing
const safeEqual = (a, b) => {
    const digest = (value) => crypto.createHash("sha256").update(String(value)).digest();
    return crypto.timingSafeEqual(digest(a), digest(b));
};

export const checkCredentials = (username, password) =>
    isAdminConfigured() &&
    // Evaluate both so a wrong username takes as long as a wrong password
    [safeEqual(username, process.env.ADMIN_USERNAME), safeEqual(password, process.env.ADMIN_PASSWORD)].every(Boolean);

const cookieOptions = () => ({
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
});

export const startSession = (res) => {
    const expiry = Date.now() + SESSION_TTL_MS;
    res.cookie(SESSION_COOKIE, `${expiry}.${sign(expiry)}`, { ...cookieOptions(), maxAge: SESSION_TTL_MS });
};

export const endSession = (res) => res.clearCookie(SESSION_COOKIE, cookieOptions());

const readCookie = (req, name) => {
    for (const part of (req.headers.cookie || "").split(";")) {
        const [key, ...value] = part.trim().split("=");
        if (key === name) return decodeURIComponent(value.join("="));
    }
    return null;
};

const hasValidSession = (req) => {
    if (!isAdminConfigured()) return false;
    const [expiry, signature] = (readCookie(req, SESSION_COOKIE) || "").split(".");
    return Boolean(signature) && Number(expiry) > Date.now() && safeEqual(signature, sign(expiry));
};

// Pages redirect to the login form; JSON endpoints get a 401
export const requireAdmin = (req, res, next) => {
    if (hasValidSession(req)) return next();
    if (req.originalUrl.startsWith("/admin/api/")) return res.status(401).json({ message: "Not authenticated" });
    res.redirect("/admin/login");
};

export const isLockedOut = (ip) => {
    const entry = failedLogins.get(ip);
    if (!entry) return false;
    if (entry.resetAt < Date.now()) {
        failedLogins.delete(ip);
        return false;
    }
    return entry.count >= MAX_FAILED_LOGINS;
};

export const recordFailedLogin = (ip) => {
    const entry = failedLogins.get(ip);
    if (!entry || entry.resetAt < Date.now()) {
        failedLogins.set(ip, { count: 1, resetAt: Date.now() + LOCKOUT_MS });
    } else {
        entry.count += 1;
    }
};

export const clearFailedLogins = (ip) => failedLogins.delete(ip);

// Vercel Cron sends "Authorization: Bearer <CRON_SECRET>"
export const requireCronSecret = (req, res, next) => {
    const secret = process.env.CRON_SECRET;
    if (secret && safeEqual(req.headers.authorization || "", `Bearer ${secret}`)) return next();
    res.status(401).json({ message: "Not authorized" });
};
