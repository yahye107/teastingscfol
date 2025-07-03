const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  profilePic: {
    url: String,
    public_id: String,
  },
  fullName: String,
  username: String,
  email: { type: String, unique: true },
  password: String,
  rawPassword: {
    type: String,
    select: false, // hides it by default, good for security
  },
  role: {
    type: String,
    enum: ["student", "parent", "teacher", "staff", "admin"],
  },
  status: {
    type: String,
    enum: ["active", "pending", "blocked"],
    default: "active",
  },
  teacherProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
  },
  studentProfile: {
    // Single reference, not array
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
  },
  parentProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Parent",
  },
  profilePic: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
