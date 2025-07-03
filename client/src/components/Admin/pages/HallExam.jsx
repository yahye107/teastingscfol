import SearchableSelect from "@/components/common/SearchableSelect";
import GlobalLoader from "@/components/common/GlobalLoader";
import { useState, useEffect, useMemo } from "react";
import {
  callGetAllExamApi,
  callGetAllHallsApi,
  callGetStudentsByExamTitleAndHallApi,
} from "@/service/service";
import {
  FiSearch,
  FiInfo,
  FiUsers,
  FiPhone,
  FiCalendar,
  FiMapPin,
} from "react-icons/fi";

const HallExam = () => {
  // State declarations remain the same
  const [exams, setExams] = useState([]);
  const [halls, setHalls] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedHall, setSelectedHall] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [examsRes, hallsRes] = await Promise.all([
          callGetAllExamApi(),
          callGetAllHallsApi(),
        ]);

        const mergedExamsMap = new Map();
        examsRes?.examTables.forEach((exam) => {
          if (!mergedExamsMap.has(exam.title)) {
            mergedExamsMap.set(exam.title, { ...exam });
          } else {
            const existing = mergedExamsMap.get(exam.title);
            const combinedHalls = [
              ...(existing.halls || []),
              ...(exam.halls || []),
            ];
            mergedExamsMap.set(exam.title, {
              ...existing,
              halls: combinedHalls,
            });
          }
        });

        setExams([...mergedExamsMap.values()]);
        setHalls(hallsRes?.halls || []);
      } catch (err) {
        setError("Failed to load initial data");
        console.error(err);
      } finally {
        setTimeout(() => setLoading(false), 1000);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedExam || !selectedHall) return;
      setLoading(true);
      setStudents([]);
      setError("");

      try {
        const data = await callGetStudentsByExamTitleAndHallApi(
          selectedExam.value,
          selectedHall.value
        );
        setStudents(data.students || []);
      } catch (err) {
        setError("Failed to fetch students data");
        console.error(err);
      } finally {
        setTimeout(() => setLoading(false), 800);
      }
    };

    fetchStudents();
  }, [selectedExam, selectedHall]);

  useEffect(() => {
    setSelectedHall(null);
    setStudents([]);
  }, [selectedExam]);

  const examOptions = exams.map((exam) => ({
    value: exam.title,
    label: `${exam.title} (${new Date(exam.date).toLocaleDateString()})`,
  }));

  const filteredHalls = useMemo(() => {
    if (!selectedExam) return [];
    const selectedTitle = selectedExam.value.toLowerCase();
    const matchingExams = exams.filter(
      (exam) => exam.title.toLowerCase() === selectedTitle
    );
    const hallIdSet = new Set();
    matchingExams.forEach((exam) => {
      exam.halls?.forEach((h) => hallIdSet.add(h.hallId));
    });
    return halls.filter((hall) => hallIdSet.has(hall._id));
  }, [selectedExam, exams, halls]);

  const hallOptions = halls.map((hall) => ({
    value: hall._id,
    label: ` Hall ${hall.hallNumber} (${hall.location || "Main Campus"})`,
  }));

  const filteredStudents = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <GlobalLoader size="lg" />
      </div>
    );
  }
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-gradient-to-br from-white to-indigo-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FiCalendar className="text-indigo-600 dark:text-indigo-400" />
              Hall Examination Overview
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage and view student allocations for examinations
            </p>
          </div>

          {selectedHall && students.length > 0 && (
            <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-xl px-4 py-3 mt-4 sm:mt-0">
              <div className="flex items-center gap-2">
                <FiUsers className="text-indigo-700 dark:text-indigo-400" />
                <span className="font-medium text-indigo-700 dark:text-indigo-300">
                  {students.length} students allocated
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Selection Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <FiInfo className="text-indigo-600 dark:text-indigo-400" />
              Select Examination
            </h2>
            <SearchableSelect
              options={examOptions}
              value={selectedExam?.value}
              onChange={(val) => {
                const option = examOptions.find((opt) => opt.value === val);
                setSelectedExam(option || null);
              }}
              isLoading={loading}
              placeholder="Search exams..."
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <FiMapPin className="text-indigo-600 dark:text-indigo-400" />
              Select Hall
            </h2>
            <SearchableSelect
              options={hallOptions}
              value={selectedHall?.value}
              onChange={(val) => {
                const option = hallOptions.find((opt) => opt.value === val);
                setSelectedHall(option || null);
              }}
              isLoading={loading}
              placeholder="Search halls..."
              isDisabled={!selectedExam}
            />
          </div>
        </div>

        {/* Info Cards */}
        {(selectedExam || selectedHall) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {selectedExam && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
                    <FiCalendar className="text-indigo-700 dark:text-indigo-400 text-xl" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700 dark:text-gray-300">
                      Selected Exam
                    </h3>
                    <p className="text-gray-900 dark:text-white font-semibold">
                      {selectedExam.label}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedHall && (
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                    <FiMapPin className="text-purple-700 dark:text-purple-400 text-xl" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700 dark:text-gray-300">
                      Selected Hall
                    </h3>
                    <p className="text-gray-900 dark:text-white font-semibold">
                      {selectedHall.label}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Student List Section */}
        {students.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                  <FiUsers />
                  Student Allocation
                </h2>

                <div className="relative w-full md:w-auto">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="pl-10 pr-4 py-2 w-full md:w-80 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Roll No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Section
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredStudents.map((student) => (
                    <tr
                      key={student._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {student.name || student.user?.fullName || "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-200 font-mono">
                          {student.rollNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {student.class || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                          {student.section || "N/A"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredStudents.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 dark:text-gray-500">
                  No students match your search
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty States */}
        {!loading && selectedHall && students.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="text-center py-16 px-6">
              <div className="mx-auto bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                No students allocated
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                There are no students assigned to {selectedExam?.label} in{" "}
                {selectedHall?.label}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center gap-3 text-red-800 dark:text-red-200">
              <FiInfo className="text-xl flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HallExam;
