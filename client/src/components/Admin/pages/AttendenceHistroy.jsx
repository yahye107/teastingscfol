import React, { useEffect, useState, useMemo } from "react";
import {
  callGetAllClassesApi,
  callGetStudentsByClassroomApi,
  callGetAttendanceRatesForClassApi,
  callGetAttendanceRatesBySubjectApi,
  callUpdateAttendanceApi,
  callBulkUpdateAttendanceApi,
  callGetStudentAttendanceApi,
  callGetAllsubjectssApi,
} from "@/service/service";
import { ClipLoader } from "react-spinners";
import { toast } from "sonner";

const getStatusClasses = (status) => {
  switch (status) {
    case "Present":
      return "bg-green-200 text-green-800";
    case "Absent":
      return "bg-red-200 text-red-800";
    case "Late":
      return "bg-yellow-200 text-yellow-800";
    case "Excused":
      return "bg-blue-200 text-blue-800";
    default:
      return "bg-gray-200 text-gray-800";
  }
};

const formatDisplayDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

// Reusable Searchable Select Component
const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder,
  className = "",
  disabled = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={`relative ${className}`}>
      <div
        className={`flex items-center justify-between p-2 border rounded cursor-pointer ${
          disabled ? "bg-gray-100" : ""
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span>▼</span>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
          <div className="sticky top-0 bg-white p-2 border-b">
            <input
              type="text"
              placeholder="Search..."
              className="w-full p-1 border rounded"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          <ul>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <li
                  key={option.value}
                  className={`p-2 hover:bg-blue-100 cursor-pointer ${
                    value === option.value ? "bg-blue-50" : ""
                  }`}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  {option.label}
                </li>
              ))
            ) : (
              <li className="p-2 text-gray-500 text-center">
                No options found
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

const AdminAttendanceManager = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentHistory, setStudentHistory] = useState([]);
  const [filters, setFilters] = useState({
    classId: "",
    subjectId: "",
    academicYear: "All",
  });
  const [loading, setLoading] = useState({
    main: false,
    history: false,
  });
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Generate academic years from 1900 to 2300 with "All" option
  const academicYears = useMemo(() => {
    const years = [{ value: "All", label: "All Academic Years" }];
    for (let year = 1900; year <= 2300; year++) {
      years.push({
        value: `${year}-${year + 1}`,
        label: `${year}-${year + 1}`,
      });
    }
    return years;
  }, []);

  // Format classes for searchable select
  const classOptions = useMemo(() => {
    return classes.map((cls) => ({
      value: cls._id,
      label: `Grade ${cls.grade} - ${cls.section}`,
    }));
  }, [classes]);

  // Format subjects for searchable select
  const subjectOptions = useMemo(() => {
    return subjects.map((sub) => ({
      value: sub._id,
      label: sub.name,
    }));
  }, [subjects]);

  // Calculate attendance summary
  const attendanceSummary = useMemo(() => {
    const summary = {
      Present: 0,
      Absent: 0,
      Late: 0,
      Excused: 0,
      total: studentHistory.length,
    };

    studentHistory.forEach((record) => {
      if (summary.hasOwnProperty(record.status)) {
        summary[record.status]++;
      }
    });

    return summary;
  }, [studentHistory]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [classesRes, subjectsRes] = await Promise.all([
          callGetAllClassesApi(),
          callGetAllsubjectssApi(),
        ]);
        setClasses(classesRes.classrooms || []);
        setSubjects(subjectsRes.subjects || []);
      } catch (error) {
        toast.error("Failed to load initial data");
      }
    };
    fetchInitialData();
  }, []);

  const loadAttendanceData = async () => {
    if (!filters.classId) return;
    setLoading((prev) => ({ ...prev, main: true }));
    try {
      const studentsRes = await callGetStudentsByClassroomApi(filters.classId);
      const rawStudents = studentsRes.students || studentsRes.data || [];

      const attendanceRes = filters.subjectId
        ? await callGetAttendanceRatesBySubjectApi(
            filters.classId,
            filters.subjectId,
            filters.academicYear === "All" ? null : filters.academicYear
          )
        : await callGetAttendanceRatesForClassApi(
            filters.classId,
            filters.academicYear === "All" ? null : filters.academicYear
          );

      const mergedData = rawStudents.map((student) => {
        const attendance =
          (attendanceRes.data || []).find((a) => a.studentId === student._id) ||
          {};
        return {
          studentId: student._id,
          studentName: student.user?.fullName || "Unknown Student",
          attendanceRate: attendance.attendanceRate || "N/A",
          lastUpdated: attendance.lastUpdated || new Date().toISOString(),
          currentStatus: attendance.currentStatus || "Absent",
          latestAttendanceId: attendance.latestAttendanceId || null,
        };
      });

      setAttendanceData(
        mergedData.sort((a, b) =>
          a.attendanceRate === "N/A"
            ? 1
            : b.attendanceRate === "N/A"
              ? -1
              : parseFloat(b.attendanceRate) - parseFloat(a.attendanceRate)
        )
      );
    } catch (error) {
      toast.error("Failed to load attendance data");
    } finally {
      setLoading((prev) => ({ ...prev, main: false }));
    }
  };

  useEffect(() => {
    loadAttendanceData();
  }, [
    filters.classId,
    filters.subjectId,
    filters.academicYear,
    refreshTrigger,
  ]);

  const loadStudentHistory = async () => {
    if (!selectedStudent) return;
    setLoading((prev) => ({ ...prev, history: true }));
    try {
      const historyRes = await callGetStudentAttendanceApi(
        selectedStudent,
        null,
        null,
        filters.academicYear === "All" ? null : filters.academicYear
      );
      setStudentHistory(historyRes?.data?.result || []);
    } catch (error) {
      toast.error("Failed to load student history");
    } finally {
      setLoading((prev) => ({ ...prev, history: false }));
    }
  };

  useEffect(() => {
    loadStudentHistory();
  }, [selectedStudent, filters.academicYear, refreshTrigger]);

  const handleStudentHistory = async (studentId) => {
    setSelectedStudent(studentId);
    setHistorySearchQuery("");
  };

  const updateAttendanceStatus = async (attendanceId, newStatus) => {
    try {
      // Optimistic update for history
      setStudentHistory((prev) =>
        prev.map((record) =>
          record._id === attendanceId
            ? { ...record, status: newStatus }
            : record
        )
      );

      // Optimistic update for main list
      setAttendanceData((prev) =>
        prev.map((student) => {
          if (student.latestAttendanceId === attendanceId) {
            return { ...student, currentStatus: newStatus };
          }
          return student;
        })
      );

      await callUpdateAttendanceApi(attendanceId, newStatus);
      toast.success("Attendance updated");
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      toast.error("Failed to update attendance");
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  const handleBulkUpdate = async (newStatus) => {
    if (!selectedRecords.length) {
      toast.warn("No records selected");
      return;
    }
    try {
      await callBulkUpdateAttendanceApi(
        selectedRecords.map((id) => ({ attendanceId: id, newStatus }))
      );
      toast.success("Bulk update successful");
      setSelectedRecords([]);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      toast.error("Bulk update failed");
    }
  };

  const exportData = (data, fields, filename) => {
    const csvContent = [
      fields.join(","),
      ...data.map((item) =>
        fields
          .map((field) => `"${String(item[field]).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAttendanceData = attendanceData.filter((student) =>
    student.studentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Enhanced history search
  const filteredStudentHistory = useMemo(() => {
    if (!historySearchQuery) return studentHistory;

    const query = historySearchQuery.toLowerCase();
    return studentHistory.filter((record) => {
      return (
        formatDisplayDate(record.date).toLowerCase().includes(query) ||
        (record.subject || "").toLowerCase().includes(query) ||
        (record.markedBy || "").toLowerCase().includes(query) ||
        (record.academicYear || "").toLowerCase().includes(query)
      );
    });
  }, [studentHistory, historySearchQuery]);

  // Get selected student name
  const selectedStudentName = useMemo(() => {
    if (!selectedStudent) return "";
    const student = attendanceData.find((s) => s.studentId === selectedStudent);
    return student ? student.studentName : "Unknown Student";
  }, [selectedStudent, attendanceData]);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Attendance Management</h1>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6 grid grid-cols-1 md:grid-cols-6 gap-4">
        {/* Class Select */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Class
          </label>
          <SearchableSelect
            options={classOptions}
            value={filters.classId}
            onChange={(value) =>
              setFilters((prev) => ({ ...prev, classId: value }))
            }
            placeholder="Select Class"
          />
        </div>

        {/* Subject Select */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject
          </label>
          <SearchableSelect
            options={subjectOptions}
            value={filters.subjectId}
            onChange={(value) =>
              setFilters((prev) => ({ ...prev, subjectId: value }))
            }
            placeholder="All Subjects"
            disabled={!filters.classId}
          />
        </div>

        {/* Academic Year Select */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Academic Year
          </label>
          <SearchableSelect
            options={academicYears}
            value={filters.academicYear}
            onChange={(value) =>
              setFilters((prev) => ({ ...prev, academicYear: value }))
            }
            placeholder="Select Year"
          />
        </div>

        {/* Student Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Students
          </label>
          <input
            type="text"
            placeholder="Type student name..."
            className="w-full p-2 border rounded"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Export Button */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 invisible">
            Export
          </label>
          <button
            className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 whitespace-nowrap"
            onClick={() =>
              exportData(
                filteredAttendanceData,
                ["studentName", "attendanceRate", "lastUpdated"],
                "attendance_summary.csv"
              )
            }
          >
            Export Summary
          </button>
        </div>

        {/* Clear Filters Button */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 invisible">
            Clear
          </label>
          <button
            className="w-full p-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 whitespace-nowrap"
            onClick={() => {
              setFilters({
                classId: "",
                subjectId: "",
                academicYear: "All",
              });
              setSearchQuery("");
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Main Attendance Table */}
      {loading.main ? (
        <div className="text-center py-8">
          <ClipLoader size={40} color="#3B82F6" />
          <p className="mt-2 text-gray-500">Loading attendance data...</p>
        </div>
      ) : filteredAttendanceData.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md overflow-x-auto mb-8">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">Student</th>
                <th className="px-6 py-3 text-left">Attendance Rate</th>
                <th className="px-6 py-3 text-left">Last Updated</th>
                <th className="px-6 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendanceData.map((student) => (
                <tr
                  key={student.studentId}
                  className="border-t hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleStudentHistory(student.studentId)}
                >
                  <td className="px-4 py-3">{student.studentName}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{
                            width: `${
                              student.attendanceRate === "N/A"
                                ? 0
                                : student.attendanceRate
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm md:text-base">
                        {student.attendanceRate}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm md:text-base">
                    {formatDisplayDate(student.lastUpdated)}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={student.currentStatus}
                      onChange={(e) =>
                        updateAttendanceStatus(
                          student.latestAttendanceId,
                          e.target.value
                        )
                      }
                      className={`p-1 rounded ${getStatusClasses(
                        student.currentStatus
                      )}`}
                    >
                      {["Present", "Absent", "Late", "Excused"].map(
                        (status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        )
                      )}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-4">
          {filters.classId
            ? "No attendance data available for selected filters"
            : "Please select a class to view attendance data"}
        </div>
      )}

      {/* Student History Panel */}
      {selectedStudent && (
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
            <div>
              <h2 className="text-xl font-semibold">Attendance History</h2>
              <p className="text-gray-600">Student: {selectedStudentName}</p>
            </div>

            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              <input
                type="text"
                placeholder="Search history (date, subject, marked by, year)..."
                className="p-2 border rounded text-sm md:text-base"
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
              />
              <button
                className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm md:text-base flex-1"
                onClick={() =>
                  exportData(
                    filteredStudentHistory,
                    ["date", "subject", "status", "markedBy", "academicYear"],
                    "attendance_history.csv"
                  )
                }
              >
                Export History
              </button>
              <button
                className="p-2 text-gray-500 hover:text-gray-700 text-sm md:text-base"
                onClick={() => setSelectedStudent(null)}
              >
                Close
              </button>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 md:grid-cols-5 gap-2">
            <div className="bg-green-100 p-3 rounded-lg text-center">
              <div className="text-lg font-bold">
                {attendanceSummary.Present}
              </div>
              <div className="text-green-800">Present</div>
            </div>
            <div className="bg-red-100 p-3 rounded-lg text-center">
              <div className="text-lg font-bold">
                {attendanceSummary.Absent}
              </div>
              <div className="text-red-800">Absent</div>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg text-center">
              <div className="text-lg font-bold">{attendanceSummary.Late}</div>
              <div className="text-yellow-800">Late</div>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg text-center">
              <div className="text-lg font-bold">
                {attendanceSummary.Excused}
              </div>
              <div className="text-blue-800">Excused</div>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg text-center md:col-span-1">
              <div className="text-lg font-bold">{attendanceSummary.total}</div>
              <div className="text-gray-800">Total Records</div>
            </div>
          </div>

          <div className="mb-4">
            <span className="font-medium">Academic Year:</span>{" "}
            {filters.academicYear === "All"
              ? "All Academic Years"
              : filters.academicYear}
          </div>

          {loading.history ? (
            <div className="text-center py-4">
              <ClipLoader size={30} color="#3B82F6" />
              <p className="mt-2 text-gray-500">
                Loading attendance history...
              </p>
            </div>
          ) : filteredStudentHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">
                      <input
                        type="checkbox"
                        onChange={(e) =>
                          setSelectedRecords(
                            e.target.checked
                              ? filteredStudentHistory.map((r) => r._id)
                              : []
                          )
                        }
                      />
                    </th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Subject</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Marked By</th>
                    <th className="px-4 py-2 text-left">Academic Year</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudentHistory.map((record) => (
                    <tr key={record._id} className="border-t hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedRecords.includes(record._id)}
                          onChange={(e) => {
                            const newSelection = e.target.checked
                              ? [...selectedRecords, record._id]
                              : selectedRecords.filter(
                                  (id) => id !== record._id
                                );
                            setSelectedRecords(newSelection);
                          }}
                        />
                      </td>
                      <td className="px-6 py-4">
                        {formatDisplayDate(record.date)}
                      </td>
                      <td className="px-6 py-4">{record.subject}</td>
                      <td className="px-6 py-4">
                        <select
                          value={record.status}
                          onChange={(e) =>
                            updateAttendanceStatus(record._id, e.target.value)
                          }
                          className={`p-1 rounded ${getStatusClasses(
                            record.status
                          )}`}
                        >
                          {["Present", "Absent", "Late", "Excused"].map(
                            (status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            )
                          )}
                        </select>
                      </td>
                      <td className="px-6 py-4">{record.markedBy}</td>
                      <td className="px-6 py-4">
                        {record.academicYear || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {selectedRecords.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 items-center">
                  <span className="font-medium">
                    {selectedRecords.length} records selected
                  </span>
                  <button
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                    onClick={() => handleBulkUpdate("Present")}
                  >
                    Mark Present
                  </button>
                  <button
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    onClick={() => handleBulkUpdate("Absent")}
                  >
                    Mark Absent
                  </button>
                  <button
                    className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    onClick={() => handleBulkUpdate("Late")}
                  >
                    Mark Late
                  </button>
                  <button
                    className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
                    onClick={() => handleBulkUpdate("Excused")}
                  >
                    Mark Excused
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              {historySearchQuery
                ? "No records match your search criteria"
                : "No attendance records found for this student"}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminAttendanceManager;
