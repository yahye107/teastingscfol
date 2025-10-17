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
  employmentType: {
    type: String,
    enum: ["Full-time", "Part-time", "Contract"],
    default: "Full-time",
  },
  notes: String,
  experience: String,
  nationalId: { type: String, default: "" },
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
  // classes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Classroom" }],
  // timetable: [Object],
  timetables: [{ type: mongoose.Schema.Types.ObjectId, ref: "Timetable" }],
});

module.exports = mongoose.model("Teacher", teacherSchema);
