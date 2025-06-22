import React, { useEffect, useState } from "react";
import "./index.css";
import { Button } from "./components/ui/button";
import { Route, Routes, useLocation } from "react-router-dom";
import MainPage from "./pages/mainPage";
import Authpage from "./pages/auth";
import Login from "./components/auth/Login";
import Notfound from "./pages/notfound";
import StudentDash from "./components/student/pages/StudentDash";
import TeacherDash from "./components/teacher/teacher";
import ParantsDash from "./components/parant/ParantsDash";
import AdminDash from "./components/Admin/pages/AdminDash";
import Home from "./components/Admin/pages/Home";
import RegStudents from "./components/Admin/pages/students";
import Logout from "./components/Admin/componeets/common/Logout";
import Parants from "./components/Admin/pages/Parants";
import ParantsInfo from "./components/Admin/pages/ParantsInfo";
import StudentInfo from "./components/Admin/pages/StudentInfo";
import FeeRecords from "./components/Admin/pages/FeeRecords";
import TeacherRegister from "./components/Admin/pages/TeacherRegister";
import TeacherInfo from "./components/Admin/pages/TeacherInfo";
import Halls from "./components/Admin/pages/Halls";
import Class from "./components/Admin/pages/Class";
import Subjects from "./components/Admin/pages/Subjects";
import TimeTable from "./components/Admin/pages/TimeTable";
import StudentTimetbale from "./components/Admin/pages/StudentTimetbale";
import TeacherTimeTbale from "./components/Admin/pages/TecherTimeTbale";
import NetworkError from "./components/common/NetworkError";
import Userinfo from "./components/Admin/pages/Userinfo";
import AdminEvent from "./components/Admin/pages/AdminEvent";
import TeadherAttendence from "./components/Admin/pages/TeadherAttendence";
import AdminAnouncement from "./components/Admin/pages/AdminAnouncement";
import TeacherAttendanceHistory from "./components/Admin/pages/AttendenceTacherHistroy";
import CreateExamTbale from "./components/Admin/pages/CreateExamTbale";
import ManageExamTable from "./components/Admin/pages/ManageExamTable";
import Teacherhome from "./components/teacher/Teacherhome";
import Massages from "./components/teacher/pages/Massages";
import STuAttendence from "./components/teacher/pages/sTuAttendence";
import AttendenceHistroy from "./components/Admin/pages/AttendenceHistroy";
import Celender from "./components/teacher/pages/Celender";
import ManageEvents from "./components/Admin/pages/mangeevnts";
import ClassEvents from "./components/teacher/pages/ClassEvents";
import Gradebook from "./components/teacher/pages/Gradebook";
import UpdateGrade from "./components/teacher/pages/UpdateGrade";
import TrackMarks from "./components/Admin/pages/TrackMarks";
import MarkHIstroyTrack from "./components/Admin/pages/MarkHIstroyTrack";
import SeeStudents from "./components/Admin/pages/SeeStudents";
import Assegment from "./components/teacher/pages/Assegment";
import StudentCelender from "./components/student/pages/StudentCelender";
import StudentAssegment from "./components/student/pages/StudentAssegment";
import StudentGrade from "./components/student/pages/studentGrade";
import StudentAttendencePage from "./components/student/pages/StudentAttendence";
import StudentMassages from "./components/student/pages/StudentMassages";
import AssignmentDetails from "./components/teacher/pages/AssignmentDetails";

const App = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(false); // 👈 global loading state
  const location = useLocation(); // 👈 track current route

  useEffect(() => {
    setLoading(true);

    const timer = setTimeout(() => {
      setLoading(false);
    }, 500); // Adjust delay based on how long your transitions take

    return () => clearTimeout(timer);
  }, [location]); // 👈 triggers on every route change

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      setIsOnline(true);
    }
  };

  if (!isOnline) return <NetworkError onRetry={handleRetry} />;
  if (!isOnline) return <NetworkError onRetry={handleRetry} />;
  //  if (loading) {
  //  return (
  //     <div className="fixed inset-0 flex justify-center items-center">
  //       <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
  //     </div>
  //   );
  // }
  return (
    <Routes>
      <Route path="/logout" element={<Logout />} />
      <Route path="/" element={<MainPage />} />
      <Route path="auth" element={<Authpage />}>
        <Route path="login" element={<Login />} />
      </Route>
      <Route path="*" element={<Notfound />} />
      <Route path="student" element={<StudentDash />} />
      <Route path="/teacher" element={<TeacherDash />} />
      <Route path="admin/dashboard" element={<AdminDash />}>
        <Route index element={<Home />} />
        <Route path="studentRegister" element={<RegStudents />} />
        <Route path="Parantsregister" element={<Parants />} />
        <Route path="parantinfo" element={<ParantsInfo />} />
        <Route path="StudentInfo" element={<StudentInfo />} />
        <Route path="FeeRecords" element={<FeeRecords />} />
        <Route path="Tescher" element={<TeacherRegister />} />
        <Route path="TeacherInfo" element={<TeacherInfo />} />
        <Route path="Halls" element={<Halls />} />
        <Route path="class" element={<Class />} />
        <Route path="Subjects" element={<Subjects />} />
        <Route path="timeTable" element={<TimeTable />} />
        <Route path="studentTimetable" element={<StudentTimetbale />} />
        <Route path="teacherTimetable" element={<TeacherTimeTbale />} />
        <Route path="usersinfo" element={<Userinfo />} />
        <Route path="AdminEvents" element={<AdminEvent />} />
        <Route path="Tatendence" element={<TeadherAttendence />} />
        <Route path="AdminAnouncement" element={<AdminAnouncement />} />
        <Route path="manageExam" element={<ManageExamTable />} />
        <Route path="Histroyattendence" element={<AttendenceHistroy />} />
        <Route path="MarkHistroy" element={<MarkHIstroyTrack />} />
        <Route path="Track" element={<TrackMarks />} />
        <Route path="SeeStudents" element={<SeeStudents />} />
        <Route
          path="TeacherAttendenceHist"
          element={<TeacherAttendanceHistory />}
        />
        <Route path="ExamTbale" element={<CreateExamTbale />} />
        <Route path="mangingEvents" element={<ManageEvents />} />
      </Route>
      <Route path="/student/dashboard" element={<StudentDash />}>
        <Route index element={<StudentDash />} />
        <Route path="Studentcelender" element={<StudentCelender />} />
        <Route path="Studentmassages" element={<StudentMassages />} />
        <Route
          path="TudentattendancePage"
          element={<StudentAttendencePage />}
        />
        {/* <Route path="ClassEvents" element={<ClassEvents />} /> */}
        <Route path="StudentGradebook" element={<StudentGrade />} />
        {/* <Route path="UpdateGradebook" element={<UpdateGrade />} /> */}
        <Route path="StudentAssegment" element={<StudentAssegment />} />
      </Route>
      <Route path="teacher/dashboard" element={<TeacherDash />}>
        <Route index element={<Teacherhome />} />
        <Route path="massages" element={<Massages />} />
        <Route path="attendance" element={<STuAttendence />} />
        <Route path="celender" element={<Celender />} />
        <Route path="ClassEvents" element={<ClassEvents />} />
        <Route path="Gradebook" element={<Gradebook />} />
        <Route path="UpdateGradebook" element={<UpdateGrade />} />
        <Route path="Assegment" element={<Assegment />} />
        <Route
          path="assignment-details/:assignmentId"
          element={<AssignmentDetails />}
        />
      </Route>
      <Route path="/parent/dashboard" element={<ParantsDash />} />
    </Routes>
  );
};

export default App;
