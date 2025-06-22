const mongoose = require("mongoose");
const paymentHistorySchema = new mongoose.Schema({
  amount: Number,
  date: { type: Date, default: Date.now },
  senderNumber: String,
  method: {
    type: String,
    enum: ["Cash", "Bank Transfer", "Mobile Money"],
    default: "Cash",
  },
});

// In Student model (studentSchema.js)
const monthlyBalanceSchema = new mongoose.Schema({
  month: String,
  year: Number,
  dueAmount: Number,
  paidAmount: { type: Number, default: 0 },
  dueDate: Date, // 5th of the month
  paymentDate: Date,
  senderNumber: String,
  method: String,
});
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
  emergencyContact: String,
  previousSchool: String,
  ePortfolio: [{ title: String, link: String }],
  ///////
  monthlyPayment: { type: Number, default: 0 },
  payedmoneythisMonth: { type: Number, default: 0 },
  paymentHistory: [paymentHistorySchema],
  monthlyBalances: [monthlyBalanceSchema],
  yearlyBalance: { type: Number, default: 0 },
  nextDueDate: { type: Date },
});

module.exports = mongoose.model("Student", studentSchema);
