const mongoose = require("mongoose");

// In Student model (studentSchema.js)

const studentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  admissionNumber: String,
  age: String,
  gender: String,
  dob: Date,
  contact: String,
  address: String,
  classId: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom" },
  class: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom" },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: "Parent" },
  timetables: [{ type: mongoose.Schema.Types.ObjectId, ref: "Timetable" }],
  result: [{ type: mongoose.Schema.Types.ObjectId, ref: "StudentResult" }],
  exam: [{ type: mongoose.Schema.Types.ObjectId, ref: "Exam" }],
  feeRecordes: [
    { type: mongoose.Schema.Types.ObjectId, ref: "MonthlyPayment" },
  ],
  emergencyContact: String,
  previousSchool: String,
  ePortfolio: [{ title: String, link: String }],
  ///////
  monthlyPayment: { type: Number, default: 0 },
});

module.exports = mongoose.model("Student", studentSchema);
