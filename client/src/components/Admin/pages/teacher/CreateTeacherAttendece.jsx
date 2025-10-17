import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import GlobalLoader from "@/components/common/GlobalLoader";
import {
  callMarkTeacherAttendanceApi,
  callGetAllTeachersApi,
} from "@/service/service";
import SearchableSelect from "@/components/common/SearchableSelect";
import { ArrowLeft } from "lucide-react";
import ButtonLoader from "@/components/common/ButtonLoadi";

const TeacherAttendance = () => {
  const [teachers, setTeachers] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [academicYear, setAcademicYear] = useState("");
  const [submittedRecords, setSubmittedRecords] = useState(new Set());
  const navigate = useNavigate();
  const statuses = ["Present", "Absent", "Day Off", "Late"];

  // Generate academic years (current year and next 2 years)
  const getAcademicYears = () => {
    const years = [];
    for (let year = 2000; year <= 2100; year++) {
      years.push(`${year}-${year + 1}`);
    }
    return years;
  };

  const academicYears = getAcademicYears();
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
          academicYear: academicYear || academicYears[0],
        }));
        setTeachers(res.teachers || []);
        setAttendanceData(formatted);

        // Set default academic year to current year
        if (!academicYear) {
          setAcademicYear(academicYears[0]);
        }
      } catch {
        toast.error("Failed to load teachers");
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  // Update academic year for all records when academic year changes
  useEffect(() => {
    if (academicYear && attendanceData.length > 0) {
      const updatedData = attendanceData.map((record) => ({
        ...record,
        academicYear,
      }));
      setAttendanceData(updatedData);
    }
  }, [academicYear]);

  const handleChange = (index, field, value) => {
    // Check if this record was already submitted today
    const recordId = attendanceData[index].teacher;
    if (submittedRecords.has(recordId)) {
      toast.error(
        `Attendance for ${attendanceData[index].name} has already been submitted today.`
      );
      return;
    }

    const newData = [...attendanceData];
    newData[index][field] = value;

    // Clear time fields when status changes from Present/Late
    if (field === "status" && value !== "Present" && value !== "Late") {
      newData[index].timeIn = "";
      newData[index].timeOut = "";
    }

    // Clear reason for non-Excused/Absent statuses
    if (field === "status" && value !== "Excused" && value !== "Absent") {
      newData[index].reason = "";
    }

    setAttendanceData(newData);
  };

  const validateEntries = () => {
    let isValid = true;
    const errors = [];

    // Validate academic year
    if (!academicYear) {
      errors.push("Please select an academic year");
      isValid = false;
    }

    attendanceData.forEach((entry, index) => {
      const recordId = entry.teacher;

      // Skip validation for already submitted records
      if (submittedRecords.has(recordId)) {
        return;
      }

      // Validate required fields based on status
      if (entry.status === "Excused" && !entry.reason.trim()) {
        errors.push(`Reason required for ${entry.name}`);
        isValid = false;
      }

      if (entry.status === "Present" || entry.status === "Late") {
        if (!entry.timeIn || !entry.timeOut) {
          errors.push(`Both time in and time out required for ${entry.name}`);
          isValid = false;
        } else if (entry.timeIn >= entry.timeOut) {
          errors.push(
            `Invalid time range for ${entry.name} (time out must be after time in)`
          );
          isValid = false;
        }
      }

      // Validate time format
      if (entry.timeIn && !isValidTime(entry.timeIn)) {
        errors.push(`Invalid time in format for ${entry.name}`);
        isValid = false;
      }
      if (entry.timeOut && !isValidTime(entry.timeOut)) {
        errors.push(`Invalid time out format for ${entry.name}`);
        isValid = false;
      }
    });

    if (errors.length > 0) {
      toast.error(
        <div className="space-y-1">
          <div className="font-semibold">Please fix the following errors:</div>
          {errors.map((error, idx) => (
            <div key={idx}>• {error}</div>
          ))}
        </div>,
        { duration: 5000 }
      );
    }
    return isValid;
  };

  const isValidTime = (time) => {
    return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!validateEntries()) return;

    try {
      setSubmitting(true);

      const recordsToSubmit = attendanceData.filter(
        (record) => !submittedRecords.has(record.teacher)
      );

      if (recordsToSubmit.length === 0) {
        toast.info("All attendance records have already been submitted today.");
        return;
      }

      const results = await Promise.allSettled(
        recordsToSubmit.map((data) => callMarkTeacherAttendanceApi(data))
      );

      const successfulSubmissions = new Set();
      const failedSubmissions = [];

      results.forEach((result, index) => {
        const teacherName = recordsToSubmit[index].name;
        if (result.status === "fulfilled") {
          successfulSubmissions.add(recordsToSubmit[index].teacher);
          toast.success(`Attendance submitted for ${teacherName}`);
        } else {
          const errorMessage =
            result.reason?.response?.data?.message || result.reason?.message;
          if (errorMessage?.includes("Attendance already marked")) {
            successfulSubmissions.add(recordsToSubmit[index].teacher);
            toast.warning(`${teacherName}: ${errorMessage}`);
          } else {
            failedSubmissions.push({ name: teacherName, error: errorMessage });
          }
        }
      });

      setSubmittedRecords(
        (prev) => new Set([...prev, ...successfulSubmissions])
      );

      if (failedSubmissions.length > 0) {
        toast.error(
          <div className="space-y-1">
            <div className="font-semibold">
              Failed to submit for {failedSubmissions.length} teacher(s):
            </div>
            {failedSubmissions.map((sub, idx) => (
              <div key={idx}>
                • {sub.name}: {sub.error}
              </div>
            ))}
          </div>,
          { duration: 6000 }
        );
      }

      // ✅ Reset table after successful submission
      if (successfulSubmissions.size > 0) {
        const resetData = teachers.map((teacher) => ({
          teacher: teacher._id,
          name: teacher.user?.fullName,
          status: "Present",
          timeIn: "",
          timeOut: "",
          reason: "",
          academicYear: academicYear || academicYears[0],
        }));
        setAttendanceData(resetData);
        setSubmittedRecords(new Set()); // optional: clear submitted records
      }
    } catch (err) {
      toast.error(err.message || "Failed to submit attendance");
    } finally {
      setSubmitting(false);
    }
  };

  const getRecordStatus = (teacherId) => {
    return submittedRecords.has(teacherId) ? "submitted" : "pending";
  };

  if (loading) return <GlobalLoader />;

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="space-y-6">
        {/* Header Section */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 w-full items-center">
          {/* Back Button + Title */}
          <div className="flex items-center gap-3 col-span-1 sm:col-span-2">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="gap-2 text-black flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 text-black" />
              Back
            </Button>

            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Teacher Attendance
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {attendanceData.length} teachers registered
              </p>
            </div>
          </div>

          {/* Academic Year Selector */}
          <div className="space-y-1 col-span-1 flex-shrink-0 w-full sm:w-[180px]">
            <label
              htmlFor="academicYear"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
            >
              Academic Year:
            </label>
            <SearchableSelect
              options={academicYears.map((year) => ({
                label: year,
                value: year,
              }))}
              value={academicYear}
              onChange={setAcademicYear}
              placeholder="Select Year"
              className="w-full"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 col-span-1 justify-end flex-wrap">
            <Link to="/admin/dashboard/teacher/All">
              <Button
                variant="outline"
                className="w-full sm:w-auto gap-2 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                View History
              </Button>
            </Link>

            <Link to="/admin/dashboard/teacher/Attendece/todey">
              <Button className="w-full sm:w-auto gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                Today's Attendance
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Content Area */}
        {/* <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            Attendance content will be displayed here
          </div>
        </div> */}
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {attendanceData.length}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400">
            Total Teachers
          </div>
        </div>
        {/* <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {submittedRecords.size}
          </div>
          <div className="text-sm text-green-600 dark:text-green-400">
            Submitted Today
          </div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {attendanceData.length - submittedRecords.size}
          </div>
          <div className="text-sm text-yellow-600 dark:text-yellow-400">
            Pending
          </div>
        </div> */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
            {academicYear}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Academic Year
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {attendanceData.map((entry, index) => {
          const recordStatus = getRecordStatus(entry.teacher);
          const isSubmitted = recordStatus === "submitted";

          return (
            <div
              key={entry.teacher}
              className={`p-4 rounded-lg border-2 ${
                isSubmitted
                  ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              }`}
            >
              {isSubmitted && (
                <div className="flex items-center gap-2 mb-3 p-2 bg-green-100 dark:bg-green-800/30 rounded">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    Submitted
                  </span>
                </div>
              )}

              <div className="space-y-4">
                {/* Teacher Name and Status */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {entry.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Academic Year: {entry.academicYear}
                    </p>
                  </div>
                  <select
                    disabled={isSubmitted}
                    className={`ml-2 px-3 py-2 rounded-md border text-sm focus:ring-2 ${
                      entry.status === "Excused" && !entry.reason
                        ? "border-red-500 focus:ring-red-500"
                        : isSubmitted
                          ? "border-gray-300 bg-gray-100 dark:bg-gray-700 text-gray-500"
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
                        disabled={isSubmitted}
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 ${
                          isSubmitted
                            ? "border-gray-300 bg-gray-100 dark:bg-gray-700 text-gray-500"
                            : "border-gray-300 dark:border-gray-600"
                        } ${
                          !entry.timeIn && entry.status === "Present"
                            ? "border-red-500 focus:ring-red-500"
                            : ""
                        }`}
                        value={entry.timeIn}
                        onChange={(e) =>
                          handleChange(index, "timeIn", e.target.value)
                        }
                      />
                      {!entry.timeIn &&
                        entry.status === "Present" &&
                        !isSubmitted && (
                          <p className="mt-1 text-xs text-red-600">
                            Time in required
                          </p>
                        )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Time Out
                      </label>
                      <input
                        type="time"
                        disabled={isSubmitted}
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 ${
                          isSubmitted
                            ? "border-gray-300 bg-gray-100 dark:bg-gray-700 text-gray-500"
                            : "border-gray-300 dark:border-gray-600"
                        } ${
                          !entry.timeOut && entry.status === "Present"
                            ? "border-red-500 focus:ring-red-500"
                            : ""
                        }`}
                        value={entry.timeOut}
                        onChange={(e) =>
                          handleChange(index, "timeOut", e.target.value)
                        }
                      />
                      {!entry.timeOut &&
                        entry.status === "Present" &&
                        !isSubmitted && (
                          <p className="mt-1 text-xs text-red-600">
                            Time out required
                          </p>
                        )}
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
                      disabled={isSubmitted}
                      className={`w-full px-3 py-2 rounded-md border text-sm focus:ring-2 ${
                        isSubmitted
                          ? "border-gray-300 bg-gray-100 dark:bg-gray-700 text-gray-500"
                          : entry.status === "Excused" && !entry.reason
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
                    {entry.status === "Excused" &&
                      !entry.reason &&
                      !isSubmitted && (
                        <p className="mt-1 text-sm text-red-600">
                          Reason is required for excused absence
                        </p>
                      )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
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
                Academic Year
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
              {/* <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </th> */}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
            {attendanceData.map((entry, index) => {
              const recordStatus = getRecordStatus(entry.teacher);
              const isSubmitted = recordStatus === "submitted";

              return (
                <tr
                  key={entry.teacher}
                  className={
                    isSubmitted
                      ? "bg-green-50 dark:bg-green-900/20"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
                  }
                >
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {entry.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {entry.academicYear}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      disabled={isSubmitted}
                      className={`w-full px-2 py-1 rounded-md border text-sm ${
                        isSubmitted
                          ? "border-gray-300 bg-gray-100 dark:bg-gray-700 text-gray-500"
                          : entry.status === "Excused" && !entry.reason
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
                      disabled={
                        isSubmitted ||
                        (entry.status !== "Present" && entry.status !== "Late")
                      }
                      className={`w-full px-2 py-1 border rounded-md text-sm dark:bg-gray-700 ${
                        isSubmitted
                          ? "border-gray-300 bg-gray-100 dark:bg-gray-700 text-gray-500"
                          : "border-gray-300 dark:border-gray-600"
                      } ${
                        !entry.timeIn && entry.status === "Present"
                          ? "border-red-500"
                          : ""
                      }`}
                      value={entry.timeIn}
                      onChange={(e) =>
                        handleChange(index, "timeIn", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="time"
                      disabled={
                        isSubmitted ||
                        (entry.status !== "Present" && entry.status !== "Late")
                      }
                      className={`w-full px-2 py-1 border rounded-md text-sm dark:bg-gray-700 ${
                        isSubmitted
                          ? "border-gray-300 bg-gray-100 dark:bg-gray-700 text-gray-500"
                          : "border-gray-300 dark:border-gray-600"
                      } ${
                        !entry.timeOut && entry.status === "Present"
                          ? "border-red-500"
                          : ""
                      }`}
                      value={entry.timeOut}
                      onChange={(e) =>
                        handleChange(index, "timeOut", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      disabled={isSubmitted}
                      className={`w-full px-2 py-1 rounded-md border text-sm ${
                        isSubmitted
                          ? "border-gray-300 bg-gray-100 dark:bg-gray-700 text-gray-500"
                          : entry.status === "Excused" && !entry.reason
                            ? "border-red-500"
                            : "border-gray-300 dark:border-gray-600"
                      }`}
                      value={entry.reason}
                      onChange={(e) =>
                        handleChange(index, "reason", e.target.value)
                      }
                      placeholder={
                        entry.status === "Excused"
                          ? "Required..."
                          : "Optional..."
                      }
                    />
                  </td>
                  {/* <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isSubmitted
                          ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
                      }`}
                    >
                      {isSubmitted ? "Submitted" : "Pending"}
                    </span>
                  </td> */}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Submit Button */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-900 pt-4 border-t dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {submittedRecords.size} of {attendanceData.length} records submitted
          </div>
          <Button
            onClick={handleSubmit}
            disabled={
              submitting || submittedRecords.size === attendanceData.length
            }
            className="w-full sm:w-auto"
            size="lg"
          >
            {submitting ? (
              <>
                <ButtonLoader />
              </>
            ) : (
              "Save Attendance"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TeacherAttendance;
