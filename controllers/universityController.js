import University from "../models/university.js";

// Get all universities with populated master institution metadata
export const getAllUniversities = async (req, res, next) => {
    try {
        const universities = await University.find({ isActive: true }).populate("institution");

        res.status(200).json({
            success: true,
            count: universities.length,
            data: universities,
        });
    } catch (error) {
        next(error);
    }
};

// Get a single university by ID including faculties and courses
export const getUniversityById = async (req, res, next) => {
    try {
        const university = await University.findById(req.params.id).populate("institution");

        if (!university) {
            res.statusCode = 404;
            throw new Error("University not found");
        }

        res.status(200).json({
            success: true,
            data: university,
        });
    } catch (error) {
        next(error);
    }
};