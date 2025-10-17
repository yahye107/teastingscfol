const bcrypt = require("bcryptjs");
const User = require("../models/user");
const Parent = require("../models/parents");
const { generateEasyPassword } = require("../utils/passwordgenetar");
// const { sendCredentialsEmail } = require("../utils/emailService");

const createParent = async (req, res) => {
  try {
    const { fullName, email, occupation, contact, address } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Parent already exists." });
    const baseUsername = fullName.split(" ")[0].toLowerCase();
    let username = baseUsername;
    const password = generateEasyPassword(username);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email,
      username,
      password: hashedPassword,
      role: "parent",
      rawPassword: password,
    });

    const parent = await Parent.create({
      user: user._id,
      occupation,
      contact,
      address,
      children: [],
    });
    await User.findByIdAndUpdate(user._id, {
      parentProfile: parent._id,
    });
    // await sendCredentialsEmail(email, fullName, password);

    res.status(201).json({ message: "Parent created successfully", parent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const getParentChildren = async (req, res) => {
  try {
    const { parentId } = req.params;

    const parent = await Parent.findById(parentId).populate({
      path: "children",
      select:
        "contact dob gender admissionNumber address previousSchool classId user", // include refs
      populate: [
        {
          path: "user",
          select: "fullName email",
        },
        {
          path: "classId",
          select: "name section academicYear",
        },
      ],
    });

    if (!parent) {
      return res.status(404).json({ message: "Parent not found." });
    }

    res.status(200).json({
      message: "Children fetched successfully",
      children: parent.children,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllParents = async (req, res) => {
  try {
    const parents = await Parent.find()
      .populate({
        path: "user",
        select: "fullName email role rawPassword", // Include only necessary user fields
      })
      .populate({
        path: "children",
        select: "fullName email contact dob classId", // Optional: include children info if needed
      });

    res.status(200).json({
      message: "All parents fetched successfully",
      parents,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const childrenPopulation = {
  path: "children",
  select:
    "contact dob gender admissionNumber address previousSchool classId user",
  populate: [
    {
      path: "user",
      select: "fullName status email",
    },
    {
      path: "classId",
      select: "name section academicYear",
    },
  ],
};

const getParentById = async (req, res) => {
  try {
    const { id } = req.params;
    const parent = await Parent.findById(id)
      .populate({
        path: "user",
        select: "fullName email status role rawPassword",
      })
      .populate(childrenPopulation);

    if (!parent) {
      return res.status(404).json({ message: "Parent not found." });
    }

    res.status(200).json({ message: "Parent fetched successfully", parent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a parent
const updateParent = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, occupation, contact, address } = req.body;

    // Find parent with user populated
    const parent = await Parent.findById(id).populate("user");
    if (!parent) return res.status(404).json({ message: "Parent not found." });

    // Update user info
    if (fullName) parent.user.fullName = fullName;
    if (email) parent.user.email = email;
    await parent.user.save();

    // Update parent info
    if (occupation) parent.occupation = occupation;
    if (contact) parent.contact = contact;
    if (address) parent.address = address;

    await parent.save();

    // 🔥 Re-fetch updated parent with children fully populated
    const updatedParent = await Parent.findById(id)
      .populate("user")
      .populate(childrenPopulation);

    res
      .status(200)
      .json({ message: "Parent updated successfully", parent: updatedParent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteParent = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the parent first
    const parent = await Parent.findById(id);
    if (!parent) {
      return res.status(404).json({ message: "Parent not found." });
    }

    // Delete the associated user
    if (parent.user) {
      await User.findByIdAndDelete(parent.user);
    }

    // Delete the parent
    await Parent.findByIdAndDelete(id);

    res.status(200).json({ message: "Parent deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
module.exports = {
  createParent,
  getParentChildren,
  getAllParents,
  getParentById,
  updateParent,
  deleteParent,
};
