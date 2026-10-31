import mongoose from "mongoose";

const countSchema = new mongoose.Schema({ key: String, count: Number }, { _id: false });

// One document per WAT day, built from ApiLog by utils/rollup.js and kept forever
const apiDailyStatSchema = new mongoose.Schema(
    {
        date: { type: Date, required: true, unique: true },
        requests: Number,
        success: Number,
        clientErrors: Number,
        serverErrors: Number,
        avgMs: Number,
        p95Ms: Number,
        uniqueConsumers: Number,
        // Requests per hour of the day in WAT (24 entries)
        hourly: [Number],
        statuses: [countSchema],
        endpoints: [
            {
                _id: false,
                route: String,
                calls: Number,
                errorCount: Number,
                avgMs: Number,
                p95Ms: Number,
            },
        ],
        filterKeys: [countSchema],
        // Top values per filter key, e.g. { state: [{ key: "lagos", count: 12 }] }
        topValues: { type: Map, of: [countSchema] },
        institutions: [countSchema],
        zeroResults: Number,
        zeroResultQueries: [countSchema],
        notFoundCodes: [countSchema],
        clientTypes: [countSchema],
        referers: [countSchema],
        countries: [countSchema],
        topConsumers: [countSchema],
        computedAt: Date,
    },
    { versionKey: false }
);

export default mongoose.model("ApiDailyStat", apiDailyStatSchema);
