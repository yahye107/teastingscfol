import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import GlobalLoader from "@/components/common/GlobalLoader";
import {
  callMarkTeacherAttendanceApi,
  callGetAllTeachersApi,
} from "@/service/service";

const TeacherAttendance = () => {
  const [teachers, setTeachers] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const statuses = ["Present", "Absent", "Day Off", "Late", "Excused"];

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await callGetAllTeachersApi();
        const formatted = res.teachers.map((teacher) => ({
          teacher: teacher._id,
          name: teacher.user?.fullName,
          status: "Present",
          timeIn: "",
          timeOut: "",
          reason: "",
        }));
        setTeachers(res.teachers || []);
        setAttendanceData(formatted);
      } catch {
        toast.error("Failed to load teachers");
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  const handleChange = (index, field, value) => {
    const newData = [...attendanceData];
    newData[index][field] = value;

    // Clear time fields when status changes from Present
    if (field === "status" && value !== "Present") {
      newData[index].timeIn = "";
      newData[index].timeOut = "";
    }

    setAttendanceData(newData);
  };

  const validateEntries = () => {
    let isValid = true;
    const errors = [];

    attendanceData.forEach((entry, index) => {
      if (entry.status === "Excused" && !entry.reason.trim()) {
        errors.push(`Reason required for ${entry.name}`);
        isValid = false;
      }

      if (entry.status === "Present") {
        if (!entry.timeIn || !entry.timeOut) {
          errors.push(`Time required for ${entry.name}`);
          isValid = false;
        }
        if (entry.timeIn >= entry.timeOut) {
          errors.push(`Invalid time range for ${entry.name}`);
          isValid = false;
        }
      }
    });

    if (errors.length > 0) {
      toast.error(`Validation errors: ${errors.join(", ")}`);
    }
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateEntries()) return;

    try {
      setSubmitting(true);
      await Promise.all(
        attendanceData.map((data) => callMarkTeacherAttendanceApi(data))
      );
      toast.success("Attendance submitted successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to submit attendance");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <GlobalLoader />;

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Teacher Attendance
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {attendanceData.length} teachers registered
          </p>
        </div>
        <Link
          to="/admin/dashboard/TeacherAttendenceHist"
          className="w-full md:w-auto"
        >
          <Button variant="outline" className="w-full md:w-auto">
            View History
          </Button>
        </Link>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {attendanceData.map((entry, index) => (
          <div
            key={entry.teacher}
            className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700"
          >
            <div className="space-y-4">
              {/* Teacher Name and Status */}
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  {entry.name}
                </h3>
                <select
                  className={`ml-2 px-3 py-2 rounded-md border text-sm focus:ring-2 ${
                    entry.status === "Excused" && !entry.reason
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                  }`}
                  value={entry.status}
                  onChange={(e) =>
                    handleChange(index, "status", e.target.value)
                  }
                >
                  {statuses.map((status) => (
                    <option
                      key={status}
                      value={status}
                      className="dark:bg-gray-800"
                    >
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Inputs */}
              {(entry.status === "Present" || entry.status === "Late") && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Time In
                    </label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                      value={entry.timeIn}
                      onChange={(e) =>
                        handleChange(index, "timeIn", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Time Out
                    </label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                      value={entry.timeOut}
                      onChange={(e) =>
                        handleChange(index, "timeOut", e.target.value)
                      }
                    />
                  </div>
                </div>
              )}

              {/* Reason Input */}
              {(entry.status === "Excused" || entry.status === "Absent") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reason {entry.status === "Excused" && "*"}
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 rounded-md border text-sm focus:ring-2 ${
                      entry.status === "Excused" && !entry.reason
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                    }`}
                    value={entry.reason}
                    onChange={(e) =>
                      handleChange(index, "reason", e.target.value)
                    }
                    placeholder={
                      entry.status === "Excused"
                        ? "Required reason..."
                        : "Optional reason..."
                    }
                  />
                  {entry.status === "Excused" && !entry.reason && (
                    <p className="mt-1 text-sm text-red-600">
                      Reason is required for excused absence
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                Teacher
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                Time In
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                Time Out
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                Reason
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
            {attendanceData.map((entry, index) => (
              <tr key={entry.teacher}>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {entry.name}
                </td>
                <td className="px-4 py-3">
                  <select
                    className={`w-full px-2 py-1 rounded-md border text-sm ${
                      entry.status === "Excused" && !entry.reason
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    value={entry.status}
                    onChange={(e) =>
                      handleChange(index, "status", e.target.value)
                    }
                  >
                    {statuses.map((status) => (
                      <option
                        key={status}
                        value={status}
                        className="dark:bg-gray-800"
                      >
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="time"
                    className="w-full px-2 py-1 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600"
                    value={entry.timeIn}
                    onChange={(e) =>
                      handleChange(index, "timeIn", e.target.value)
                    }
                    disabled={
                      entry.status !== "Present" && entry.status !== "Late"
                    }
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="time"
                    className="w-full px-2 py-1 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600"
                    value={entry.timeOut}
                    onChange={(e) =>
                      handleChange(index, "timeOut", e.target.value)
                    }
                    disabled={
                      entry.status !== "Present" && entry.status !== "Late"
                    }
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    className={`w-full px-2 py-1 rounded-md border text-sm ${
                      entry.status === "Excused" && !entry.reason
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    value={entry.reason}
                    onChange={(e) =>
                      handleChange(index, "reason", e.target.value)
                    }
                    placeholder={
                      entry.status === "Excused" ? "Required..." : "Optional..."
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Submit Button */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-900 pt-4 border-t dark:border-gray-700">
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full md:w-auto md:float-right"
          size="lg"
        >
          {submitting ? (
            <>
              <span className="animate-pulse">Saving...</span>
              <span className="ml-2">⏳</span>
            </>
          ) : (
            "Save All Attendance"
          )}
        </Button>
      </div>
    </div>
  );
};

export default TeacherAttendance;
