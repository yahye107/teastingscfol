const mongoose = require("mongoose");

const monthlyPaymentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    month: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      default: new Date().getFullYear(),
    },
    academicYear: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Paid", "Partial", "Unpaid"],
      default: "Unpaid",
    },
    dueDate: {
      type: Date,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    dept: {
      type: Number,
      default: 0,
    },
    note: {
      type: String,
      default: "",
    },

    // ✅ NEW FIELDS
    method: {
      type: String,
      enum: ["Cash", "Bank Transfer", "Avc +", "Scholarship", "Other"],
      default: "Avc +",
    },
    sentBy: {
      type: String,
      default: "", // e.g., phone number or name of payer
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("MonthlyPayment", monthlyPaymentSchema);
