const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Could be Admin or Teacher
    required: true,
  },
  role: {
    type: String,
    enum: ["admin", "teacher"],
    required: true,
  },
  audience: {
    type: String,
    enum: ["student", "teacher", "parent", "staff", "all", "class"],
    required: true,
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Classroom",
    default: null, // Only required if audience === "class"
  },
  date: {
    type: Date,
    required: false,
  },
  startTime: {
    type: String, // Format: "HH:mm" (e.g., "13:00")
    required: false,
  },
  endTime: {
    type: String, // Format: "HH:mm"
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Event", eventSchema);
