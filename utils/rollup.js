// Builds ApiDailyStat documents from ApiLog so history outlives the 30-day raw log retention
import ApiLog, { LOG_RETENTION_DAYS } from "../models/ApiLog.js";
import ApiDailyStat from "../models/ApiDailyStat.js";
import { aggregateLogs, startOfDay, DAY_MS } from "./analytics.js";

// Rolls up one day (midnight WAT, as returned by startOfDay). Safe to re-run: it replaces that day's document.
export const rollupDay = async (date) => {
    const stats = await aggregateLogs(date, new Date(date.getTime() + DAY_MS), "hour");

    const hourly = Array(24).fill(0);
    for (const { hour, count } of stats.hourly) hourly[hour] = count;

    const doc = {
        date,
        ...stats.overview,
        hourly,
        statuses: stats.statuses,
        endpoints: stats.endpoints.map(({ lastCalled, ...endpoint }) => endpoint),
        filterKeys: stats.filterKeys,
        topValues: stats.topValues,
        institutions: stats.institutions,
        zeroResults: stats.zeroResults,
        zeroResultQueries: stats.zeroResultQueries,
        notFoundCodes: stats.notFoundCodes,
        clientTypes: stats.clientTypes,
        referers: stats.referers,
        countries: stats.countries,
        topConsumers: stats.consumers.map(({ key, count }) => ({ key, count })),
        computedAt: new Date(),
    };

    try {
        await ApiDailyStat.replaceOne({ date }, doc, { upsert: true });
    } catch (error) {
        // Two rollups racing to insert the same day: the other one already wrote it
        if (error.code !== 11000) throw error;
    }
    return doc;
};

// Rolls up every finished day since the last rollup (or since the oldest raw log), skipping today
export const rollupPendingDays = async () => {
    const today = startOfDay(new Date());
    // Raw logs older than this may already be gone, so there is nothing reliable to roll up
    const earliest = new Date(today.getTime() - (LOG_RETENTION_DAYS - 1) * DAY_MS);

    const [latest, oldestLog] = await Promise.all([
        ApiDailyStat.findOne().sort({ date: -1 }).select("date").lean(),
        ApiLog.findOne().sort({ createdAt: 1 }).select("createdAt").lean(),
    ]);
    if (!oldestLog) return [];

    let day = latest ? new Date(latest.date.getTime() + DAY_MS) : startOfDay(oldestLog.createdAt);
    if (day < earliest) day = earliest;

    const rolledUp = [];
    for (; day < today; day = new Date(day.getTime() + DAY_MS)) {
        await rollupDay(day);
        rolledUp.push(day);
    }
    return rolledUp;
};
