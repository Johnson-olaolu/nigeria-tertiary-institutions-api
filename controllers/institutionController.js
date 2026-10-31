import Institution from "../models/Institution.js";
import Course from "../models/Course.js";

// Get all institutions with optional query filters (state, ownership, category)
export const getAllInstitutions = async (req, res, next) => {
    try {
        const { state, ownership } = req.query;
        const category = req.category ?? req.query.category;
        let filter = {};

        if (state) filter.state = state;
        if (ownership) filter.ownership = ownership;
        if (category) filter.category = category;

        const institutions = await Institution.find(filter).sort({ name: 1 });

        res.status(200).json({
            success: true,
            count: institutions.length,
            data: institutions,
        });
    } catch (error) {
        next(error);
    }
};

// Get a single institution profile by its code, with the faculties and courses it offers
export const getInstitutionByCode = async (req, res, next) => {
    try {
        const filter = { code: req.params.code };
        if (req.category) filter.category = req.category;

        const foundInstitution = await Institution.findOne(filter).lean();

        if (!foundInstitution) {
            res.statusCode = 404;
            throw new Error("Institution not found");
        }

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

        res.status(200).json({
            success: true,
            data: {
                ...foundInstitution,
                faculties: [...faculties.values()],
            },
        });
    } catch (error) {
        next(error);
    }
};
