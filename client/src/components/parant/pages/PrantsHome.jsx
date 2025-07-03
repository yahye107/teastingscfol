import React, { useEffect, useState, useMemo } from "react";
import { useUser } from "@/useContaxt/UseContext";
import {
  callGetEventsForUserApi,
  callGetAnnouncementsForUserApi,
} from "@/service/service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  DollarSignIcon,
  UsersIcon,
  BookOpenIcon,
  CalendarIcon,
  BarChartIcon,
  AlertCircleIcon,
  CheckCircleIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import GlobalLoader from "@/components/common/GlobalLoader";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const ParentHome = () => {
  const { user } = useUser();
  const children = user?.parentProfile?.children || [];

  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventRes, announcementRes] = await Promise.all([
          callGetEventsForUserApi(),
          callGetAnnouncementsForUserApi(),
        ]);
        setEvents(eventRes?.events || []);
        setAnnouncements(announcementRes?.announcements || []);
      } catch (err) {
        console.error("Error loading data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const summary = useMemo(() => {
    const today = new Date();

    return {
      totalChildren: children.length,
      upcomingEvents: events
        ?.filter((e) => new Date(e.date) > today)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 3),
      pendingFees: children.reduce((sum, child) => {
        return (
          sum +
          (child.feeRecordes?.filter(
            (fee) =>
              fee.status !== "Paid" &&
              fee.dueDate &&
              new Date(fee.dueDate) <= today
          ).length || 0)
        );
      }, 0),
      recentGrades: children
        .flatMap(
          (child) =>
            child.results?.map((result) => ({
              subject: result.subject?.name,
              grade: result.grade,
              childName: child.name,
              date: result.date,
            })) || []
        )
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3),
      attendanceRate:
        children.reduce((sum, child) => {
          return sum + (child.attendance?.averageRate || 0);
        }, 0) / Math.max(children.length, 1),
    };
  }, [children, events]);

  if (loading) return <GlobalLoader />;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-2">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* QUICK ACTIONS - MOVED TO TOP */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChartIcon className="w-5 h-5 text-purple-600" />
            Quick Actions
          </CardTitle>
          <CardDescription>Manage your parent account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link>
              <Button variant="outline" className="w-full justify-start gap-2">
                <BookOpenIcon className="w-4 h-4" />
                Academic Calendar
              </Button>
            </Link>
            <Link to="/parent/dashboard/PrantFeeREcord">
              <Button variant="outline" className="w-full justify-start gap-2">
                <DollarSignIcon className="w-4 h-4" />
                View Payment
              </Button>
            </Link>
            <Link to="/parent/dashboard/MyChildrenGrade">
              <Button variant="outline" className="w-full justify-start gap-2">
                <UsersIcon className="w-4 h-4" />
                View Grade
              </Button>
            </Link>
            <Link to="/parent/dashboard/PrantsMss">
              <Button variant="outline" className="w-full justify-start gap-2">
                <CalendarIcon className="w-4 h-4" />
                Schedule Meeting
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Children Card */}
        <Card className="border border-blue-100 bg-blue-50 hover:bg-blue-100 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <UsersIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-800">Children Enrolled</p>
                <p className="text-2xl font-bold text-blue-900">
                  {summary.totalChildren}
                </p>
              </div>
            </div>
            <Button
              variant="link"
              className="mt-4 pl-0 text-blue-600 cursor-pointer"
            >
              <Link to="/parent/dashboard/Mychildren">
                View Children Details →
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Pending Fees Card */}
        <Card className="border border-amber-100 bg-amber-50 hover:bg-amber-100 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 p-3 rounded-full">
                <DollarSignIcon className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-amber-800">Pending Fees</p>
                <p className="text-2xl font-bold text-amber-900">
                  {summary.pendingFees}
                </p>
              </div>
            </div>
            <Button
              variant="link"
              className="mt-4 pl-0 text-amber-600 cursor-pointer"
            >
              <Link to="/parent/dashboard/PrantFeeREcord">
                View Payment Details →
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Attendance Card */}

        {/* Recent Grades Card */}
      </div>

      {/* UPCOMING EVENTS */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            Upcoming School Events
          </CardTitle>
          <CardDescription>Important dates for your children</CardDescription>
        </CardHeader>
        <CardContent>
          {summary.upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {summary.upcomingEvents.map((event, index) => (
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
                    <p className="text-gray-600 text-sm">{event.message}</p>
                    <p className="text-gray-500 text-sm mt-1">
                      {event.startTime} -{event.endTime}
                    </p>
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

      {/* ANNOUNCEMENTS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircleIcon className="w-5 h-5 text-amber-600" />
            School Announcements
          </CardTitle>
          <CardDescription>
            Latest updates from the school administration
          </CardDescription>
        </CardHeader>
        <CardContent>
          {announcements.length > 0 ? (
            <div className="space-y-4">
              {announcements.slice(0, 3).map((a, index) => (
                <div
                  key={index}
                  className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded"
                >
                  <h3 className="font-medium">{a.title}</h3>
                  <p className="text-gray-600 text-sm">{a.message}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No announcements yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ParentHome;
