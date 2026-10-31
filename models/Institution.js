import mongoose from "mongoose";

export const CATEGORIES = ["University", "Polytechnic", "College of Education"];

const institutionSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: [true, "Institution code is required"],
            unique: true, // Stable public identifier (e.g. "ABU"), used by the seed data and API lookups
            trim: true,
        },
        name: {
            type: String,
            required: [true, "Institution name is required"],
            trim: true,
        },
        category: {
            type: String,
            enum: CATEGORIES,
            required: [true, "Institution category is required"],
            trim: true,
        },
        ownership: {
            type: String,
            enum: ["Federal", "State", "Private"],
            required: [true, "Ownership type is required"],
            trim: true,
        },
        state: {
            type: String,
            required: [true, "State is required"],
            trim: true,
        },
        address: {
            type: String,
            trim: true,
        },
        logoUrl: {
            type: String,
            trim: true,
        },
        website: {
            type: String,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

institutionSchema.index({ category: 1, state: 1 });

export default mongoose.model("Institution", institutionSchema);
