import mongoose from "mongoose";
import Faculty from "../models/Faculty.js";
import Course from "../models/Course.js";

// Get all faculties/schools with optional category filter
export const getAllFaculties = async (req, res, next) => {
    try {
        const { category } = req.query;
        let filter = {};

        if (category) filter.category = category;

        const faculties = await Faculty.find(filter).sort({ category: 1, name: 1 });

        res.status(200).json({
            success: true,
            count: faculties.length,
            data: faculties,
        });
    } catch (error) {
        next(error);
    }
};

// Get the courses under a single faculty
export const getFacultyCourses = async (req, res, next) => {
    try {
        const { id } = req.params;

        const faculty = mongoose.isValidObjectId(id) ? await Faculty.findById(id) : null;

        if (!faculty) {
            res.statusCode = 404;
            throw new Error("Faculty not found");
        }

        const courses = await Course.find({ faculty: faculty._id })
            .select("-institutions")
            .sort({ name: 1 });

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
