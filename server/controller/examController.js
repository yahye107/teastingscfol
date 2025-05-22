const mongoose = require("mongoose");
const Exam = require("../models/examtbale");
const Student = require("../models/student");
const Hall = require("../models/hall");

// Create Exam
const createExam = async (req, res) => {
  try {
    const { classId, title, halls: requestHalls, exams } = req.body;

    // Validate and format halls
    const halls = await Promise.all(
      requestHalls.map(async (h) => {
        const hallId = new mongoose.Types.ObjectId(h.hallId);
        const hall = await Hall.findById(hallId);
        if (!hall) throw new Error(`Invalid hall ID: ${h.hallId}`);
        return {
          hallId,
          hallNumber: hall.hallNumber, // ✅ Now it's defined properly
          count: h.count,
        };
      })
    );

    const students = await Student.find({ classId });
    const studentIds = students.map((s) => s._id);

    const allHalls = halls.flatMap((h) => Array(h.count).fill(h.hallId));
    const shuffledHalls = allHalls.sort(() => 0.5 - Math.random());

    const hallAssignments = {};
    studentIds.forEach((studentId, index) => {
      hallAssignments[studentId] = shuffledHalls[index % shuffledHalls.length];
    });

    const exam = new Exam({
      classId,
      title,
      exams,
      halls,
      studentHallMap: hallAssignments,
    });

    await exam.save();

    res.status(201).json({ message: "Exam group created successfully", exam });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Student Exam Table with Proper Hall Numbers
const getStudentExamTable = async (req, res) => {
  try {
    const studentId = req.params.studentId;

    const student = await Student.findById(studentId).populate("classId");
    if (!student) return res.status(404).json({ message: "Student not found" });

    const exams = await Exam.find({ classId: student.classId._id })
      .populate("exams.subjectId")
      .populate("halls.hallId");

    const result = [];

    for (const examGroup of exams) {
      const hallId = examGroup.studentHallMap?.get(studentId.toString());
      const hall = hallId ? await Hall.findById(hallId) : null;

      for (const exam of examGroup.exams) {
        result.push({
          title: examGroup.title,
          subject: exam.subjectId?.name || "N/A",
          date: exam.date,
          day: exam.day,
          startTime: exam.startTime,
          endTime: exam.endTime,
          hall: hall?.hallNumber || "Not assigned",
        });
      }
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Exam Table for a Class
const getClassExamTable = async (req, res) => {
  try {
    const classId = req.params.classId;
    // Populate both exams.subjectId and halls.hallId
    const exams = await Exam.find({ classId })
      .populate("exams.subjectId")
      .populate("halls.hallId"); // Add this line

    const result = [];

    for (const examGroup of exams) {
      for (const exam of examGroup.exams) {
        result.push({
          title: examGroup.title,
          subject: exam.subjectId?.name || "N/A",
          date: exam.date,
          day: exam.day,
          startTime: exam.startTime,
          endTime: exam.endTime,
          // Include hall details from the examGroup's halls array
          halls: examGroup.halls.map((hall) => ({
            hallNumber: hall.hallId.hallNumber, // Now accessible due to population
            count: hall.count,
          })),
        });
      }
    }

    res.status(200).json({
      result,
      message: "Exam data retrieved with hall numbers",
      exams,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Exam
const updateExam = async (req, res) => {
  try {
    const examId = req.params.id;
    const update = req.body;

    const updatedExam = await Exam.findByIdAndUpdate(examId, update, {
      new: true,
    });

    if (!updatedExam)
      return res.status(404).json({ message: "Exam not found" });

    res.status(200).json(updatedExam);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteExam = async (req, res) => {
  try {
    const examId = req.params.id;
    const deletedExam = await Exam.findByIdAndDelete(examId);
    if (!deletedExam)
      return res.status(404).json({ message: "Exam not found" });

    res.status(200).json({ message: "Exam deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createExam,
  getStudentExamTable,
  getClassExamTable,
  updateExam,
  deleteExam,
};
