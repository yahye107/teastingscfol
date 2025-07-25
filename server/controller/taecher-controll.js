const bcrypt = require("bcryptjs");
const User = require("../models/user");
const Teacher = require("../models/teacher");
const Subject = require("../models/subject");
const { generateEasyPassword } = require("../utils/passwordgenetar");

const createTeacher = async (req, res) => {
  try {
    const {
      fullName,
      email,
      gender,
      dob,
      age,
      contact,
      SalaryBymonth,
      address,
      qualification,
      experience,
      // employeeId,

      subjectIds,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Teacher already exists." });
    const baseUsername = fullName.split(" ")[0].toLowerCase();
    let username = baseUsername;
    const password = generateEasyPassword(username);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      username,
      rawPassword: password,
      role: "teacher",
    });

    const teacher = await Teacher.create({
      user: user._id,
      gender,
      dob,
      contact,
      SalaryBymonth,
      age,
      address,
      qualifications: qualification, // map qualification to qualifications
      experience,
      subjects: subjectIds || [],
      timetable: null,
    });
    await User.findByIdAndUpdate(user._id, {
      teacherProfile: teacher._id,
    });
    res.status(201).json({ message: "Teacher created successfully", teacher });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all teachers with populated user and subjects
const getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .populate({
        path: "user",
        select: "fullName email role rawPassword", // Include only necessary user fields
      })
      .populate("subjects");
    res.status(200).json({ message: "Teacher found.", teachers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a specific teacher by ID
const getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
      .populate({
        path: "user",
        select: "fullName email role rawPassword", // Include only necessary user fields
      })
      .populate("subjects");
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    res.status(200).json({
      message: "Teacher found.",
      teacher,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update teacher details
const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      email,
      gender,
      dob,
      contact,
      SalaryBymonth,
      address,
      age,
      qualification,
      experience,
      // employeeId,
      subjectIds,
    } = req.body;

    const teacher = await Teacher.findById(id);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    // Update linked user
    if (fullName || email) {
      await User.findByIdAndUpdate(teacher.user, { fullName, email });
    }

    // Update teacher fields
    const updatedTeacher = await Teacher.findByIdAndUpdate(
      id,
      {
        gender,
        dob,
        contact,
        address,
        qualification,
        SalaryBymonth,
        age,
        experience,
        // employeeId,
        subjects: subjectIds || [],
      },
      { new: true }
    )
      .populate("user")
      .populate("subjects");

    res
      .status(200)
      .json({ message: "Teacher updated", teacher: updatedTeacher });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a teacher and linked user
const deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    await User.findByIdAndDelete(teacher.user);
    await Teacher.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Teacher and user deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createTeacher,
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
};
