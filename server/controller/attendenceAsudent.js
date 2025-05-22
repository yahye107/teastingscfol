const Attendance = require("../models/studentAttendance");
const Student = require("../models/student");
// POST - Mark student attendance
const markStudentAttendance = async (req, res) => {
  try {
    const { userId } = req.params; // Changed from teacherId to userId
    const { classId, subject, periodStart, periodEnd, date, attendanceList } =
      req.body;

    // Validate required fields
    if (
      !classId ||
      !subject ||
      !periodStart ||
      !periodEnd ||
      !date ||
      !attendanceList
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const localDate = new Date(date);
    const utcDate = new Date(
      Date.UTC(
        localDate.getFullYear(),
        localDate.getMonth(),
        localDate.getDate()
      )
    );
    // Create attendance records with userId
    const bulkData = attendanceList.map((entry) => ({
      user: userId, // Now using userId instead of teacherId
      student: entry.studentId,
      subject,
      status: entry.status,
      classId,
      periodStart,
      periodEnd,
      date: utcDate,
    }));

    await Attendance.insertMany(bulkData);
    res.status(201).json({ message: "Attendance submitted successfully." });
  } catch (error) {
    console.error("Error submitting attendance:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update getStudentAttendance controller
const getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    let query = { student: studentId };

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Remove timezone conversion (dates already UTC)
      query.date = {
        $gte: start,
        $lte: end,
      };
    }

    const attendance = await Attendance.find(query)
      .populate({ path: "user", select: "fullName" })
      .populate("subject", "name")
      .sort({ date: -1 })
      .lean();

    // Format dates to local string without converting
    const result = attendance.map((entry) => ({
      ...entry,
      markedBy: entry.user?.fullName || "Unknown",
      subject: entry.subject?.name || "Unknown",
      date: new Date(entry.date).toLocaleDateString("en-US"), // Keep local format
    }));

    res.status(200).json({ result });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET - Attendance rates for a class
const getAttendanceRatesForClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const students = await Student.find({ classId }).select("_id");

    const results = await Promise.all(
      students.map(async (student) => {
        const allRecords = await Attendance.find({ student: student._id });
        const total = allRecords.length;

        const presentCount = allRecords.filter(
          (entry) => entry.status === "Present"
        ).length;

        const percentage =
          total > 0 ? ((presentCount / total) * 100).toFixed(1) : "N/A";

        return {
          studentId: student._id,
          attendanceRate: percentage,
        };
      })
    );

    res.status(200).json(results);
  } catch (error) {
    console.error("Error calculating attendance rates:", error);
    res.status(500).json({ message: "Server error" });
  }
};
//////////////
const getAttendanceRatesBySubject = async (req, res) => {
  try {
    const { classId, subjectId } = req.params;

    // Calculate start and end of the current day (resets daily at midnight)
    const currentDate = new Date();
    const academicYearStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      0,
      0,
      0 // Set to midnight (00:00:00) of the current day
    );
    const academicYearEnd = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() + 1, // Next day
      0,
      0,
      0 // Midnight of the next day
    );

    const students = await Student.find({ classId }).select("_id");

    const results = await Promise.all(
      students.map(async (student) => {
        const allRecords = await Attendance.find({
          student: student._id,
          subject: subjectId,
          date: { $gte: academicYearStart, $lt: academicYearEnd }, // Filter by today's date
        });

        const total = allRecords.length;
        const presentCount = allRecords.filter(
          (entry) => entry.status === "Present"
        ).length;

        const percentage =
          total > 0 ? ((presentCount / total) * 100).toFixed(1) : "N/A";

        return {
          studentId: student._id,
          attendanceRate: percentage,
        };
      })
    );

    res.status(200).json(results);
  } catch (error) {
    console.error("Error calculating subject-based attendance rates:", error);
    res.status(500).json({ message: "Server error" });
  }
};
// a. Edit Attendance
// Backend Controller (attendenceAsudent.js)
// a. Edit Attendance
const updateAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const updated = await Attendance.findByIdAndUpdate(
      attendanceId,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    res.status(200).json({ message: "Attendance updated", data: updated });
  } catch (error) {
    console.error("Error updating attendance:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// b. Daily Attendance Summary
const getDailySummary = async (req, res) => {
  try {
    const { classId, date } = req.body;

    if (!classId || !date) {
      return res
        .status(400)
        .json({ message: "classId and date are required." });
    }

    const summary = await Attendance.aggregate([
      {
        $match: {
          classId,
          date: new Date(date),
          user: req.user.id,
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// a. Comprehensive Reports
const getClassAttendanceReport = async (req, res) => {
  try {
    const { classId, fromDate, toDate } = req.query;
    const report = await Attendance.aggregate([
      {
        $match: {
          classId,
          date: { $gte: new Date(fromDate), $lte: new Date(toDate) },
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "student",
          foreignField: "_id",
          as: "studentData",
        },
      },
      {
        $group: {
          _id: "$student",
          totalDays: { $sum: 1 },
          presentDays: {
            $sum: {
              $cond: [{ $eq: ["$status", "Present"] }, 1, 0],
            },
          },
          studentName: { $first: "$studentData.user.fullName" },
        },
      },
    ]);
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// b. Bulk Actions
const bulkUpdateAttendance = async (req, res) => {
  try {
    const { updates } = req.body;
    const bulkOps = updates.map((update) => ({
      updateOne: {
        filter: { _id: update.attendanceId },
        update: { $set: { status: update.newStatus } },
      },
    }));

    await Attendance.bulkWrite(bulkOps);
    res.json({ message: "Bulk update successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
// a. Monthly Attendance Summary
const getMonthlySummary = async (req, res) => {
  try {
    const { studentId } = req.params;
    const monthlyData = await Attendance.aggregate([
      {
        $match: {
          student: studentId,
          date: {
            $gte: new Date(startOfMonth),
            $lte: new Date(endOfMonth),
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          statuses: { $push: "$status" },
        },
      },
    ]);
    res.json(monthlyData);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
// a. Comprehensive Reports
// Attendance threshold alerts
const checkAttendanceThreshold = async (studentId) => {
  const totalRecords = await Attendance.countDocuments({ student: studentId });
  const presentCount = await Attendance.countDocuments({
    student: studentId,
    status: "Present",
  });

  const attendanceRate = (presentCount / totalRecords) * 100;

  if (attendanceRate < 75) {
    // Trigger notification to admin/parent
    sendNotification({
      studentId,
      message: `Low attendance: ${attendanceRate.toFixed(1)}%`,
    });
  }
};
// Attendance trends over time
const getAttendanceTrends = async (req, res) => {
  try {
    const { classId, timeframe } = req.query;
    const trends = await Attendance.aggregate([
      {
        $match: { classId },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: timeframe === "monthly" ? "%Y-%m" : "%Y-%W",
              date: "$date",
            },
          },
          presentCount: {
            $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] },
            totalStudents: { $sum: 1 },
          },
        },
      },
      {
        $project: {
          datePeriod: "$_id",
          attendanceRate: {
            $multiply: [{ $divide: ["$presentCount", "$totalStudents"] }, 100],
          },
        },
      },
    ]);
    res.json(trends);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
module.exports = {
  markStudentAttendance,
  getAttendanceRatesForClass,
  getStudentAttendance,
  getAttendanceRatesBySubject,
  updateAttendance,
  getDailySummary,
  getClassAttendanceReport,
  bulkUpdateAttendance,
  getMonthlySummary,
  checkAttendanceThreshold,
  getAttendanceTrends,
};
