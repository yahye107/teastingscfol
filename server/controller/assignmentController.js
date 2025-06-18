const Assignment = require("../models/assegment");
const StudentAssignmentStatus = require("../models/studentAssegment");
const Classroom = require("../models/classroom");
const Student = require("../models/student");
const mongoose = require("mongoose");
// 1. Create assignment & assign to all students
const createAssignment = async (req, res) => {
  try {
    const { userId } = req.params; // Changed from teacherId to userId
    const { title, description, link, classroomId, subjectId } = req.body;

    // Validate required fields
    if (!title || !description || !link || !classroomId || !subjectId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Create assignment with userId as teacher
    const assignment = new Assignment({
      title,
      description,
      link,
      teacher: userId, // Now using userId instead of teacherId
      classroom: classroomId,
      subject: subjectId,
    });

    await assignment.save();

    // Find classroom and assign to all students
    const classroom = await Classroom.findById(classroomId).populate("students");

    const statusEntries = classroom.students.map((student) => ({
      assignment: assignment._id,
      student: student._id,
    }));

    await StudentAssignmentStatus.insertMany(statusEntries);

    res.status(201).json({
      message: "Assignment created and assigned to students.",
    });
  } catch (error) {
    console.error("Error creating assignment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 2. Automatically mark assignment as Viewed
const markAssignmentViewed = async (req, res) => {
  try {
    const { studentId, assignmentId } = req.body;

    const updated = await StudentAssignmentStatus.findOneAndUpdate(
      {
        student: studentId,
        assignment: assignmentId,
        status: { $ne: "Completed" },
      },
      { status: "Viewed", updatedAt: new Date() },
      { new: true }
    );

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Automatically mark assignment as Completed when student submits
const markAssignmentCompleted = async (req, res) => {
  try {
    const { studentId, assignmentId, submission } = req.body;

    const updated = await StudentAssignmentStatus.findOneAndUpdate(
      { student: studentId, assignment: assignmentId },
      {
        status: "Completed",
        submission: submission || "Submitted",
        updatedAt: new Date(),
      },
      { new: true }
    );

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. View all student statuses for a specific assignment
const getAssignmentStatus = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const statuses = await StudentAssignmentStatus.find({
      assignment: assignmentId,
    }).populate("student", "name email");

    res.status(200).json(statuses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const getStudentAssignments = async (req, res) => {
  try {
    // More reliable student ID extraction
    const studentId = req.studentInfo?._id || 
                     (req.userInfo?.studentProfile?._id || req.userInfo?.studentProfile);

    // Validate student ID format
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(403).json({
        success: false,
        message: "Invalid student identification",
      });
    }

    // Check if student exists in database
    const studentExists = await Student.exists({ _id: studentId });
    if (!studentExists) {
      return res.status(404).json({
        success: false,
        message: "Student record not found",
      });
    }

    const statuses = await StudentAssignmentStatus.find({ student: studentId })
      .populate({
        path: "assignment",
        populate: [
          {
            path: "teacher",
            populate: { path: "user", select: "fullName email" },
          },
          { path: "subject", select: "name" },
          { 
            path: "classroom", 
            select: "grade section",
            // Handle deleted classrooms
            options: { allowNull: true }  
          },
        ],
      })
      .sort({ updatedAt: -1 })
      .lean();  // Better performance

    // Handle case where assignments exist but population failed
    const validStatuses = statuses.filter(s => s.assignment !== null);

    res.status(200).json({
      success: true,
      assignments: validStatuses,
      // Helpful metadata
      meta: {
        total: statuses.length,
        valid: validStatuses.length
      }
    });
  } catch (err) {
    // More specific error logging
    console.error(`Assignment Error [${req.userInfo?._id}]:`, err);
    
    res.status(500).json({ 
      success: false,
      error: "Server error while retrieving assignments"
    });
  }
};
const getTeacherAssignments = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(403).json({ success: false, message: "Invalid teacher identification" });
    }

    const assignments = await Assignment.find({ teacher: userId })
      .populate("classroom", "grade section")
      .populate("subject", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, assignments });
  } catch (err) {
    console.error(`Teacher Assignment Fetch Error:`, err);
    res.status(500).json({ success: false, error: "Server error while retrieving teacher assignments" });
  }
};
module.exports = {
  createAssignment,
  getStudentAssignments,
  getTeacherAssignments,
  markAssignmentViewed,
  markAssignmentCompleted,
  getAssignmentStatus,
};
