const mongoose = require("mongoose");
const parentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  occupation: String,
  contact: String,
  address: String,
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
});

module.exports = mongoose.model("Parent", parentSchema);
