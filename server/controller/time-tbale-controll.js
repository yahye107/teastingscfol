const Timetable = require("../models/timetable");
const Teacher = require("../models/teacher");
const Classroom = require("../models/classroom");
const moment = require("moment");
const Student = require("../models/student");
// Create a timetable period
const createTimetable = async (req, res) => {
  try {
    const {
      teacherId,
      day,
      periodStart,
      periodEnd,
      classId,
      subjectId,
      hallId,
    } = req.body;

    if (
      !teacherId ||
      !day ||
      !periodStart ||
      !periodEnd ||
      !classId ||
      !subjectId ||
      !hallId
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const timetable = await Timetable.create({
      teacher: teacherId,
      day,
      startTime: periodStart,
      endTime: periodEnd,
      class: classId,
      subject: subjectId,
      hall: hallId,
    });

    await Teacher.findByIdAndUpdate(teacherId, {
      $push: { timetables: timetable._id },
    });
    await Classroom.findByIdAndUpdate(classId, {
      $push: { timetables: timetable._id },
    });
    res
      .status(200)
      .json({ message: "Timetable created successfully", timetable });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get full weekly timetable for a teacher
const getTeacherWeeklyTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.find({ teacher: req.params.teacherId })
      .populate("class")
      .populate("subject")
      .populate("hall");

    if (!timetable || timetable.length === 0)
      return res.status(404).json({ message: "No timetable found" });

    res.status(200).json(timetable);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get today's timetable for a teacher
const getTeacherTodayTimetable = async (req, res) => {
  try {
    const today = moment().format("dddd");

    const periods = await Timetable.find({
      teacher: req.params.teacherId,
      day: today,
    })
      .populate("class")
      .populate("subject")
      .populate("hall");

    res.status(200).json({ day: today, periods });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get weekly timetable for a student

// Get today's timetable for a student
// Get weekly timetable for a student
const getStudentWeeklyTimetable = async (req, res) => {
  try {
    const { classId } = req.params;

    const timetables = await Timetable.find({ class: classId })
      .populate({
        path: "teacher",
        select: "user",
        populate: { path: "user", select: "fullName" },
      })
      .populate("subject")
      .populate("hall");

    if (!timetables || timetables.length === 0)
      return res.status(404).json({ message: "No timetable found" });

    const flatSchedule = timetables.map((t) => ({
      day: t.day,
      teacherName: t.teacher?.user?.fullName,
      subjectName: t.subject?.name,
      hallNumber: t.hall?.hallNumber,
      startTime: t.startTime,
      endTime: t.endTime,
    }));

    res.status(200).json(flatSchedule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get today's timetable for a student
const getStudentTodayTimetable = async (req, res) => {
  try {
    const today = moment().format("dddd");
    const { classId } = req.params;

    const periods = await Timetable.find({
      class: classId,
      day: today,
    })
      .populate({
        path: "teacher",
        select: "user",
        populate: { path: "user", select: "fullName" },
      })
      .populate("subject")
      .populate("hall");

    res.status(200).json({
      day: today,
      periods: periods.map((t) => ({
        teacherName: t.teacher?.user?.fullName,
        subjectName: t.subject?.name,
        hallNumber: t.hall?.hallNumber,
        startTime: t.startTime,
        endTime: t.endTime,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// Update a timetable period
// Update the deleteTimetable controller to match frontend API call
const deleteTimetable = async (req, res) => {
  try {
    const { teacherId, timetableId } = req.params; // Changed to get both params

    const timetable = await Timetable.findByIdAndDelete(timetableId);

    if (!timetable) {
      return res.status(404).json({ message: "Timetable not found" });
    }

    await Teacher.findByIdAndUpdate(teacherId, {
      $pull: { timetables: timetable._id },
    });

    res.status(200).json({ message: "Timetable deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update the updateTimetable controller to handle field names properly
const updateTimetable = async (req, res) => {
  try {
    const { timetableId } = req.params;
    const updates = req.body;

    if (!timetableId || !updates) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Directly use updates with model field names
    const updatedEntry = await Timetable.findByIdAndUpdate(
      timetableId,
      updates,
      { new: true }
    ).populate("class subject hall teacher");

    if (!updatedEntry) {
      return res.status(404).json({ message: "Timetable not found" });
    }

    res.json({
      message: "Timetable updated successfully",
      timetable: updatedEntry,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all timetables
const getAllTimetables = async (req, res) => {
  try {
    const timetables = await Timetable.find()
      .populate("teacher")
      .populate("class")
      .populate("subject")
      .populate("hall");

    if (!timetables || timetables.length === 0) {
      return res.status(404).json({ message: "No timetables found" });
    }

    res.status(200).json({ message: " timetables found", timetables });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get weekly timetable for a class
const getClassWeeklyTimetable = async (req, res) => {
  try {
    const { classId } = req.params;

    // Corrected query: use classId instead of class
    const timetables = await Timetable.find({ class: classId })
      .populate({
        path: "teacher",
        select: "user",
        populate: { path: "user", select: "fullName" },
      })
      .populate("subject")
      .populate("hall");

    const daysOfWeek = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    const weeklySchedule = daysOfWeek.map((day) => ({
      day,
      periods: timetables
        .filter((t) => t.day === day)
        .map((t) => ({
          teacherName: t.teacher?.user?.fullName,
          subjectName: t.subject?.name,
          hallNumber: t.hall?.hallNumber,
          startTime: t.startTime,
          endTime: t.endTime,
        })),
    }));

    res.status(200).json(weeklySchedule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getClassTodayTimetable = async (req, res) => {
  try {
    const today = moment().format("dddd");
    const { classId } = req.params;

    // Corrected query: use classId instead of class
    const periods = await Timetable.find({
      class: classId,
      day: today,
    })
      .populate({
        path: "teacher",
        select: "user",
        populate: { path: "user", select: "fullName" },
      })
      .populate("subject")
      .populate("hall");

    res.status(200).json({
      day: today,
      periods: periods.map((t) => ({
        teacherName: t.teacher?.user?.fullName,
        subjectName: t.subject?.name,
        hallNumber: t.hall?.hallNumber,
        startTime: t.startTime,
        endTime: t.endTime,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createTimetable,
  getTeacherWeeklyTimetable,
  getTeacherTodayTimetable,
  getStudentWeeklyTimetable,
  getStudentTodayTimetable,
  updateTimetable,
  deleteTimetable,
  getAllTimetables,
  getClassWeeklyTimetable,
  getClassTodayTimetable,
};
