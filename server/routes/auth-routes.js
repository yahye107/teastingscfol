// routes/auth-routes.js
const express = require("express");
const routes = express.Router();

const { authVerification } = require("../middle/authmiddle");
// In your protected route (routes.js)
routes.get("/protected", authVerification, (req, res) => {
  const response = {
    success: true,
    message: "You are authenticated!",
    user: req.userInfo,
  };

  // Conditionally add teacher info if exists
  if (req.teacherInfo) {
    response.teacher = req.teacherInfo;
  }
  if (req.parentInfo) {
    response.parent = req.parentInfo;
  }
  if (req.studentInfo) {
    response.student = req.studentInfo;
  }
  res.status(200).json(response);
});
const {
  getUserCredentials,
  loginUser,
  registerUser,
  logoutUser,
  getAllUsers,
  deleteUser,
  updateUserStatus,
} = require("../controller/auth-controll");
//hall
const {
  createHall,
  getAllHalls,
  deleteHall,
  updateHall,
  getHallByNumber,
  getHallExamClasses,
  // getHallsWithClassrooms,
} = require("../controller/hall-controll");
/////teacher
const {
  markTeacherAttendance,
  updateTeacherAttendance,
  getAllTeacherAttendance,
  getTeacherAttendanceById,
} = require("../controller/attendenceTeacher");

// Admin marks teacher attendance
routes.post("/markTeacherAttendence", markTeacherAttendance);
routes.put("/markTeacherAttendence/:id", updateTeacherAttendance);
// Admin views all teacher attendance
routes.get("/getTeacherAttendence", getAllTeacherAttendance);
routes.get("/teacher-attendance/:id", getTeacherAttendanceById);
////////student
const {
  createStudent,
  updateStudent,
  deleteStudent,
  getAllStudents,
  makePayment,
} = require("../controller/stdent-controll");
routes.post("/student", createStudent);
routes.put("/Upstudent/:studentId", updateStudent);
routes.delete("/Destudent/:studentId", deleteStudent);
routes.get("/student/getAll", getAllStudents);
routes.post("/payStudents/:studentId", makePayment);

////parent
const {
  createParent,
  getParentChildren,
  getAllParents,
} = require("../controller/auth-prants");
routes.post("/register", registerUser);
routes.post("/login", loginUser);
routes.post("/logout", logoutUser);
routes.get("/credentials/:id", getUserCredentials);
routes.get("/all", getAllUsers);
routes.delete("/users/:id", deleteUser);
routes.post("/users/:id/status", authVerification, updateUserStatus);
//prant
routes.post("/Parents", createParent);
routes.get("/allparents", getAllParents);
routes.get("/:parentId/children", getParentChildren);

//hall
routes.post("/hall", createHall);

// Route to get all halls
routes.get("/halls", getAllHalls);

// Route to get hall by hall number
routes.get("/hall/:hallNumber", getHallByNumber);
routes.get("/hall/exam-classes/:hallId", getHallExamClasses);
routes.get("/hall/:hallNumber", getHallByNumber);
routes.get("/hall/:hallNumber", getHallByNumber);
routes.put("/hall/:hallId", updateHall);

// DELETE hall by hallId
routes.delete("/hall/:hallId", deleteHall);
////
///
// routes.get("/with-classrooms", getHallsWithClassrooms);

//////////////////////////////subject

const {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
} = require("../controller/subject-controll");

// Subject routes
routes.post("/subjects", createSubject);
routes.get("/subjects", getAllSubjects);
routes.get("/subjects/:id", getSubjectById);
routes.put("/subjects/:id", updateSubject);
routes.delete("/subjects/:id", deleteSubject);
/////////////teacher
const {
  createTeacher,
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
} = require("../controller/taecher-controll");

routes.post("/teacher", createTeacher);
routes.get("/teachers", getAllTeachers);
routes.get("/teacher/:id", getTeacherById);
routes.put("/teacher/:id", updateTeacher);
routes.delete("/teacher/:id", deleteTeacher);
////////events
const {
  createGeneralEvent,
  createClassEvent,
  deleteEvent,
  createGeneralAnouncement,
  getAnnouncementsForUser,
  getAllEventsAndAnnouncements,
  getEventsForUser,
} = require("../controller/eventControll");

// Admin creates event for student/teacher/parent/staff/all
routes.post("/admin/create", authVerification, createGeneralEvent);
routes.post(
  "/admin/Anouncementcreate",
  authVerification,
  createGeneralAnouncement
);
// Teacher creates class event
// routes/event.js
routes.get(
  "/alleventsAnnoncemnt",
  authVerification,
  getAllEventsAndAnnouncements
);

routes.post("/teacher/create", authVerification, createClassEvent);
routes.delete("/event/Event/:eventId", authVerification, deleteEvent);
// Get events based on role/class
routes.get("/event/user", authVerification, getEventsForUser);
routes.get("/event/announcements", authVerification, getAnnouncementsForUser);
module.exports = routes;

// Add to your routes

// sendCredentialsEmail("babajey2004@gmail.com", "TestUser", "testpassword123");
const { sendCredentialsEmail } = require("../utils/emailService");

routes.get("/force-test-email", async (req, res) => {
  try {
    const info = await sendCredentialsEmail(
      "yaxyeismail10@gmail.com",
      "testuser",
      "TestPass123!"
    );

    console.log("✅ Email sent", info);

    res.json({
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    });
  } catch (err) {
    console.error("💥 Force Test Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Add this route TO CRAEET a payment
const {
  createPayment,
  getAllStudentPayments,
  getStudentPaymentsById,
  getPaymentsByClassId,
  updatePayment,
  deletePayment,
} = require("../controller/createPayment ");
routes.post("/payments/create", createPayment);
routes.get("/payments/GetAll", getAllStudentPayments);
routes.get("/payments/student/:id", getStudentPaymentsById);
routes.get("/payments/class/:classId", getPaymentsByClassId);
routes.put("/payments/update/:id", updatePayment);
routes.delete("/payments/delete/:id", deletePayment);
