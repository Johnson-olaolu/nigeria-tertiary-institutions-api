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
});

const schoolSchema = new mongoose.Schema({
    schoolId: {
        type: String,
        required: true,
        trim: true,
    },
    facultyName: {
        type: String,
        required: true,
        trim: true,
    },
    degreeAwarded: {
        type: String,
        trim: true,
    },
    courses: [courseSchema],
});

const polytechnicSchema = new mongoose.Schema(
    {
        institution: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Institution",
            required: [true, "Associated institution reference is required"],
            unique: true,
        },
        schools: [schoolSchema], // Academic schools and program hierarchy
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Polytechnic", polytechnicSchema);