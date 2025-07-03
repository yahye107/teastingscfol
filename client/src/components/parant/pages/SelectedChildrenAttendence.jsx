import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useUser } from "@/useContaxt/UseContext";
import {
  format,
  parseISO,
  isToday,
  isThisWeek,
  startOfYear,
  endOfYear,
  isWithinInterval,
} from "date-fns";
import {
  ChevronLeft,
  Calendar,
  Clock,
  BookOpen,
  Filter,
  X,
  CheckCircle,
  XCircle,
  Clock as LateIcon,
  HelpCircle,
} from "lucide-react";
import GlobalLoader from "@/components/common/GlobalLoader";

const SelectedChildrenAttendence = () => {
  const { user } = useUser();
  const { childId } = useParams();
  const [activeView, setActiveView] = useState("today"); // today, week, year
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    academicYear: "all",
    subject: "all",
    month: "all",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showContent, setShowContent] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 1500); // 1500ms = 1.5 seconds

    return () => clearTimeout(timer);
  }, []);
  // Find the child
  const child = user?.parentProfile?.children?.find(
    (child) => child.id === childId
  );
  useEffect(() => {
    if (!child) {
      // Redirect after 1 second or immediately
      navigate("/parent/dashboard/MychildrenAttendence");
    }
  }, [child, navigate]);

  // Status configuration
  const statusConfig = {
    Present: {
      color: "bg-green-100 text-green-800",
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
    },
    Absent: {
      color: "bg-red-100 text-red-800",
      icon: <XCircle className="h-4 w-4 text-red-500" />,
    },
    Late: {
      color: "bg-yellow-100 text-yellow-800",
      icon: <LateIcon className="h-4 w-4 text-yellow-500" />,
    },
    Excused: {
      color: "bg-blue-100 text-blue-800",
      icon: <HelpCircle className="h-4 w-4 text-blue-500" />,
    },
  };

  // Get unique academic years
  const academicYears = useMemo(() => {
    if (!child?.attendance) return [];
    return [...new Set(child.attendance.map((a) => a.academicYear))].sort(
      (a, b) => b - a
    );
  }, [child]);

  // Get unique subjects
  const subjects = useMemo(() => {
    if (!child?.attendance) return [];
    return [...new Set(child.attendance.map((a) => a.subject?.name || "N/A"))];
  }, [child]);

  // Months for filter
  const months = [
    { value: "all", label: "All Months" },
    { value: "0", label: "January" },
    { value: "1", label: "February" },
    { value: "2", label: "March" },
    { value: "3", label: "April" },
    { value: "4", label: "May" },
    { value: "5", label: "June" },
    { value: "6", label: "July" },
    { value: "7", label: "August" },
    { value: "8", label: "September" },
    { value: "9", label: "October" },
    { value: "10", label: "November" },
    { value: "11", label: "December" },
  ];

  // Filter attendance based on view and filters
  const filteredAttendance = useMemo(() => {
    if (!child?.attendance) return [];

    let result = [...child.attendance];

    // Apply view filter
    const now = new Date();
    switch (activeView) {
      case "today":
        result = result.filter((att) => isToday(parseISO(att.date)));
        break;
      case "week":
        result = result.filter((att) =>
          isThisWeek(parseISO(att.date), { weekStartsOn: 1 })
        );
        break;
      case "year":
        result = result.filter((att) =>
          isWithinInterval(parseISO(att.date), {
            start: startOfYear(now),
            end: endOfYear(now),
          })
        );
        break;
      default:
        break;
    }

    // Apply academic year filter
    if (filters.academicYear !== "all") {
      result = result.filter(
        (att) => att.academicYear === filters.academicYear
      );
    }

    // Apply subject filter
    if (filters.subject !== "all") {
      result = result.filter((att) => att.subject?.name === filters.subject);
    }

    // Apply month filter
    if (filters.month !== "all") {
      result = result.filter((att) => {
        const date = parseISO(att.date);
        return date.getMonth() === parseInt(filters.month);
      });
    }

    // Apply search term
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter((att) => {
        return (
          (att.subject?.name || "").toLowerCase().includes(lowerSearch) ||
          att.status.toLowerCase().includes(lowerSearch) ||
          format(parseISO(att.date), "MMM dd, yyyy")
            .toLowerCase()
            .includes(lowerSearch) ||
          String(att.academicYear || "")
            .toLowerCase()
            .includes(lowerSearch)
        );
      });
    }

    return result;
  }, [child, activeView, filters, searchTerm]);

  // Calculate attendance summary
  const attendanceSummary = useMemo(() => {
    const summary = {
      Present: 0,
      Absent: 0,
      Late: 0,
      Excused: 0,
      total: filteredAttendance.length,
    };

    filteredAttendance.forEach((att) => {
      if (summary.hasOwnProperty(att.status)) {
        summary[att.status]++;
      }
    });

    return summary;
  }, [filteredAttendance]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      academicYear: "all",
      subject: "all",
      month: "all",
    });
    setSearchTerm("");
  };

  if (!child) {
    return null; // Optional: could show loader or just nothing since redirect is instant
  }
  if (!showContent) {
    return <GlobalLoader />;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/parent/dashboard/MychildrenAttendence"
          className="flex items-center text-indigo-600 hover:text-indigo-800 transition mb-6"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back to Children
        </Link>
      </div>

      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center">
          <div className="flex items-center">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-full p-3 mr-4">
              <BookOpen className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                {child.name}'s Attendance
              </h1>
              <div className="flex flex-wrap gap-3 mt-2">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <BookOpen className="h-4 w-4 mr-1.5 text-indigo-500" />
                  <span>
                    {child.class?.name || "N/A"}
                    {child.class?.section &&
                      ` - Section ${child.class.section}`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="ml-auto mt-4 md:mt-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-2 shadow-sm">
              <p className="text-indigo-600 dark:text-indigo-400 font-medium">
                {child.attendance?.length || 0} Attendance Records
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* View Selector and Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex border-b border-gray-200 dark:border-gray-800">
          <button
            className={`py-3 px-6 font-medium text-sm flex items-center ${
              activeView === "today"
                ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
            onClick={() => setActiveView("today")}
          >
            <Clock className="h-4 w-4 mr-2" />
            Today
          </button>
          <button
            className={`py-3 px-6 font-medium text-sm flex items-center ${
              activeView === "week"
                ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
            onClick={() => setActiveView("week")}
          >
            <Calendar className="h-4 w-4 mr-2" />
            This Week
          </button>
          <button
            className={`py-3 px-6 font-medium text-sm flex items-center ${
              activeView === "year"
                ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
            onClick={() => setActiveView("year")}
          >
            <Calendar className="h-4 w-4 mr-2" />
            This Year
          </button>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search records..."
              className="pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Filter className="h-5 w-5 mr-1.5 text-indigo-500" />
            Filters
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-5 mb-6 border border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-white">
              Filter Attendance
            </h3>
            <button
              onClick={() => setShowFilters(false)}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Academic Year
              </label>
              <select
                name="academicYear"
                value={filters.academicYear}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="all">All Years</option>
                {academicYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subject
              </label>
              <select
                name="subject"
                value={filters.subject}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="all">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Month
              </label>
              <select
                name="month"
                value={filters.month}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-lg"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {Object.entries(attendanceSummary).map(([status, count]) => {
          if (status === "total") {
            return (
              <div
                key={status}
                className="p-4 rounded-xl shadow-sm bg-gray-50 dark:bg-gray-800 flex items-center"
              >
                <div className="mr-3">
                  <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <div className="text-xl font-bold">{count}</div>
                  <div className="text-sm mt-1">Total Records</div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={status}
              className={`p-4 rounded-xl shadow-sm flex items-center ${statusConfig[status]?.color}`}
            >
              <div className="mr-3">{statusConfig[status]?.icon}</div>
              <div>
                <div className="text-xl font-bold">{count}</div>
                <div className="text-sm mt-1">{status}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Attendance Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-800">
        <div className="p-5 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            {activeView === "today" && "Today's Attendance"}
            {activeView === "week" && "This Week's Attendance"}
            {activeView === "year" && "This Year's Attendance"}
          </h2>
        </div>

        {filteredAttendance.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
              No attendance records found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {activeView === "today"
                ? "No attendance recorded for today"
                : "Try adjusting your filters or view"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Academic Year
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredAttendance.map((att, i) => (
                  <tr
                    key={i}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200">
                      {format(parseISO(att.date), "MMM dd, yyyy")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200">
                      {att.subject?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`flex items-center px-3 py-1 rounded-full ${
                          statusConfig[att.status]?.color
                        }`}
                      >
                        {statusConfig[att.status]?.icon}
                        <span className="ml-1.5">{att.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1.5 text-gray-500" />
                        <span>
                          {att.periodStart} - {att.periodEnd}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200">
                      {att.academicYear}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Insights */}
      <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2 text-indigo-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          Attendance Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-indigo-600 dark:text-indigo-400 font-medium mb-1">
              Overall Attendance Rate
            </div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">
              {attendanceSummary.total > 0
                ? `${Math.round(
                    (attendanceSummary.Present / attendanceSummary.total) * 100
                  )}%`
                : "N/A"}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-indigo-600 dark:text-indigo-400 font-medium mb-1">
              Most Common Status
            </div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">
              {attendanceSummary.total > 0
                ? Object.entries(attendanceSummary)
                    .filter(([status]) => status !== "total")
                    .sort((a, b) => b[1] - a[1])[0][0]
                : "N/A"}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-indigo-600 dark:text-indigo-400 font-medium mb-1">
              Recent Record
            </div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">
              {filteredAttendance.length > 0
                ? format(parseISO(filteredAttendance[0].date), "MMM dd")
                : "N/A"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectedChildrenAttendence;
