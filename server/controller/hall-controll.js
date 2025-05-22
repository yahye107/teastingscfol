const Hall = require("../models/hall");
const Classroom = require("../models/classroom"); // ← Import Classroom model
const Exam = require("../models/examtbale");
// ✅ Create a hall
const createHall = async (req, res) => {
  try {
    const { hallNumber, capacity, type } = req.body;

    // Check if hall number already exists
    const existingHall = await Hall.findOne({ hallNumber });
    if (existingHall) {
      return res.status(400).json({ message: "Hall number already exists." });
    }

    // Create new hall
    const hall = new Hall({
      hallNumber,
      capacity,
      type,
    });

    await hall.save();
    res.status(201).json({ message: "Hall created successfully.", hall });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get all halls
// ✅ Get all halls with classrooms
const getAllHalls = async (req, res) => {
  try {
    const halls = await Hall.find().lean();

    const hallsWithClasses = await Promise.all(
      halls.map(async (hall) => {
        const classrooms = await Classroom.find({ hall: hall._id })
          .select("grade section academicYear students")
          .lean();

        const formattedClassrooms = classrooms.map((cls) => ({
          grade: cls.grade,
          section: cls.section,
          academicYear: cls.academicYear,
          studentCount: cls.students?.length || 0,
        }));

        return {
          ...hall,
          classrooms: formattedClassrooms,
        };
      })
    );

    res.status(200).json({ halls: hallsWithClasses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get a hall by hall number
const getHallByNumber = async (req, res) => {
  try {
    const { hallNumber } = req.params;

    // Find the hall
    const hall = await Hall.findOne({ hallNumber }).lean();
    if (!hall) {
      return res.status(404).json({ message: "Hall not found." });
    }

    // Find all classrooms using this hall
    const classrooms = await Classroom.find({ hall: hall._id })
      .populate("classTeacher", "fullName")
      .populate("students", "_id")
      .lean();

    const formattedClassrooms = classrooms.map((cls) => ({
      name: cls.name,
      grade: cls.grade,
      section: cls.section,
      academicYear: cls.academicYear,
      classTeacher: cls.classTeacher?.fullName || "Not Assigned",
      studentCount: cls.students.length,
    }));

    res.status(200).json({
      ...hall,
      classrooms: formattedClassrooms,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// const getHallsWithClassrooms = async (req, res) => {
//   try {
//     const halls = await Hall.find().lean();

//     const hallsWithClasses = await Promise.all(
//       halls.map(async (hall) => {
//         const classrooms = await Classroom.find({ hall: hall._id })
//           .populate("classTeacher", "fullName") // populate teacher name
//           .populate("students", "_id") // just to count students
//           .lean();

//         const formattedClassrooms = classrooms.map((cls) => ({
//           name: cls.name,
//           grade: cls.grade,
//           section: cls.section,
//           academicYear: cls.academicYear,
//           classTeacher: cls.classTeacher?.fullName || "Not Assigned",
//           studentCount: cls.students.length,
//         }));

//         return {
//           ...hall,
//           classrooms: formattedClassrooms,
//         };
//       })
//     );

//     res.status(200).json(hallsWithClasses);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };
// ✅ Get current exam classes in a hall
const getHallExamClasses = async (req, res) => {
  try {
    const { hallId } = req.params;

    // 1. Validate hall exists
    const hall = await Hall.findById(hallId);
    if (!hall) {
      return res.status(404).json({ message: "Hall not found." });
    }

    // 2. Find all exams using this hall
    const exams = await Exam.find({
      "halls.hallId": hallId,
    }).populate({
      path: "classId",
      select: "name grade section",
    });

    // 3. Aggregate student counts per class
    const classMap = new Map();

    for (const exam of exams) {
      // Count students assigned to this hall in the exam
      const studentsInHall = Array.from(exam.studentHallMap.values()).filter(
        (hId) => hId.toString() === hallId
      ).length;

      if (studentsInHall > 0) {
        const classKey = exam.classId._id.toString();

        if (classMap.has(classKey)) {
          classMap.get(classKey).students += studentsInHall;
        } else {
          classMap.set(classKey, {
            className: exam.classId.name,
            grade: exam.classId.grade,
            section: exam.classId.section,
            students: studentsInHall,
          });
        }
      }
    }

    res.status(200).json({
      hall: hall.hallNumber,
      currentExams: Array.from(classMap.values()),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const updateHall = async (req, res) => {
  try {
    const { hallId } = req.params;
    const { hallNumber, capacity, type } = req.body;

    const hall = await Hall.findById(hallId);
    if (!hall) {
      return res.status(404).json({ message: "Hall not found." });
    }

    // If updating hall number, check for duplicates
    if (hallNumber && hallNumber !== hall.hallNumber) {
      const existingHall = await Hall.findOne({ hallNumber });
      if (existingHall) {
        return res.status(400).json({ message: "Hall number already exists." });
      }
    }

    hall.hallNumber = hallNumber || hall.hallNumber;
    hall.capacity = capacity || hall.capacity;
    hall.type = type || hall.type;

    await hall.save();

    res.status(200).json({ message: "Hall updated successfully.", hall });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ NEW: Delete a hall
const deleteHall = async (req, res) => {
  try {
    const { hallId } = req.params;

    const hall = await Hall.findByIdAndDelete(hallId);
    if (!hall) {
      return res.status(404).json({ message: "Hall not found." });
    }

    res.status(200).json({ message: "Hall deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
module.exports = {
  createHall,
  getHallExamClasses,
  getAllHalls,
  //   getHallsWithClassrooms,
  getHallByNumber,
  updateHall,
  deleteHall,
};
