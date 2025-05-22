const Assignment = require("../models/assegment");
const StudentAssignmentStatus = require("../models/studentAssegment");
const Classroom = require("../models/classroom");
const Student = require("../models/student");

// 1. Create assignment & assign to all students
const createAssignment = async (req, res) => {
  try {
    const { title, description, link, classroomId, teacherId, subjectId } =
      req.body;

    const assignment = new Assignment({
      title,
      description,
      link,
      teacher: teacherId,
      classroom: classroomId,
      subject: subjectId,
    });

    await assignment.save();

    const classroom = await Classroom.findById(classroomId).populate(
      "students"
    );

    const statusEntries = classroom.students.map((student) => ({
      assignment: assignment._id,
      student: student._id,
    }));

    await StudentAssignmentStatus.insertMany(statusEntries);

    res
      .status(201)
      .json({ message: "Assignment created and assigned to students." });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

module.exports = {
  createAssignment,
  markAssignmentViewed,
  markAssignmentCompleted,
  getAssignmentStatus,
};
