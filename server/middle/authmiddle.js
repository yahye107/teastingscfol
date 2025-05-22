const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Teacher = require("../models/teacher");
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

    if (userInfo.role === "teacher") {
      teacherInfo = await Teacher.findOne({ user: userInfo._id })
        .populate("subjects")
        .populate("timetables");
    }

    if (userInfo.role === "student") {
      studentInfo = await Student.findOne({ user: userInfo._id })
        .populate("classroom")
        .populate("parent");
    }

    req.userInfo = userInfo;
    req.teacherInfo = teacherInfo;
    req.studentInfo = studentInfo;

    // Optional: Add references to user object
    if (teacherInfo) userInfo.teacherProfile = teacherInfo._id;
    if (studentInfo) userInfo.studentProfile = studentInfo._id;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = { authVerification };
