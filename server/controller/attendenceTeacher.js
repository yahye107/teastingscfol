const TeacherAttendance = require("../models/teacherAttendance");
const Teacher = require("../models/teacher");

const markTeacherAttendance = async (req, res) => {
  try {
    const { academicYear, teacher, status, timeIn, timeOut, reason } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const alreadyMarked = await TeacherAttendance.findOne({
      teacher,
      date: { $gte: today },
    });

    if (alreadyMarked) {
      return res
        .status(400)
        .json({ message: "Attendance already marked for today." });
    }

    const attendance = new TeacherAttendance({
      teacher,
      academicYear,
      status,
      timeIn: status === "Day Off" ? undefined : timeIn,
      timeOut: status === "Day Off" ? undefined : timeOut,
      reason: status === "Day Off" ? "Day Off" : reason,
    });

    await attendance.save();
    res
      .status(201)
      .json({ message: "Attendance marked successfully.", attendance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const updateTeacherAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, timeIn, timeOut, reason, academicYear } = req.body;

    const updatedData = {
      status,
      timeIn: status === "Day Off" ? undefined : timeIn,
      timeOut: status === "Day Off" ? undefined : timeOut,
      reason: status === "Day Off" ? "Day Off" : reason,
      academicYear,
    };

    const updatedAttendance = await TeacherAttendance.findByIdAndUpdate(
      id,
      updatedData,
      { new: true }
    );

    if (!updatedAttendance) {
      return res.status(404).json({ message: "Attendance not found." });
    }

    res
      .status(200)
      .json({ message: "Attendance updated successfully.", updatedAttendance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllTeacherAttendance = async (req, res) => {
  try {
    const {
      academicYear,
      startDate,
      endDate,
      status,
      teacherId,
      page = 1,
      limit = 50,
    } = req.query;

    let filter = {};

    // Academic Year filter
    if (academicYear && academicYear !== "all") {
      filter.academicYear = academicYear;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Status filter
    if (status && status !== "all") {
      filter.status = status;
    }

    // Teacher filter
    if (teacherId) {
      filter.teacher = teacherId;
    }

    const skip = (page - 1) * limit;

    const attendance = await TeacherAttendance.find(filter)
      .populate({
        path: "teacher",
        select: "name email subject",
        populate: {
          path: "user",
          select: "fullName email",
        },
      })
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await TeacherAttendance.countDocuments(filter);

    res.status(200).json({
      attendance,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      message: "Attendance fetched successfully.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get attendance history for one teacher by ID
const getTeacherAttendanceById = async (req, res) => {
  try {
    const { id } = req.params; // teacher ID

    const attendance = await TeacherAttendance.find({ teacher: id })
      .sort({ date: -1 })
      .select("-__v")
      .populate({
        path: "teacher",
        select: "name email subject",
        populate: {
          path: "user",
          select: "fullName email",
        },
      });

    res
      .status(200)
      .json({ message: "Attendance for the teacher.", attendance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const getTodayTeacherAttendance = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const teachers = await Teacher.find().populate("user", "fullName");
    const todayRecords = await TeacherAttendance.find({
      date: { $gte: today },
    });

    const result = teachers.map((teacher) => {
      const existing = todayRecords.find(
        (r) => r.teacher.toString() === teacher._id.toString()
      );
      return {
        teacher: teacher._id,
        _id: existing?._id || "",
        name: teacher.user?.fullName,
        status: existing?.status || "Pending",
        timeIn: existing?.timeIn || "",
        timeOut: existing?.timeOut || "",
        reason: existing?.reason || "",
        academicYear: existing?.academicYear || "",
        alreadySubmitted: !!existing,
      };
    });

    res.status(200).json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  markTeacherAttendance,
  getAllTeacherAttendance,
  updateTeacherAttendance,
  getTeacherAttendanceById, // 👈 Add this to exports
  getTodayTeacherAttendance,
};
