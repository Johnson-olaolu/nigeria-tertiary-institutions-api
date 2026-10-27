import Institution from "../models/institution.js";

// Get all institutions with optional query filters (state, ownership, category)
export const getAllInstitutions = async (req, res, next) => {
    try {
        const { state, ownership, category } = req.query;
        let filter = {};

        if (state) filter.state = state;
        if (ownership) filter.ownership = ownership;
        if (category) filter.category = category;

        const institutions = await Institution.find(filter);

        res.status(200).json({
            success: true,
            count: institutions.length,
            data: institutions,
        });
    } catch (error) {
        next(error);
    }
};

// Get a single institution profile by ID
export const getInstitutionById = async (req, res, next) => {
    try {
        const foundInstitution = await Institution.findById(req.params.id);

        if (!foundInstitution) {
            res.statusCode = 404;
            throw new Error("Institution not found");
        }

        res.status(200).json({
            success: true,
            data: foundInstitution,
        });
    } catch (error) {
        next(error);
    }
};