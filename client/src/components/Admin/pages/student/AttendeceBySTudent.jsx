import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  callGetAllsubjectssApi,
  callUpdateAttendanceApi,
  callGetStudentAttendanceApi,
  callGetRegisteredAcademicYearsApi,
  callGetAllStudentsidbyApi,
} from "@/service/service";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Calendar,
  User,
  Filter,
  Edit2,
  Save,
  X,
  Download,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarDays,
  BarChart3,
} from "lucide-react";
import { ClipLoader } from "react-spinners";
import { toast } from "sonner";
import GlobalLoader from "@/components/common/GlobalLoader";
import SearchableSelect from "@/components/common/SearchableSelect";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import exportData from "@/components/common/Export";

const attendanceSchema = z.object({
  status: z.enum(["Present", "Absent", "Late", "Excused"]),
});

const AttendeceBySTudent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    academicYear: "",
    subject: "all",
  });
  const [editingAttendanceId, setEditingAttendanceId] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [stats, setStats] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(attendanceSchema),
  });

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      const start = Date.now();
      try {
        const [studentRes, subjectsRes, yearsRes] = await Promise.all([
          callGetAllStudentsidbyApi(id),
          callGetAllsubjectssApi(),
          callGetRegisteredAcademicYearsApi(),
        ]);

        setStudent(studentRes.student);
        setSubjects(subjectsRes.subjects || []);
        setAcademicYears(yearsRes || []);

        if (yearsRes.length > 0) {
          setFilters((prev) => ({ ...prev, academicYear: yearsRes[0] }));
        }

        // Set default date range (last 30 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        setFilters((prev) => ({
          ...prev,
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
        }));
      } catch (error) {
        toast.error("Failed to load student data");
        console.error("Error fetching data:", error);
      } finally {
        const elapsed = Date.now() - start;
        const minTime = 500; // 2s minimum
        const remaining = minTime - elapsed;

        if (remaining > 0) {
          setTimeout(() => setLoading(false), remaining);
        } else {
          setLoading(false);
        }
      }
    };

    fetchInitialData();
  }, [id]);

  // Fetch attendance data when filters change
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!id || !filters.startDate || !filters.endDate) return;
      setAttendanceLoading(true);
      const start = Date.now();
      try {
        const response = await callGetStudentAttendanceApi(
          id,
          filters.startDate,
          filters.endDate,
          filters.academicYear
        );

        setAttendance(response.data?.result || []);
        calculateStats(response.data?.result || []);
      } catch (error) {
        console.error("Error fetching attendance:", error);
        toast.error("Failed to load attendance records");
        setAttendance([]);
      } finally {
        const elapsed = Date.now() - start;
        const minTime = 500; // 2s minimum
        const remaining = minTime - elapsed;

        if (remaining > 0) {
          setTimeout(() => setAttendanceLoading(false), remaining);
        } else {
          setAttendanceLoading(false);
        }
      }
    };

    fetchAttendance();
  }, [id, filters]);

  // Calculate attendance statistics
  const calculateStats = (attendanceData) => {
    if (!attendanceData.length) {
      setStats(null);
      return;
    }

    const totalRecords = attendanceData.length;
    const presentCount = attendanceData.filter(
      (a) => a.status === "Present"
    ).length;
    const absentCount = attendanceData.filter(
      (a) => a.status === "Absent"
    ).length;
    const lateCount = attendanceData.filter((a) => a.status === "Late").length;
    const excusedCount = attendanceData.filter(
      (a) => a.status === "Excused"
    ).length;

    const attendanceRate = ((presentCount + lateCount) / totalRecords) * 100;

    setStats({
      totalRecords,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      attendanceRate: Math.round(attendanceRate * 10) / 10,
    });
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Handle edit attendance
  const handleEdit = (attendanceRecord) => {
    setEditingAttendanceId(attendanceRecord._id);
    setValue("status", attendanceRecord.status);
    setEditDialogOpen(true);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingAttendanceId(null);
    setEditDialogOpen(false);
    reset();
  };

  // Handle update attendance
  const handleUpdateAttendance = async (data) => {
    if (!editingAttendanceId) return;

    try {
      setUpdating(true);

      const response = await callUpdateAttendanceApi(
        editingAttendanceId,
        data.status
      );

      if (response.status === 200 || response.status === 201) {
        toast.success("Attendance updated successfully");

        const refreshedResponse = await callGetStudentAttendanceApi(
          id,
          filters.startDate,
          filters.endDate,
          filters.academicYear
        );

        setAttendance(refreshedResponse.data?.result || []);
        calculateStats(refreshedResponse.data?.result || []);
        handleCancelEdit();
      } else {
        throw new Error("Failed to update attendance");
      }
    } catch (error) {
      console.error("Error updating attendance:", error);
      toast.error("Failed to update attendance record");
    } finally {
      setUpdating(false);
    }
  };

  // Filter attendance by subject
  const filteredAttendance =
    filters.subject === "all"
      ? attendance
      : attendance.filter((record) => record.subject === filters.subject);

  // Get status badge color and icon
  const getStatusConfig = (status) => {
    switch (status) {
      case "Present":
        return {
          color: "bg-green-50 text-green-700 border-green-200",
          icon: <CheckCircle className="h-4 w-4" />,
        };
      case "Absent":
        return {
          color: "bg-red-50 text-red-700 border-red-200",
          icon: <XCircle className="h-4 w-4" />,
        };
      case "Late":
        return {
          color: "bg-yellow-50 text-yellow-700 border-yellow-200",
          icon: <Clock className="h-4 w-4" />,
        };
      case "Excused":
        return {
          color: "bg-blue-50 text-blue-700 border-blue-200",
          icon: <AlertCircle className="h-4 w-4" />,
        };
      default:
        return {
          color: "bg-gray-50 text-gray-700 border-gray-200",
          icon: <CalendarDays className="h-4 w-4" />,
        };
    }
  };

  const headers = ["Date", "Subject", "Status", "Marked By", "Academic Year"];
  const rows = attendance.map((record) => [
    record.date,
    record.subject || "Unknown",
    record.status || "-",
    record.markedBy || "-",
    record.academicYear || "-",
  ]);
  const exportDataSet = { headers, rows };

  if (loading) {
    return <GlobalLoader />;
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            Student not found
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Header Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  navigate(`/admin/dashboard/StudentInfobyid/${id}`)
                }
                className="flex items-center gap-2 bg-blue-100 text-purple-700 hover:bg-purple-200 px-3 py-1 rounded-md"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <CalendarDays className="h-6 w-6 text-blue-600" />
                  Student Attendance
                </h1>
                <p className="text-gray-600 mt-1">
                  Tracking attendance for {student.user?.fullName}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer">
                  <Download className="h-4 w-4 mr-2 inline" />
                  Export
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => exportData("csv", exportDataSet, "payments")}
                >
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => exportData("excel", exportDataSet, "payments")}
                >
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => exportData("word", exportDataSet, "payments")}
                >
                  Export as Word
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Student Profile Card */}
        <Card className="bg-gradient-to-r from-slate-50 to-blue-50 border-blue-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col items-center sm:flex-row sm:items-center gap-4">
                {/* Avatar */}
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-8 w-8 text-white" />
                </div>

                {/* Student Info */}
                <div className="text-center sm:text-left">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {student.user?.fullName}
                  </h2>

                  <div className="flex flex-wrap justify-center sm:justify-start gap-2 md:gap-4 mt-2 text-sm text-gray-600">
                    <span>
                      Admission: <strong>{student.admissionNumber}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Class: <strong>{student.classId?.name}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Parent:{" "}
                      <strong>{student.parent?.user?.fullName || "N/A"}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {stats && (
                <div className="text-left md:text-right mt-2 md:mt-0">
                  <div className="text-3xl font-bold text-blue-600">
                    {stats.attendanceRate}%
                  </div>
                  <div className="text-sm text-gray-600">
                    Overall Attendance
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Statistics Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.presentCount}
                    </p>
                    <p className="text-sm text-gray-600">Present</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.absentCount}
                    </p>
                    <p className="text-sm text-gray-600">Absent</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.lateCount}
                    </p>
                    <p className="text-sm text-gray-600">Late</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalRecords}
                    </p>
                    <p className="text-sm text-gray-600">Total Records</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Filters */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5 text-blue-600" />
              Quick Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Date Range
                </label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) =>
                      handleFilterChange("startDate", e.target.value)
                    }
                    className="flex-1"
                  />
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) =>
                      handleFilterChange("endDate", e.target.value)
                    }
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Academic Year
                </label>
                <SearchableSelect
                  options={academicYears.map((year) => ({
                    label: year,
                    value: year,
                  }))}
                  value={filters.academicYear}
                  onChange={(value) =>
                    handleFilterChange("academicYear", value)
                  }
                  placeholder="Select Year"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Subject
                </label>
                <SearchableSelect
                  options={[
                    { label: "All Subjects", value: "all" },
                    ...subjects.map((sub) => ({
                      label: sub.name,
                      value: sub.name,
                    })),
                  ]}
                  value={filters.subject}
                  onChange={(value) => handleFilterChange("subject", value)}
                  placeholder="Filter by Subject"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Actions
                </label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      const endDate = new Date();
                      const startDate = new Date();
                      startDate.setDate(startDate.getDate() - 30);
                      setFilters((prev) => ({
                        ...prev,
                        startDate: startDate.toISOString().split("T")[0],
                        endDate: endDate.toISOString().split("T")[0],
                      }));
                    }}
                  >
                    Last 30 Days
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Records */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Attendance History</CardTitle>
                <CardDescription>
                  {filters.startDate && filters.endDate && (
                    <>
                      Showing records from <strong>{filters.startDate}</strong>{" "}
                      to <strong>{filters.endDate}</strong>
                      {filters.subject !== "all" && ` in ${filters.subject}`}
                    </>
                  )}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-sm">
                {filteredAttendance.length} records
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {attendanceLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <ClipLoader size={32} color="#3B82F6" />
                  <p className="mt-2 text-gray-500">
                    Loading attendance records...
                  </p>
                </div>
              </div>
            ) : filteredAttendance.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No attendance records found
                </h3>
                <p className="text-gray-500 max-w-md">
                  No attendance records match your current filters. Try
                  adjusting the date range or subject filter.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Subject</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Marked By</TableHead>
                      <TableHead className="font-semibold">
                        Academic Year
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttendance.map((record) => {
                      const statusConfig = getStatusConfig(record.status);
                      return (
                        <TableRow
                          key={record._id}
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-4 w-4 text-gray-400" />
                              {record.date}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {record.subject}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`flex items-center gap-1.5 border ${statusConfig.color} text-xs font-medium`}
                            >
                              {statusConfig.icon}
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {record.markedBy}
                          </TableCell>
                          <TableCell>
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {record.academicYear}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(record)}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit2 className="h-3 w-3" />
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Attendance Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-blue-600" />
                Update Attendance Status
              </DialogTitle>
              <DialogDescription>
                Change the attendance status for the selected record
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={handleSubmit(handleUpdateAttendance)}
              className="space-y-4"
            >
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">
                  Attendance Status
                </label>
                <Select
                  onValueChange={(value) => setValue("status", value)}
                  defaultValue={watch("status")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="Present"
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Present
                    </SelectItem>
                    <SelectItem
                      value="Absent"
                      className="flex items-center gap-2"
                    >
                      <XCircle className="h-4 w-4 text-red-600" />
                      Absent
                    </SelectItem>
                    <SelectItem
                      value="Late"
                      className="flex items-center gap-2"
                    >
                      <Clock className="h-4 w-4 text-yellow-600" />
                      Late
                    </SelectItem>
                    <SelectItem
                      value="Excused"
                      className="flex items-center gap-2"
                    >
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      Excused
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-sm text-red-500">
                    {errors.status.message}
                  </p>
                )}
              </div>

              <DialogFooter className="flex gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={updating}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {updating ? (
                    <>
                      <ClipLoader size={16} color="white" />
                      <span className="ml-2">Updating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      Save Changes
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AttendeceBySTudent;
