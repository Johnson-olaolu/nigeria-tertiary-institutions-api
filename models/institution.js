import mongoose from "mongoose";

const institutionSchema = new mongoose.Schema(
    {
        institutionId: {
            type: String,
            required: [true, "Institution ID is required"],
            unique: true,
            trim: true,
        },
        name: {
            type: String,
            required: [true, "Institution name is required"],
            trim: true,
        },
        category: {
            type: String,
            enum: ["University", "Polytechnic", "College of Education"],
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
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Institution", institutionSchema);