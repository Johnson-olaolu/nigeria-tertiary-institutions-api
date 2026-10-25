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

const facultySchema = new mongoose.Schema({
  facultyId: {
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

const universitySchema = new mongoose.Schema(
  {
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: [true, "Associated institution reference is required"],
      unique: true, // Ensures a one-to-one mapping with the master Institution record
    },
    faculties: [facultySchema], // Academic faculty and course hierarchy
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("University", universitySchema);