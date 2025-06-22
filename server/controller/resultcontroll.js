const Result = require("../models/result");

const Attendance = require("../models/studentAttendance");
const Student = require("../models/student");
const mongoose = require("mongoose");
const { calculateAttendanceRate } = require("../utils/attendance");
const submitResultsForClassSubject = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { classId, subjectId, academicYear, results } = req.body;

    if (
      !classId ||
      !subjectId ||
      !academicYear ||
      !results ||
      !Array.isArray(results)
    ) {
      return res.status(400).json({ message: "Missing or invalid data." });
    }

    const resultData = await Promise.all(
      results.map(async (entry) => {
        const attendanceRate = await calculateAttendanceRate(
          entry.studentId,
          subjectId,
          academicYear // ✅ include academic year
        );

        const totalScore =
          entry.firstExam +
          entry.midExam +
          entry.thirdExam +
          entry.finalExam +
          entry.activities;

        return {
          teacher: teacherId,
          student: entry.studentId,
          subject: subjectId,
          classId,
          academicYear,
          attendanceRate,
          firstExam: entry.firstExam,
          midExam: entry.midExam,
          thirdExam: entry.thirdExam,
          finalExam: entry.finalExam,
          activities: entry.activities,
          total: totalScore.toFixed(1),
          createdBy: teacherId,
          lastUpdatedBy: teacherId,
        };
      })
    );

    await Result.insertMany(resultData);

    res.status(201).json({
      message: "Results submitted successfully.",
      results: resultData,
    });
  } catch (error) {
    console.error("Error submitting results:", error);
    res.status(500).json({ message: "Server error" });
  }
};
const getStudentResults = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicYear } = req.query;

    const query = { student: studentId, academicYear };
    if (academicYear) {
      query.academicYear = academicYear;
    }

    const results = await Result.find(query)
      .populate("subject", "name")
      .select(
        "subject name academicYear attendanceRate firstExam midExam thirdExam finalExam activities total lastUpdatedBy createdBy updatedAt createdAt"
      );

    const totalMarks = results.reduce((sum, r) => sum + parseFloat(r.total), 0);
    const avg =
      results.length > 0 ? (totalMarks / results.length).toFixed(2) : "N/A";

    const formatted = results.map((r) => ({
      subject: r.subject?.name || "Unknown",
      attendanceRate: r.attendanceRate,
      firstExam: r.firstExam,
      midExam: r.midExam,
      thirdExam: r.thirdExam,
      finalExam: r.finalExam,
      activities: r.activities,
      total: r.total,
    }));

    res.status(200).json({
      results: formatted,
      subjectCount: results.length,
      totalMarks: totalMarks.toFixed(1),
      average: avg,
    });
  } catch (error) {
    console.error("Error fetching student results:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/////////////////////
const updateResultForStudent = async (req, res) => {
  try {
    const { resultId } = req.params;
    const { firstExam, midExam, thirdExam, finalExam, activities, updatedBy } =
      req.body;

    // Validate numeric values
    const scores = [firstExam, midExam, thirdExam, finalExam, activities];
    if (
      scores.some(
        (score) => typeof score !== "number" || score < 0 || score > 100
      )
    ) {
      return res.status(400).json({ message: "Invalid score values" });
    }

    const existing = await Result.findById(resultId);
    if (!existing) {
      return res.status(404).json({ message: "Result not found" });
    }

    // Only calculate attendance rate if needed
    const attendanceRecords = await Attendance.find({
      student: existing.student,
      subject: existing.subject,
    });

    existing.firstExam = firstExam;
    existing.midExam = midExam;
    existing.thirdExam = thirdExam;
    existing.finalExam = finalExam;
    existing.activities = activities;
    existing.attendanceRate =
      attendanceRecords.length > 0
        ? (
            (attendanceRecords.filter((r) => r.status === "Present").length /
              attendanceRecords.length) *
            100
          ).toFixed(1)
        : 0;
    existing.total = (
      firstExam +
      midExam +
      thirdExam +
      finalExam +
      activities
    ).toFixed(1);
    existing.lastUpdatedBy = updatedBy;

    const updatedResult = await existing.save();

    res.status(200).json(updatedResult);
  } catch (error) {
    console.error("Error updating result:", error);
    res.status(500).json({
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
// Get results by class, subject, and year
// controllers/resultController.js
const getResultsByClassSubjectYear = async (req, res) => {
  try {
    const { classId, subjectId, academicYear } = req.query;

    if (!classId || !subjectId || !academicYear) {
      return res.status(400).json({ message: "Missing required parameters" });
    }

    const results = await Result.find({
      classId,
      subject: subjectId,
      academicYear,
    }).populate({
      path: "student",
      select: "user", // Get the user reference from Student
      populate: {
        path: "user", // Populate the actual User document
        select: "fullName", // Get only the fullName
      },
    });

    const formatted = results.map((r) => ({
      _id: r._id,
      studentId: r.student._id,
      fullName: r.student.user?.fullName || "Unknown Student",
      attendanceRate: r.attendanceRate || 0,
      firstExam: r.firstExam || 0,
      midExam: r.midExam || 0,
      thirdExam: r.thirdExam || 0,
      finalExam: r.finalExam || 0,
      activities: r.activities || 0,
      total: r.total || 0,
    }));

    res.status(200).json({ students: formatted });
  } catch (error) {
    console.error("Error in getResultsByClassSubjectYear:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const bulkUpdateResults = async (req, res) => {
  try {
    const { updates } = req.body;
    console.log("Incoming bulk update request:", { updates });

    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ message: "Invalid updates data." });
    }

    const resultIds = [];
    const updateMap = new Map();

    // Validation phase
    for (const [index, update] of updates.entries()) {
      console.log(`Processing update ${index + 1}/${updates.length}`);

      const { resultId, updatedBy } = update;
      const scoreFields = [
        "firstExam",
        "midExam",
        "thirdExam",
        "finalExam",
        "activities",
      ];

      // Validate resultId format
      if (!resultId || !mongoose.Types.ObjectId.isValid(resultId)) {
        return res.status(400).json({
          message: `Invalid or missing resultId at position ${index}: ${resultId}`,
          index,
        });
      }

      // Validate required fields
      const missingFields = [];
      if (!updatedBy) missingFields.push("updatedBy");
      scoreFields.forEach((field) => {
        if (update[field] === undefined || update[field] === null) {
          missingFields.push(field);
        }
      });

      if (missingFields.length > 0) {
        return res.status(400).json({
          message: `Missing fields in update ${index + 1}: ${missingFields.join(", ")}`,
          index,
        });
      }

      // Parse and validate scores
      const parsedScores = {};
      for (const field of scoreFields) {
        const value = Number(update[field]);
        if (isNaN(value)) {
          return res.status(400).json({
            message: `Invalid number format for ${field} in update ${index + 1}: ${update[field]}`,
            field,
            index,
          });
        }
        if (value < 0 || value > 100) {
          return res.status(400).json({
            message: `Value out of range (0-100) for ${field} in update ${index + 1}: ${value}`,
            field,
            index,
          });
        }
        parsedScores[field] = value;
      }

      if (updateMap.has(resultId)) {
        return res.status(400).json({
          message: `Duplicate resultId found at position ${index}: ${resultId}`,
          index,
        });
      }

      resultIds.push(resultId);
      updateMap.set(resultId, {
        ...parsedScores,
        updatedBy,
        resultId,
      });
    }

    // Fetch existing results
    console.log("Fetching existing results...");
    const existingResults = await Result.find({ _id: { $in: resultIds } });

    // Check for missing results
    const missingResults = resultIds.filter(
      (id) => !existingResults.some((r) => r._id.toString() === id)
    );

    if (missingResults.length > 0) {
      console.warn("Missing results:", missingResults);
      return res.status(404).json({
        message: `${missingResults.length} results not found`,
        missingIds: missingResults,
      });
    }

    // Prepare attendance query
    console.log("Gathering attendance data...");
    const attendanceQuery = existingResults.map(({ student, subject }) => ({
      student,
      subject,
    }));

    const attendanceRecords = await Attendance.find({
      $or: attendanceQuery,
    });

    console.log(`Found ${attendanceRecords.length} attendance records`);

    // Prepare bulk operations
    console.log("Preparing bulk operations...");
    const bulkOps = existingResults.map((result) => {
      const update = updateMap.get(result._id.toString());
      const {
        firstExam,
        midExam,
        thirdExam,
        finalExam,
        activities,
        updatedBy,
      } = update;

      // Calculate attendance rate
      const relevantAttendance = attendanceRecords.filter(
        (ar) =>
          ar.student.equals(result.student) && ar.subject.equals(result.subject)
      );

      const presentCount = relevantAttendance.filter(
        (a) => a.status === "Present"
      ).length;

      const attendanceRate =
        relevantAttendance.length > 0
          ? ((presentCount / relevantAttendance.length) * 100).toFixed(1)
          : "0.0";

      // Calculate total score
      const total = (
        firstExam +
        midExam +
        thirdExam +
        finalExam +
        activities
      ).toFixed(1);

      return {
        updateOne: {
          filter: { _id: result._id },
          update: {
            $set: {
              firstExam,
              midExam,
              thirdExam,
              finalExam,
              activities,
              attendanceRate,
              total,
              lastUpdatedBy: updatedBy,
              updatedAt: new Date(),
            },
          },
        },
      };
    });

    // Execute bulk write
    const bulkWriteResult = await Result.bulkWrite(bulkOps);

    console.log("Bulk write result:", bulkWriteResult);

    res.status(200).json({
      message: "Results updated successfully.",
      bulkWriteResult,
    });
  } catch (error) {
    console.error("Error in bulkUpdateResults:", error);
    res.status(500).json({
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
// controllers/resultController.js
const getClassResultsOverview = async (req, res) => {
  try {
    const { classId } = req.params;
    const { academicYear } = req.query;

    // Validate required parameters
    if (!classId) {
      return res.status(400).json({ message: "Class ID is required" });
    }

    if (!academicYear) {
      return res.status(400).json({ message: "Academic year is required" });
    }

    // Query results for the specific class and academic year
    const results = await Result.find({
      classId,
      academicYear,
    })
      .populate({
        path: "student",
        select: "user",
        populate: {
          path: "user",
          select: "fullName",
        },
      })
      .populate("subject", "name")
      .select(
        "student subject firstExam midExam thirdExam finalExam activities total"
      );

    // Organize results by student
    const studentMap = new Map();

    results.forEach((result) => {
      const studentId = result.student?._id?.toString();
      const subjectId = result.subject?._id?.toString();

      if (!studentId || !subjectId) return;

      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          studentId,
          fullName: result.student.user?.fullName || "Unknown Student",
          subjects: new Map(), // Will store subjectId => highest total
          details: [], // Store all subject details for the student
        });
      }

      const studentData = studentMap.get(studentId);
      const newTotal = parseFloat(result.total) || 0;

      // Keep the highest total per subject
      const currentTotal = studentData.subjects.get(subjectId);
      if (!currentTotal || newTotal > currentTotal) {
        studentData.subjects.set(subjectId, newTotal);

        // Store detailed subject information
        studentData.details.push({
          subjectId,
          subjectName: result.subject?.name || "Unknown",
          firstExam: result.firstExam || 0,
          midExam: result.midExam || 0,
          thirdExam: result.thirdExam || 0,
          finalExam: result.finalExam || 0,
          activities: result.activities || 0,
          total: newTotal,
        });
      }
    });

    // Calculate summary for each student
    const students = Array.from(studentMap.values()).map((student) => {
      const subjectTotals = Array.from(student.subjects.values());
      const totalMarks = subjectTotals.reduce((sum, val) => sum + val, 0);
      const subjectsCount = student.subjects.size;

      return {
        studentId: student.studentId,
        fullName: student.fullName,
        totalMarks: totalMarks.toFixed(1),
        subjectsCount,
        averagePerSubject:
          subjectsCount > 0 ? (totalMarks / subjectsCount).toFixed(2) : "0.00",
        subjects: student.details, // Include detailed subject information
      };
    });

    // Sort students by total marks (descending)
    students.sort(
      (a, b) => parseFloat(b.totalMarks) - parseFloat(a.totalMarks)
    );

    res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    console.error("Error in getClassResultsOverview:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching class results overview",
      error: error.message,
    });
  }
};
// Get all unique academic years from the Result collection
const getRegisteredAcademicYears = async (req, res) => {
  try {
    const years = await Result.distinct("academicYear");

    const sortedYears = years.sort((a, b) => {
      // Sort years like "2024-2025"
      const aStart = parseInt(a.split("-")[0]);
      const bStart = parseInt(b.split("-")[0]);
      return bStart - aStart; // Descending order
    });

    res
      .status(200)
      .json({ message: "All the years", academicYears: sortedYears });
  } catch (error) {
    console.error("Error fetching academic years:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getClassResultsOverview,
  getRegisteredAcademicYears,
  getStudentResults,
  getResultsByClassSubjectYear,
  bulkUpdateResults,
  updateResultForStudent,
  submitResultsForClassSubject,
};
