const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    required: true,
  },
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
});

module.exports = mongoose.model("AddSubjectToJeshcer", subjectSchema);
