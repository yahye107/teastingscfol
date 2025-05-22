const mongoose = require("mongoose");

const hallSchema = new mongoose.Schema({
  hallNumber: { type: String, required: true, unique: true },
  capacity: { type: Number },
  type: { type: String, enum: ["exam", "classroom"], default: "classroom" },
});

module.exports = mongoose.model("Hall", hallSchema);
