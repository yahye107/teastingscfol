const Attendance = require("../models/studentAttendance");
const Student = require("../models/student");
const Subject = require("../models/subject");

// POST - Mark student attendance
const markStudentAttendance = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      classId,
      subject,
      periodStart,
      periodEnd,
      date,
      attendanceList,
      academicYear,
    } = req.body;

    if (
      !classId ||
      !subject ||
      !periodStart ||
      !periodEnd ||
      !date ||
      !attendanceList ||
      !academicYear
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

    const bulkData = attendanceList.map((entry) => ({
      user: userId,
      student: entry.studentId,
      subject,
      status: entry.status,
      classId,
      periodStart,
      periodEnd,
      date: utcDate,
      academicYear,
    }));

    await Attendance.insertMany(bulkData);
    res.status(201).json({ message: "Attendance submitted successfully." });
  } catch (error) {
    console.error("Error submitting attendance:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update getStudentAttendance controller
const getStudentAttendance = async (
  req,
  res,
  studentId,
  startDate,
  endDate,
  academicYear
) => {
  try {
    let query = { student: studentId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (academicYear && academicYear !== "All") {
      query.academicYear = academicYear;
    }

    const attendance = await Attendance.find(query)
      .populate({ path: "user", select: "fullName" }) // teacher who marked it
      .populate({ path: "subject", select: "name" }) // subject name
      .populate({
        path: "student",
        populate: {
          path: "user",
          select: "fullName",
        },
      }) // ✅ this gets the student fullName from the linked user
      .sort({ date: -1 })
      .lean();

    const result = attendance.map((entry) => ({
      ...entry,
      markedBy: entry.user?.fullName || "Unknown",
      subject: entry.subject?.name || "Unknown",
      studentName: entry.student?.user?.fullName || "Unknown",
      date: new Date(entry.date).toLocaleDateString("en-US"),
      academicYear: entry.academicYear,
    }));

    res.status(200).json({
      result,
      meta: {
        totalRecords: result.length,
        academicYear: academicYear || "All Years",
        studentId,
        dateRange:
          startDate && endDate ? `${startDate} to ${endDate}` : "All Dates",
      },
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET - Attendance rates for a class
const getAttendanceRatesForClass = async (req, res, classId, academicYear) => {
  try {
    const students = await Student.find({ classId }).select("_id");

    const results = await Promise.all(
      students.map(async (student) => {
        const query = { student: student._id };
        if (academicYear && academicYear !== "All") {
          query.academicYear = academicYear;
        }

        const allRecords = await Attendance.find(query);
        const total = allRecords.length;
        const presentCount = allRecords.filter(
          (entry) => entry.status === "Present"
        ).length;

        const percentage =
          total > 0 ? ((presentCount / total) * 100).toFixed(1) : "N/A";

        return {
          studentId: student._id,
          attendanceRate: percentage,
          totalRecords: total,
          academicYear: academicYear || "All Years",
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
const getAttendanceRatesBySubject = async (
  req,
  res,
  classId,
  subjectId,
  academicYear
) => {
  try {
    const students = await Student.find({ classId }).select("_id");

    const results = await Promise.all(
      students.map(async (student) => {
        const query = {
          student: student._id,
          subject: subjectId,
        };
        if (academicYear && academicYear !== "All") {
          query.academicYear = academicYear;
        }

        const allRecords = await Attendance.find(query);
        const total = allRecords.length;
        const presentCount = allRecords.filter(
          (entry) => entry.status === "Present"
        ).length;

        const percentage =
          total > 0 ? ((presentCount / total) * 100).toFixed(1) : "N/A";

        return {
          studentId: student._id,
          subjectId,
          attendanceRate: percentage,
          totalRecords: total,
          academicYear: academicYear || "All Years",
        };
      })
    );

    res.status(200).json(results);
  } catch (error) {
    console.error("Error calculating subject-based attendance rates:", error);
    res.status(500).json({ message: "Server error" });
  }
};
// controller/attendanceController.js

const getStudentAttendanceByAcademicYear = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicYear } = req.query;

    if (!studentId || !academicYear) {
      return res
        .status(400)
        .json({ message: "Missing studentId or academicYear" });
    }

    const query = {
      student: studentId,
      academicYear,
    };

    const attendanceRecords = await Attendance.find(query)
      .populate({ path: "user", select: "fullName" }) // teacher
      .populate({ path: "subject", select: "name" }) // subject
      .populate({
        path: "student",
        populate: {
          path: "user",
          select: "fullName",
        },
      })
      .sort({ date: -1 })
      .lean();

    // Map full records
    const result = attendanceRecords.map((entry) => ({
      ...entry,
      markedBy: entry.user?.fullName || "Unknown",
      subject: entry.subject?.name || "Unknown",
      studentName: entry.student?.user?.fullName || "Unknown",
      date: new Date(entry.date).toLocaleDateString("en-US"),
    }));

    // Calculate attendance rate per subject
    const subjectSummary = {};
    for (const entry of attendanceRecords) {
      const subjectId = entry.subject?._id?.toString();
      const subjectName = entry.subject?.name || "Unknown";

      if (!subjectSummary[subjectId]) {
        subjectSummary[subjectId] = {
          subjectId,
          subjectName,
          total: 0,
          present: 0,
        };
      }

      subjectSummary[subjectId].total += 1;
      if (entry.status === "Present") {
        subjectSummary[subjectId].present += 1;
      }
    }

    const subjectRates = Object.values(subjectSummary).map((s) => ({
      subjectId: s.subjectId,
      subjectName: s.subjectName,
      totalRecords: s.total,
      presentCount: s.present,
      attendanceRate:
        s.total > 0 ? ((s.present / s.total) * 100).toFixed(1) + "%" : "N/A",
    }));

    res.status(200).json({
      success: true,
      records: result,
      subjectRates,
      meta: {
        studentId,
        academicYear,
        totalRecords: result.length,
        subjectsWithAttendance: subjectRates.length,
      },
    });
  } catch (error) {
    console.error("Error fetching attendance by academic year:", error);
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
const getLoggedInStudentAttendance = async (req, res) => {
  try {
    const userId = req.userInfo._id;
    const { subjectId, academicYear } = req.query;

    // Find student based on authenticated user
    const student = await Student.findOne({ user: userId });

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    // Build query with filters
    const query = { student: student._id };
    if (subjectId) query.subject = subjectId;
    if (academicYear && academicYear !== "All")
      query.academicYear = academicYear;

    const attendance = await Attendance.find(query)
      .populate({ path: "user", select: "fullName" })
      .populate({ path: "subject", select: "name" })
      .sort({ date: -1 })
      .lean();

    // Format response
    const formatted = attendance.map((entry) => ({
      _id: entry._id,
      date: entry.date,
      subject: entry.subject?.name || "Unknown",
      status: entry.status,
      markedBy: entry.user?.fullName || "Unknown",
      academicYear: entry.academicYear,
      periodStart: entry.periodStart,
      periodEnd: entry.periodEnd,
    }));

    res.status(200).json({
      studentName: student.fullName,
      totalRecords: formatted.length,
      records: formatted,
    });
  } catch (error) {
    console.error("Error getting student attendance:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get unique subjects for a student
const getStudentSubjects = async (req, res) => {
  try {
    const userId = req.userInfo._id;
    const student = await Student.findOne({ user: userId });

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    // Get distinct subjects from student's attendance records
    const subjectIds = await Attendance.distinct("subject", {
      student: student._id,
    });

    // Get subject details
    const subjects = await Subject.find(
      { _id: { $in: subjectIds } },
      { _id: 1, name: 1 }
    );

    res.status(200).json({ subjects });
  } catch (error) {
    console.error("Error getting student subjects:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get attendance summary for student
const getStudentAttendanceSummary = async (req, res) => {
  try {
    const userId = req.userInfo._id;
    const student = await Student.findOne({ user: userId });

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const allRecords = await Attendance.find({ student: student._id });

    // Calculate summary statistics
    const summary = {
      Present: 0,
      Absent: 0,
      Late: 0,
      Excused: 0,
      total: allRecords.length,
    };

    allRecords.forEach((record) => {
      if (summary.hasOwnProperty(record.status)) {
        summary[record.status]++;
      }
    });

    res.status(200).json(summary);
  } catch (error) {
    console.error("Error getting attendance summary:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getLoggedInStudentAttendance,
  getStudentSubjects,
  getStudentAttendanceSummary,
  markStudentAttendance,
  getAttendanceRatesForClass,
  getStudentAttendance,
  getAttendanceRatesBySubject,
  updateAttendance,
  getDailySummary,
  getClassAttendanceReport,
  getStudentAttendanceByAcademicYear,
  bulkUpdateAttendance,
  getMonthlySummary,
  checkAttendanceThreshold,
  getAttendanceTrends,
};
