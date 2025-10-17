const bcrypt = require("bcryptjs");
const User = require("../models/user");
const Staff = require("../models/staff");
const { generateEasyPassword } = require("../utils/passwordgenetar");
// const { sendCredentialsEmail } = require("../utils/emailService");

// ✅ Create new staff
const createStaff = async (req, res) => {
  try {
    const {
      fullName,
      email,
      dob,
      gender,
      nationalId,
      jobTitle,
      employmentType,
      educationalQualifications,
      // certifications,
      age,
      SalaryBymonth,
      notes,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Staff'email already exists." });
    // const existingStaffByNationalId = await Staff.findOne({ nationalId });
    // if (existingStaffByNationalId) {
    //   return res
    //     .status(400)
    //     .json({ message: "Staff national ID already exists." });
    // }

    const baseUsername = fullName.split(" ")[0].toLowerCase();
    const username = baseUsername;
    const password = generateEasyPassword(username);
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email,
      username,
      password: hashedPassword,
      role: "staff",
      rawPassword: password,
    });

    const staff = await Staff.create({
      user: user._id,
      dob,
      gender,
      nationalId,
      jobTitle,
      employmentType,
      educationalQualifications,
      age,
      // certifications,
      SalaryBymonth,
      notes,
    });

    await User.findByIdAndUpdate(user._id, { staffProfile: staff._id });

    // await sendCredentialsEmail(email, fullName, password);

    res.status(201).json({
      message: "Staff created successfully",
      staff,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get all staff
const getAllStaff = async (req, res) => {
  try {
    const staffList = await Staff.find()
      .populate({
        path: "user",
        select: "fullName email username status",
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "All staff fetched successfully",
      staff: staffList,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get staff by ID
const getStaffById = async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await Staff.findById(id).populate({
      path: "user",
      select: "fullName email username role rawPassword status",
    });

    if (!staff) return res.status(404).json({ message: "Staff not found." });

    res.status(200).json({
      message: "Staff fetched successfully",
      staff,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update staff
const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      email,
      dob,
      gender,
      nationalId,
      jobTitle,
      employmentType,
      educationalQualifications,
      certifications,
      SalaryBymonth,
      notes,
      status,
    } = req.body;

    const staff = await Staff.findById(id).populate("user");
    if (!staff) return res.status(404).json({ message: "Staff not found." });

    // 🔹 Calculate age if DOB is provided
    let calculatedAge = staff.age; // Keep old age if DOB isn't changed
    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      calculatedAge = today.getFullYear() - birthDate.getFullYear();

      // Adjust if birthday hasn’t occurred yet this year
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        calculatedAge--;
      }
    }

    // 🔹 Update user info
    if (fullName) staff.user.fullName = fullName;
    if (email) staff.user.email = email;
    if (status) staff.user.status = status;
    await staff.user.save();

    // 🔹 Update staff data
    staff.dob = dob ?? staff.dob;
    staff.gender = gender ?? staff.gender;
    staff.nationalId = nationalId ?? staff.nationalId;
    staff.jobTitle = jobTitle ?? staff.jobTitle;
    staff.employmentType = employmentType ?? staff.employmentType;
    staff.educationalQualifications =
      educationalQualifications ?? staff.educationalQualifications;
    staff.certifications = certifications ?? staff.certifications;
    staff.SalaryBymonth = SalaryBymonth ?? staff.SalaryBymonth;
    staff.notes = notes ?? staff.notes;
    staff.age = calculatedAge; // ✅ Save new or existing age

    await staff.save();

    const updatedStaff = await Staff.findById(id).populate("user");

    res.status(200).json({
      message: "Staff updated successfully",
      staff: updatedStaff,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete staff
const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await Staff.findById(id);
    if (!staff) return res.status(404).json({ message: "Staff not found." });

    if (staff.user) await User.findByIdAndDelete(staff.user);
    await Staff.findByIdAndDelete(id);

    res.status(200).json({ message: "Staff deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
};
