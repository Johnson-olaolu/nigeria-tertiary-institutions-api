import Institution from "../models/Institution.js";
import Faculty from "../models/Faculty.js";
import Course from "../models/Course.js";

// Treat user input as literal text inside a regex
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const INSTITUTION_FIELDS = "code name category ownership state";

// Find institutions offering any course under faculties matching a code or name
export const getInstitutionsByFaculty = async (req, res, next) => {
    try {
        const { facultyId } = req.params;
        const pattern = { $regex: escapeRegex(facultyId), $options: "i" };

        const faculties = await Faculty.find({ $or: [{ code: pattern }, { name: pattern }] }).lean();

        const institutionIds = await Course.find({ faculty: { $in: faculties.map((f) => f._id) } })
            .distinct("institutions");

        const institutions = await Institution.find({ _id: { $in: institutionIds } })
            .select(INSTITUTION_FIELDS)
            .sort({ name: 1 })
            .lean();

        const byCategory = {};
        for (const institution of institutions) {
            (byCategory[institution.category] ??= []).push(institution);
        }

        res.status(200).json({
            success: true,
            facultyId,
            faculties,
            count: institutions.length,
            data: byCategory,
        });
    } catch (error) {
        next(error);
    }
};

// Find institutions offering a specific course code
export const getInstitutionsByCourse = async (req, res, next) => {
    try {
        const { courseId } = req.params;

        const courses = await Course.find({ code: courseId })
            .populate("faculty", "code name category degreeAwarded")
            .populate({ path: "institutions", select: INSTITUTION_FIELDS, options: { sort: { name: 1 } } })
            .lean();

        if (!courses.length) {
            res.statusCode = 404;
            throw new Error("Course not found");
        }

        res.status(200).json({
            success: true,
            courseId,
            count: courses.reduce((total, c) => total + c.institutions.length, 0),
            data: courses,
        });
    } catch (error) {
        next(error);
    }
};

// Global keyword search for institutions by name, code or state
export const globalSearch = async (req, res, next) => {
    try {
        const { keyword } = req.query;

        if (!keyword) {
            res.statusCode = 400;
            throw new Error("Please provide a search keyword query parameter");
        }

        const pattern = { $regex: escapeRegex(keyword), $options: "i" };

        const institutions = await Institution.find({
            $or: [{ name: pattern }, { code: pattern }, { state: pattern }],
        })
            .sort({ name: 1 })
            .lean();

        res.status(200).json({
            success: true,
            keyword,
            count: institutions.length,
            data: institutions,
        });
    } catch (error) {
        next(error);
    }
};
