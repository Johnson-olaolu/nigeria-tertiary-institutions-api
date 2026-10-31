import mongoose from "mongoose";
import { CATEGORIES } from "./Institution.js";

const facultySchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: [true, "Faculty code is required"],
            trim: true,
        },
        name: {
            type: String,
            required: [true, "Faculty name is required"],
            trim: true,
        },
        category: {
            type: String,
            enum: CATEGORIES, // Institution type this faculty/school belongs to
            required: [true, "Faculty category is required"],
            trim: true,
        },
        degreeAwarded: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

facultySchema.index({ category: 1, code: 1 }, { unique: true });

export default mongoose.model("Faculty", facultySchema);
