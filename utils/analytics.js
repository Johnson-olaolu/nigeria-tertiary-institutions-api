// Aggregations behind the admin dashboard, over raw ApiLog rows and ApiDailyStat rollups
import ApiLog from "../models/ApiLog.js";
import ApiDailyStat from "../models/ApiDailyStat.js";

// Stats are bucketed in Nigerian time. WAT has no daylight saving, so the offset is fixed.
export const TIMEZONE = "Africa/Lagos";
const TZ_OFFSET_MS = 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;

const TOP_N = 25;

// Ranges served from raw logs (full detail) and from daily rollups (long-term trends)
export const LOG_RANGES = { "24h": { ms: DAY_MS, unit: "hour" }, "7d": { ms: 7 * DAY_MS, unit: "day" }, "30d": { ms: 30 * DAY_MS, unit: "day" } };
export const ROLLUP_RANGES = { "90d": 90, "12m": 365, all: null };
export const GROUPS = ["day", "week", "month"];

// Midnight WAT of the day containing `date`, as a UTC instant
export const startOfDay = (date) => {
    const local = date.getTime() + TZ_OFFSET_MS;
    return new Date(local - (local % DAY_MS) - TZ_OFFSET_MS);
};

const bucketFormat = (unit) => (unit === "hour" ? "%Y-%m-%d %H:00" : "%Y-%m-%d");

const formatBucket = (date, unit) => ({
    $dateToString: { date: { $dateTrunc: { date, unit, timezone: TIMEZONE, startOfWeek: "monday" } }, format: bucketFormat(unit), timezone: TIMEZONE },
});

const isError = { $gte: ["$status", 400] };
const countIf = (condition) => ({ $sum: { $cond: [condition, 1, 0] } });
const p95 = (input) => ({ $percentile: { input, p: [0.95], method: "approximate" } });
const topCounts = (field, extraMatch = {}) => [
    { $match: { [field]: { $nin: [null, ""] }, ...extraMatch } },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $limit: TOP_N },
    { $project: { _id: 0, key: "$_id", count: 1 } },
];

// "/api/institutions/query?state=lagos&course=x", ignoring paging and sorting params
const queryKey = {
    $toLower: {
        $reduce: {
            input: {
                $filter: {
                    input: { $objectToArray: { $ifNull: ["$filters", {}] } },
                    cond: { $not: { $in: ["$$this.k", ["page", "limit", "sort"]] } },
                },
            },
            initialValue: "$route",
            in: { $concat: ["$$value", { $cond: [{ $eq: ["$$value", "$route"] }, "?", "&"] }, "$$this.k", "=", "$$this.v"] },
        },
    },
};

