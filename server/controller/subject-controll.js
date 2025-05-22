const Subject = require("../models/subject");

// ✅ Create a subject
const createSubject = async (req, res) => {
  try {
    const { name, code, description } = req.body;

    // Check if subject name or code already exists
    const existing = await Subject.findOne({ $or: [{ name }, { code }] });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Subject name or code already exists." });
    }

    const subject = new Subject({ name, code, description });
    await subject.save();

    res.status(201).json({ message: "Subject created successfully.", subject });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get all subjects
const getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find();
    res.status(200).json({
      message: "Subject found.",
      subjects,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get a single subject by ID
const getSubjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findById(id);

    if (!subject)
      return res.status(404).json({ message: "Subject not found." });

    res.status(200).json({
      message: "Subject found.",
      subject,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update a subject
const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description } = req.body;

    const updatedSubject = await Subject.findByIdAndUpdate(
      id,
      { name, code, description },
      { new: true, runValidators: true }
    );

    if (!updatedSubject)
      return res.status(404).json({ message: "Subject not found." });

    res
      .status(200)
      .json({ message: "Subject updated.", subject: updatedSubject });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete a subject
const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Subject.findByIdAndDelete(id);
    if (!deleted)
      return res.status(404).json({ message: "Subject not found." });

    res.status(200).json({ message: "Subject deleted." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
};
