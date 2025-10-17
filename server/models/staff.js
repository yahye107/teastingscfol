const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Personal Info

    dob: { type: Date },
    gender: { type: String, enum: ["male", "female"] },

    nationalId: { type: String, default: "" },
    age: String,
    // Job Info
    jobTitle: { type: String, required: true },
    employmentType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract"],
      default: "Full-time",
    },

    // Education & Skills
    educationalQualifications: { type: String }, // Array of qualifications
    // certifications: [String], // Array of certifications or skills

    // Salary & Payroll
    SalaryBymonth: String,

    // Misc / Notes
    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Staff", staffSchema);
