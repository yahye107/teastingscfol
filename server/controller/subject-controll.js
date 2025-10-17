const Subject = require("../models/subject");

const Teacher = require("../models/teacher");
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
const assignSubjectsToTeacher = async (req, res) => {
  try {
    const { teacherId, subjectIds } = req.body;

    // console.log("Received assignment request:", { teacherId, subjectIds }); // Debug log

    // Validate input
    if (!teacherId || !subjectIds || !Array.isArray(subjectIds)) {
      return res.status(400).json({
        message: "Invalid input. teacherId and subjectIds array are required.",
      });
    }

    // Validate teacher
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found." });
    }

    // Validate subjects exist
    const subjects = await Subject.find({ _id: { $in: subjectIds } });
    if (subjects.length !== subjectIds.length) {
      return res.status(400).json({
        message: "One or more subjects not found.",
        found: subjects.length,
        requested: subjectIds.length,
      });
    }

    // Convert existing subjects to strings for comparison
    const existingSubjectIds = teacher.subjects.map((subject) =>
      subject.toString()
    );

    // Add new subjects (avoid duplicates)
    const newSubjects = subjectIds.filter(
      (subjectId) => !existingSubjectIds.includes(subjectId.toString())
    );

    if (newSubjects.length === 0) {
      return res.status(400).json({
        message: "All selected subjects are already assigned to this teacher.",
      });
    }

    // Add new subjects
    teacher.subjects.push(...newSubjects);

    await teacher.save();

    // Populate subjects for response
    const updatedTeacher =
      await Teacher.findById(teacherId).populate("subjects");

    return res.status(200).json({
      message: "Subjects assigned successfully.",
      teacher: updatedTeacher,
      assignedCount: newSubjects.length,
    });
  } catch (err) {
    console.error("Error assigning subjects:", err);

    // More specific error messages
    if (err.name === "CastError") {
      return res
        .status(400)
        .json({ message: "Invalid teacher or subject ID format." });
    }

    res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
const removeSubjectsFromTeacher = async (req, res) => {
  try {
    const { teacherId, subjectIds } = req.body;

    if (!teacherId || !subjectIds || !Array.isArray(subjectIds)) {
      return res.status(400).json({
        message: "Invalid input. teacherId and subjectIds array are required.",
      });
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found." });
    }

    // Filter out the subjects to remove
    teacher.subjects = teacher.subjects.filter(
      (subjectId) => !subjectIds.includes(subjectId.toString())
    );

    await teacher.save();

    const updatedTeacher =
      await Teacher.findById(teacherId).populate("subjects");

    return res.status(200).json({
      message: "Subjects removed successfully.",
      teacher: updatedTeacher,
      removedCount: subjectIds.length,
    });
  } catch (err) {
    console.error("Error removing subjects:", err);

    if (err.name === "CastError") {
      return res
        .status(400)
        .json({ message: "Invalid teacher or subject ID format." });
    }

    res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

module.exports = {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  assignSubjectsToTeacher,
  deleteSubject,
  removeSubjectsFromTeacher,
};
