// Shared parsing and aggregation helpers for the list/query endpoints

export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 200;

// URL segment -> category, shared by the institution, faculty and course alias routes
export const CATEGORY_ALIASES = {
    universities: "University",
    polytechnics: "Polytechnic",
    "college-of-education": "College of Education",
};

const badRequest = (res, message) => {
    res.statusCode = 400;
    return new Error(message);
};

// Treat user input as literal text inside a regex
export const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const containsRegex = (value) => new RegExp(escapeRegex(String(value).trim()), "i");

export const exactRegex = (value) => new RegExp(`^${escapeRegex(String(value).trim())}$`, "i");

export const isObjectIdString = (value) => /^[0-9a-f]{24}$/i.test(value);

// "a, b" (or a repeated query param) -> ["a", "b"]
export const parseList = (value) =>
    value == null
        ? []
        : String(value)
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean);

// Case-insensitive enum list; unknown values are a 400
export const parseEnumList = (res, name, value, allowed) =>
    parseList(value).map((item) => {
        const match = allowed.find((option) => option.toLowerCase() === item.toLowerCase());
        if (!match) throw badRequest(res, `Invalid ${name} "${item}". Allowed values: ${allowed.join(", ")}`);
        return match;
    });

/**
 * Split comma-separated values into exact codes and name fragments: a value that is an existing
 * code in `model` matches only that code (ABU, LAW); anything else matches names containing it.
 */
export const resolveCodeOrName = async (model, value) => {
    const values = parseList(value);
    const existing = await model.distinct("code", { code: { $in: values.map(exactRegex) } });
    const codes = new Set(existing.map((code) => code.toLowerCase()));

    return {
        codes: values.filter((item) => codes.has(item.toLowerCase())),
        names: values.filter((item) => !codes.has(item.toLowerCase())),
    };
};

// Query filter for terms from resolveCodeOrName, optionally on an embedded document ("faculty.")
export const codeOrNameMatch = ({ codes, names }, prefix = "") => ({
    $or: [
        ...codes.map((code) => ({ [`${prefix}code`]: exactRegex(code) })),
        ...names.map((name) => ({ [`${prefix}name`]: containsRegex(name) })),
    ],
});

// Same as codeOrNameMatch, as an aggregation expression for use inside $filter (e.g. "$$course")
export const codeOrNameExpr = ({ codes, names }, variable) => ({
    $or: [
        ...codes.map((code) => ({ $eq: [{ $toLower: `${variable}.code` }, code.toLowerCase()] })),
        ...names.map((name) => ({ $regexMatch: { input: `${variable}.name`, regex: escapeRegex(name), options: "i" } })),
    ],
});

// Pagination is optional: null unless page or limit is passed
export const parsePagination = (res, query) => {
    if (query.page === undefined && query.limit === undefined) return null;

    const page = query.page === undefined ? 1 : Number(query.page);
    const limit = query.limit === undefined ? DEFAULT_LIMIT : Number(query.limit);

    if (!Number.isInteger(page) || page < 1) throw badRequest(res, "page must be a positive integer");
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
        throw badRequest(res, `limit must be an integer between 1 and ${MAX_LIMIT}`);
    }
    return { page, limit };
};

// "name" or "-courseCount" -> { field, direction }
export const parseSort = (res, value, allowed, defaultField = "name") => {
    const raw = value ? String(value).trim() : defaultField;
    const field = raw.replace(/^-/, "");
    if (!allowed.includes(field)) throw badRequest(res, `Invalid sort "${raw}". Allowed fields: ${allowed.join(", ")}`);
    return { field, direction: raw.startsWith("-") ? -1 : 1 };
};

/**
 * Finish a pipeline with sorting and optional pagination, then send the standard list response.
 * `enrich` stages add derived fields (counts etc.); they run after pagination unless the sort needs them.
 */
export const runQuery = async ({ model, res, pipeline, enrich = [], computedFields = [], sort, pagination }) => {
    const sortByComputed = computedFields.includes(sort.field);
    const sortStages = [
        // Sort strings case-insensitively; _id keeps page boundaries stable
        { $addFields: { _sortKey: sortByComputed ? `$${sort.field}` : { $toLower: `$${sort.field}` } } },
        { $sort: { _sortKey: sort.direction, _id: 1 } },
        { $unset: "_sortKey" },
    ];

    const stages = sortByComputed ? [...pipeline, ...enrich, ...sortStages] : [...pipeline, ...sortStages];

    if (!pagination) {
        const data = await model.aggregate(sortByComputed ? stages : [...stages, ...enrich]);
        return res.status(200).json({ success: true, count: data.length, data });
    }

    const { page, limit } = pagination;
    const pageStages = [{ $skip: (page - 1) * limit }, { $limit: limit }, ...(sortByComputed ? [] : enrich)];
    const [{ data, total }] = await model.aggregate([
        ...stages,
        { $facet: { data: pageStages, total: [{ $count: "count" }] } },
    ]);
    const totalCount = total[0]?.count ?? 0;

    res.status(200).json({
        success: true,
        count: data.length,
        total: totalCount,
        page,
        pages: Math.ceil(totalCount / limit),
        data,
    });
};
