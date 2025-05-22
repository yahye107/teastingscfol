const mongoose = require("mongoose");

const studentAssignmentStatusSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment" },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  status: {
    type: String,
    enum: ["Not Viewed", "Viewed", "Completed"],
    default: "Not Viewed",
  },
  submission: { type: String },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model(
  "StudentAssignmentStatus",
  studentAssignmentStatusSchema
);
