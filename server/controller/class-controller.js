const Classroom = require("../models/classroom");
const Teacher = require("../models/teacher");
const Student = require("../models/student");
const Hall = require("../models/hall");
// ✅ Create classroom without needing classTeacherId or studentIds initially
const createClassroom = async (req, res) => {
  try {
    const { grade, section, academicYear, hall, classTeacher } = req.body;

    if (!grade || !section || !academicYear || !hall) {
      return res.status(400).json({
        message: "Grade, section, academicYear, and hall are required.",
      });
    }

    const classroomName = `Grade ${grade} - ${section}`;

    const classroomData = new Classroom({
      name: classroomName,
      grade,
      section,
      academicYear,
      hall, // ✅ save hall reference
      classTeacher,
      students: [],
    });

    // Only include classTeacher if it's provided
    if (classTeacher) {
      classroomData.classTeacher = classTeacher;
    }

    const classroom = new Classroom(classroomData);
    await classroom.save();
    res
      .status(201)
      .json({ message: "Classroom created successfully.", classroom });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get classrooms by grade
const getClassroomsByGrade = async (req, res) => {
  try {
    const { grade } = req.params;
    const classrooms = await Classroom.find({ grade })
      .populate("classTeacher", "username")
      .populate({
        path: "students",
        populate: {
          path: "user",
          select: "fullName username", // 👈 this gives you what you want
        },
      })
      .populate("hall", "hallNumber") // Populate the hall information
      .populate("timetables")
      .populate({
        path: "result",
        populate: { path: "student subject" }, // populate nested student and subject in each result if needed
      });
    res.status(200).json(classrooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Assign class teacher (already correct)
// const assignClassTeacher = async (req, res) => {
//   try {
//     const { classroomId, teacherId } = req.body;

//     const classroom = await Classroom.findById(classroomId);
//     if (!classroom) return res.status(404).json({ message: "Classroom not found." });

//     const teacher = await Teacher.findById(teacherId);
//     if (!teacher) return res.status(404).json({ message: "Teacher not found." });

//     classroom.classTeacher = teacher._id;
//     await classroom.save();

//     res.status(200).json({ message: "Class teacher assigned successfully." });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// ✅ Get students of a classroom (for attendance)
const getStudentsByClassroom = async (req, res) => {
  try {
    const { classroomId } = req.params;

    const classroom = await Classroom.findById(classroomId).populate({
      path: "students",
      populate: {
        path: "user",
        select: "fullName username email", // Add whatever fields you need
      },
    });
    if (!classroom)
      return res.status(404).json({ message: "Classroom not found." });

    res.status(200).json({ students: classroom.students });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const getClassroomByGradeAndSection = async (req, res) => {
  try {
    const { grade, section } = req.params;

    const classroom = await Classroom.findOne({ grade, section })
      .populate("classTeacher", "username")
      .populate("students", "username");

    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found." });
    }

    res.status(200).json(classroom);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// ✅ Get all classrooms with full populated details
const getAllClassrooms = async (req, res) => {
  try {
    const classrooms = await Classroom.find()
      .populate("classTeacher", "username")
      .populate({
        path: "students",
        populate: {
          path: "user",
          select: "fullName username",
        },
      })
      .populate("hall", "hallNumber")
      .populate("timetables")
      .populate("result");
    res
      .status(200)
      .json({ message: "All parents fetched successfully", classrooms });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// ✅ Update classroom details (grade, section, academicYear, hall, classTeacher, students)
const updateClassroom = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { grade, section, academicYear, hall, classTeacher, studentIds } =
      req.body;
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found." });
    }

    // Only update fields if they are provided
    if (grade !== undefined) classroom.grade = grade;
    if (section !== undefined) classroom.section = section;
    if (academicYear !== undefined) classroom.academicYear = academicYear;
    if (hall !== undefined) classroom.hall = hall;
    if (classTeacher !== undefined) classroom.classTeacher = classTeacher;
    if (studentIds !== undefined) classroom.students = studentIds;

    await classroom.save();

    res
      .status(200)
      .json({ message: "Classroom updated successfully.", classroom });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const deleteClassroom = async (req, res) => {
  try {
    const { classroomId } = req.params;

    // Check if the classroomId is provided
    if (!classroomId) {
      return res.status(400).json({ message: "Classroom ID is required." });
    }

    // Find and delete the classroom by its ID
    const classroom = await Classroom.findByIdAndDelete(classroomId);

    // Check if the classroom was found and deleted
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found." });
    }

    res
      .status(200)
      .json({ message: "Classroom deleted successfully.", classroom });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllClassrooms,
  createClassroom,
  getClassroomsByGrade,
  updateClassroom,
  getClassroomByGradeAndSection,
  getStudentsByClassroom, // ← export this new function
  deleteClassroom,
  // assignClassTeacher,
};
