const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Student = require("../models/student");
const Classroom = require("../models/classroom");
const Parent = require("../models/parents");
const Teacher = require("../models/teacher");

const User = require("../models/user");
require("dotenv").config();

const { generateEasyPassword } = require("../utils/passwordgenetar");
// const { sendCredentialsEmail } = require("../utils/emailService");

const registerUser = async (req, res) => {
  try {
    const { username, email, role, ...rest } = req.body;

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "User already exists." });

    const password = generateEasyPassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      role,
      password: hashedPassword,
      rawPassword: password, // Storing raw password for admin reference (secure this later)
      ...rest,
    });
    user.teacherProfile = teacher._id;
    await user.save();

    // await sendCredentialsEmail(email, username, password);

    res
      .status(201)
      .json({ message: "User created and credentials sent to email." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.status === "blocked") {
      return res.status(403).json({ message: "Your account has been blocked" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials." });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // Set token as a cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getUserCredentials = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select(
      "username rawPassword email role"
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const logoutUser = (req, res) => {
  // Clear the JWT cookie
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // true in production
    sameSite: "strict",
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

const getTeacherInfo = async (req, res) => {
  const userId = req.userInfo._id;
  // or however you store logged-in user info

  try {
    const teacher = await Teacher.findOne({ user: userId })
      .populate("subjects") // optional: populate subjects
      .populate("timetables"); // optional: populate timetables

    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found." });
    }

    res.json({ user: req.user, teacher });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the user first
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // If the user is a student, delete the related student record
    if (user.role === "student") {
      const student = await Student.findOne({ user: user._id });
      if (student) {
        // Remove student from the classroom and parent's children list
        await Classroom.findByIdAndUpdate(student.classId, {
          $pull: { students: student._id },
        });
        if (student.parent) {
          await Parent.findByIdAndUpdate(student.parent, {
            $pull: { children: student._id },
          });
        }

        // Delete the student and user record
        await Student.findByIdAndDelete(student._id);
      }
    }

    // If the user is a parent, delete the related parent record
    if (user.role === "parent") {
      const parent = await Parent.findOne({ user: user._id });
      if (parent) {
        // Remove the parent's children (students)
        for (let childId of parent.children) {
          await Student.findByIdAndUpdate(childId, {
            $unset: { parent: "" },
          });
        }
        // Delete the parent
        await Parent.findByIdAndDelete(parent._id);
      }
    }

    // If the user is a teacher, delete the related teacher record (if applicable)
    if (user.role === "teacher") {
      const teacher = await Teacher.findOne({ user: user._id });
      if (teacher) {
        // TODO: remove teacher from other references if needed
        await Teacher.findByIdAndDelete(teacher._id);
      }
    }

    // Finally, delete the user record
    await User.findByIdAndDelete(id);

    res
      .status(200)
      .json({ message: "User and all related data deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("+rawPassword");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status input
    if (!["active", "pending", "blocked"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ message: "User not found." });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
module.exports = {
  getAllUsers,
  deleteUser,
  registerUser,
  loginUser,
  updateUserStatus,
  getUserCredentials,
  logoutUser,
};
