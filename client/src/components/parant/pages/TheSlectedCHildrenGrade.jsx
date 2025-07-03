import React, { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useUser } from "@/useContaxt/UseContext";
import { ChevronLeft, Award, Download, Search, Filter } from "lucide-react";
import GlobalLoader from "@/components/common/GlobalLoader";
import { useEffect } from "react";

// Helper function for detailed grade letters
function getDetailedGradeLetter(total) {
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
}

const TheSelectedChildrenGrade = () => {
  const { childId } = useParams();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const child = useMemo(
    () => user?.parentProfile?.children?.find((c) => c.id === childId),
    [user, childId]
  );

  const [academicYearFilter, setAcademicYearFilter] = useState("all");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "subject",
    direction: "asc",
  });

  const results = child?.Result || [];

  // Get unique academic years
  const academicYears = useMemo(
    () => [...new Set(results.map((r) => r.academicYear))].sort().reverse(),
    [results]
  );

  // Sorting functionality
  const sortedResults = useMemo(() => {
    if (!sortConfig.key) return results;

    return [...results].sort((a, b) => {
      const aValue =
        sortConfig.key === "subject" ? a.subject?.name : a[sortConfig.key];
      const bValue =
        sortConfig.key === "subject" ? b.subject?.name : b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [results, sortConfig]);

  // Filtering functionality
  const filteredResults = useMemo(
    () =>
      sortedResults
        .filter(
          (r) =>
            academicYearFilter === "all" ||
            r.academicYear === academicYearFilter
        )
        .filter((r) =>
          r.subject?.name.toLowerCase().includes(subjectSearch.toLowerCase())
        ),
    [sortedResults, academicYearFilter, subjectSearch]
  );

  useEffect(() => {
    if (results.length > 0) {
      // Find the latest year based on createdAt
      const sortedByDate = [...results].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setAcademicYearFilter(sortedByDate[0].academicYear);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [results]);

  // Enhanced grade calculations
  const gradeStats = useMemo(() => {
    if (filteredResults.length === 0) return null;

    // Calculate overall average from subject totals
    const subjectTotals = filteredResults.map((r) => r.total || 0);
    const totalSum = subjectTotals.reduce((a, b) => a + b, 0);
    const average = Math.round(totalSum / filteredResults.length);

    // Grade distribution based on base letters
    const getBaseGradeLetter = (total) => {
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

    const distribution = filteredResults.reduce((acc, r) => {
      const baseLetter = getBaseGradeLetter(r.total);
      acc[baseLetter] = (acc[baseLetter] || 0) + 1;
      return acc;
    }, {});

    // Find strongest/weakest subjects
    const sortedByTotal = [...filteredResults].sort(
      (a, b) => b.total - a.total
    );
    const strongest = sortedByTotal[0];
    const weakest = sortedByTotal[sortedByTotal.length - 1];

    return {
      average,
      letter: getDetailedGradeLetter(average),
      distribution,
      strongestSubject: strongest?.subject?.name,
      strongestScore: strongest?.total,
      weakestSubject: weakest?.subject?.name,
      weakestScore: weakest?.total,
    };
  }, [filteredResults]);

  // Handle sorting
  const requestSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // CSV download handler
  const handleDownload = () => {
    const header = [
      "Subject",
      "Academic Year",
      "First Exam",
      "Mid Exam",
      "Third Exam",
      "Final Exam",
      "Activities",
      "Attendance",
      "Total",
      "Grade",
    ];

    const rows = filteredResults.map((r) => [
      r.subject?.name || "N/A",
      r.academicYear,
      r.firstExam ?? "-",
      r.midExam ?? "-",
      r.thirdExam ?? "-",
      r.finalExam ?? "-",
      r.activities ?? "-",
      `${r.attendanceRate ?? 0}%`,
      `${r.total ?? 0}%`,
      getDetailedGradeLetter(r.total),
    ]);

    const csvContent = [
      header.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${child.name}_Grades_Report.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!child) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <Award className="mx-auto h-12 w-12 text-indigo-500 mb-3" />
        <h2 className="text-xl font-bold">Child Not Found</h2>
        <p className="text-gray-500 mt-1">
          We couldn't locate the requested child in your profile.
        </p>
      </div>
    );
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (loading || !showContent) {
    return <GlobalLoader />;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <Link
        to="/parent/dashboard/MyChildrenGrade"
        className="flex items-center text-indigo-600 hover:text-indigo-800 transition mb-6"
      >
        <ChevronLeft className="h-5 w-5 mr-1" />
        Back to Children
      </Link>

      {/* Header Card */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
              {child.name}'s Academic Report
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Class: {child.class?.name}
              {child.class?.section && ` • Section ${child.class.section}`}
            </p>

            {gradeStats && (
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <div className="flex items-center">
                  <span className="text-gray-600 dark:text-gray-300 mr-2">
                    Average:
                  </span>
                  <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {gradeStats.average}%
                  </span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${
                      gradeStats.letter.startsWith("A")
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                        : gradeStats.letter.startsWith("B")
                        ? "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300"
                        : gradeStats.letter.startsWith("C")
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                        : gradeStats.letter.startsWith("D")
                        ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    }`}
                  >
                    {gradeStats.letter}
                  </span>
                </div>

                <div className="hidden sm:flex items-center">
                  <span className="text-gray-600 dark:text-gray-300 mr-2">
                    Strongest:
                  </span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {gradeStats.strongestSubject} ({gradeStats.strongestScore}%)
                  </span>
                </div>

                <div className="hidden sm:flex items-center">
                  <span className="text-gray-600 dark:text-gray-300 mr-2">
                    Needs Improvement:
                  </span>
                  <span className="font-medium text-amber-600 dark:text-amber-400">
                    {gradeStats.weakestSubject} ({gradeStats.weakestScore}%)
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleDownload}
            className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition shadow-md hover:shadow-lg"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow border border-gray-100 dark:border-gray-700 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search subjects..."
            value={subjectSearch}
            onChange={(e) => setSubjectSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 dark:bg-gray-750 dark:text-white"
          />
        </div>

        <div className="flex items-center">
          <div className="mr-3 text-gray-500 dark:text-gray-400">
            <Filter className="h-5 w-5" />
          </div>
          <select
            value={academicYearFilter}
            onChange={(e) => setAcademicYearFilter(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 dark:bg-gray-750 dark:text-white"
          >
            <option value="all">All Academic Years</option>
            {academicYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grade Distribution */}
      {gradeStats && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-100 dark:border-gray-700 p-5 mb-6">
          <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-3">
            Grade Distribution
          </h3>

          {/* Totals Info */}
          <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold text-lg">
            Subjects: {filteredResults.length} | Total Marks:{" "}
            {filteredResults.reduce((acc, curr) => acc + (curr.total || 0), 0)}
          </div>

          <div className="flex flex-wrap gap-4">
            {Object.entries(gradeStats.distribution).map(([grade, count]) => (
              <div key={grade} className="flex items-center">
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    grade === "A"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                      : grade === "B"
                      ? "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300"
                      : grade === "C"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                      : grade === "D"
                      ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                  }`}
                >
                  {grade}
                </span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  {count} {count === 1 ? "subject" : "subjects"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grade Table */}
      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-750 text-gray-600 dark:text-gray-400">
            <tr>
              <th
                className="px-5 py-4 text-left font-semibold cursor-pointer"
                onClick={() => requestSort("subject")}
              >
                <div className="flex items-center">
                  Subject
                  {sortConfig.key === "subject" && (
                    <ChevronLeft
                      className={`ml-1 h-4 w-4 transition-transform ${
                        sortConfig.direction === "asc"
                          ? "rotate-90"
                          : "-rotate-90"
                      }`}
                    />
                  )}
                </div>
              </th>
              <th className="px-4 py-4 text-center">Academic Year</th>
              <th className="px-4 py-4 text-center">First</th>
              <th className="px-4 py-4 text-center">Mid</th>
              <th className="px-4 py-4 text-center">Third</th>
              <th className="px-4 py-4 text-center">Final</th>
              <th className="px-4 py-4 text-center">Activities</th>
              <th className="px-4 py-4 text-center">Attendance</th>
              <th
                className="px-4 py-4 text-center font-semibold cursor-pointer"
                onClick={() => requestSort("total")}
              >
                <div className="flex items-center justify-center">
                  Total
                  {sortConfig.key === "total" && (
                    <ChevronLeft
                      className={`ml-1 h-4 w-4 transition-transform ${
                        sortConfig.direction === "asc"
                          ? "rotate-90"
                          : "-rotate-90"
                      }`}
                    />
                  )}
                </div>
              </th>
              <th className="px-4 py-4 text-center">Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredResults.length > 0 ? (
              filteredResults.map((r) => {
                const getGradeColor = (total) => {
                  if (total >= 90) return "text-green-600 dark:text-green-400";
                  if (total >= 80) return "text-teal-600 dark:text-teal-400";
                  if (total >= 70)
                    return "text-yellow-600 dark:text-yellow-400";
                  if (total >= 60)
                    return "text-orange-600 dark:text-orange-400";
                  return "text-red-600 dark:text-red-400";
                };

                return (
                  <tr
                    key={r._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-750/50 transition"
                  >
                    <td className="px-5 py-4 font-medium">
                      {r.subject?.name || "N/A"}
                    </td>
                    <td className="px-4 py-4 text-center text-gray-500">
                      {r.academicYear}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {r.firstExam ?? "-"}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {r.midExam ?? "-"}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {r.thirdExam ?? "-"}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {r.finalExam ?? "-"}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {r.activities ?? "-"}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {r.attendanceRate ?? 0}%
                    </td>
                    <td
                      className={`px-4 py-4 text-center font-bold ${getGradeColor(
                        r.total
                      )}`}
                    >
                      {r.total ?? 0}
                    </td>
                    <td
                      className={`px-4 py-4 text-center font-bold ${getGradeColor(
                        r.total
                      )}`}
                    >
                      {getDetailedGradeLetter(r.total)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="10"
                  className="px-5 py-8 text-center text-gray-500"
                >
                  No matching records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TheSelectedChildrenGrade;
