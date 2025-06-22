import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUser } from "@/useContaxt/UseContext";
import { ClipLoader } from "react-spinners";
import { toast } from "sonner";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import {
  callGetAttendanceByAcademicYearApi,
  callGetRegisteredAcademicYearsApi,
} from "@/service/service";
import GlobalLoader from "@/components/common/GlobalLoader";

// Grade mapping function
const getGradeLetter = (total) => {
  if (total >= 97) return "A+";
  if (total >= 93) return "A";
  if (total >= 90) return "A-";
  if (total >= 87) return "B+";
  if (total >= 83) return "B";
  if (total >= 80) return "B-";
  if (total >= 77) return "C+";
  if (total >= 73) return "C";
  if (total >= 70) return "C-";
  if (total >= 67) return "D+";
  if (total >= 63) return "D";
  if (total >= 60) return "D-";
  return "F";
};

const StudentGrade = () => {
  const { user, loading: userLoading } = useUser();
  const allResults = user?.studentProfile?.results || [];

  const [displayResults, setDisplayResults] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [metaData, setMetaData] = useState(null);
  const [academicYears, setAcademicYears] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [showContent, setShowContent] = useState(false);

  // Simulate initial loading with timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 1500); // 1.5 seconds loading simulation

    return () => clearTimeout(timer);
  }, []);

  // Show global loader while user data is loading or during simulated loading

  // Fetch academic years
  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        const yearsRes = await callGetRegisteredAcademicYearsApi();
        setAcademicYears(yearsRes || []);

        // Set default to latest year if available
        if (yearsRes.length > 0 && !selectedYear) {
          setSelectedYear(yearsRes[0]);
        }
      } catch (error) {
        toast.error("Failed to load academic years");
      }
    };

    fetchAcademicYears();
  }, []);

  // Extract unique subjects
  const allSubjects = [
    ...new Set(
      allResults.map((result) => result.subject?.name).filter(Boolean)
    ),
  ].sort();

  // Fetch attendance data for selected year
  useEffect(() => {
    if (!user?.studentProfile?._id || !selectedYear) return;

    const fetchAttendanceAndMerge = async () => {
      setIsLoading(true);

      try {
        // Fetch attendance for the entire year
        const attendanceRes = await callGetAttendanceByAcademicYearApi(
          user.studentProfile._id,
          selectedYear
        );

        // Check if API response is valid
        if (!attendanceRes?.data?.subjectRates) {
          throw new Error("Invalid attendance data structure");
        }

        // Create map of subject attendance rates
        const subjectAttendanceMap = {};
        attendanceRes.data.subjectRates.forEach((subject) => {
          let rateValue = 0;
          if (subject.attendanceRate && subject.attendanceRate !== "N/A") {
            const numericValue = parseFloat(
              subject.attendanceRate.replace("%", "")
            );
            rateValue = isNaN(numericValue) ? 0 : numericValue;
          }
          subjectAttendanceMap[subject.subjectName] = rateValue;
        });

        // Filter results based on selected year
        const yearResults = allResults.filter(
          (r) => r.academicYear === selectedYear
        );

        // Merge attendance with grade results
        const mergedResults = yearResults.map((result) => {
          const subjectName = result.subject?.name;
          const attendanceRate = subjectName
            ? subjectAttendanceMap[subjectName] || 0
            : 0;

          // Calculate total grade
          const total = (
            result.firstExam +
            result.midExam +
            result.thirdExam +
            result.finalExam +
            result.activities
          ).toFixed(1);

          return {
            ...result,
            attendanceRate,
            total,
            grade: getGradeLetter(parseFloat(total)),
            lastUpdatedBy: result.updatedBy || "Unknown",
            createdAt: result.createdAt || new Date().toISOString(),
            updatedAt: result.updatedAt || new Date().toISOString(),
            createdBy: result.createdBy || "System",
          };
        });

        setDisplayResults(mergedResults);
      } catch (error) {
        toast.error("Failed to load attendance data");
        console.error("Attendance fetch error:", error);

        // Fallback to results without attendance
        const yearResults = allResults.filter(
          (r) => r.academicYear === selectedYear
        );
        setDisplayResults(
          yearResults.map((r) => {
            const total = (
              r.firstExam +
              r.midExam +
              r.thirdExam +
              r.finalExam +
              r.activities
            ).toFixed(1);

            return {
              ...r,
              attendanceRate: 0,
              total,
              grade: getGradeLetter(parseFloat(total)),
              lastUpdatedBy: r.updatedBy || "Unknown",
              createdAt: r.createdAt || new Date().toISOString(),
              updatedAt: r.updatedAt || new Date().toISOString(),
              createdBy: r.createdBy || "System",
            };
          })
        );
      } finally {
        // Simulate minimum loading time for better UX
        setTimeout(() => setIsLoading(false), 800);
      }
    };

    fetchAttendanceAndMerge();
  }, [selectedYear, user?.studentProfile?._id]);

  // Filter results based on selections
  const filteredResults = displayResults.filter((result) => {
    const matchesSubject =
      selectedSubject === "all" || result.subject?.name === selectedSubject;

    const matchesSearch =
      searchTerm === "" ||
      result.subject?.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSubject && matchesSearch;
  });

  // Function to show metadata details
  const showMetaData = (result) => {
    setMetaData({
      subject: result.subject?.name,
      createdBy: result.createdBy,
      createdAt: format(new Date(result.createdAt), "MMM dd, yyyy HH:mm"),
      lastUpdatedBy: result.lastUpdatedBy,
      updatedAt: format(new Date(result.updatedAt), "MMM dd, yyyy HH:mm"),
      academicYear: result.academicYear,
      total: result.total,
      grade: result.grade,
      attendance: `${result.attendanceRate.toFixed(1)}%`,
      breakdown: {
        firstExam: result.firstExam,
        midExam: result.midExam,
        thirdExam: result.thirdExam,
        finalExam: result.finalExam,
        activities: result.activities,
      },
    });
  };

  // Export to Excel function
  const exportToExcel = () => {
    setIsExporting(true);

    try {
      // Prepare data for export
      const exportData = filteredResults.map((result) => ({
        Subject: result.subject?.name || "N/A",
        "Academic Year": result.academicYear,
        "First Exam": result.firstExam,
        "Mid Exam": result.midExam,
        "Third Exam": result.thirdExam,
        "Final Exam": result.finalExam,
        Activities: result.activities,
        Attendance: `${result.attendanceRate.toFixed(1)}%`,
        Total: result.total,
        Grade: result.grade,
      }));

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Academic Results");

      // Generate file name
      const studentName = user?.name
        ? user.name.replace(/\s+/g, "_")
        : "Student";
      const fileName = `${studentName}_Grades_${
        selectedYear || "All_Years"
      }.xlsx`;

      // Export file
      XLSX.writeFile(workbook, fileName);
      toast.success("Report downloaded successfully!");
    } catch (error) {
      toast.error("Failed to export report");
      console.error("Export error:", error);
    } finally {
      // Simulate minimum export time for better UX
      setTimeout(() => setIsExporting(false), 500);
    }
  };
  if (userLoading || !showContent) return <GlobalLoader />;
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            My Academic Performance
          </h1>
          <p className="text-gray-600 mt-1">
            View your grades and attendance records
          </p>
        </div>

        <Button
          variant="outline"
          className="hidden md:flex"
          onClick={exportToExcel}
          disabled={isExporting || filteredResults.length === 0}
        >
          {isExporting ? (
            <ClipLoader size={16} color="#3B82F6" className="mr-2" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          )}
          Download Report
        </Button>
      </div>

      {/* Filters Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Academic Year
          </label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="bg-gray-50">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {academicYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject
          </label>
          <Select
            value={selectedSubject}
            onValueChange={setSelectedSubject}
            disabled={!selectedYear}
          >
            <SelectTrigger className="bg-gray-50">
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {allSubjects.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Subjects
          </label>
          <Input
            placeholder="Type to search subjects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-50"
          />
        </div>
      </div>

      {/* Stats Summary */}
      {filteredResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-700">Average Grade</p>
            <p className="text-2xl font-bold text-blue-900">
              {(
                filteredResults.reduce((sum, result) => {
                  const total = result.total;
                  return sum + parseFloat(total);
                }, 0) / filteredResults.length
              ).toFixed(1)}
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <p className="text-sm text-green-700">Average Attendance</p>
            <p className="text-2xl font-bold text-green-900">
              {(
                filteredResults.reduce(
                  (sum, result) => sum + result.attendanceRate,
                  0
                ) / filteredResults.length
              ).toFixed(1)}
              %
            </p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <p className="text-sm text-purple-700">Subjects</p>
            <p className="text-2xl font-bold text-purple-900">
              {new Set(filteredResults.map((r) => r.subject?.name)).size}
            </p>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
            <p className="text-sm text-amber-700">Highest Grade</p>
            <p className="text-2xl font-bold text-amber-900">
              {Math.max(
                ...filteredResults.map((result) => parseFloat(result.total))
              ).toFixed(1)}
            </p>
          </div>
        </div>
      )}

      {/* Results Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl shadow-sm border">
          <ClipLoader size={40} color="#3B82F6" />
          <p className="mt-4 text-gray-600">Loading your academic records...</p>
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
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
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No records found
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {allResults.length === 0
              ? "You don't have any grade records yet"
              : "Try changing your filters to see results"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="p-4 text-center font-medium text-gray-500 uppercase tracking-wider">
                    Year
                  </th>
                  <th className="p-4 text-center font-medium text-gray-500 uppercase tracking-wider">
                    First Exam
                  </th>
                  <th className="p-4 text-center font-medium text-gray-500 uppercase tracking-wider">
                    Mid Exam
                  </th>
                  <th className="p-4 text-center font-medium text-gray-500 uppercase tracking-wider">
                    Third Exam
                  </th>
                  <th className="p-4 text-center font-medium text-gray-500 uppercase tracking-wider">
                    Final Exam
                  </th>
                  <th className="p-4 text-center font-medium text-gray-500 uppercase tracking-wider">
                    Activities
                  </th>
                  <th className="p-4 text-center font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center justify-center">
                      <span>Attendance</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 ml-1 text-blue-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </th>
                  <th className="p-4 text-center font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="p-4 text-center font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="p-4 text-center font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredResults.map((result) => {
                  return (
                    <tr
                      key={result._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4 font-medium text-gray-900">
                        {result.subject?.name || "Unknown Subject"}
                      </td>
                      <td className="p-4 text-center text-gray-600">
                        {result.academicYear}
                      </td>
                      <td className="p-4 text-center text-gray-600">
                        {result.firstExam.toFixed(1)}
                      </td>
                      <td className="p-4 text-center text-gray-600">
                        {result.midExam.toFixed(1)}
                      </td>
                      <td className="p-4 text-center text-gray-600">
                        {result.thirdExam.toFixed(1)}
                      </td>
                      <td className="p-4 text-center text-gray-600">
                        {result.finalExam.toFixed(1)}
                      </td>
                      <td className="p-4 text-center text-gray-600">
                        {result.activities.toFixed(1)}
                      </td>
                      <td className="p-4 text-center">
                        <div
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            result.attendanceRate >= 90
                              ? "bg-green-100 text-green-800"
                              : result.attendanceRate >= 75
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {result.attendanceRate.toFixed(1)}%
                        </div>
                      </td>
                      <td className="p-4 text-center font-semibold">
                        <div
                          className={`font-bold ${
                            parseFloat(result.total) >= 90
                              ? "text-green-600"
                              : parseFloat(result.total) >= 70
                              ? "text-blue-600"
                              : "text-red-600"
                          }`}
                        >
                          {result.total}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div
                          className={`text-lg font-bold ${
                            result.grade.includes("A")
                              ? "text-green-600"
                              : result.grade.includes("B")
                              ? "text-blue-600"
                              : result.grade.includes("C")
                              ? "text-yellow-600"
                              : result.grade.includes("D")
                              ? "text-orange-600"
                              : "text-red-600"
                          }`}
                        >
                          {result.grade}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => showMetaData(result)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Enhanced Metadata Dialog */}
      {metaData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Grade Details</h3>
              <button
                onClick={() => setMetaData(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Subject</p>
                  <p className="font-medium">{metaData.subject}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Academic Year</p>
                  <p className="font-medium">{metaData.academicYear}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Grade</p>
                  <p className=" text-xl font-bold text-blue-600">
                    {metaData.total}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Final Grade</p>
                  <p
                    className={`font-medium text-xl  ${
                      metaData.grade.includes("A")
                        ? "text-green-600"
                        : metaData.grade.includes("B")
                        ? "text-blue-600"
                        : metaData.grade.includes("C")
                        ? "text-yellow-600"
                        : metaData.grade.includes("D")
                        ? "text-orange-600"
                        : "text-red-600"
                    }`}
                  >
                    {metaData.grade}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Attendance</p>
                <p className="font-medium">{metaData.attendance}</p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-500 mb-2">Grade Breakdown</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-xs text-gray-500">First Exam</p>
                    <p className="font-medium">
                      {metaData.breakdown.firstExam}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-xs text-gray-500">Mid Exam</p>
                    <p className="font-medium">{metaData.breakdown.midExam}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-xs text-gray-500">Third Exam</p>
                    <p className="font-medium">
                      {metaData.breakdown.thirdExam}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-xs text-gray-500">Final Exam</p>
                    <p className="font-medium">
                      {metaData.breakdown.finalExam}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-xs text-gray-500">Activities</p>
                    <p className="font-medium">
                      {metaData.breakdown.activities}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-500 mb-2">Record Information</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Created By</p>
                    <p className="font-medium">{metaData.createdBy}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Created At</p>
                    <p className="font-medium">{metaData.createdAt}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Last Updated By</p>
                    <p className="font-medium">{metaData.lastUpdatedBy}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Updated At</p>
                    <p className="font-medium">{metaData.updatedAt}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Button onClick={() => setMetaData(null)} className="w-full">
                Close Details
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Download Button */}
      <div className="mt-6 md:hidden">
        <Button
          className="w-full"
          onClick={exportToExcel}
          disabled={isExporting || filteredResults.length === 0}
        >
          {isExporting ? (
            <ClipLoader size={16} color="#ffffff" className="mr-2" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          )}
          Download Report
        </Button>
      </div>
    </div>
  );
};

export default StudentGrade;
