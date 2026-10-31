import crypto from "node:crypto";
import ApiLog from "../models/ApiLog.js";

// Query params worth recording; anything else is ignored
const TRACKED_PARAMS = [
    "q", "name", "address", "code", "state", "ownership", "category",
    "faculty", "course", "institution", "degree", "sort", "page", "limit",
];
// Params that are about paging/ordering rather than what was searched for
const NON_TERM_PARAMS = new Set(["sort", "page", "limit"]);
// Params whose values are comma-separated lists
const LIST_PARAMS = new Set(["code", "state", "ownership", "category", "faculty", "course", "institution", "degree"]);

const MAX_VALUE_LENGTH = 100;

const clip = (value, max = MAX_VALUE_LENGTH) => (value.length > max ? value.slice(0, max) : value);

export const clientIp = (req) => {
    const forwarded = req.headers["x-forwarded-for"];
    const ip = forwarded ? String(forwarded).split(",")[0].trim() : req.ip || "";
    return ip.replace(/^::ffff:/, "");
};

const hashIp = (ip) => crypto.createHmac("sha256", process.env.IP_HASH_SALT || "").update(ip).digest("hex");

// 102.89.34.7 -> 102.89.x.x, 2001:db8:85a3::1 -> 2001:db8:x:x
const maskIp = (ip) => {
    if (ip.includes(".")) return `${ip.split(".").slice(0, 2).join(".")}.x.x`;
    return `${ip.split(":").filter(Boolean).slice(0, 2).join(":")}:x:x`;
};

const classifyClient = (userAgent) => {
    if (!userAgent) return "unknown";
    if (/bot|crawl|spider|slurp|preview|facebookexternalhit/i.test(userAgent)) return "bot";
    if (/curl|wget|postman|insomnia|httpie|thunder client|bruno|hoppscotch/i.test(userAgent)) return "cli";
    if (/mozilla\//i.test(userAgent)) return "browser";
    return "server";
};

const safeDecode = (value) => {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
};

const refererHost = (req) => {
    const source = req.headers.origin || req.headers.referer;
    if (!source) return undefined;
    try {
        return new URL(source).host;
    } catch {
        return undefined;
    }
};

// Raw filter values plus normalised { key, value } terms (one per list item)
const parseFilters = (query) => {
    const filters = {};
    const terms = [];

    for (const key of TRACKED_PARAMS) {
        if (query[key] === undefined || query[key] === "") continue;
        const raw = clip(String(query[key]));
        filters[key] = raw;
        if (NON_TERM_PARAMS.has(key)) continue;

        const values = LIST_PARAMS.has(key) ? raw.split(",") : [raw];
        for (const value of values) {
            const normalised = value.trim().toLowerCase();
            if (normalised) terms.push({ key, value: normalised });
        }
    }
    return { filters, terms };
};

// Records every request under the mount path in ApiLog once the response has been sent
export const requestLogger = (req, res, next) => {
    const start = process.hrtime.bigint();
    // The router resets baseUrl and params when an error leaves it, so capture what we need now
    const base = req.baseUrl;

    res.on("finish", () => {
        const route = req.route ? `${base}${req.route.path}` : "unmatched";
        const pathname = req.originalUrl.split("?")[0];
        const userAgent = req.headers["user-agent"] ? clip(req.headers["user-agent"], 300) : undefined;
        const ip = clientIp(req);
        const { filters, terms } = parseFilters(req.query);

        let institutionCode;
        if (route.startsWith(`${base}/institutions/`) && route.endsWith("/:code")) {
            institutionCode = clip(safeDecode(pathname.split("/").pop())).toUpperCase();
        }

        ApiLog.create({
            method: req.method,
            route,
            path: clip(pathname, 300),
            status: res.statusCode,
            durationMs: Number(process.hrtime.bigint() - start) / 1e6,
            filters,
            terms,
            resultCount: res.locals.resultCount,
            institutionCode,
            ipHash: ip ? hashIp(ip) : undefined,
            ipMasked: ip ? maskIp(ip) : undefined,
            userAgent,
            clientType: classifyClient(userAgent),
            refererHost: refererHost(req),
            country: req.headers["x-vercel-ip-country"],
            errorMessage: res.locals.errorMessage,
        }).catch((error) => console.error(`Failed to log API request: ${error.message}`));
    });

    next();
};