// One $facet over the ApiLog rows of a window; used for the live dashboard and to build daily rollups
const logFacets = (unit) => ({
    overview: [
        {
            $group: {
                _id: null,
                requests: { $sum: 1 },
                success: countIf({ $lt: ["$status", 400] }),
                clientErrors: countIf({ $and: [isError, { $lt: ["$status", 500] }] }),
                serverErrors: countIf({ $gte: ["$status", 500] }),
                avgMs: { $avg: "$durationMs" },
                p95Ms: p95("$durationMs"),
            },
        },
        { $project: { _id: 0, requests: 1, success: 1, clientErrors: 1, serverErrors: 1, avgMs: 1, p95Ms: { $first: "$p95Ms" } } },
    ],
    consumersCount: [{ $group: { _id: "$ipHash" } }, { $count: "count" }],
    timeseries: [
        { $group: { _id: formatBucket("$createdAt", unit), success: countIf({ $lt: ["$status", 400] }), errors: countIf(isError) } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, bucket: "$_id", success: 1, errors: 1 } },
    ],
    daily: [
        { $group: { _id: formatBucket("$createdAt", "day"), count: { $sum: 1 } } },
        { $project: { _id: 0, key: "$_id", count: 1 } },
    ],
    hourly: [
        { $group: { _id: { $hour: { date: "$createdAt", timezone: TIMEZONE } }, count: { $sum: 1 } } },
        { $project: { _id: 0, hour: "$_id", count: 1 } },
    ],
    endpoints: [
        {
            $group: {
                _id: "$route",
                calls: { $sum: 1 },
                errorCount: countIf(isError),
                avgMs: { $avg: "$durationMs" },
                p95Ms: p95("$durationMs"),
                lastCalled: { $max: "$createdAt" },
            },
        },
        { $sort: { calls: -1, _id: 1 } },
        { $limit: 50 },
        { $project: { _id: 0, route: "$_id", calls: 1, errorCount: 1, avgMs: 1, p95Ms: { $first: "$p95Ms" }, lastCalled: 1 } },
    ],
    statuses: topCounts("status"),
    filterKeys: [
        { $project: { filter: { $objectToArray: { $ifNull: ["$filters", {}] } } } },
        { $unwind: "$filter" },
        { $group: { _id: "$filter.k", count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $project: { _id: 0, key: "$_id", count: 1 } },
    ],
    // Only successful requests, so rejected values (e.g. ownership=bogus) don't show up as popular
    topValues: [
        { $match: { status: { $lt: 400 } } },
        { $unwind: "$terms" },
        { $group: { _id: { k: "$terms.key", v: "$terms.value" }, count: { $sum: 1 } } },
        { $sort: { count: -1, "_id.v": 1 } },
        { $group: { _id: "$_id.k", values: { $push: { key: "$_id.v", count: "$count" } } } },
        { $project: { _id: 0, k: "$_id", v: { $slice: ["$values", TOP_N] } } },
    ],
    institutions: topCounts("institutionCode", { status: { $lt: 400 } }),
    notFoundCodes: topCounts("institutionCode", { status: 404 }),
    zeroResults: [{ $match: { resultCount: 0 } }, { $count: "count" }],
    zeroResultQueries: [
        { $match: { resultCount: 0 } },
        { $group: { _id: queryKey, count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: TOP_N },
        { $project: { _id: 0, key: "$_id", count: 1 } },
    ],
    consumers: [
        { $match: { ipHash: { $ne: null } } },
        { $group: { _id: "$ipHash", key: { $first: "$ipMasked" }, count: { $sum: 1 }, lastSeen: { $max: "$createdAt" } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: TOP_N },
        { $project: { _id: 0, key: 1, count: 1, lastSeen: 1 } },
    ],
    clientTypes: topCounts("clientType"),
    referers: topCounts("refererHost"),
    countries: topCounts("country"),
});

const EMPTY_OVERVIEW = { requests: 0, success: 0, clientErrors: 0, serverErrors: 0, avgMs: null, p95Ms: null };

const busiest = (rows, field) => (rows.length ? rows.reduce((top, row) => (row.count > top.count ? row : top))[field] : null);

// Runs logFacets over [start, end) and flattens the single-row facets
export const aggregateLogs = async (start, end, unit) => {
    const [facets] = await ApiLog.aggregate([{ $match: { createdAt: { $gte: start, $lt: end } } }, { $facet: logFacets(unit) }]);

    return {
        ...facets,
        overview: { ...EMPTY_OVERVIEW, ...facets.overview[0], uniqueConsumers: facets.consumersCount[0]?.count ?? 0 },
        topValues: Object.fromEntries(facets.topValues.map(({ k, v }) => [k, v])),
        zeroResults: facets.zeroResults[0]?.count ?? 0,
        busiestHour: busiest(facets.hourly, "hour"),
        busiestDay: busiest(facets.daily, "key"),
    };
};

// Every hour/day bucket label in [start, end], in the same WAT format formatBucket produces
const bucketsBetween = (start, end, unit) => {
    const step = unit === "hour" ? HOUR_MS : DAY_MS;
    const labels = [];
    for (let t = start.getTime() + TZ_OFFSET_MS; t <= end.getTime() + TZ_OFFSET_MS; t += step) {
        const iso = new Date(t - (t % step)).toISOString();
        labels.push(unit === "hour" ? `${iso.slice(0, 10)} ${iso.slice(11, 13)}:00` : iso.slice(0, 10));
    }
    return labels;
};

// Adds zero rows for buckets with no traffic so gaps show on the chart
const fillBuckets = (rows, start, end, unit) => {
    const byBucket = new Map(rows.map((row) => [row.bucket, row]));
    return bucketsBetween(start, end, unit).map((bucket) => byBucket.get(bucket) ?? { bucket, success: 0, errors: 0 });
};

// Dashboard stats for 24h / 7d / 30d, straight from the raw logs
export const getLogStats = async (range) => {
    const { ms, unit } = LOG_RANGES[range];
    const end = new Date();
    const start = new Date(end.getTime() - ms);

    const [stats, previousRequests, recentErrors] = await Promise.all([
        aggregateLogs(start, end, unit),
        ApiLog.countDocuments({ createdAt: { $gte: new Date(start.getTime() - ms), $lt: start } }),
        ApiLog.find({ createdAt: { $gte: start }, status: { $gte: 400 } })
            .sort({ createdAt: -1 })
            .limit(20)
            .select("createdAt method path status errorMessage")
            .lean(),
    ]);

    const { consumersCount, daily, ...rest } = stats;
    return {
        source: "logs",
        range,
        unit,
        ...rest,
        timeseries: fillBuckets(stats.timeseries, start, end, unit),
        overview: { ...stats.overview, previousRequests },
        recentErrors,
    };
};

// Sums a [{ key, count }] list field across daily rollups
const mergeCounts = (field) => [
    { $unwind: `$${field}` },
    { $group: { _id: `$${field}.key`, count: { $sum: `$${field}.count` } } },
    { $sort: { count: -1, _id: 1 } },
    { $limit: TOP_N },
    { $project: { _id: 0, key: "$_id", count: 1 } },
];

// Average weighted by request count, so quiet days don't skew it
const weightedAvg = (value, weight) => ({ $sum: { $multiply: [{ $ifNull: [value, 0] }, weight] } });

const rollupFacets = (group) => ({
    overview: [
        {
            $group: {
                _id: null,
                requests: { $sum: "$requests" },
                success: { $sum: "$success" },
                clientErrors: { $sum: "$clientErrors" },
                serverErrors: { $sum: "$serverErrors" },
                msTotal: weightedAvg("$avgMs", "$requests"),
                p95Ms: { $avg: "$p95Ms" },
                // Averaged over days with traffic ($avg skips the nulls)
                uniqueConsumers: { $avg: { $cond: [{ $gt: ["$requests", 0] }, "$uniqueConsumers", null] } },
                zeroResults: { $sum: "$zeroResults" },
            },
        },
        {
            $project: {
                _id: 0,
                requests: 1,
                success: 1,
                clientErrors: 1,
                serverErrors: 1,
                p95Ms: 1,
                uniqueConsumers: { $round: ["$uniqueConsumers", 0] },
                zeroResults: 1,
                avgMs: { $cond: [{ $gt: ["$requests", 0] }, { $divide: ["$msTotal", "$requests"] }, null] },
            },
        },
    ],
    timeseries: [
        {
            $group: {
                _id: formatBucket("$date", group),
                success: { $sum: "$success" },
                errors: { $sum: { $add: ["$clientErrors", "$serverErrors"] } },
            },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, bucket: "$_id", success: 1, errors: 1 } },
    ],
    busiestDay: [
        { $sort: { requests: -1, date: 1 } },
        { $limit: 1 },
        { $project: { _id: 0, key: { $dateToString: { date: "$date", format: "%Y-%m-%d", timezone: TIMEZONE } } } },
    ],
    hourly: [
        { $unwind: { path: "$hourly", includeArrayIndex: "hour" } },
        { $group: { _id: "$hour", count: { $sum: "$hourly" } } },
        { $project: { _id: 0, hour: "$_id", count: 1 } },
    ],
    endpoints: [
        { $unwind: "$endpoints" },
        {
            $group: {
                _id: "$endpoints.route",
                calls: { $sum: "$endpoints.calls" },
                errorCount: { $sum: "$endpoints.errorCount" },
                msTotal: weightedAvg("$endpoints.avgMs", "$endpoints.calls"),
                p95Ms: { $avg: "$endpoints.p95Ms" },
            },
        },
        { $sort: { calls: -1, _id: 1 } },
        { $limit: 50 },
        { $project: { _id: 0, route: "$_id", calls: 1, errorCount: 1, p95Ms: 1, avgMs: { $divide: ["$msTotal", "$calls"] } } },
    ],
    topValues: [
        { $project: { values: { $objectToArray: { $ifNull: ["$topValues", {}] } } } },
        { $unwind: "$values" },
        { $unwind: "$values.v" },
        { $group: { _id: { k: "$values.k", v: "$values.v.key" }, count: { $sum: "$values.v.count" } } },
        { $sort: { count: -1, "_id.v": 1 } },
        { $group: { _id: "$_id.k", values: { $push: { key: "$_id.v", count: "$count" } } } },
        { $project: { _id: 0, k: "$_id", v: { $slice: ["$values", TOP_N] } } },
    ],
    statuses: mergeCounts("statuses"),
    filterKeys: mergeCounts("filterKeys"),
    institutions: mergeCounts("institutions"),
    notFoundCodes: mergeCounts("notFoundCodes"),
    zeroResultQueries: mergeCounts("zeroResultQueries"),
    consumers: mergeCounts("topConsumers"),
    clientTypes: mergeCounts("clientTypes"),
    referers: mergeCounts("referers"),
    countries: mergeCounts("countries"),
});

// Dashboard stats for 90d / 12m / all, from the daily rollups (full days up to yesterday)
export const getRollupStats = async (range, group) => {
    const days = ROLLUP_RANGES[range];
    const today = startOfDay(new Date());
    const start = days ? new Date(today.getTime() - days * DAY_MS) : new Date(0);

    const [[facets], previous] = await Promise.all([
        ApiDailyStat.aggregate([{ $match: { date: { $gte: start, $lt: today } } }, { $facet: rollupFacets(group) }]),
        days
            ? ApiDailyStat.aggregate([
                  { $match: { date: { $gte: new Date(start.getTime() - days * DAY_MS), $lt: start } } },
                  { $group: { _id: null, requests: { $sum: "$requests" } } },
              ])
            : [],
    ]);

    const { zeroResults = 0, ...overview } = facets.overview[0] ?? { ...EMPTY_OVERVIEW, uniqueConsumers: 0 };
    return {
        source: "rollups",
        range,
        unit: group,
        ...facets,
        overview: { ...overview, previousRequests: days ? (previous[0]?.requests ?? 0) : null },
        topValues: Object.fromEntries(facets.topValues.map(({ k, v }) => [k, v])),
        zeroResults,
        busiestHour: busiest(facets.hourly, "hour"),
        busiestDay: facets.busiestDay[0]?.key ?? null,
        recentErrors: null,
    };
};

export const getRecentRequests = () =>
    ApiLog.find()
        .sort({ createdAt: -1 })
        .limit(50)
        .select("createdAt method path status durationMs ipMasked clientType country")
        .lean();
