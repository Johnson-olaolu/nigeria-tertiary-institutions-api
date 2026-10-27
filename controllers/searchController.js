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
            "faculties.courses.course_id": courseId,
        }).populate("institution");

        // Search polytechnics offering the course inside schools
        const polytechnics = await Polytechnic.find({
            "schools.courses.course_id": courseId,
        }).populate("institution");

        // Search colleges of education offering the course inside courses
        const colleges = await collegeOfEducation.find({
            "courses.course_id": courseId,
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

// Global keyword search for institution names across all categories
export const globalSearch = async (req, res, next) => {
    try {
        const { keyword } = req.query;

        if (!keyword) {
            res.statusCode = 400;
            throw new Error("Please provide a search keyword query parameter");
        }

        // Find matching documents and convert to plain JS objects using .lean()
        const records = await Institution.find({
            $or: [
                { "institutions.universities.name": { $regex: keyword, $options: "i" } },
                { "institutions.polytechnic.name": { $regex: keyword, $options: "i" } },
                { "institutions.college_of_education.name": { $regex: keyword, $options: "i" } }
            ]
        }).lean();

        // Filter the arrays so only the matching institutions remain in the response
        const filteredResults = records.map(record => {
            const doc = { ...record };
            if (doc.institutions) {
                if (doc.institutions.universities) {
                    doc.institutions.universities = doc.institutions.universities.filter(uni =>
                        new RegExp(keyword, "i").test(uni.name) || 
                        new RegExp(keyword, "i").test(uni.ownership) ||
                        new RegExp(keyword, "i").test(uni.State)
                    );
                }
                if (doc.institutions.polytechnic) {
                    doc.institutions.polytechnic = doc.institutions.polytechnic.filter(poly =>
                        new RegExp(keyword, "i").test(poly.name) || 
                        new RegExp(keyword, "i").test(poly.ownership) ||
                        new RegExp(keyword, "i").test(poly.State)
                    );
                }
                if (doc.institutions.college_of_education) {
                    doc.institutions.college_of_education = doc.institutions.college_of_education.filter(col =>
                        new RegExp(keyword, "i").test(col.name) || 
                        new RegExp(keyword, "i").test(col.ownership) ||
                        new RegExp(keyword, "i").test(col.State)
                    );
                }
            }
            return doc;
        });

        res.status(200).json({
            success: true,
            keyword,
            count: filteredResults.length,
            data: filteredResults,
        });
    } catch (error) {
        next(error);
    }
};