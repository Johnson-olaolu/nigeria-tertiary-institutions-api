import Polytechnic from "../models/polytechnic.js";

// Get all polytechnics with populated master institution metadata
export const getAllPolytechnics = async (req, res, next) => {
    try {
        const polytechnics = await Polytechnic.find({ isActive: true }).populate("institution");

        res.status(200).json({
            success: true,
            count: polytechnics.length,
            data: polytechnics,
        });
    } catch (error) {
        next(error);
    }
};

// Get a single polytechnic by ID including schools and courses
export const getPolytechnicById = async (req, res, next) => {
    try {
        const polytechnic = await Polytechnic.findById(req.params.id).populate("institution");

        if (!polytechnic) {
            res.statusCode = 404;
            throw new Error("Polytechnic not found");
        }

        res.status(200).json({
            success: true,
            data: polytechnic,
        });
    } catch (error) {
        next(error);
    }
};