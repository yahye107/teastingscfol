import React, { useState, useEffect } from "react";
import {
  callUpdateTeacherAttendanceApi,
  callGetAllTeacherAttendanceApi,
} from "@/service/service";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import exportData from "@/components/common/Export";
import {
  Download,
  Filter,
  RefreshCw,
  Users,
  Calendar,
  Clock,
  BarChart3,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Edit,
  Save,
  CheckCircle2,
  XCircle,
  Clock4,
  Coffee,
  User,
} from "lucide-react";
import GlobalLoader from "@/components/common/GlobalLoader";
import SearchableSelect from "@/components/common/SearchableSelect";
import { useNavigate } from "react-router-dom";

const AlltimeAttendce = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [teacherSummary, setTeacherSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("detailed");
  const [pageLoading, setpageLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({
    status: "",
    timeIn: "",
    timeOut: "",
    reason: "",
    academicYear: "",
  });
  const [updating, setUpdating] = useState(false);

  const navigate = useNavigate();

  // Filter states
  const [filters, setFilters] = useState({
    academicYear: "all",
    startDate: "",
    endDate: "",
    status: "all",
    performance: "all",
    teacherName: "",
  });

  // Status options with icons and colors
  const statusOptions = [
    {
      value: "Present",
      label: "Present",
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      value: "Absent",
      label: "Absent",
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      value: "Late",
      label: "Late",
      icon: Clock4,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    // {
    //   value: "Half Day",
    //   label: "Half Day",
    //   icon: Clock,
    //   color: "text-yellow-600",
    //   bgColor: "bg-yellow-100",
    // },
    {
      value: "Day Off",
      label: "Day Off",
      icon: Coffee,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
  ];

  const filterStatusOptions = [
    { value: "all", label: "All Status" },
    ...statusOptions.map((opt) => ({ value: opt.value, label: opt.label })),
  ];

  // Available academic years
  const getAcademicYears = () => {
    const years = [];
    for (let year = 2000; year <= 2100; year++) {
      years.push(`${year}-${year + 1}`);
    }
    return years;
  };

  const academicYears = getAcademicYears();

  useEffect(() => {
    const timer = setTimeout(() => {
      setpageLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Performance metrics
  const performanceOptions = [
    { value: "all", label: "All Performance" },
    { value: "most_hours", label: "Most Working Hours" },
    { value: "least_hours", label: "Least Working Hours" },
    { value: "most_present", label: "Most Present Days" },
    { value: "most_absent", label: "Most Absent Days" },
    { value: "best_punctuality", label: "Best Punctuality" },
  ];

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, attendanceData]);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const response = await callGetAllTeacherAttendanceApi();
      if (response && response?.attendance) {
        setAttendanceData(response?.attendance);
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTeacherSummary = (data) => {
    const summary = {};

    data.forEach((record) => {
      const teacherId = record.teacher?._id || record.teacher;
      const teacherName =
        record.teacher?.user?.fullName ||
        record.user?.fullName ||
        "Unknown Teacher";

      if (!summary[teacherId]) {
        summary[teacherId] = {
          teacherId,
          teacherName,
          totalHours: 0,
          presentDays: 0,
          absentDays: 0,
          lateDays: 0,
          halfDays: 0,
          dayOff: 0,
          totalRecords: 0,
          totalDays: 0,
        };
      }

      if (record.timeIn && record.timeOut && record.status === "Present") {
        const hours = calculateWorkingHours(record.timeIn, record.timeOut);
        summary[teacherId].totalHours += hours;
      }

      if (record.status === "Present") summary[teacherId].presentDays++;
      if (record.status === "Absent") summary[teacherId].absentDays++;
      if (record.status === "Late") summary[teacherId].lateDays++;
      if (record.status === "Half Day") summary[teacherId].halfDays++;
      if (record.status === "Day Off") summary[teacherId].dayOff++;

      summary[teacherId].totalRecords++;
      summary[teacherId].totalDays++;
    });

    return Object.values(summary).map((teacher) => ({
      ...teacher,
      attendanceRate:
        teacher.totalDays > 0
          ? ((teacher.presentDays / teacher.totalDays) * 100).toFixed(1)
          : "0.0",
      punctualityRate:
        teacher.totalDays > 0
          ? (
              ((teacher.presentDays + teacher.halfDays) / teacher.totalDays) *
              100
            ).toFixed(1)
          : "0.0",
    }));
  };

  const applyFilters = () => {
    let filtered = [...attendanceData];

    if (filters.academicYear !== "all") {
      filtered = filtered.filter(
        (item) => item.academicYear === filters.academicYear
      );
    }

    if (filters.startDate) {
      filtered = filtered.filter(
        (item) => new Date(item.date) >= new Date(filters.startDate)
      );
    }
    if (filters.endDate) {
      filtered = filtered.filter(
        (item) => new Date(item.date) <= new Date(filters.endDate)
      );
    }

    if (filters.status !== "all") {
      filtered = filtered.filter((item) => item.status === filters.status);
    }

    if (filters.teacherName) {
      filtered = filtered.filter((item) => {
        const teacherName =
          item.teacher?.user?.fullName || item.user?.fullName || "";
        return teacherName
          .toLowerCase()
          .includes(filters.teacherName.toLowerCase());
      });
    }

    const summary = calculateTeacherSummary(filtered);

    let finalFilteredData = filtered;
    let finalTeacherSummary = summary;

    if (filters.performance !== "all") {
      finalTeacherSummary = applyPerformanceFilterToSummary(summary);
      if (viewMode === "detailed") {
        const teacherIds = finalTeacherSummary.map(
          (teacher) => teacher.teacherId
        );
        finalFilteredData = filtered.filter((record) =>
          teacherIds.includes(record.teacher?._id || record.teacher)
        );
      }
    }

    setFilteredData(finalFilteredData);
    setTeacherSummary(finalTeacherSummary);
  };

  const applyPerformanceFilterToSummary = (summary) => {
    const sortedSummary = [...summary];

    switch (filters.performance) {
      case "most_hours":
        return sortedSummary.sort((a, b) => b.totalHours - a.totalHours);
      case "least_hours":
        return sortedSummary.sort((a, b) => a.totalHours - b.totalHours);
      case "most_present":
        return sortedSummary.sort((a, b) => b.presentDays - a.presentDays);
      case "most_absent":
        return sortedSummary.sort((a, b) => b.absentDays - a.absentDays);
      case "best_punctuality":
        return sortedSummary.sort(
          (a, b) => b.punctualityRate - a.punctualityRate
        );
      default:
        return sortedSummary;
    }
  };

  const calculateWorkingHours = (timeIn, timeOut) => {
    if (!timeIn || !timeOut) return 0;

    const timeInStr =
      typeof timeIn === "string" ? timeIn : timeIn.toTimeString().slice(0, 5);
    const timeOutStr =
      typeof timeOut === "string"
        ? timeOut
        : timeOut.toTimeString().slice(0, 5);

    const [inHour, inMinute] = timeInStr.split(":").map(Number);
    const [outHour, outMinute] = timeOutStr.split(":").map(Number);

    const start = new Date();
    start.setHours(inHour, inMinute, 0, 0);

    const end = new Date();
    end.setHours(outHour, outMinute, 0, 0);

    let diff = (end - start) / (1000 * 60 * 60);
    if (diff < 0) diff += 24;

    return Math.max(0, diff);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      academicYear: "all",
      startDate: "",
      endDate: "",
      status: "all",
      performance: "all",
      teacherName: "",
    });
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = (data) => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  };

  // Edit functionality
  const handleEditClick = (record) => {
    setEditingRecord(record);
    setEditForm({
      status: record.status,
      timeIn: record.timeIn || "",
      timeOut: record.timeOut || "",
      reason: record.reason || "",
      academicYear: record.academicYear || "",
    });
  };

  const handleUpdateAttendance = async (e) => {
    e.preventDefault();
    if (!editingRecord) return;

    setUpdating(true);
    try {
      await callUpdateTeacherAttendanceApi(editingRecord._id, editForm);
      await fetchAttendanceData(); // Refresh data
      setEditingRecord(null);
      setEditForm({
        status: "",
        timeIn: "",
        timeOut: "",
        reason: "",
        academicYear: "",
      });
    } catch (error) {
      console.error("Error updating attendance:", error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusIcon = (status) => {
    const statusOption = statusOptions.find((opt) => opt.value === status);
    const IconComponent = statusOption?.icon || CheckCircle2;
    return <IconComponent className={`h-4 w-4 ${statusOption?.color}`} />;
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find((opt) => opt.value === status);
    return statusOption?.bgColor || "bg-gray-100";
  };

  const exportDataSet = () => {
    let headers = [];
    let rows = [];

    if (viewMode === "detailed") {
      headers = [
        "Teacher Name",
        "Date",
        "Status",
        "Time In",
        "Time Out",
        "Working Hours",
        "Reason",
        "Academic Year",
      ];

      rows = filteredData.map((record) => {
        const teacherName =
          record.teacher?.user?.fullName || record.user?.fullName || "N/A";
        return [
          teacherName,
          record.date ? new Date(record.date).toLocaleDateString() : "N/A",
          record.status,
          record.timeIn
            ? typeof record.timeIn === "string"
              ? record.timeIn
              : record.timeIn.toTimeString().slice(0, 5)
            : "N/A",
          record.timeOut
            ? typeof record.timeOut === "string"
              ? record.timeOut
              : record.timeOut.toTimeString().slice(0, 5)
            : "N/A",
          record.timeIn && record.timeOut
            ? calculateWorkingHours(record.timeIn, record.timeOut).toFixed(2) +
              " hrs"
            : "N/A",
          record.reason || "N/A",
          record.academicYear || "N/A",
        ];
      });
    } else if (viewMode === "summary") {
      headers = [
        "Rank",
        "Teacher",
        "Total Hours",
        "Present Days",
        "Absent Days",
        "Late Days",
        "Day Off",
        "Attendance Rate",
      ];

      rows = teacherSummary.map((teacher, index) => [
        index + 1,
        teacher.teacherName,
        teacher.totalHours.toFixed(2),
        teacher.presentDays,
        teacher.absentDays,
        teacher.lateDays,
        teacher.dayOff,
        teacher.attendanceRate + "%",
      ]);
    }

    return { headers, rows };
  };

  const { headers, rows } = exportDataSet();

  // Stats for dashboard
  const stats = {
    totalTeachers: new Set(
      attendanceData.map((item) => item.teacher?._id || item.teacher)
    ).size,
    totalRecords: attendanceData.length,
    averageAttendance:
      teacherSummary.length > 0
        ? (
            teacherSummary.reduce(
              (acc, curr) => acc + parseFloat(curr.attendanceRate),
              0
            ) / teacherSummary.length
          ).toFixed(1)
        : 0,
    filteredRecords: filteredData.length,
  };

  if (pageLoading) {
    return <GlobalLoader />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col items-start sm:flex-row sm:items-center">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="gap-2 text-black flex-shrink-0 mb-2 sm:mb-0 sm:mr-4"
              >
                <ArrowLeft className="h-4 w-4 text-black" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Teacher Attendance
                </h1>
                <p className="text-gray-600 mt-2">
                  Monitor and analyze teacher attendance patterns
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 border-gray-300"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {showFilters ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer">
                    <Download className="h-4 w-4 mr-2 inline" />
                    Export
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() =>
                      exportData("excel", exportDataSet(), "teacher_attendance")
                    }
                  >
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      exportData("excel", exportDataSet(), "teacher_attendance")
                    }
                  >
                    Export as Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      exportData("excel", exportDataSet(), "teacher_attendance")
                    }
                  >
                    Export as Word
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Teachers
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalTeachers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Records
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalRecords}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Avg. Attendance
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.averageAttendance}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Filtered Records
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.filteredRecords}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Reset</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(false)}
                  className="flex items-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>Close</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Academic Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Year
                </label>
                <SearchableSelect
                  options={[
                    { label: "All Years", value: "all" },
                    ...academicYears.map((year) => ({
                      label: year,
                      value: year,
                    })),
                  ]}
                  value={filters.academicYear}
                  onChange={(value) =>
                    handleFilterChange("academicYear", value)
                  }
                  placeholder="Select Year"
                />
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  {filterStatusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Performance Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Performance
                </label>
                <select
                  value={filters.performance}
                  onChange={(e) =>
                    handleFilterChange("performance", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  {performanceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Teacher Name Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Teacher
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    value={filters.teacherName}
                    onChange={(e) =>
                      handleFilterChange("teacherName", e.target.value)
                    }
                    placeholder="Enter teacher name..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Mode Toggle and Results Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center space-x-4 mb-4 sm:mb-0">
            <div className="bg-white rounded-lg border border-gray-200 p-1">
              <button
                onClick={() => setViewMode("detailed")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === "detailed"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Detailed View
              </button>
              <button
                onClick={() => setViewMode("summary")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === "summary"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Summary View
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 px-4 py-2">
            <p className="text-sm text-gray-600">
              {viewMode === "detailed"
                ? `Showing ${filteredData.length} of ${attendanceData.length} records`
                : `Showing ${teacherSummary.length} teachers`}
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
              <span className="text-gray-600">Loading attendance data...</span>
            </div>
          </div>
        )}

        {/* Summary View */}
        {!loading && viewMode === "summary" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {[
                      { key: "rank", label: "Rank", sortable: false },
                      { key: "teacherName", label: "Teacher", sortable: true },
                      {
                        key: "totalHours",
                        label: "Total Hours",
                        sortable: true,
                      },
                      { key: "presentDays", label: "Present", sortable: true },
                      { key: "absentDays", label: "Absent", sortable: true },
                      { key: "lateDays", label: "Late", sortable: true },
                      { key: "dayOff", label: "Day Off", sortable: true },
                      {
                        key: "attendanceRate",
                        label: "Attendance Rate",
                        sortable: true,
                      },
                    ].map((column) => (
                      <th
                        key={column.key}
                        className={`px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                          column.sortable
                            ? "cursor-pointer hover:bg-gray-100"
                            : ""
                        }`}
                        onClick={() =>
                          column.sortable && handleSort(column.key)
                        }
                      >
                        <div className="flex items-center space-x-1">
                          <span>{column.label}</span>
                          {column.sortable &&
                            (sortConfig.key === column.key ? (
                              sortConfig.direction === "asc" ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )
                            ) : (
                              <div className="opacity-30">
                                <ChevronUp className="h-3 w-3" />
                                <ChevronDown className="h-3 w-3 -mt-1" />
                              </div>
                            ))}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {teacherSummary.length > 0 ? (
                    getSortedData(teacherSummary).map((teacher, index) => (
                      <tr
                        key={teacher.teacherId}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                index < 3
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {index + 1}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {teacher.teacherName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {teacher.totalHours.toFixed(2)} hrs
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {teacher.presentDays}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {teacher.absentDays}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {teacher.lateDays}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {teacher.dayOff}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-sm font-medium ${
                                parseFloat(teacher.attendanceRate) >= 90
                                  ? "text-green-600"
                                  : parseFloat(teacher.attendanceRate) >= 75
                                    ? "text-yellow-600"
                                    : "text-red-600"
                              }`}
                            >
                              {teacher.attendanceRate}%
                            </span>
                            {parseFloat(teacher.attendanceRate) >= 90 ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : parseFloat(teacher.attendanceRate) <= 70 ? (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center">
                        <div className="text-gray-500">
                          <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
                          <p className="text-lg font-medium">
                            No teacher data found
                          </p>
                          <p className="text-sm">Try adjusting your filters</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detailed View with Edit Functionality */}
        {!loading && viewMode === "detailed" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teacher
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time In
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time Out
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Working Hours
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Academic Year
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredData.length > 0 ? (
                    filteredData.map((record, index) => {
                      const teacherName =
                        record.teacher?.user?.fullName ||
                        record.user?.fullName ||
                        "N/A";
                      return (
                        <tr
                          key={record._id || index}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <User className="h-4 w-4 text-blue-600" />
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {teacherName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(record.date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div
                              className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(record.status)}`}
                            >
                              {getStatusIcon(record.status)}
                              <span
                                className={
                                  statusOptions.find(
                                    (opt) => opt.value === record.status
                                  )?.color
                                }
                              >
                                {record.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {record.timeIn ? (
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span>{record.timeIn}</span>
                              </div>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {record.timeOut ? (
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span>{record.timeOut}</span>
                              </div>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {record.timeIn && record.timeOut
                              ? calculateWorkingHours(
                                  record.timeIn,
                                  record.timeOut
                                ).toFixed(2) + " hrs"
                              : "—"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                            {record.reason || "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {record.academicYear || "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditClick(record)}
                                  className="flex items-center space-x-2"
                                >
                                  <Edit className="h-4 w-4" />
                                  <span>Edit</span>
                                </Button>
                              </DialogTrigger>

                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>
                                    Edit Attendance Record
                                  </DialogTitle>
                                </DialogHeader>

                                <form
                                  onSubmit={handleUpdateAttendance}
                                  className="space-y-4"
                                >
                                  {/* Status */}
                                  <div>
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                      value={editForm.status}
                                      onValueChange={(value) => {
                                        setEditForm((prev) => {
                                          // When status = "Absent", reset timeIn and timeOut
                                          if (value === "Absent") {
                                            return {
                                              ...prev,
                                              status: value,
                                              timeIn: "",
                                              timeOut: "",
                                            };
                                          }
                                          return { ...prev, status: value };
                                        });
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {statusOptions.map((option) => (
                                          <SelectItem
                                            key={option.value}
                                            value={option.value}
                                          >
                                            <div className="flex items-center space-x-2">
                                              <option.icon
                                                className={`h-4 w-4 ${option.color}`}
                                              />
                                              <span>{option.label}</span>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {/* Conditional fields */}
                                  {editForm.status !== "Day Off" && (
                                    <>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label htmlFor="timeIn">
                                            Time In
                                          </Label>
                                          <Input
                                            type="time"
                                            id="timeIn"
                                            value={editForm.timeIn}
                                            onChange={(e) =>
                                              setEditForm((prev) => ({
                                                ...prev,
                                                timeIn: e.target.value,
                                              }))
                                            }
                                            disabled={
                                              editForm.status === "Absent"
                                            }
                                            required={
                                              editForm.status === "Present" ||
                                              editForm.status === "Late"
                                            }
                                          />
                                        </div>

                                        <div>
                                          <Label htmlFor="timeOut">
                                            Time Out
                                          </Label>
                                          <Input
                                            type="time"
                                            id="timeOut"
                                            value={editForm.timeOut}
                                            onChange={(e) =>
                                              setEditForm((prev) => ({
                                                ...prev,
                                                timeOut: e.target.value,
                                              }))
                                            }
                                            disabled={
                                              editForm.status === "Absent"
                                            }
                                            required={
                                              editForm.status === "Present" ||
                                              editForm.status === "Late"
                                            }
                                          />
                                        </div>
                                      </div>

                                      <div>
                                        <Label htmlFor="reason">Reason</Label>
                                        <Input
                                          id="reason"
                                          value={editForm.reason}
                                          onChange={(e) =>
                                            setEditForm((prev) => ({
                                              ...prev,
                                              reason: e.target.value,
                                            }))
                                          }
                                          placeholder="Enter reason for absence or late..."
                                          disabled={
                                            editForm.status === "Present"
                                          }
                                          // required={
                                          //   editForm.status === "Late" ||
                                          //   editForm.status === "Absent"
                                          // }
                                        />
                                      </div>
                                    </>
                                  )}

                                  {/* Academic Year */}
                                  <div>
                                    <Label htmlFor="academicYear">
                                      Academic Year
                                    </Label>
                                    <SearchableSelect
                                      options={academicYears.map((year) => ({
                                        label: year,
                                        value: year,
                                      }))}
                                      value={editForm.academicYear}
                                      onChange={(value) =>
                                        setEditForm((prev) => ({
                                          ...prev,
                                          academicYear: value,
                                        }))
                                      }
                                      placeholder="Select Academic Year"
                                    />
                                  </div>

                                  {/* Buttons */}
                                  <div className="flex space-x-3 pt-4">
                                    <Button
                                      type="submit"
                                      disabled={updating}
                                      className="flex-1 flex items-center space-x-2"
                                    >
                                      {updating ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                      ) : (
                                        <Save className="h-4 w-4" />
                                      )}
                                      <span>
                                        {updating
                                          ? "Updating..."
                                          : "Update Record"}
                                      </span>
                                    </Button>

                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => setEditingRecord(null)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </form>
                              </DialogContent>
                            </Dialog>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center">
                        <div className="text-gray-500">
                          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40" />
                          <p className="text-lg font-medium">
                            No attendance records found
                          </p>
                          <p className="text-sm">
                            Try adjusting your filters or search criteria
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlltimeAttendce;
