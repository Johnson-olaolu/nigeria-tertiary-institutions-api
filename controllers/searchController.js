import University from "../models/university.js";
import Polytechnic from "../models/polytechnic.js";
import collegeOfEducation from "../models/collegeOfEducation.js";
import Institution from "../models/institution.js";

// Find institutions offering a specific course code/ID
export const getInstitutionsByCourse = async (req, res, next) => {
    try {
        const { courseId } = req.params;

        // Search universities offering the course inside faculties
        const universities = await University.find({
            "faculties.courses.courseId": courseId,
        }).populate("institution");

        // Search polytechnics offering the course inside schools
        const polytechnics = await Polytechnic.find({
            "schools.courses.courseId": courseId,
        }).populate("institution");

        // Search colleges of education offering the course inside courses
        const colleges = await collegeOfEducation.find({
            "courses.courseId": courseId,
        }).populate("institution");

        res.status(200).json({
            success: true,
            courseId,
            results: {
                universitiesCount: universities.length,
                polytechnicsCount: polytechnics.length,
                collegesOfEducationCount: colleges.length,
                universities,
                polytechnics,
                collegesOfEducation: colleges,
            },
        });
    } catch (error) {
        next(error);
    }
};

// Global keyword search for institution names
export const globalSearch = async (req, res, next) => {
    try {
        const { keyword } = req.query;

        if (!keyword) {
            res.statusCode = 400;
            throw new Error("Please provide a search keyword query parameter");
        }

        // Case-insensitive regex search on institution names
        const institutions = await Institution.find({
            name: { $regex: keyword, $options: "i" },
        });

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