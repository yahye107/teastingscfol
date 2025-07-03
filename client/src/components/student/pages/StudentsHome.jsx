import React, { useEffect, useState } from "react";
import { useUser } from "@/useContaxt/UseContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  BookOpenIcon,
  CalendarIcon,
  BarChartIcon,
  DollarSignIcon,
  UsersIcon,
  CheckCircleIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { callGetEventsForUserApi } from "@/service/service";
import GlobalLoader from "@/components/common/GlobalLoader";
import { Link } from "react-router-dom";

const StudentsHome = () => {
  const { user } = useUser();
  const student = user?.studentProfile;

  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [showUI, setShowUI] = useState(false);

  // 1. Always call useEffect unconditionally
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventRes = await callGetEventsForUserApi();
        setEvents(eventRes?.events || []);
      } catch (error) {
        console.error("Error fetching events", error);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowUI(true);
    }, 1500);
    return () => clearTimeout(timeout);
  }, []);

  // 2. Then return loading state
  if (!student || !showUI) {
    return (
      <div className="flex items-center justify-center" style={{ height: 300 }}>
        <GlobalLoader />
      </div>
    );
  }

  // 3. Safe to calculate derived values now
  const pendingFees =
    student.feeRecordes?.filter(
      (fee) => fee.status !== "Paid" && new Date(fee.dueDate) <= new Date()
    ).length || 0;

  const overallGrade = student.results?.length
    ? (
        student.results.reduce((sum, result) => sum + result.total, 0) /
        student.results.length
      ).toFixed(1)
    : "N/A";

  const attendanceRate = student.results?.length
    ? (
        student.results.reduce(
          (sum, result) => sum + result.attendanceRate,
          0
        ) / student.results.length
      ).toFixed(0)
    : "0";

  const upcomingEvents = events
    .filter(
      (event) =>
        event.status === "upcoming" || new Date(event.date) > new Date()
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  const recentGrades = student.results?.slice(0, 3) || [];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Welcome back, {user?.fullName}!
        </h1>
        <p className="text-gray-600 mt-2">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <Badge variant="secondary">
            {student.classId?.name} • {student.classId?.section}
          </Badge>
          <Badge variant="outline">Admission: {student.admissionNumber}</Badge>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChartIcon className="w-5 h-5 text-purple-600" />
            Quick Actions
          </CardTitle>
          <CardDescription>Access important features quickly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/student/dashboard/Studentcelender">
              <Button variant="outline" className="w-full justify-start gap-2">
                <CalendarIcon className="w-4 h-4" />
                View Timetable
              </Button>
            </Link>
            <Link to="/student/dashboard/StudentGradebook">
              <Button variant="outline" className="w-full justify-start gap-2">
                <BookOpenIcon className="w-4 h-4" />
                Check Grades
              </Button>
            </Link>
            <Link to="/student/dashboard/fees">
              <Button variant="outline" className="w-full justify-start gap-2">
                <DollarSignIcon className="w-4 h-4" />
                Fees Histroy
              </Button>
            </Link>
            <Link to="/student/dashboard/PrantsMss">
              <Button variant="outline" className="w-full justify-start gap-2">
                <UsersIcon className="w-4 h-4" />
                Contact Teacher
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Class Info */}
        <Card className="border border-blue-100 bg-blue-50 hover:bg-blue-100 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <UsersIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-800">Class & Section</p>
                <p className="text-xl font-bold text-blue-900">
                  {student.classId?.name} • {student.classId?.section}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grades Card */}
        <Card className="border border-green-100 bg-green-50 hover:bg-green-100 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-full">
                <BookOpenIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-800">Overall Grade</p>
                <p className="text-xl font-bold text-green-900">
                  {overallGrade}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fees Card */}
        <Card className="border border-amber-100 bg-amber-50 hover:bg-amber-100 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 p-3 rounded-full">
                <DollarSignIcon className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-amber-800">Pending Fees</p>
                <p className="text-xl font-bold text-amber-900">
                  {pendingFees}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Card */}
        <Card className="border border-indigo-100 bg-indigo-50 hover:bg-indigo-100 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-100 p-3 rounded-full">
                <CheckCircleIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-indigo-800">Attendance Rate</p>
                <p className="text-xl font-bold text-indigo-900">
                  {attendanceRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              Upcoming Events
            </CardTitle>
            <CardDescription>
              School activities and important dates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingEvents ? (
              <GlobalLoader />
            ) : upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map((event, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-center text-blue-800 font-bold">
                        {format(new Date(event.date), "dd")}
                      </div>
                      <div className="text-center text-blue-600 text-sm">
                        {format(new Date(event.date), "MMM")}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium">{event.title}</h3>
                      <p className="text-gray-600 text-sm">
                        {event.message || "No description available"}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {event.startTime && (
                          <Badge variant="outline">
                            {event.startTime} - {event.endTime}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No upcoming events scheduled</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Grades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpenIcon className="w-5 h-5 text-green-600" />
              Recent Grades
            </CardTitle>
            <CardDescription>Your latest academic performance</CardDescription>
          </CardHeader>
          <CardContent>
            {recentGrades.length > 0 ? (
              <div className="space-y-4">
                {recentGrades.map((grade, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <h3 className="font-medium">
                        {grade.subject?.name || "Unknown Subject"}
                      </h3>
                      {grade.date && (
                        <p className="text-gray-600 text-sm">
                          {format(new Date(grade.date), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold">{grade.total}</span>
                      <Badge
                        variant={
                          grade.total >= 70
                            ? "success"
                            : grade.total >= 50
                            ? "warning"
                            : "destructive"
                        }
                      >
                        {grade.grade}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No grade records available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fee Status */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSignIcon className="w-5 h-5 text-amber-600" />
            Fee Status
          </CardTitle>
          <CardDescription>Your payment records</CardDescription>
        </CardHeader>
        <CardContent>
          {student.feeRecordes?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Month/Year
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {student.feeRecordes.slice(0, 3).map((fee, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {fee.month} {fee.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${fee.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {fee.dueDate
                          ? format(new Date(fee.dueDate), "MMM d, yyyy")
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            fee.status === "Paid" ? "success" : "destructive"
                          }
                        >
                          {fee.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No fee records available</p>
          )}
        </CardContent>
      </Card>

      {/* Parent Contact */}
      {student.parent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-indigo-600" />
              Parent Contact
            </CardTitle>
            <CardDescription>Your parent/guardian information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="bg-gray-100 p-4 rounded-lg">
                <UsersIcon className="w-8 h-8 text-gray-600" />
              </div>
              <div>
                <h3 className="font-medium">
                  {student.parent.user?.fullName || "Parent Name"}
                </h3>
                <p className="text-gray-600">
                  Contact: {student.parent.contact || "N/A"}
                </p>
                <p className="text-gray-600 mt-1">
                  Emergency: {student.emergencyContact || "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentsHome;
