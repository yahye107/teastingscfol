const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    // teacher: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Teacher",
    //   required: true,
    // },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // ✅ Not "teacher" — it's a user with role 'teacher'
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    status: {
      type: String,
      enum: ["Present", "Absent", "Late", "Excused"],
      required: true,
    },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom" },
    periodStart: { type: String, required: true },
    periodEnd: { type: String, required: true },
    date: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);
