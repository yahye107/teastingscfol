const mongoose = require("mongoose");
const Exam = require("../models/examtbale");
const Student = require("../models/student");
const Hall = require("../models/hall");

const createExam = async (req, res) => {
  try {
    const { classId, title, halls: requestHalls, exams } = req.body;

    // ✅ First: check if exam already exists
    let exam = await Exam.findOne({ classId, title });

    // ✅ Get already assigned student IDs (if any)
    const alreadyAssignedStudentIds = new Set(
      Object.keys(exam?.studentHallMap || {})
    );

    // ✅ Get students who are NOT yet assigned
    const students = await Student.find({ classId })
      .sort({ name: 1 })
      .then((all) =>
        all.filter((s) => !alreadyAssignedStudentIds.has(s._id.toString()))
      );

    // ✅ Format halls
    const halls = await Promise.all(
      requestHalls.map(async (h) => {
        const hallId = new mongoose.Types.ObjectId(h.hallId);
        const hall = await Hall.findById(hallId);
        if (!hall) throw new Error(`Invalid hall ID: ${h.hallId}`);
        return {
          hallId,
          hallNumber: hall.hallNumber,
          count: h.count,
        };
      })
    );

    // ✅ Distribute students
    const hallAssignments = {};
    let studentIndex = 0;
    for (const hall of halls) {
      const { hallId, count } = hall;
      for (let i = 0; i < count && studentIndex < students.length; i++) {
        const student = students[studentIndex];
        hallAssignments[student._id] = hallId;
        studentIndex++;
      }
    }

    // ✅ Merge or create
    if (exam) {
      exam.exams.push(...exams);
      exam.halls.push(...halls);
      for (const [studentId, hallId] of Object.entries(hallAssignments)) {
        exam.studentHallMap.set(studentId, hallId);
      }
      await exam.save();
    } else {
      exam = new Exam({
        classId,
        title,
        exams,
        halls,
        studentHallMap: hallAssignments,
      });
      await exam.save();
    }

    // ✅ Update student records
    await Promise.all(
      Object.keys(hallAssignments).map((studentId) =>
        Student.findByIdAndUpdate(studentId, {
          $addToSet: { exam: exam._id },
        })
      )
    );

    res.status(201).json({
      message: exam.wasNew ? "New exam created" : "Exam merged with existing",
      assignedCount: Object.keys(hallAssignments).length,
      exam,
    });
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
// Get All Exam Tables
const getAllExamTables = async (req, res) => {
  try {
    const exams = await Exam.find()
      .populate("classId", "name section")
      .populate("title")
      .populate("exams.subjectId", "name")
      .populate("halls.hallId", "hallNumber");

    const formattedExams = exams.map((examGroup) => ({
      _id: examGroup._id,
      title: examGroup.title,
      class: examGroup.classId?.name || "Unknown",
      section: examGroup.classId?.section || "",
      halls: examGroup.halls.map((hall) => ({
        hallNumber: hall.hallId?.hallNumber || "N/A",
        count: hall.count,
      })),
      exams: examGroup.exams.map((exam) => ({
        subject: exam.subjectId?.name || "N/A",
        date: exam.date,
        day: exam.day,
        startTime: exam.startTime,
        endTime: exam.endTime,
      })),
    }));

    res.status(200).json({
      message: "All exam tables retrieved successfully",
      examTables: formattedExams,
    });
  } catch (error) {
    console.error("Error in getAllExamTables:", error);
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

// Get Students by Hall for a Specific Exam
const getStudentsByHall = async (req, res) => {
  try {
    const { examId, hallId } = req.params;

    // Validate ObjectIDs
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: "Invalid exam ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(hallId)) {
      return res.status(400).json({ message: "Invalid hall ID" });
    }

    // Find the exam and populate necessary data
    const exam = await Exam.findById(examId).populate({
      path: "studentHallMap.$*",
      select: "hallNumber",
    });

    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    // Find all students assigned to this hall in this exam
    const studentIds = [];
    for (const [studentId, assignedHall] of exam.studentHallMap) {
      if (assignedHall && assignedHall._id.toString() === hallId) {
        studentIds.push(new mongoose.Types.ObjectId(studentId));
      }
    }

    // Get student details
    const students = await Student.find(
      { _id: { $in: studentIds } },
      "name rollNumber"
    ).sort({ name: 1 });

    // Get hall details
    const hall = await Hall.findById(hallId, "hallNumber");

    res.status(200).json({
      hall: hall ? hall.hallNumber : "Unknown",
      students,
      count: students.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Get Students Grouped by Hall for a Specific Exam Title
// Get Students in a Specific Hall for a Specific Exam Title
const getStudentsByExamTitleAndHallId = async (req, res) => {
  try {
    const { title, hallId } = req.params;
    const decodedTitle = decodeURIComponent(title); // Handle URL encoding

    // Validate hallId
    if (!mongoose.Types.ObjectId.isValid(hallId)) {
      return res.status(400).json({ message: "Invalid hall ID" });
    }

    // Find exams by title (case-insensitive and trimmed)
    const exams = await Exam.find({
      title: { $regex: new RegExp(`^${decodedTitle.trim()}$`, "i") },
    }).populate("halls.hallId");

    if (exams.length === 0) {
      return res.status(404).json({
        message: `No exams found with title '${decodedTitle}'`,
        hallId,
        students: [],
        count: 0,
      });
    }

    const hallObjectId = new mongoose.Types.ObjectId(hallId);
    let totalStudents = 0;
    const studentIds = new Set();
    const matchingExams = [];

    // Process each matching exam
    for (const exam of exams) {
      // 1. Check if hall exists in this exam
      const hallExists = exam.halls.some((h) =>
        h.hallId._id.equals(hallObjectId)
      );

      if (!hallExists) continue;

      // 2. Get students assigned to this hall
      let studentMap;
      if (exam.studentHallMap instanceof Map) {
        studentMap = exam.studentHallMap;
      } else {
        // Convert object to Map
        studentMap = new Map(Object.entries(exam.studentHallMap || {}));
      }

      // 3. Collect student IDs
      for (const [studentId, assignedHallId] of studentMap) {
        if (assignedHallId && assignedHallId.toString() === hallId) {
          studentIds.add(studentId);
          totalStudents++;
        }
      }

      // 4. Track matching exams
      matchingExams.push({
        examId: exam._id,
        title: exam.title,
        hallCount: exam.halls.length,
      });
    }

    if (totalStudents === 0) {
      return res.status(200).json({
        hallId,
        students: [],
        count: 0,
        message: "No students assigned to this hall for the given exam title",
        matchingExams,
      });
    }

    // Fetch student details
    const students = await Student.find(
      { _id: { $in: Array.from(studentIds) } },
      "name rollNumber user classId"
    )
      .populate("user", "fullName")
      .populate("classId", "name section")
      .sort({ "user.fullName": 1 });

    // Format response
    const hall = await Hall.findById(hallId);
    const formattedStudents = students.map((student) => ({
      _id: student._id,
      name: student.user?.fullName || student.name || "Unnamed",
      rollNumber: student.rollNumber,
      class: student.classId?.name || "N/A",
      section: student.classId?.section || "",
    }));

    res.status(200).json({
      examTitle: decodedTitle,
      hall: {
        hallId: hall?._id,
        hallNumber: hall?.hallNumber || "Unknown",
      },
      students: formattedStudents,
      count: formattedStudents.length,
      matchingExams,
    });
  } catch (error) {
    console.error("Error in getStudentsByExamTitleAndHallId:", error);
    res.status(500).json({ error: error.message });
  }
};
// Get Hall Number for a Specific Student
const getStudentHall = async (req, res) => {
  try {
    const studentId = req.params.studentId;

    // Validate student ID
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    // Check if student exists
    const student = await Student.findById(studentId).populate(
      "user",
      "fullName"
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Get all exams that include this student in their hall map
    const exams = await Exam.find({
      [`studentHallMap.${studentId}`]: { $exists: true },
    }).populate("halls.hallId");

    // Collect hall information
    const hallAssignments = [];

    for (const exam of exams) {
      // Get hall ID for this student in this exam
      let hallId;
      if (exam.studentHallMap instanceof Map) {
        hallId = exam.studentHallMap.get(studentId.toString());
      } else {
        // Handle object format
        hallId = exam.studentHallMap[studentId.toString()];
      }

      if (!hallId) continue;

      // Find hall details
      const hallInfo = exam.halls.find(
        (h) => h.hallId._id.toString() === hallId.toString()
      );

      if (hallInfo) {
        hallAssignments.push({
          examId: exam._id,
          examTitle: exam.title,
          hallId: hallInfo.hallId._id,
          hallNumber: hallInfo.hallId.hallNumber,
        });
      }
    }

    if (hallAssignments.length === 0) {
      return res.status(200).json({
        studentId,
        message: "No hall assignments found for this student",
        hallAssignments: [],
      });
    }

    res.status(200).json({
      studentId,
      studentName: student.user?.fullName || student.name || "Unnamed",
      hallAssignments,
    });
  } catch (error) {
    console.error("Error in getStudentHall:", error);
    res.status(500).json({ error: error.message });
  }
};
module.exports = {
  createExam,
  getStudentHall,
  getStudentExamTable,
  getClassExamTable,
  getStudentsByHall,
  updateExam,
  getAllExamTables,
  getStudentsByExamTitleAndHallId,
  deleteExam,
};
