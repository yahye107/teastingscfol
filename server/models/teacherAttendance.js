const mongoose = require("mongoose");

const teacherAttendanceSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    required: true,
  },
  academicYear: { type: String, default: "" },
  date: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["Present", "Absent", "Late", "Excused", "Day Off"], // 👈 Added here
    required: true,
  },
  timeIn: String,
  timeOut: String,
  reason: String,
});

module.exports = mongoose.model("TeacherAttendance", teacherAttendanceSchema);
