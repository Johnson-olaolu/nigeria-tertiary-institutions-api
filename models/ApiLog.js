import mongoose from "mongoose";

// Raw logs are kept this long; ApiDailyStat keeps the long-term history
export const LOG_RETENTION_DAYS = 30;

// One document per /api request, written by middleware/requestLogger.js
const apiLogSchema = new mongoose.Schema(
    {
        method: String,
        // Matched route pattern, e.g. /api/institutions/:code ("unmatched" when no route handled it)
        route: String,
        path: String,
        status: Number,
        durationMs: Number,
        // Raw values of the known query params that were passed
        filters: { type: Map, of: String },
        // Normalised filter values, one entry per comma-separated value, for "top values" stats
        terms: [{ _id: false, key: String, value: String }],
        // Total matches for list endpoints (null for other endpoints)
        resultCount: Number,
        // :code param on institution profile routes
        institutionCode: String,
        ipHash: String,
        ipMasked: String,
        userAgent: String,
        clientType: String,
        refererHost: String,
        country: String,
        errorMessage: String,
        createdAt: { type: Date, default: Date.now },
    },
    { versionKey: false }
);

apiLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: LOG_RETENTION_DAYS * 24 * 60 * 60 });
apiLogSchema.index({ createdAt: -1, route: 1 });

export default mongoose.model("ApiLog", apiLogSchema);
