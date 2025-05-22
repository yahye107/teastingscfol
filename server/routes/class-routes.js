// routes/classroomRoutes.js
const express = require("express");
const router = express.Router();
const { authVerification } = require("../middle/authmiddle");
// ================== Timetable ==================
const {
  createTimetable,
  getAllTimetables,
  deleteTimetable,
  updateTimetable,
  getTeacherWeeklyTimetable,
  getTeacherTodayTimetable,
  getStudentWeeklyTimetable,
  getStudentTodayTimetable,
  getClassWeeklyTimetable,
  getClassTodayTimetable,
} = require("../controller/time-tbale-controll");

// Admin creates or updates a teacher's timetable
router.post("/timetable/create", createTimetable);

// Teacher's weekly and today's timetable
router.get(
  "/timetable/teacher/:teacherId",
  authVerification,
  getTeacherWeeklyTimetable
);
router.get("/timetable/teacher/today/:teacherId", getTeacherTodayTimetable);

// Student's weekly and today's timetable
router.get("/timetable/student/:classId", getStudentWeeklyTimetable);
router.get("/timetable/student/today/:classId", getStudentTodayTimetable);
router.put("/timetable/:timetableId", updateTimetable);
router.delete("/timetable/:teacherId/:timetableId", deleteTimetable);
router.get("/timetable", getAllTimetables);
router.get("/timetable/weekly/:classId", getClassWeeklyTimetable);

// Get today's timetable for a class
router.get("/timetable/today/:classId", getClassTodayTimetable);

// ===========================ExamTimetable=======================
// routes/examRoutes.js

const {
  createExam,
  updateExam,
  deleteExam,
  getClassExamTable,
  getStudentExamTable,
} = require("../controller/examController");

// Create new exam
router.post("/EaxmTable/createExamtable", createExam);

// Update an exam
router.put("/EaxmTable/update/:id", updateExam);

// Delete an exam
router.delete("/EaxmTable/delete/:id", deleteExam);
router.get("/EaxmTable/class/:classId", getClassExamTable);
// Get a student's full exam table
router.get("/EaxmTable/student/:studentId", getStudentExamTable);

module.exports = router;
//=================result======================
const {
  submitResultsForClassSubject,
  getStudentResults,
  getResultsByClassSubjectYear,
  bulkUpdateResults,
  getClassResultsOverview,
  updateResultForStudent,
} = require("../controller/resultcontroll");
router.post("/results/:teacherId", submitResultsForClassSubject);
router.put("/results/:resultId", updateResultForStudent);
router.get("/results/student/:studentId", getStudentResults);
router.get("/results", getResultsByClassSubjectYear); // uses query params
router.put("/bulk", bulkUpdateResults); // bulk update
router.get("/ResultMark/:classId", getClassResultsOverview);
// ================== Student Attendance ==================
const {
  markStudentAttendance,
  getStudentAttendance,
  getAttendanceRatesForClass,
  getAttendanceRatesBySubject,
  updateAttendance,
  getDailySummary,
  getClassAttendanceReport,
  bulkUpdateAttendance,
  getMonthlySummary,
  getAttendanceTrends,
} = require("../controller/attendenceAsudent");
// const checkRole = require("../middle/authmiddle");

// Teacher routes
router.post(
  "/attendance/mark/:userId",
  // checkRole(["teacher"]),
  markStudentAttendance
);
router.put(
  "/attendance/:attendanceId",

  updateAttendance
);
router.get(
  "/attendance/daily-summary",
  // checkRole(["teacher"]),
  getDailySummary
);

// Student routes
router.get(
  "/attendance/student/:studentId",
  // checkRole(["student", "admin"]),
  getStudentAttendance
);
router.get(
  "/attendance/monthly/:studentId",
  // checkRole(["student", "admin"]),
  getMonthlySummary
);

// Admin routes
router.get(
  "/attendance/rates/:classId",
  // checkRole(["admin"]),
  getAttendanceRatesForClass
);
router.get(
  "/:classId/subject/:subjectId",
  // checkRole(["admin"]),
  getAttendanceRatesBySubject
);
router.get(
  "/reports/class/:classId",
  // checkRole(["admin"]),
  getClassAttendanceReport
);
router.put(
  "/attendance/bulk-update",
  // checkRole(["admin"]),
  bulkUpdateAttendance
);
router.get("/trends/class/:classId", getAttendanceTrends);
// ================== Assignment ==================
const {
  createAssignment,
  markAssignmentViewed,
  markAssignmentCompleted,
  getAssignmentStatus,
} = require("../controller/assignmentController");

// Teacher creates an assignment
router.post("/assignment/create", createAssignment);

// Student updates their status
router.post("/assignment/viewed", markAssignmentViewed);
router.post("/assignment/completed", markAssignmentCompleted);

// Teacher checks status of all students for an assignment
router.get("/assignment/status/:assignmentId", getAssignmentStatus);

// ================== Classroom ==================
const {
  createClassroom,
  getAllClassrooms,
  getClassroomsByGrade,
  getClassroomByGradeAndSection,
  getStudentsByClassroom,
  updateClassroom,
  deleteClassroom,
} = require("../controller/class-controller");

// Create classroom
router.post("/classroom/create", createClassroom);
router.get("/getallclassroom", getAllClassrooms);
router.put("/classroom/:classroomId", updateClassroom);
// Get classrooms by grade
router.get("/classroom/grade/:grade", getClassroomsByGrade);

// Get a specific classroom by grade and section
router.get("/classroom/:grade/:section", getClassroomByGradeAndSection);

// Get students by classroom ID
router.get("/getstudentsClass/:classroomId", getStudentsByClassroom);
router.delete("/classroom/:classroomId", deleteClassroom);

module.exports = router;
