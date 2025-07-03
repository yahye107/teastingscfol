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
  CalendarIcon,
  UsersIcon,
  BookOpenIcon,
  FileTextIcon,
  ClockIcon,
  CheckCircleIcon,
  BarChartIcon,
  BellIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { callGetEventsForUserApi } from "@/service/service";
import GlobalLoader from "@/components/common/GlobalLoader";
import { Link } from "react-router-dom";

const Teacherhome = () => {
  const { user } = useUser();
  const teacher = user?.teacherProfile;

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch events data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventRes = await callGetEventsForUserApi();
        setEvents(eventRes?.events || []);
      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (!teacher) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <GlobalLoader />
      </div>
    );
  }

  // Calculate summary data
  const totalStudents =
    teacher.classes?.reduce(
      (sum, cls) => sum + (cls.students?.length || 0),
      0
    ) || 0;

  const pendingGrading =
    teacher.assignments?.filter((assignment) => assignment.status === "pending")
      .length || 0;

  // Get upcoming events (next 7 days)
  const upcomingEvents = events
    .filter(
      (event) =>
        event.status === "upcoming" || new Date(event.date) > new Date()
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);
  const todayDayName = format(new Date(), "eeee").toLowerCase(); // "thursday"
  const todaysTimetable =
    teacher.timetables?.filter(
      (item) => item.day.toLowerCase() === todayDayName
    ) || [];

  console.log(todaysTimetable);
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Welcome, {user?.fullName}!
        </h1>
        <p className="text-gray-600 mt-2">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="secondary">{teacher.department || "Teacher"}</Badge>
          {/* <Badge variant="outline">
            {teacher?.timetables?.class?.length || 0} Classes
          </Badge> */}
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChartIcon className="w-5 h-5 text-purple-600" />
            Quick Actions
          </CardTitle>
          <CardDescription>Access frequently used features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/teacher/dashboard/attendance">
              <Button variant="outline" className="w-full justify-start gap-2">
                <UsersIcon className="w-4 h-4" />
                Take Attendance
              </Button>
            </Link>
            <Link to="/teacher/dashboard/Gradebook">
              <Button variant="outline" className="w-full justify-start gap-2">
                <BookOpenIcon className="w-4 h-4" />
                Enter Grades
              </Button>
            </Link>
            <Link to="/teacher/dashboard/Assegment">
              <Button variant="outline" className="w-full justify-start gap-2">
                <FileTextIcon className="w-4 h-4" />
                Create Assignment
              </Button>
            </Link>
            <Link to="/teacher/dashboard/celender">
              <Button variant="outline" className="w-full justify-start gap-2">
                <CalendarIcon className="w-4 h-4" />
                View Timetable
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border border-blue-100 bg-blue-50 hover:bg-blue-100 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <UsersIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-800">Total Students</p>
                <p className="text-xl font-bold text-blue-900">
                  {totalStudents}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-green-100 bg-green-50 hover:bg-green-100 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-full">
                <ClockIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-800">Today's Classes</p>
                <p className="text-xl font-bold text-green-900">
                  {todaysTimetable.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-amber-100 bg-amber-50 hover:bg-amber-100 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 p-3 rounded-full">
                <BookOpenIcon className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-amber-800">Pending Grading</p>
                <p className="text-xl font-bold text-amber-900">
                  {pendingGrading}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-indigo-100 bg-indigo-50 hover:bg-indigo-100 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-100 p-3 rounded-full">
                <CheckCircleIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-indigo-800">Attendance Due</p>
                <p className="text-xl font-bold text-indigo-900">
                  {todaysTimetable.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div> */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Today's Timetable */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-blue-600" />
              Today's Schedule ({todayDayName})
            </CardTitle>
            <CardDescription>Your classes for today</CardDescription>
          </CardHeader>
          <CardContent>
            {todaysTimetable.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0"
              >
                <div>
                  <h3 className="font-medium">
                    {item.subject.name || "Class Session"}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {item.class.name} • hall {item.hall.hallNumber}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {item.startTime} - {item.endTime}
                  </p>
                  {/* <Badge variant="secondary">{item.type || "Lecture"}</Badge> */}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellIcon className="w-5 h-5 text-purple-600" />
              Upcoming Events
            </CardTitle>
            <CardDescription>
              School activities and important dates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <GlobalLoader />
            ) : upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map((event, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-center text-purple-800 font-bold">
                        {format(new Date(event.date), "dd")}
                      </div>
                      <div className="text-center text-purple-600 text-sm">
                        {format(new Date(event.date), "MMM")}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium">{event.title}</h3>
                      <p className="text-gray-600 text-sm">
                        {event.message || "No description available"}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {event.startTime && event.endTime && (
                          <Badge variant="outline">
                            {event.startTime} - {event.endTime}
                          </Badge>
                        )}
                        {event.location && (
                          <Badge variant="outline">{event.location}</Badge>
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
      </div>

      {/* Pending Assignments */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileTextIcon className="w-5 h-5 text-amber-600" />
            Assignments to Grade
          </CardTitle>
          <CardDescription>Pending evaluation work</CardDescription>
        </CardHeader>
        <CardContent>
          {teacher.assignments?.filter((a) => a.status === "pending").length >
          0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assignment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submissions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teacher.assignments
                    ?.filter((a) => a.status === "pending")
                    .slice(0, 3)
                    .map((assignment, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {assignment.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {assignment.class}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {assignment.dueDate
                            ? format(
                                new Date(assignment.dueDate),
                                "MMM d, yyyy"
                              )
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {assignment.submissions || 0}/
                          {assignment.totalStudents || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="warning">Pending</Badge>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No pending assignments to grade</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Teacherhome;
