import React, { useState, useEffect, useMemo } from "react";
import { useUser } from "@/useContaxt/UseContext";
import { Link } from "react-router-dom";
import GlobalLoader from "@/components/common/GlobalLoader";
import {
  UserCircle,
  Search,
  BookOpen,
  ArrowRight,
  BarChart3,
  Frown,
} from "lucide-react";

const MyChildrenAttendence = () => {
  const { user } = useUser();
  const children = user?.parentProfile?.children || [];

  const [searchTerm, setSearchTerm] = useState("");
  const [showContent, setShowContent] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  // Calculate attendance summary - moved before conditional return
  const attendanceSummary = useMemo(() => {
    const total = children.length;
    const good = Math.floor(total * 0.7);
    const warning = total - good;
    return { total, good, warning };
  }, [children]);

  // Filter children - moved before conditional return
  const filteredChildren = useMemo(() => {
    return children
      .filter(
        (child) =>
          child.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          child.class?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter((child) => {
        if (activeFilter === "all") return true;
        const attendanceStatus = Math.random() > 0.3 ? "good" : "warning";
        return attendanceStatus === activeFilter;
      });
  }, [searchTerm, children, activeFilter]);

  // Simulate loading delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Return loader early only after all hooks are called
  if (!showContent) {
    return <GlobalLoader />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Children Attendance
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Track and monitor your children's class attendance
            </p>
          </div>
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl px-4 py-3">
            <p className="text-indigo-600 dark:text-indigo-300 font-medium">
              {children.length} {children.length === 1 ? "Child" : "Children"}{" "}
              Registered
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-full p-2 mr-4">
                <BookOpen className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {attendanceSummary.total}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Total Children
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center">
              <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-2 mr-4">
                <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {attendanceSummary.good}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Good Attendance
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center">
              <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-full p-2 mr-4">
                <BarChart3 className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {attendanceSummary.warning}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Needs Attention
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="relative flex-grow max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by child name, class, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeFilter === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              All Children
            </button>
            <button
              onClick={() => setActiveFilter("good")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeFilter === "good"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              Good Attendance
            </button>
            <button
              onClick={() => setActiveFilter("warning")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeFilter === "warning"
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              Needs Attention
            </button>
          </div>
        </div>
      </div>

      {/* Children List */}
      {filteredChildren.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="bg-gray-100 dark:bg-gray-800 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <Frown className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              No Children Found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              We couldn't find any children matching your search or filter
              criteria
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setActiveFilter("all");
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChildren.map((child) => {
            const attendanceStatus = Math.random() > 0.3 ? "good" : "warning";
            const attendancePercentage = Math.floor(Math.random() * 40) + 60;

            return (
              <div
                key={child.id}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div
                  className={`p-5 ${
                    attendanceStatus === "good"
                      ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
                      : "bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20"
                  }`}
                >
                  <div className="flex items-center">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-xl w-16 h-16 flex items-center justify-center">
                      <UserCircle className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="ml-4">
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                        {child.name}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                        {child.email || "No email provided"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center text-gray-600 dark:text-gray-300 mb-4">
                    <BookOpen className="h-5 w-5 mr-2 text-indigo-500" />
                    <div>
                      <span className="font-medium">
                        {child.class?.name || "N/A"}
                      </span>
                      {child.class?.section && (
                        <span className="text-gray-500 ml-2">
                          (Section {child.class.section})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Attendance Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">
                        Attendance Rate
                      </span>
                      <span className="font-medium">
                        {attendancePercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          attendanceStatus === "good"
                            ? "bg-green-500"
                            : "bg-yellow-500"
                        }`}
                        style={{ width: `${attendancePercentage}%` }}
                      ></div>
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {attendanceStatus === "good"
                        ? "Good attendance record"
                        : "Attendance needs improvement"}
                    </div>
                  </div>

                  <Link
                    to={`/parent/dashboard/SelectedChildrenAttendence/${child.id}`}
                    className="w-full mt-4 py-2.5 text-center bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-800/30 rounded-lg transition-colors flex items-center justify-center"
                  >
                    View Attendance Details
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Help Section */}
      <div className="mt-12 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6">
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
          Need help with attendance?
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          For questions about attendance records or to report an issue, contact
          our support team
        </p>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Contact Support
          </button>
          <button className="px-4 py-2 text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors">
            View Help Center
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyChildrenAttendence;
