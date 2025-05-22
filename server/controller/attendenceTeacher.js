const TeacherAttendance = require("../models/teacherAttendance");
const Teacher = require("../models/teacher");

const markTeacherAttendance = async (req, res) => {
  try {
    const { teacher, status, timeIn, timeOut, reason } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const alreadyMarked = await TeacherAttendance.findOne({
      teacher,
      date: { $gte: today },
    });

    if (alreadyMarked) {
      return res
        .status(400)
        .json({ message: "Attendance already marked for today." });
    }

    const attendance = new TeacherAttendance({
      teacher,
      status,
      timeIn: status === "Day Off" ? undefined : timeIn,
      timeOut: status === "Day Off" ? undefined : timeOut,
      reason: status === "Day Off" ? "Day Off" : reason,
    });

    await attendance.save();
    res.status(201).json({ message: "Attendance marked successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const updateTeacherAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, timeIn, timeOut, reason } = req.body;

    const updatedData = {
      status,
      timeIn: status === "Day Off" ? undefined : timeIn,
      timeOut: status === "Day Off" ? undefined : timeOut,
      reason: status === "Day Off" ? "Day Off" : reason,
    };

    const updatedAttendance = await TeacherAttendance.findByIdAndUpdate(
      id,
      updatedData,
      { new: true }
    );

    if (!updatedAttendance) {
      return res.status(404).json({ message: "Attendance not found." });
    }

    res.status(200).json({ message: "Attendance updated successfully.", updatedAttendance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllTeacherAttendance = async (req, res) => {
  try {
    const attendance = await TeacherAttendance.find()
      .populate("teacher", "name email subject")
      .sort({ date: -1 });

    res.status(200).json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get attendance history for one teacher by ID
const getTeacherAttendanceById = async (req, res) => {
  try {
    const { id } = req.params; // teacher ID

    const attendance = await TeacherAttendance.find({ teacher: id })
      .sort({ date: -1 })
      .select("-__v")
      .populate("teacher", "name email subject");

    res.status(200).json({message: "Attendance for the teacher.",attendance});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  markTeacherAttendance,
  getAllTeacherAttendance,
  updateTeacherAttendance,
  getTeacherAttendanceById, // 👈 Add this to exports
};
