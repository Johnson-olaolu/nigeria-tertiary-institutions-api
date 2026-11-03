import mongoose from "mongoose";
import Faculty from "../models/Faculty.js";
import Course from "../models/Course.js";
import Institution, { CATEGORIES } from "../models/Institution.js";
import {
    codeOrNameExpr,
    codeOrNameMatch,
    containsRegex,
    httpError,
    parseEnumList,
    parsePagination,
    parseSort,
    resolveCodeOrName,
    runQuery,
    sendList,
} from "../utils/queryHelpers.js";

export const SORT_FIELDS = ["name", "code", "category", "courseCount", "institutionCount"];
const COMPUTED_FIELDS = ["courseCount", "institutionCount"];

// Every course in the faculty, kept as _courses for filtering and counting
const coursesLookup = {
    $lookup: {
        from: Course.collection.name,
        localField: "_id",
        foreignField: "faculty",
        as: "_courses",
        pipeline: [{ $project: { code: 1, name: 1, institutions: 1 } }],
    },
};

// courseCount and institutionCount always cover the whole faculty, not just matched courses
const countStages = [
    {
        $addFields: {
            courseCount: { $size: "$_courses" },
            institutionCount: {
                $size: {
                    $reduce: { input: "$_courses.institutions", initialValue: [], in: { $setUnion: ["$$value", "$$this"] } },
                },
            },
        },
    },
    { $unset: "_courses" },
];

const buildFacultyMatch = (query, fixedCategory) => {
    const match = {};

    if (query.q) {
        const pattern = containsRegex(query.q);
        match.$or = [{ code: pattern }, { name: pattern }];
    }
    if (query.degree) match.degreeAwarded = containsRegex(query.degree);

    const categories = fixedCategory ? [fixedCategory] : parseEnumList("category", query.category, CATEGORIES);
    if (categories.length) match.category = { $in: categories };

    return match;
};

// Keeps faculties with a course matching the course filter and/or offered by a matching institution
const buildMatchedCourseStages = async (query) => {
    if (!query.course && !query.institution) return [];

    const conditions = [];
    if (query.course) conditions.push(codeOrNameExpr(await resolveCodeOrName(Course, query.course), "$$course"));
    if (query.institution) {
        const terms = await resolveCodeOrName(Institution, query.institution);
        const institutionIds = await Institution.find(codeOrNameMatch(terms)).distinct("_id");
        conditions.push({ $gt: [{ $size: { $setIntersection: ["$$course.institutions", institutionIds] } }, 0] });
    }

    return [
        {
            $addFields: {
                matchedCourses: {
                    $map: {
                        input: { $filter: { input: "$_courses", as: "course", cond: { $and: conditions } } },
                        as: "course",
                        in: { _id: "$$course._id", code: "$$course.code", name: "$$course.name" },
                    },
                },
            },
        },
        { $match: { "matchedCourses.0": { $exists: true } } },
    ];
};

// All faculties/schools; only sort and pagination params apply
export const listFaculties = (query) =>
    runQuery({
        model: Faculty,
        pipeline: [coursesLookup],
        enrich: countStages,
        computedFields: COMPUTED_FIELDS,
        sort: parseSort(query.sort, SORT_FIELDS),
        pagination: parsePagination(query),
    });

// Faculties/schools matching category, degree, the courses they contain and the institutions offering them
export const searchFaculties = async (query, fixedCategory) => {
    // Validate everything before resolving institutions
    const match = buildFacultyMatch(query, fixedCategory);
    const sort = parseSort(query.sort, SORT_FIELDS);
    const pagination = parsePagination(query);

    return runQuery({
        model: Faculty,
        pipeline: [{ $match: match }, coursesLookup, ...(await buildMatchedCourseStages(query))],
        enrich: countStages,
        computedFields: COMPUTED_FIELDS,
        sort,
        pagination,
    });
};

// One faculty with the courses under it
export const getFacultyWithCourses = async (id) => {
    const faculty = mongoose.isValidObjectId(id) ? await Faculty.findById(id) : null;
    if (!faculty) throw httpError(404, "Faculty not found");

    const courses = await Course.find({ faculty: faculty._id })
        .select("-institutions")
        .sort({ name: 1 });

    return { faculty, courses };
};

// Get all faculties/schools
export const getAllFaculties = async (req, res, next) => {
    try {
        sendList(res, await listFaculties(req.query));
    } catch (error) {
        next(error);
    }
};

// Query faculties/schools
export const queryFaculties = async (req, res, next) => {
    try {
        sendList(res, await searchFaculties(req.query, req.category));
    } catch (error) {
        next(error);
    }
};

// Get the courses under a single faculty
export const getFacultyCourses = async (req, res, next) => {
    try {
        const { faculty, courses } = await getFacultyWithCourses(req.params.id);

        res.status(200).json({
            success: true,
            faculty,
            count: courses.length,
            data: courses,
        });
    } catch (error) {
        next(error);
    }
};
