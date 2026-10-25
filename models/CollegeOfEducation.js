import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    courseId: {
        type: String,
        required: true,
        trim: true,
    },
    courseName: {
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

const collegeOfEductionSchema = new mongoose.Schema(
    {
        institution: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Institution",
            required: [true, "Associated institution reference is required"],
            unique: true,
        },
        programType: {
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
    }
);

export default mongoose.model("CollegeOfEduction", collegeOfEductionSchema);