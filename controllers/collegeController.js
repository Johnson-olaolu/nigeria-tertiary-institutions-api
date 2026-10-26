import CollegeOfEduction from "../models/collegeOfEducation.js";

// Get all colleges of education
export const getAllCollegesOfEducation = async (req, res, next) => {
    try {
        const colleges = await CollegeOfEduction.find({ isActive: true }).populate("institution");

        res.status(200).json({
            success: true,
            count: colleges.length,
            data: colleges,
        });
    } catch (error) {
        next(error);
    }
};

// Get a single college of education by ID
export const getCollegeOfEducationById = async (req, res, next) => {
    try {
        const college = await CollegeOfEduction.findById(req.params.id).populate("institution");

        if (!college) {
            res.statusCode = 404;
            throw new Error("College of Education not found");
        }

        res.status(200).json({
            success: true,
            data: college,
        });
    } catch (error) {
        next(error);
    }
};