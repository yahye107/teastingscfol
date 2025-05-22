const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({
  title: String,
  description: String,
  link: String,
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom" },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Assignment", assignmentSchema);
