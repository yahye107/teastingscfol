const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Student = require("../models/student");
const Parent = require("../models/parents");
const Attendance = require("../models/studentAttendance");
const Teacher = require("../models/teacher");
const Result = require("../models/result");
require("dotenv").config();

const authVerification = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1]; // Get Bearer token

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userInfo = await User.findById(decoded.id).select(
      "-password -rawPassword"
    );
    if (!userInfo) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access — user not found",
      });
    }

    if (userInfo.status === "blocked") {
      return res.status(403).json({
        success: false,
        message: "Your account is blocked. Contact admin.",
      });
    }
    let teacherInfo = null;
    let studentInfo = null;
    let parentInfo = null;
    if (userInfo.role === "teacher") {
      teacherInfo = await Teacher.findOne({ user: userInfo._id }).populate({
        path: "timetables",
        select: "day startTime endTime", // select fields from the Timetable itself
        populate: [
          { path: "class", select: "name" }, // class.name
          { path: "hall", select: "hallNumber" }, // hall.hallNumber
          { path: "subject", select: "name" }, // subject.name
        ],
      });
    }

    if (userInfo.role === "student") {
      const student = await Student.findOne({ user: userInfo._id })
        .populate("classId", "_id name section timetables parent")
        .populate({
          path: "exam",
          select: "title exams halls classId",
        })

        .populate({
          path: "feeRecordes",
          select:
            "amount status month year academicYear sentBy dueDate date method note dept",
          options: { sort: { createdAt: -1 } }, // Optional: sort by date
        })
        .populate({
          path: "parent",
          populate: {
            path: "user",
            select: "fullName contact",
          },
        });

      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      const results = await Result.find({ student: student._id })
        .populate("subject", "name")
        .select(
          "subject attendanceRate firstExam midExam thirdExam finalExam activities total academicYear lastUpdatedBy createdBy updatedAt createdAt"
        );

      // Convert to plain object and attach results
      studentInfo = student.toObject();
      studentInfo.results = results;
    }
    if (userInfo.role === "parent") {
      parentInfo = await Parent.findOne({ user: userInfo._id }).populate({
        path: "children",
        populate: [
          {
            path: "classId",
            select: "name section timetables",
          },
          {
            path: "parent",
            populate: {
              path: "user",
              select: "fullName email contact",
            },
          },

          {
            path: "feeRecordes",
            select:
              "amount status month year academicYear dueDate date method note dept",
          },
        ],
      });

      if (!parentInfo) {
        return res.status(404).json({ message: "Parent not found" });
      }

      // Convert to plain object
      parentInfo = parentInfo.toObject();

      // Attach cleaned children with attendance
      parentInfo.children = await Promise.all(
        parentInfo.children.map(async (child) => {
          const user = await User.findById(child.user).select("fullName email");

          // ✅ Fetch attendance for each student
          const attendance = await Attendance.find({ student: child._id })
            .populate("subject", "name")
            .select("status date subject periodStart periodEnd academicYear");
          const results = await Result.find({ student: child._id })
            .populate("subject", "name")
            .populate("classId", "name section")
            .select(
              "academicYear subject classId attendanceRate firstExam midExam thirdExam finalExam activities total createdAt createdBy"
            );

          return {
            id: child._id,
            name: user?.fullName || "Unknown",
            email: user?.email || "N/A",
            class: child.classId,
            feeRecordes: child.feeRecordes,
            attendance: attendance,
            Result: results,
          };
        })
      );
    }

    req.userInfo = userInfo;
    req.teacherInfo = teacherInfo;
    req.studentInfo = studentInfo;
    req.parentInfo = parentInfo;
    // Optional: Add references to user object
    if (teacherInfo) userInfo.teacherProfile = teacherInfo._id;
    if (studentInfo) userInfo.studentProfile = studentInfo._id;
    if (parentInfo) userInfo.parentProfile = parentInfo._id;
    next();
  } catch (error) {
    console.error("Auth Verification Error:", error); // Log actual error
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = { authVerification };
