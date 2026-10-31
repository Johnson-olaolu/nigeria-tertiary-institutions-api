import mongoose from "mongoose";
import Course from "../models/Course.js";
import Faculty from "../models/Faculty.js";

// Get all courses with optional faculty or category filters
export const getAllCourses = async (req, res, next) => {
    try {
        const { faculty, category } = req.query;
        let filter = {};
        let facultyFilter = {};

        if (faculty) {
            if (!mongoose.isValidObjectId(faculty)) {
                res.statusCode = 400;
                throw new Error("Invalid faculty ID");
            }
            facultyFilter._id = faculty;
        }
        if (category) facultyFilter.category = category;

        if (faculty || category) {
            filter.faculty = { $in: await Faculty.find(facultyFilter).distinct("_id") };
        }

        const courses = await Course.find(filter)
            .select("-institutions")
            .populate("faculty", "code name category")
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            count: courses.length,
            data: courses,
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
