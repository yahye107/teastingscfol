const mongoose = require("mongoose");

const studentResultSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    academicYear: { type: String, required: true }, // "2024/2025"
    attendanceRate: { type: Number, required: true }, // % for the subject
    firstExam: Number,
    midExam: Number,
    thirdExam: Number,
    finalExam: Number,
    activities: Number,
    total: {
      type: Number,
      required: true,
      validate: {
        validator: (v) => !isNaN(v),
        message: "Total must be a valid number.",
      },
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" }, // or "User" if admin involved
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" }, // or "User"
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudentResult", studentResultSchema);
