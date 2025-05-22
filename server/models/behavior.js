import mongoose from "mongoose";

const behaviorReportSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: { type: String, enum: ["positive", "negative"], required: true },
  title: String,
  description: String,
  date: { type: Date, default: Date.now },
  actionTaken: String,
  severity: { type: String, enum: ["low", "medium", "high"], default: "low" },
  parentNotified: { type: Boolean, default: false },
});

export default mongoose.model("BehaviorReport", behaviorReportSchema);
