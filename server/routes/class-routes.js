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
  getStudentsByHall,
  getStudentsByExamTitleAndHallId,
  getStudentHall,
  getAllExamTables,
  // getExamStudentHalls,
} = require("../controller/examController");

// Create new exam
router.post("/EaxmTable/createExamtable", createExam);
router.get("/EaxmTable/all-exams", getAllExamTables);

router.get("/EaxmTable/:studentId/", getStudentHall);
router.get("/exams/:examId/halls/:hallId/students", getStudentsByHall);
router.get("/exams/title/:title/hall/:hallId", getStudentsByExamTitleAndHallId);
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
  getRegisteredAcademicYears,
  updateStudentResult,
} = require("../controller/resultcontroll");
router.post("/results/:teacherId", submitResultsForClassSubject);
router.put("/results/:resultId", updateResultForStudent);
router.get("/results/student/:studentId", getStudentResults);
router.get("/results/academicyear", getRegisteredAcademicYears);
router.get("/results", getResultsByClassSubjectYear); // uses query params
router.put("/bulk", bulkUpdateResults); // bulk update
router.get("/ResultMark/:classId", getClassResultsOverview);
router.put("/update/:resultId", updateStudentResult);
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
  getLoggedInStudentAttendance,
  getStudentSubjects,
  getStudentAttendanceSummary,
  getStudentAttendanceByAcademicYear,
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
  (req, res) => {
    const { studentId } = req.params;
    const { academicYear, startDate, endDate } = req.query;
    getStudentAttendance(req, res, studentId, startDate, endDate, academicYear);
  }
);
router.get(
  "/attendance/by-academic-year/:studentId",
  getStudentAttendanceByAcademicYear
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
  (req, res) => {
    const { classId } = req.params;
    const { academicYear } = req.query;
    getAttendanceRatesForClass(req, res, classId, academicYear);
  }
);
router.get("/student/myself", authVerification, getLoggedInStudentAttendance);
router.get("/student/subjects", authVerification, getStudentSubjects);
router.get("/student/summary", authVerification, getStudentAttendanceSummary);

router.get(
  "/:classId/subject/:subjectId",
  // checkRole(["admin"]),
  (req, res) => {
    const { classId, subjectId } = req.params;
    const { academicYear } = req.query;
    getAttendanceRatesBySubject(req, res, classId, subjectId, academicYear);
  }
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
  getStudentAssignments,
  getTeacherAssignments,
  getAssignmentDetails,
} = require("../controller/assignmentController");

// Teacher creates an assignment
router.post("/assignments/create/:userId", createAssignment);
router.get("/assignments/student", authVerification, getStudentAssignments);
// backend
router.get("/assignment/details/:assignmentId", getAssignmentDetails);

router.get("/assignments/teacher/:userId", getTeacherAssignments);
// Student updates their status
router.post("/assignments/viewed", markAssignmentViewed);
router.post("/assignments/completed", markAssignmentCompleted);

// Teacher checks status of all students for an assignment
router.get("/assignments/status/:assignmentId", getAssignmentStatus);

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
router.get("/getallclassroom", authVerification, getAllClassrooms);
router.put("/classroom/:classroomId", updateClassroom);
// Get classrooms by grade
router.get("/classroom/grade/:grade", getClassroomsByGrade);

// Get a specific classroom by grade and section
router.get("/classroom/:grade/:section", getClassroomByGradeAndSection);

// Get students by classroom ID
router.get("/getstudentsClass/:classroomId", getStudentsByClassroom);
router.delete("/classroom/:classroomId", deleteClassroom);

module.exports = router;
