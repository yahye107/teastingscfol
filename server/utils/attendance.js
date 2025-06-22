const Attendance = require("../models/studentAttendance");

// utils/attendance.js
const calculateAttendanceRate = async (studentId, subjectId, academicYear) => {
  const query = {
    student: studentId,
    subject: subjectId,
    academicYear: academicYear, // Add academic year filter
  };

  const attendanceRecords = await Attendance.find(query);

  const presentCount = attendanceRecords.filter(
    (record) => record.status === "Present"
  ).length;

  const totalRecords = attendanceRecords.length;

  return totalRecords > 0
    ? ((presentCount / totalRecords) * 100).toFixed(1)
    : "0.0";
};

module.exports = { calculateAttendanceRate };
