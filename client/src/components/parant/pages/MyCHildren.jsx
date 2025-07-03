import GlobalLoader from "@/components/common/GlobalLoader";
import React, { useState, useEffect } from "react";

import { useUser } from "@/useContaxt/UseContext";
import { Link } from "react-router-dom";
import {
  UserCircle,
  CalendarDays,
  BarChart3,
  BookOpen,
  Mail,
  Search,
  Frown,
  X,
} from "lucide-react";

const MyChildren = () => {
  const { user } = useUser();
  const children = user?.parentProfile?.children || [];
  const [searchTerm, setSearchTerm] = useState("");
  const [showUI, setShowUI] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowUI(true);
    }, 1500); // 1.5 seconds
    return () => clearTimeout(timeout);
  }, []);
  // Filter children based on search term (name or email)
  const filteredChildren = children.filter((child) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      child.name.toLowerCase().includes(searchLower) ||
      (child.email && child.email.toLowerCase().includes(searchLower)) ||
      (child.class?.name &&
        child.class.name.toLowerCase().includes(searchLower))
    );
  });
  if (!showUI) {
    return <GlobalLoader />;
  }
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            My Children
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Manage and monitor your children's academic progress
          </p>
        </div>
        <div className="mt-4 md:mt-0 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl px-4 py-3">
          <p className="text-indigo-600 dark:text-indigo-300 font-medium">
            {filteredChildren.length}{" "}
            {filteredChildren.length === 1 ? "Child" : "Children"} Found
          </p>
        </div>
      </div>

      {/* Search Section */}
      <div className="mb-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
        <div className="relative max-w-2xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search children by name, email, or class..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            {children.length} total children
          </span>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            Tap on cards for details
          </span>
        </div>
      </div>

      {children.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="bg-gray-100 dark:bg-gray-800 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <UserCircle className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              No Children Registered
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              You don't have any registered children yet. Please contact your
              school to add children to your account.
            </p>
            <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">
              Contact School
            </button>
          </div>
        </div>
      ) : filteredChildren.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="bg-gray-100 dark:bg-gray-800 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <Frown className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              No Matching Children Found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              We couldn't find any children matching:
            </p>
            <p className="font-medium text-indigo-600 dark:text-indigo-400 mb-6">
              "{searchTerm}"
            </p>
            <button
              onClick={() => setSearchTerm("")}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              Clear Search
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChildren.map((child) => (
            <div
              key={child.id}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-5">
                <div className="flex items-center">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl w-16 h-16 flex items-center justify-center">
                    <UserCircle className="h-8 w-8 text-white" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-xl font-bold text-white">
                      {child.name}
                    </h2>
                    <p className="text-indigo-100 flex items-center mt-1">
                      <Mail className="h-4 w-4 mr-1" />
                      {child.email || "N/A"}
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

                <div className="grid grid-cols-2 gap-3 mt-6">
                  <Link
                    to={`/parent/dashboard/SelectedChildrenAttendence/${child.id}`}
                    className="flex flex-col items-center justify-center p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-800/30 transition-colors"
                  >
                    <div className="bg-indigo-500 p-2 rounded-lg mb-2">
                      <CalendarDays className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-indigo-700 dark:text-indigo-300 font-medium text-sm">
                      Attendance
                    </span>
                  </Link>

                  <Link
                    to={`/parent/dashboard/TheSlectedCHild/${child.id}`}
                    className="flex flex-col items-center justify-center p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg border border-emerald-100 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-800/30 transition-colors"
                  >
                    <div className="bg-emerald-500 p-2 rounded-lg mb-2">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-emerald-700 dark:text-emerald-300 font-medium text-sm">
                      Results
                    </span>
                  </Link>
                </div>

                <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">
                  <Link
                    to={`/parent/dashboard/profile/${child.id}`}
                    className="w-full py-2.5 text-center text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium rounded-lg transition-colors flex items-center justify-center group-hover:underline"
                  >
                    View Full Profile
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 ml-1.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
          Need help finding a child?
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          If you can't find a child that should be listed, try these solutions:
        </p>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <li className="flex items-start">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-full p-1.5 mr-3 mt-0.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-indigo-600 dark:text-indigo-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-gray-700 dark:text-gray-300 text-sm">
              Check spelling variations
            </span>
          </li>
          <li className="flex items-start">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-full p-1.5 mr-3 mt-0.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-indigo-600 dark:text-indigo-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-gray-700 dark:text-gray-300 text-sm">
              Search by email instead of name
            </span>
          </li>
          <li className="flex items-start">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-full p-1.5 mr-3 mt-0.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-indigo-600 dark:text-indigo-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-gray-700 dark:text-gray-300 text-sm">
              Contact your school administrator
            </span>
          </li>
        </ul>
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

export default MyChildren;
