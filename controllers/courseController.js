import mongoose from "mongoose";
import Course from "../models/Course.js";
import Faculty from "../models/Faculty.js";
import Institution, { CATEGORIES, OWNERSHIPS } from "../models/Institution.js";
import {
    codeOrNameMatch,
    containsRegex,
    exactRegex,
    isObjectIdString,
    parseEnumList,
    parseList,
    parsePagination,
    parseSort,
    resolveCodeOrName,
    runQuery,
} from "../utils/queryHelpers.js";

export const SORT_FIELDS = ["name", "code", "institutionCount"];
const COMPUTED_FIELDS = ["institutionCount"];

const facultyStages = [
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
];

// The offering institutions' type, state and ownership, kept as _offeredBy for filtering and counting
const institutionsLookup = {
    $lookup: {
        from: Institution.collection.name,
        localField: "institutions",
        foreignField: "_id",
        as: "_offeredBy",
        pipeline: [{ $project: { category: 1, state: 1, ownership: 1 } }],
    },
};

// institutionCount plus a per-category breakdown, e.g. { University: 112, Polytechnic: 0, ... }
const countStages = [
    {
        $addFields: {
            institutionCount: { $size: "$_offeredBy" },
            offeredBy: Object.fromEntries(
                CATEGORIES.map((category) => [
                    category,
                    { $size: { $filter: { input: "$_offeredBy", cond: { $eq: ["$$this.category", category] } } } },
                ])
            ),
        },
    },
    { $unset: ["_offeredBy", "institutions"] },
];

const buildCoursePipeline = async (res, query, fixedCategory) => {
    // A course qualifies if at least one offering institution meets all of these together
    const offeredBy = {};
    const categories = fixedCategory ? [fixedCategory] : parseEnumList(res, "category", query.category, CATEGORIES);
    if (categories.length) offeredBy.category = { $in: categories };
    if (query.state) offeredBy.state = { $in: parseList(query.state).map(exactRegex) };
    if (query.ownership) offeredBy.ownership = { $in: parseEnumList(res, "ownership", query.ownership, OWNERSHIPS) };

    const match = {};

    if (query.q) {
        const pattern = containsRegex(query.q);
        match.$or = [{ code: pattern }, { name: pattern }];
    }
    if (query.institution) {
        const terms = await resolveCodeOrName(Institution, query.institution);
        match.institutions = { $in: await Institution.find(codeOrNameMatch(terms)).distinct("_id") };
    }

    // faculty accepts ObjectIds as well as codes/names; any of them may match
    const facultyValues = parseList(query.faculty);
    const facultyIds = facultyValues.filter(isObjectIdString);
    const facultyTerms = facultyValues.filter((value) => !isObjectIdString(value));
    const facultyConditions = [
        ...(facultyIds.length ? [{ "faculty._id": { $in: facultyIds.map((id) => new mongoose.Types.ObjectId(id)) } }] : []),
        ...(facultyTerms.length
            ? codeOrNameMatch(await resolveCodeOrName(Faculty, facultyTerms.join(",")), "faculty.").$or
            : []),
    ];

    return [
        { $match: match },
        ...facultyStages,
        ...(facultyConditions.length ? [{ $match: { $or: facultyConditions } }] : []),
        institutionsLookup,
        ...(Object.keys(offeredBy).length ? [{ $match: { _offeredBy: { $elemMatch: offeredBy } } }] : []),
    ];
};

// Get all courses
export const getAllCourses = async (req, res, next) => {
    try {
        await runQuery({
            model: Course,
            res,
            pipeline: [...facultyStages, institutionsLookup],
            enrich: countStages,
            computedFields: COMPUTED_FIELDS,
            sort: parseSort(res, req.query.sort, SORT_FIELDS),
            pagination: parsePagination(res, req.query),
        });
    } catch (error) {
        next(error);
    }
};

// Query courses by text, faculty, offering institution and the type/state/ownership of institutions offering them
export const queryCourses = async (req, res, next) => {
    try {
        const sort = parseSort(res, req.query.sort, SORT_FIELDS);
        const pagination = parsePagination(res, req.query);

        await runQuery({
            model: Course,
            res,
            pipeline: await buildCoursePipeline(res, req.query, req.category),
            enrich: countStages,
            computedFields: COMPUTED_FIELDS,
            sort,
            pagination,
        });
    } catch (error) {
        next(error);
    }
};

// Get a single course with the institutions that offer it
export const getCourseById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const course = mongoose.isValidObjectId(id)
            ? await Course.findById(id)
                  .populate("faculty")
                  .populate("institutions", "code name category ownership state")
            : null;

        if (!course) {
            res.statusCode = 404;
            throw new Error("Course not found");
        }

        res.status(200).json({
            success: true,
            data: course,
        });
    } catch (error) {
        next(error);
    }
};
