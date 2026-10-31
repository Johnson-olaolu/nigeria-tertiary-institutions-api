import mongoose from "mongoose";

export const CATEGORIES = ["University", "Polytechnic", "College of Education"];

/**
 * @openapi
 * components:
 *   schemas:
 *     Institution:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         code:
 *           type: string
 *           example: ABU
 *         name:
 *           type: string
 *           example: Ahmadu Bello University
 *         category:
 *           $ref: '#/components/schemas/Category'
 *         ownership:
 *           $ref: '#/components/schemas/Ownership'
 *         state:
 *           type: string
 *           example: Kaduna
 *         address:
 *           type: string
 *           example: Zaria
 *         logoUrl:
 *           type: string
 *         website:
 *           type: string
 *           example: https://www.abu.edu.ng
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     InstitutionSummary:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         code:
 *           type: string
 *           example: ABU
 *         name:
 *           type: string
 *           example: Ahmadu Bello University
 *         category:
 *           $ref: '#/components/schemas/Category'
 *         ownership:
 *           $ref: '#/components/schemas/Ownership'
 *         state:
 *           type: string
 *           example: Kaduna
 *     InstitutionProfile:
 *       description: An institution with the faculties and courses it offers
 *       allOf:
 *         - $ref: '#/components/schemas/Institution'
 *         - type: object
 *           properties:
 *             faculties:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Faculty'
 *                   - type: object
 *                     properties:
 *                       courses:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/Course'
 */
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
