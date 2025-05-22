import React, { useEffect, useState } from "react";
import {
  callGetAllStudentsApi,
  callGetAllTeachersApi,
  callGetAllClassesApi,
  callGetEventsForUserApi,
  calllogoutUserApi,
  callGetClassTodayTimetableApi,
  callGetTeacherAttendanceByIdApi,
  callGetClassExamTableApi,
} from "@/service/service";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
} from "recharts";
// import { useRouter } from "next/router";

const Dashboard = () => {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    announcements: 0,
  });
  const [events, setEvents] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [exams, setExams] = useState([]);
  // const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, teachersRes, classesRes, eventsRes] =
          await Promise.all([
            callGetAllStudentsApi(),
            callGetAllTeachersApi(),
            callGetAllClassesApi(),
            callGetEventsForUserApi(),
          ]);

        // Get sample class ID for demo (you might want to change this)
        const sampleClassId = classesRes[0]?._id;
        const timetableRes = sampleClassId
          ? await callGetClassTodayTimetableApi(sampleClassId)
          : [];
        const examsRes = sampleClassId
          ? await callGetClassExamTableApi(sampleClassId)
          : [];

        setStats({
          students: studentsRes.length,
          teachers: teachersRes.length,
          classes: classesRes.length,
          announcements: eventsRes.length,
        });

        setEvents(eventsRes.slice(0, 5));
        setTimetable(timetableRes);
        setExams(examsRes.slice(0, 3));

        // Sample teacher attendance data
        if (teachersRes.length > 0) {
          const attendanceRes = await callGetTeacherAttendanceByIdApi(
            teachersRes[0]._id
          );
          setAttendance(attendanceRes.slice(0, 7));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // const handleLogout = async () => {
  //   try {
  //     await calllogoutUserApi();
  //     router.push("/login");
  //   } catch (error) {
  //     console.error("Logout failed:", error);
  //   }
  // };

  // Chart data calculations
  const gradeDistribution = [
    { name: "Grade 9", students: 45 },
    { name: "Grade 10", students: 38 },
    { name: "Grade 11", students: 42 },
    { name: "Grade 12", students: 39 },
  ];

  const attendanceData = [
    { day: "Mon", present: 85, absent: 15 },
    { day: "Tue", present: 88, absent: 12 },
    { day: "Wed", present: 82, absent: 18 },
    { day: "Thu", present: 90, absent: 10 },
    { day: "Fri", present: 87, absent: 13 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      {/* <div className="fixed left-0 top-0 h-full w-64 bg-blue-800 text-white p-4 shadow-xl">
        <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          School Admin
        </h2>
        <nav className="space-y-2">
          {[
            "Dashboard",
            "Students",
            "Teachers",
            "Classes",
            "Attendance",
            "Exams",
            "Events",
          ].map((item) => (
            <button
              key={item}
              className="w-full flex items-center gap-3 p-3 hover:bg-blue-700 rounded-lg transition-all"
            >
              {item}
            </button>
          ))}
        </nav>
      </div> */}

      {/* Main Content */}
      <div className=" p-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Admin Dashboard
            </h1>
            <p className="text-gray-500">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <button
            // onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Logout
          </button>
        </header>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Students</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.students}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500 mb-1">Teaching Staff</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.teachers}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500 mb-1">Active Classes</p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats.classes}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500 mb-1">Upcoming Events</p>
                <p className="text-3xl font-bold text-orange-600">
                  {stats.announcements}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Attendance Overview */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4">
                Attendance Overview
              </h2>
              <BarChart width={600} height={300} data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" fill="#3B82F6" />
                <Bar dataKey="absent" fill="#EF4444" />
              </BarChart>
            </div>

            {/* Class Schedule */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4">Today's Schedule</h2>
              <div className="space-y-4">
                {timetable.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{item.subject}</p>
                      <p className="text-sm text-gray-500">{item.time}</p>
                    </div>
                    <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                      {item.classroom}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Grade Distribution */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4">Grade Distribution</h2>
              <PieChart width={300} height={200}>
                <Pie
                  data={gradeDistribution}
                  dataKey="students"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#3B82F6"
                  label
                />
                <Tooltip />
              </PieChart>
            </div>

            {/* Upcoming Exams */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4">Upcoming Exams</h2>
              <div className="space-y-4">
                {exams.map((exam, index) => (
                  <div
                    key={index}
                    className="p-3 bg-red-50 rounded-lg border-l-4 border-red-500"
                  >
                    <p className="font-medium">{exam.subject}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(exam.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm mt-1">{exam.classroom}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <button className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg flex flex-col items-center">
                  <svg
                    className="w-6 h-6 text-blue-600 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="text-sm">New Announcement</span>
                </button>
                <button className="p-3 bg-green-50 hover:bg-green-100 rounded-lg flex flex-col items-center">
                  <svg
                    className="w-6 h-6 text-green-600 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="text-sm">Add New Student</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
