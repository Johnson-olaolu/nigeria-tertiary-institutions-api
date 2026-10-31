import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: [true, "Course code is required"],
            trim: true,
        },
        name: {
            type: String,
            required: [true, "Course name is required"],
            trim: true,
        },
        faculty: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Faculty",
            required: [true, "Associated faculty reference is required"],
        },
        institutions: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Institution",
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Same course code can live under more than one faculty (e.g. ACCOUNTING)
courseSchema.index({ faculty: 1, code: 1 }, { unique: true });
courseSchema.index({ code: 1 });
courseSchema.index({ institutions: 1 });

export default mongoose.model("Course", courseSchema);
