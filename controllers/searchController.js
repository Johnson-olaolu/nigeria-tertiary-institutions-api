import University from "../models/university.js";
import Polytechnic from "../models/polytechnic.js";
import collegeOfEducation from "../models/collegeOfEducation.js";
import Institution from "../models/institution.js";

// Find institutions offering a specific course code/ID and filter response arrays
export const getInstitutionsByCourse = async (req, res, next) => {
    try {
        const { courseId } = req.params;

        // 1. Universities search & filter
        const universities = await University.find({
            "faculties.courses.course_id": courseId,
        }).populate("institution").lean();

        const filteredUniversities = universities.map(uni => ({
            ...uni,
            faculties: uni.faculties?.map(faculty => ({
                ...faculty,
                courses: faculty.courses?.filter(course => course.course_id === courseId)
            })).filter(faculty => faculty.courses?.length > 0)
        }));

        // 2. Polytechnics search & filter
        const polytechnics = await Polytechnic.find({
            "schools.courses.course_id": courseId,
        }).populate("institution").lean();

        const filteredPolytechnics = polytechnics.map(poly => ({
            ...poly,
            schools: poly.schools?.map(school => ({
                ...school,
                courses: school.courses?.filter(course => course.course_id === courseId)
            })).filter(school => school.courses?.length > 0)
        }));

        // 3. Colleges of Education search & filter
        const colleges = await collegeOfEducation.find({
            "courses.course_id": courseId,
        }).populate("institution").lean();

        const filteredColleges = colleges.map(college => ({
            ...college,
            courses: college.courses?.filter(course => course.course_id === courseId)
        }));

        res.status(200).json({
            success: true,
            courseId,
            results: {
                universitiesCount: filteredUniversities.length,
                polytechnicsCount: filteredPolytechnics.length,
                collegesOfEducationCount: filteredColleges.length,
                universities: filteredUniversities,
                polytechnics: filteredPolytechnics,
                collegesOfEducation: filteredColleges,
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