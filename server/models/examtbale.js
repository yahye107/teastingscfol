const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
      index: true,
    },
    exams: [
      {
        subjectId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Subject",
          required: true,
        },
        date: {
          type: Date,
          required: true,
          index: true,
        },
        startTime: {
          type: String,
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
          required: true,
        },
        endTime: {
          type: String,
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
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
      },
    ],
    halls: [
      {
        hallId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Hall",
          required: true,
          validate: {
            validator: async function (v) {
              return await mongoose.model("Hall").exists({ _id: v });
            },
            message: (props) => `Hall ${props.value} does not exist`,
          },
        },
        count: {
          type: Number,
          min: 1,
          required: true,
        },
      },
    ],
    studentHallMap: {
      type: Map,
      of: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hall",
        validate: {
          validator: async function (v) {
            return await mongoose.model("Hall").exists({ _id: v });
          },
          message: (props) => `Hall ${props.value} does not exist`,
        },
      },
      default: new Map(),
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Exam", examSchema);
