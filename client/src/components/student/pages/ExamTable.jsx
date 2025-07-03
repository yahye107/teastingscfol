import React, { useEffect, useState } from "react";

import { callGetStudentExamTableApi } from "@/service/service";
import GlobalLoader from "@/components/common/GlobalLoader";
import { ChevronLeft } from "lucide-react";

import { useNavigate, useParams } from "react-router-dom";
import { useUser } from "@/useContaxt/UseContext";

const ExamTable = () => {
  const navigate = useNavigate();
  const { examTitle } = useParams(); // 👈 get from route params
  const { user } = useUser();
  const [examTable, setExamTable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("");

  useEffect(() => {
    const fetchExamTable = async () => {
      if (!examTitle || !user?.studentProfile?._id) return;

      try {
        setLoading(true);
        const res = await callGetStudentExamTableApi(user.studentProfile._id);
        const filtered = res.filter(
          (e) => e.title === decodeURIComponent(examTitle)
        );
        setExamTable(filtered);

        // Set student name from the first record if available
        if (filtered.length > 0) {
          setStudentName(filtered[0].studentName || "");
        }
      } catch (err) {
        console.error("Failed to load exam table:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchExamTable();
  }, [examTitle, user]);

  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="mb-6">
          <button
            onClick={goBack}
            className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4"
          >
            <ChevronLeft className="mr-1 h-5 w-5" />
            Back to Exam Hall
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                {decodeURIComponent(examTitle || "Exam Schedule")}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Exam schedule for{" "}
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {studentName || user?.name || "Student"}
                </span>
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-blue-800 dark:text-blue-200 font-medium">
                Hall Number:{" "}
                {examTable.length > 0 ? examTable[0].hall : "Not assigned"}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-12">
            <GlobalLoader />
          </div>
        ) : examTable.length > 0 ? (
          <div className=" overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-[600px] text-left">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="p-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="p-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="p-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Day
                  </th>
                  <th className="p-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {examTable.map((row, i) => (
                  <tr
                    key={i}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="p-3 text-gray-800 dark:text-gray-200 font-medium">
                      {row.subject}
                    </td>
                    <td className="p-3 text-gray-800 dark:text-gray-200">
                      {new Date(row.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </td>
                    <td className="p-3 text-gray-800 dark:text-gray-200">
                      {row.day}
                    </td>
                    <td className="p-3 text-gray-800 dark:text-gray-200">
                      <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-md">
                        {row.startTime} - {row.endTime}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
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
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
              No schedule found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              No exam schedule available for{" "}
              <span className="font-medium">
                {decodeURIComponent(examTitle || "this exam")}
              </span>
            </p>
          </div>
        )}

        {/* <div className="mt-8 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
            Exam Guidelines
          </h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc pl-5 space-y-1">
            <li>Arrive at least 30 minutes before the exam starts</li>
            <li>Bring your student ID and required materials</li>
            <li>Electronic devices are not permitted</li>
            <li>Follow all instructions from the exam supervisor</li>
          </ul>
        </div> */}
      </div>
    </div>
  );
};

export default ExamTable;
