const mongoose = require("mongoose");
const teacherSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  employeeId: String,
  gender: String,
  dob: Date,
  age: String,
  contact: String,
  address: String,
  qualifications: String,
  SalaryBymonth: String,
  experience: String,
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
  // classes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Classroom" }],
  // timetable: [Object],
  timetables: [{ type: mongoose.Schema.Types.ObjectId, ref: "Timetable" }],
});

module.exports = mongoose.model("Teacher", teacherSchema);
