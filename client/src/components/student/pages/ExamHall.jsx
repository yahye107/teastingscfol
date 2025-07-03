import React, { useEffect, useState, useMemo } from "react";

import { callGetStudentHallApi } from "@/service/service";
import GlobalLoader from "@/components/common/GlobalLoader";

import { useUser } from "@/useContaxt/UseContext";
import { Link } from "react-router-dom";

const ExamHall = () => {
  const { user } = useUser();
  const [hallInfo, setHallInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchHallInfo = async () => {
      try {
        const res = await callGetStudentHallApi(user.studentProfile._id);
        setHallInfo(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHallInfo();
  }, [user]);

  const filteredAssignments = useMemo(() => {
    if (!hallInfo?.hallAssignments) return [];
    return [...hallInfo.hallAssignments]
      .reverse()
      .filter((assignment) =>
        assignment.examTitle.toLowerCase().includes(search.toLowerCase())
      );
  }, [hallInfo, search]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <GlobalLoader />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Exam Hall Assignments
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Assigned halls for{" "}
            <span className="font-medium text-blue-600 dark:text-blue-400">
              {hallInfo?.studentName || "Student"}
            </span>
          </p>
        </div>

        {filteredAssignments.length > 0 && (
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by exam title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        )}

        {filteredAssignments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAssignments.map((assignment, index) => (
              <Link
                to={`/student/dashboard/exam-table/${encodeURIComponent(
                  assignment.examTitle
                )}`}
              >
                <div className="cursor-pointer p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {assignment.examTitle}
                    </h2>
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-md">
                      Hall: {assignment.hallNumber}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Click to view schedule
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 py-12">
            No exam hall assignments available
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamHall;
