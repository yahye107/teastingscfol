import React, { useEffect, useState } from "react";
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
import { toast } from "react-toastify";

const getStatusClasses = (status) => {
  switch (status) {
    case "Present":
      return "bg-green-200";
    case "Absent":
      return "bg-red-200";
    case "Late":
      return "bg-yellow-200";
    case "Excused":
      return "bg-blue-200";
    default:
      return "bg-gray-200";
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

const AdminAttendanceManager = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentHistory, setStudentHistory] = useState([]);
  const [filters, setFilters] = useState({
    classId: "",
    subjectId: "",
  });
  const [loading, setLoading] = useState({
    main: false,
    history: false,
  });
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateSearchQuery, setDateSearchQuery] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
            filters.subjectId
          )
        : await callGetAttendanceRatesForClassApi(filters.classId);

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
  }, [filters.classId, filters.subjectId, refreshTrigger]);

  const loadStudentHistory = async () => {
    if (!selectedStudent) return;
    setLoading((prev) => ({ ...prev, history: true }));
    try {
      const historyRes = await callGetStudentAttendanceApi(selectedStudent);
      setStudentHistory(historyRes?.data?.result || []);
    } catch (error) {
      toast.error("Failed to load student history");
    } finally {
      setLoading((prev) => ({ ...prev, history: false }));
    }
  };

  useEffect(() => {
    loadStudentHistory();
  }, [selectedStudent, refreshTrigger]);

  const handleStudentHistory = async (studentId) => {
    setSelectedStudent(studentId);
    setDateSearchQuery("");
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

  const filteredStudentHistory = studentHistory.filter((record) => {
    const formattedDate = formatDisplayDate(record.date);
    return formattedDate.includes(dateSearchQuery);
  });

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Attendance Management</h1>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        <select
          className="p-2 border rounded md:col-span-1"
          value={filters.classId}
          onChange={(e) => setFilters({ ...filters, classId: e.target.value })}
        >
          <option value="">Select Class</option>
          {classes.map((cls) => (
            <option key={cls._id} value={cls._id}>
              Grade {cls.grade} - {cls.section}
            </option>
          ))}
        </select>

        <select
          className="p-2 border rounded md:col-span-1"
          value={filters.subjectId}
          onChange={(e) =>
            setFilters({ ...filters, subjectId: e.target.value })
          }
        >
          <option value="">All Subjects</option>
          {subjects.map((sub) => (
            <option key={sub._id} value={sub._id}>
              {sub.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search students"
          className="p-2 border rounded md:col-span-1"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <button
          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 whitespace-nowrap md:col-span-1"
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
                {/* <th className="px-6 py-3 text-left">Status</th> */}
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
                  </td>
                  <td className="px-4 py-3 text-sm md:text-base">
                    {formatDisplayDate(student.lastUpdated)}
                  </td>
                  {/* <td className="px-6 py-4">
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
                  </td> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-4">
          No attendance data available
        </div>
      )}

      {selectedStudent && (
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
            <h2 className="text-xl font-semibold">Attendance History</h2>
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              <input
                type="text"
                placeholder="Search by date (MM/DD/YYYY)"
                className="p-2 border rounded text-sm md:text-base"
                value={dateSearchQuery}
                onChange={(e) => setDateSearchQuery(e.target.value)}
              />
              <button
                className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm md:text-base flex-1"
                onClick={() =>
                  exportData(
                    filteredStudentHistory,
                    ["date", "subject", "status", "markedBy"],
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
                  </tr>
                </thead>
                <tbody>
                  {filteredStudentHistory.map((record) => (
                    <tr key={record._id} className="border-t">
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              No records found matching your search
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminAttendanceManager;
