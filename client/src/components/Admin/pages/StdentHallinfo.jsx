import React, { useState, useEffect } from "react";
import SearchableSelect from "@/components/common/SearchableSelect";
import GlobalLoader from "@/components/common/GlobalLoader";
import {
  callGetStudentHallApi,
  callGetAllStudentsApi,
} from "@/service/service";

const StudentHallInfo = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [hallInfo, setHallInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [examFilter, setExamFilter] = useState(""); // New state for exam title filter

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const response = await callGetAllStudentsApi();
        setStudents(response.students || []);
      } catch (err) {
        setError("Failed to load students");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  useEffect(() => {
    const fetchHallInfo = async () => {
      if (!selectedStudent) return;

      setLoading(true);
      setHallInfo(null);
      setError("");

      try {
        const data = await callGetStudentHallApi(selectedStudent.value);
        setHallInfo(data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load hall information"
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHallInfo();
  }, [selectedStudent]);

  // Filter hall assignments by exam title
  const filteredAssignments =
    hallInfo?.hallAssignments?.filter((assignment) =>
      assignment.examTitle.toLowerCase().includes(examFilter.toLowerCase())
    ) || [];

  const studentOptions = students.map((student) => ({
    value: student._id,
    label: `${student.user?.fullName || student.name || "Unknown"} `,
  }));

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white dark:bg-white rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-200">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Student Hall Information
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Find examination hall assignments for any student
          </p>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Student
          </label>
          <SearchableSelect
            options={studentOptions}
            value={selectedStudent?.value}
            onChange={(val) => {
              const option = studentOptions.find((opt) => opt.value === val);
              setSelectedStudent(option || null);
              setExamFilter(""); // Reset filter when student changes
            }}
            placeholder="Search by name or roll number..."
            isLoading={loading}
          />
        </div>

        {loading && (
          <div className="">
            <GlobalLoader />
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {hallInfo && !loading && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Student Info Header - Profile picture removed */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/20 p-6 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  {hallInfo.studentName}
                </h2>
              </div>
            </div>

            {/* Hall Assignments */}
            <div className="p-6">
              <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                  Examination Hall Assignments
                  <span className="ml-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {filteredAssignments.length}
                  </span>
                </h3>

                {/* Exam title search input */}
                {hallInfo.hallAssignments?.length > 0 && (
                  <div className="flex-1 max-w-xs">
                    <input
                      type="text"
                      placeholder="Search by exam title..."
                      value={examFilter}
                      onChange={(e) => setExamFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              {filteredAssignments.length > 0 ? (
                <div className="space-y-4">
                  {filteredAssignments.map((assignment, index) => (
                    <div
                      key={index}
                      className="border border-gray-100 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex flex-wrap items-center gap-4 mb-3">
                        <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-lg flex items-center justify-center">
                          <span className="text-blue-700 dark:text-blue-300 font-bold">
                            {assignment.hallNumber}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800 dark:text-white">
                            {assignment.examTitle}
                          </h4>
                        </div>
                      </div>

                      {/* Assignment ID removed from display */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 block">
                            Hall Number
                          </span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {assignment.hallNumber}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 block">
                            Exam Title
                          </span>
                          <span className="font-medium text-gray-700 dark:text-gray-300 truncate">
                            {assignment.examTitle}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : hallInfo.hallAssignments?.length > 0 ? (
                <div className="text-center py-8">
                  <div className="bg-gray-100 dark:bg-gray-700/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h4 className="text-gray-700 dark:text-gray-300 font-medium">
                    No matching exams found
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                    No hall assignments match your search
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-gray-100 dark:bg-gray-700/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h4 className="text-gray-700 dark:text-gray-300 font-medium">
                    No hall assignments found
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                    This student doesn't have any exam hall assignments yet
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {!selectedStudent && !loading && (
          <div className="text-center py-12">
            <div className="bg-gray-100 dark:bg-gray-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h4 className="text-gray-700 dark:text-gray-300 font-medium">
              Select a student to view hall information
            </h4>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
              Search for a student by name or roll number
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentHallInfo;
