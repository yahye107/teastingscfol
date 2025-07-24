import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  LineChart,
  BarChart,
  PieChart,
  Cell,
  Line,
  Bar,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  callGetAllStudentsApi,
  callGetAllTeachersApi,
  callGetAllParentsApi,
  callGetAllClassroomsApi,
  callGetAllEventsAndAnnouncementsApi,
  callGetAllPaymentsApi,
  callGetAllTeacherAttendanceApi,

  // callGetAttendanceTrendsApi,
} from "@/service/service";

const Dashboard = () => {
  // State for stat cards
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    parents: 0,
    classrooms: 0,
    attendanceSubmitted: 0,
    pendingPayments: 0,
  });

  // State for charts and events
  const [enrollmentData, setEnrollmentData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [paymentData, setPaymentData] = useState([]);
  const [teacherAttendanceData, setTeacherAttendanceData] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const COLORS = [
    "#6366F1",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#06B6D4",
  ];

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch basic stats
        const [
          studentsRes,
          teachersRes,
          parentsRes,
          classroomsRes,
          paymentsRes,
          teacherAttendanceRes,
        ] = await Promise.all([
          callGetAllStudentsApi(),
          callGetAllTeachersApi(),
          callGetAllParentsApi(),
          callGetAllClassroomsApi(),
          callGetAllPaymentsApi(),
          callGetAllTeacherAttendanceApi(), // ✅ Add this
        ]);

        // Calculate pending payments
        const pendingPayments = paymentsRes.data.reduce((sum, payment) => {
          return payment.status === "pending" ? sum + payment.amount : sum;
        }, 0);

        // Set basic stats
        setStats({
          students: studentsRes.students.length,
          teachers: teachersRes.teachers.length,
          parents: parentsRes.parents.length,
          classrooms: classroomsRes.classrooms.length,
          attendanceSubmitted: 0, // Placeholder - would need attendance API
          pendingPayments,
        });

        // Fetch events
        const eventsRes = await callGetAllEventsAndAnnouncementsApi();
        const now = new Date();
        console.log(eventsRes);
        // Filter and sort upcoming events
        const upcoming = eventsRes.data
          .filter((event) => new Date(event.date) > now)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 5);

        setUpcomingEvents(upcoming);
        const getEnrollmentTrendFromStudents = (students) => {
          const monthlyCounts = {};

          students.forEach((student) => {
            const date = new Date(student?.user?.createdAt); // assumes createdAt exists
            const month = date.toLocaleString("default", { month: "short" });
            const year = date.getFullYear();
            const key = `${month} ${year}`;

            if (!monthlyCounts[key]) monthlyCounts[key] = 0;
            monthlyCounts[key]++;
          });

          // Convert to array and sort by date
          return Object.entries(monthlyCounts)
            .map(([monthYear, count]) => {
              const [monthName, year] = monthYear.split(" ");
              const monthIndex = new Date(`${monthName} 1`).getMonth(); // 0-11
              return {
                month: monthYear,
                students: count,
                sortKey: new Date(parseInt(year), monthIndex).getTime(),
              };
            })
            .sort((a, b) => a.sortKey - b.sortKey)
            .map(({ month, students }) => ({ month, students })); // remove sortKey afterward
        };

        setEnrollmentData(getEnrollmentTrendFromStudents(studentsRes.students));

        const getMonthlyPaymentTrends = (payments) => {
          const monthlyData = {};

          payments.forEach((payment) => {
            const month = payment.month;
            const year = payment.year;
            const key = `${month} ${year}`;

            if (!monthlyData[key]) {
              monthlyData[key] = {
                month: key,
                collected: 0,
                expected: 0,
                dept: 0,
              };
            }

            monthlyData[key].collected += payment.amount;
            monthlyData[key].expected += payment.amount + payment.dept;
            monthlyData[key].dept += payment.dept;
          });

          return Object.values(monthlyData)
            .map((item) => {
              const [monthName, year] = item.month.split(" ");
              const monthIndex = new Date(`${monthName} 1`).getMonth();
              return {
                ...item,
                sortKey: new Date(parseInt(year), monthIndex).getTime(),
              };
            })
            .sort((a, b) => a.sortKey - b.sortKey)
            .map(({ month, collected, expected, dept }) => ({
              month,
              collected,
              expected,
              dept,
            }));
        };

        setPaymentData(getMonthlyPaymentTrends(paymentsRes.data));

        const getWeeklyTeacherAttendanceSummary = (attendances) => {
          const weeklyData = {};

          attendances.forEach((entry) => {
            const date = new Date(entry.date);
            const day = date.toLocaleString("en-US", { weekday: "short" });

            if (!weeklyData[day]) {
              weeklyData[day] = { day, present: 0, absent: 0 };
            }

            if (entry.status === "Present") {
              weeklyData[day].present += 1;
            } else if (entry.status === "Absent") {
              weeklyData[day].absent += 1;
            }
          });

          return Object.values(weeklyData).sort(
            (a, b) =>
              new Date(
                `1970-01-0${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(a.day) + 4}`
              ) -
              new Date(
                `1970-01-0${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(b.day) + 4}`
              )
          );
        };

        setTeacherAttendanceData(
          getWeeklyTeacherAttendanceSummary(teacherAttendanceRes.attendance)
        );
        const getClassroomStudentDistribution = (students, classrooms) => {
          const classMap = {};

          // Initialize with all classrooms
          classrooms.forEach((cls) => {
            classMap[cls.name] = 0;
          });

          students.forEach((student) => {
            const className = student.classId?.name; // adjust if it's different
            if (className) {
              classMap[className] = (classMap[className] || 0) + 1;
            }
          });

          return Object.entries(classMap).map(([name, value]) => ({
            name,
            value,
          }));
        };

        const classroomChartData = getClassroomStudentDistribution(
          studentsRes.students,
          classroomsRes.classrooms
        );
        setAttendanceData(classroomChartData); // reuse the state for now

        // Mock data for charts (in a real app, these would come from APIs)
        // setEnrollmentData([
        //   { month: "Jan", students: 1200 },
        //   { month: "Feb", students: 1350 },
        //   { month: "Mar", students: 1420 },
        //   { month: "Apr", students: 1510 },
        //   { month: "May", students: 1630 },
        //   { month: "Jun", students: 1720 },
        // ]);

        // setAttendanceData([
        //   { name: "Present", value: 75 },
        //   { name: "Absent", value: 12 },
        //   { name: "Late", value: 8 },
        //   { name: "Excused", value: 5 },
        // ]);

        // setPaymentData([
        //   { month: "Jan", collected: 42000, due: 65000 },
        //   { month: "Feb", collected: 58000, due: 65000 },
        //   { month: "Mar", collected: 61000, due: 65000 },
        //   { month: "Apr", collected: 59000, due: 65000 },
        //   { month: "May", collected: 63000, due: 65000 },
        // ]);

        // setTeacherAttendanceData([
        //   { day: "Mon", present: 72, absent: 8 },
        //   { day: "Tue", present: 75, absent: 5 },
        //   { day: "Wed", present: 70, absent: 10 },
        //   { day: "Thu", present: 76, absent: 4 },
        //   { day: "Fri", present: 74, absent: 6 },
        // ]);

        setLoading(false);
      } catch (err) {
        setError("Failed to load dashboard data");
        setLoading(false);
        console.error("Dashboard fetch error:", err);
      }
    };

    fetchDashboardData();
  }, []);

  // Animate stats on load
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setStats((prev) => ({
          ...prev,
          attendanceSubmitted: 68,
        }));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Modern Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">School Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, Administrator</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 font-medium">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </div>

      {/* Stat Cards Section - Modern Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          title="Total Students"
          value={stats.students}
          icon="👨‍🎓"
          color="bg-indigo-500"
        />
        <StatCard
          title="Total Teachers"
          value={stats.teachers}
          icon="👩‍🏫"
          color="bg-emerald-500"
        />
        <StatCard
          title="Parents Registered"
          value={stats.parents}
          icon="👪"
          color="bg-amber-500"
        />
        <StatCard
          title="Total Classrooms"
          value={stats.classrooms}
          icon="🏫"
          color="bg-violet-500"
        />
        {/* <StatCard
          title="Attendance Submitted"
          value={`${stats.attendanceSubmitted}%`}
          icon="✅"
          color="bg-cyan-500"
        />
        <StatCard
          title="Pending Payments"
          value={`$${stats.pendingPayments.toLocaleString()}`}
          icon="💰"
          color="bg-rose-500"
        /> */}
      </div>

      {/* Charts Section - Modern Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Enrollment Chart Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">
                Student Enrollment Growth
              </h3>
            </div>
            <div className="p-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={enrollmentData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e7eb"
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#6b7280" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#6b7280" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="students"
                    stroke="#6366F1"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#6366F1" }}
                    activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment & Attendance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800">
                  Monthly Payments
                </h3>
              </div>
              <div className="p-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paymentData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e5e7eb"
                    />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#6b7280" }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#6b7280" }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Bar
                      dataKey="collected"
                      fill="#10B981"
                      name="Collected"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="expected"
                      fill="#E5E7EB"
                      name="Expected"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Attendance Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800">
                  Teacher Attendance
                </h3>
              </div>
              <div className="p-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teacherAttendanceData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e5e7eb"
                    />
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#6b7280" }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#6b7280" }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Bar
                      dataKey="present"
                      fill="#6366F1"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="absent"
                      fill="#F59E0B"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Upcoming Events Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">
                  Upcoming Events
                </h3>
                <button className="text-indigo-600 text-sm font-medium hover:text-indigo-800">
                  View All
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => (
                  <EventItem key={event._id} event={event} />
                ))
              ) : (
                <div className="p-6 text-center text-gray-500">
                  No upcoming events
                </div>
              )}
            </div>
          </div>
          {/* Classroom Distribution Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">
                Classroom Student Distribution
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Number of students per class
              </p>
            </div>

            <div className="p-4 flex flex-col">
              {/* Total students summary */}
              <div className="flex justify-between items-center mb-4 px-2 py-3 bg-indigo-50 rounded-lg">
                <div className="flex items-center">
                  <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-indigo-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-indigo-700">Total Students</p>
                    <p className="text-lg font-bold text-gray-900">
                      {attendanceData.reduce(
                        (total, item) => total + item.value,
                        0
                      )}
                    </p>
                  </div>
                </div>
                <div className="bg-white border border-indigo-200 px-3 py-1 rounded-full text-indigo-700 text-sm font-medium">
                  {attendanceData.length} Classes
                </div>
              </div>

              <div className="flex items-center justify-center h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendanceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${value}`}
                      labelLine={false}
                    >
                      {attendanceData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name, props) => [
                        `${value} students`,
                        props.payload.name,
                      ]}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        background: "#fff",
                      }}
                      itemStyle={{ color: "#1f2937", fontWeight: 500 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Enhanced legend with student counts */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {attendanceData.map((entry, index) => (
                  <div
                    key={entry.name}
                    className="flex items-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div
                      className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <div className="truncate text-sm font-medium text-gray-700">
                      {entry.name}
                    </div>
                    <div className="ml-auto bg-white px-2 py-0.5 rounded-md text-xs font-bold text-gray-800">
                      {entry.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modern Stat Card Component
const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 transition-all hover:shadow-md">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div
        className={`${color} w-12 h-12 rounded-xl flex items-center justify-center`}
      >
        <span className="text-xl">{icon}</span>
      </div>
    </div>
    <div className="mt-4">
      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
        <div className={`${color} h-full`} style={{ width: "75%" }}></div>
      </div>
    </div>
  </div>
);

// Modern Event Item Component
const EventItem = ({ event }) => {
  const eventColors = {
    Exam: "bg-red-100 text-red-800",
    Holiday: "bg-green-100 text-green-800",
    Event: "bg-blue-100 text-blue-800",
    Meeting: "bg-purple-100 text-purple-800",
    Announcement: "bg-yellow-100 text-yellow-800",
  };

  const eventType = event.type || "Event";
  const colorClass = eventColors[eventType] || "bg-gray-100 text-gray-800";

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex gap-3">
        <div className="flex flex-col items-center">
          <div className="text-sm font-medium text-gray-900">
            {new Date(event.date).toLocaleDateString("en-US", {
              day: "numeric",
            })}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(event.date).toLocaleDateString("en-US", {
              month: "short",
            })}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between">
            <h4 className="font-medium text-gray-900 truncate">
              {event.title}
            </h4>
            <span
              className={`${colorClass} px-2 py-1 rounded-full text-xs font-medium`}
            >
              {eventType}
            </span>
          </div>

          {event.description && (
            <p className="mt-1 text-sm text-gray-600 truncate">
              {event.description}
            </p>
          )}

          <div className="mt-2 flex items-center text-sm text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {new Date(event.date).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
