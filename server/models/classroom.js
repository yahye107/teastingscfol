const mongoose = require("mongoose");

const classroomSchema = new mongoose.Schema({
  name: String, // e.g., "Grade 8 - A"
  grade: String,
  section: String,
  academicYear: String,
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
  classTeacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
  hall: { type: mongoose.Schema.Types.ObjectId, ref: "Hall" },
  timetables: [{ type: mongoose.Schema.Types.ObjectId, ref: "Timetable" }],
  result: [{ type: mongoose.Schema.Types.ObjectId, ref: "StudentResult" }],
});

module.exports = mongoose.model("Classroom", classroomSchema);
