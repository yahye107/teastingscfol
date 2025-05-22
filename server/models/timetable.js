const mongoose = require("mongoose");

const timetableSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    required: true,
  },

  day: {
    type: String,
    enum: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    required: true,
  },

  startTime: String, // "08:00"
  endTime: String, // "08:45"
  class: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom" },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
  hall: { type: mongoose.Schema.Types.ObjectId, ref: "Hall" },
});

module.exports = mongoose.model("Timetable", timetableSchema);
