const mongoose = require("mongoose");

// In Student model (studentSchema.js)

const studentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  admissionCounter: { type: Number, default: 0 },
  admissionNumber: { type: String },

  age: String,
  gender: String,
  dob: Date,
  contact: String,
  address: String,
  classId: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom" },
  class: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom" },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: "Parent" },
  timetables: [{ type: mongoose.Schema.Types.ObjectId, ref: "Timetable" }],
  results: [{ type: mongoose.Schema.Types.ObjectId, ref: "StudentResult" }],
  exam: [{ type: mongoose.Schema.Types.ObjectId, ref: "Exam" }],
  feeRecordes: [
    { type: mongoose.Schema.Types.ObjectId, ref: "MonthlyPayment" },
  ],

  nationalId: { type: String, default: "" },
  notes: String,
  emergencyContact: String,
  previousSchool: String,
  ePortfolio: [{ title: String, link: String }],
  ///////
  monthlyPayment: { type: Number, default: 0 },
});

module.exports = mongoose.model("Student", studentSchema);
