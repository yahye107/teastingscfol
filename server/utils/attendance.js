// utils/attendance.js
const Attendance = require("../models/studentAttendance");

const calculateAttendanceRate = async (studentId, subjectId) => {
  try {
    const total = await Attendance.countDocuments({
      student: studentId,
      subject: subjectId,
    });

    if (total === 0) return 0;

    const presentCount = await Attendance.countDocuments({
      student: studentId,
      subject: subjectId,
      status: "Present",
    });

    return Number(((presentCount / total) * 100).toFixed(1));
  } catch (error) {
    console.error("Error calculating attendance rate:", error);
    return 0;
  }
};

module.exports = { calculateAttendanceRate };
