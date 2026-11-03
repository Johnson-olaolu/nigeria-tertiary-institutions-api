import Institution, { CATEGORIES, OWNERSHIPS } from "../models/Institution.js";
import Faculty from "../models/Faculty.js";
import Course from "../models/Course.js";
import {
    codeOrNameMatch,
    containsRegex,
    exactRegex,
    httpError,
    parseEnumList,
    parseList,
    parsePagination,
    parseSort,
    resolveCodeOrName,
    runQuery,
    sendList,
} from "../utils/queryHelpers.js";

export const SORT_FIELDS = ["name", "code", "state", "courseCount", "facultyCount"];
const COMPUTED_FIELDS = ["courseCount", "facultyCount"];

// Adds courseCount and facultyCount from the courses each institution offers
const countStages = [
    {
        $lookup: {
            from: Course.collection.name,
            localField: "_id",
            foreignField: "institutions",
            as: "_offered",
            pipeline: [{ $group: { _id: null, courseCount: { $sum: 1 }, faculties: { $addToSet: "$faculty" } } }],
        },
    },
    {
        $addFields: {
            courseCount: { $ifNull: [{ $first: "$_offered.courseCount" }, 0] },
            facultyCount: { $size: { $ifNull: [{ $first: "$_offered.faculties" }, []] } },
        },
    },
    { $unset: "_offered" },
];

// Filters on the institution document's own fields
const buildInstitutionMatch = (query, fixedCategory) => {
    const match = {};

    if (query.q) {
        const pattern = containsRegex(query.q);
        match.$or = [{ name: pattern }, { code: pattern }, { state: pattern }, { address: pattern }];
    }
    if (query.name) match.name = containsRegex(query.name);
    if (query.address) match.address = containsRegex(query.address);
    if (query.code) match.code = { $in: parseList(query.code).map(exactRegex) };
    if (query.state) match.state = { $in: parseList(query.state).map(exactRegex) };
    if (query.ownership) match.ownership = { $in: parseEnumList("ownership", query.ownership, OWNERSHIPS) };

    const categories = fixedCategory ? [fixedCategory] : parseEnumList("category", query.category, CATEGORIES);
    if (categories.length) match.category = { $in: categories };

    return match;
};

// Keeps institutions offering a matching course and/or a course in a matching faculty
const buildOfferingStages = async (query) => {
    if (!query.course && !query.faculty) return [];

    const conditions = [];
    if (query.course) conditions.push(codeOrNameMatch(await resolveCodeOrName(Course, query.course)));
    if (query.faculty) conditions.push(codeOrNameMatch(await resolveCodeOrName(Faculty, query.faculty), "faculty."));

    return [
        {
            $lookup: {
                from: Course.collection.name,
                localField: "_id",
                foreignField: "institutions",
                as: "matchedCourses",
                pipeline: [
                    {
                        $lookup: {
                            from: Faculty.collection.name,
                            localField: "faculty",
                            foreignField: "_id",
                            as: "faculty",
                            pipeline: [{ $project: { code: 1, name: 1, category: 1 } }],
                        },
                    },
                    { $unwind: "$faculty" },
                    { $match: { $and: conditions } },
                    { $project: { code: 1, name: 1, faculty: 1 } },
                ],
            },
        },
        { $match: { "matchedCourses.0": { $exists: true } } },
    ];
};

// All institutions; only sort and pagination params apply
export const listInstitutions = (query) =>
    runQuery({
        model: Institution,
        pipeline: [],
        enrich: countStages,
        computedFields: COMPUTED_FIELDS,
        sort: parseSort(query.sort, SORT_FIELDS),
        pagination: parsePagination(query),
    });

// Institutions matching their own fields, the courses they offer and the faculties they have
export const searchInstitutions = async (query, fixedCategory) => {
    // Validate everything before resolving course/faculty codes
    const match = buildInstitutionMatch(query, fixedCategory);
    const sort = parseSort(query.sort, SORT_FIELDS);
    const pagination = parsePagination(query);

    return runQuery({
        model: Institution,
        pipeline: [{ $match: match }, ...(await buildOfferingStages(query))],
        enrich: countStages,
        computedFields: COMPUTED_FIELDS,
        sort,
        pagination,
    });
};

// One institution by code, with the faculties and courses it offers
export const getInstitutionProfile = async (code, fixedCategory) => {
    const filter = { code };
    if (fixedCategory) filter.category = fixedCategory;

    const foundInstitution = await Institution.findOne(filter).lean();
    if (!foundInstitution) throw httpError(404, "Institution not found");

    const courses = await Course.find({ institutions: foundInstitution._id })
        .select("-institutions")
        .populate("faculty")
        .sort({ name: 1 })
        .lean();

    // Group courses under their faculty
    const faculties = new Map();
    for (const { faculty, ...course } of courses) {
        const key = String(faculty._id);
        if (!faculties.has(key)) faculties.set(key, { ...faculty, courses: [] });
        faculties.get(key).courses.push(course);
    }

    return { ...foundInstitution, faculties: [...faculties.values()] };
};

// Get all institutions
export const getAllInstitutions = async (req, res, next) => {
    try {
        sendList(res, await listInstitutions(req.query));
    } catch (error) {
        next(error);
    }
};

// Query institutions
export const queryInstitutions = async (req, res, next) => {
    try {
        sendList(res, await searchInstitutions(req.query, req.category));
    } catch (error) {
        next(error);
    }
};

// Get a single institution profile by its code
export const getInstitutionByCode = async (req, res, next) => {
    try {
        res.status(200).json({ success: true, data: await getInstitutionProfile(req.params.code, req.category) });
    } catch (error) {
        next(error);
    }
};
