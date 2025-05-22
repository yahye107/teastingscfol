const mongoose = require("mongoose");
const staffSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  employeeId: String,
  department: String,
  contact: String,
  address: String,
  shift: String,
  joiningDate: Date,
});

module.exports = mongoose.model("Staff", staffSchema);
