import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    course_id: {
        type: String,
        required: true,
        trim: true,
    },
    course_name: {
        type: String,
        required: true,
        trim: true,
    },
    institutions: [
        {
            type: String,
            trim: true,
        },
    ],
});

const collegeOfEducationSchema = new mongoose.Schema(
    {
        program_type: {
            type: String,
            default: "Nigeria Certificate in Education (NCE)",
            trim: true,
        },
        courses: [courseSchema], // NCE courses and offering institution tags
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        collection: "collegeofeducations", // Force exact collection name
    }
);


const CollegeOfEducation = mongoose.model("CollegeOfEducation", collegeOfEducationSchema, "collegeofeducations");

export default CollegeOfEducation;