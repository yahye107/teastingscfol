import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  callUpdateTeacherAttendanceApi,
  callGetTeacherAttendanceByIdApi,
} from "@/service/service";
import { Button } from "@/components/ui/button";
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
import {
  Calendar,
  Clock,
  Edit,
  Save,
  X,
  User,
  BarChart3,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Clock4,
  Coffee,
  ArrowLeft,
  Filter,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import GlobalLoader from "@/components/common/GlobalLoader";
import SearchableSelect from "@/components/common/SearchableSelect";

function Attendcebyteacher() {
  const { id } = useParams();
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [editForm, setEditForm] = useState({
    status: "",
    timeIn: "",
    timeOut: "",
    reason: "",
    academicYear: "",
  });

  // Filter states
  const [filters, setFilters] = useState({
    academicYear: "all",
    startDate: "",
    endDate: "",
    status: "all",
    searchDate: "",
  });

  const navigate = useNavigate();

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

  useEffect(() => {
    if (id) {
      fetchTeacherAttendance();
    }
  }, [id]);

  useEffect(() => {
    applyFilters();
  }, [filters, attendanceData]);

  const fetchTeacherAttendance = async () => {
    setLoading(true);
    try {
      const response = await callGetTeacherAttendanceByIdApi(id);
      if (response && response.attendance) {
        setAttendanceData(response.attendance);
        if (response.attendance.length > 0) {
          setTeacherInfo(response.attendance[0].teacher);
        }
      }
    } catch (error) {
      console.error("Error fetching teacher attendance:", error);
    } finally {
      setLoading(false);
    }
  };
  const getAcademicYear = () => {
    const years = [];
    for (let year = 2000; year <= 2100; year++) {
      years.push(`${year}-${year + 1}`);
    }
    return years;
  };

  const academicYear = getAcademicYear();
  const applyFilters = () => {
    let filtered = [...attendanceData];

    // Academic Year filter
    if (filters.academicYear !== "all") {
      filtered = filtered.filter(
        (item) => item.academicYear === filters.academicYear
      );
    }

    // Date range filter
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

    // Specific date search
    if (filters.searchDate) {
      filtered = filtered.filter(
        (item) =>
          new Date(item.date).toISOString().split("T")[0] === filters.searchDate
      );
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter((item) => item.status === filters.status);
    }

    setFilteredData(filtered);
  };

  // Get available academic years from the data
  const getAcademicYears = () => {
    const years = [
      ...new Set(
        attendanceData.map((item) => item.academicYear).filter(Boolean)
      ),
    ];
    return years.sort().reverse();
  };

  const academicYears = getAcademicYears();

  const handleUpdateAttendance = async (e) => {
    e.preventDefault();
    if (!editingRecord) return;

    setUpdating(true);
    try {
      await callUpdateTeacherAttendanceApi(editingRecord._id, editForm);
      await fetchTeacherAttendance(); // Refresh data
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
      searchDate: "",
    });
  };

  const calculateWorkingHours = (timeIn, timeOut) => {
    if (!timeIn || !timeOut) return 0;

    const [inHour, inMinute] = timeIn.split(":").map(Number);
    const [outHour, outMinute] = timeOut.split(":").map(Number);

    const start = new Date();
    start.setHours(inHour, inMinute, 0, 0);

    const end = new Date();
    end.setHours(outHour, outMinute, 0, 0);

    let diff = (end - start) / (1000 * 60 * 60);
    if (diff < 0) diff += 24;

    return Math.max(0, diff);
  };

  // Calculate statistics - now based on filtered data
  const stats = {
    totalDays: filteredData.length,
    presentDays: filteredData.filter((record) => record.status === "Present")
      .length,
    absentDays: filteredData.filter((record) => record.status === "Absent")
      .length,
    lateDays: filteredData.filter((record) => record.status === "Late").length,
    halfDays: filteredData.filter((record) => record.status === "Half Day")
      .length,
    dayOff: filteredData.filter((record) => record.status === "Day Off").length,
    attendanceRate:
      filteredData.length > 0
        ? (
            (filteredData.filter((record) => record.status === "Present")
              .length /
              filteredData.length) *
            100
          ).toFixed(1)
        : 0,
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

  if (loading) {
    return <GlobalLoader />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col sm:flex-row items-center sm:items-center justify-start gap-4 mb-4 lg:mb-0">
              {/* Back Button */}
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="gap-2 border-gray-300 w-full sm:w-auto justify-center"
              >
                <ArrowLeft className="h-4 w-4 text-black" />
                Back
              </Button>

              {/* Teacher Info Section */}
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                {/* Avatar */}
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <User className="h-8 w-8 text-white" />
                </div>

                {/* Info */}
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {teacherInfo?.user?.fullName || "Teacher Attendance"}
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 mt-1">
                    {teacherInfo?.user?.email || "Email not available"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between sm:space-x-6 space-y-4 sm:space-y-0 text-center">
                {/* Attendance Rate */}
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.attendanceRate}%
                  </div>
                  <div className="text-sm text-gray-600">Attendance Rate</div>
                </div>

                {/* Divider (hidden on mobile) */}
                <div className="hidden sm:block h-12 w-px bg-gray-200"></div>

                {/* Present Days */}
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.presentDays}
                  </div>
                  <div className="text-sm text-gray-600">Present Days</div>
                </div>

                {/* Divider (hidden on mobile) */}
                <div className="hidden sm:block h-12 w-px bg-gray-200"></div>

                {/* Absent Days */}
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {stats.absentDays}
                  </div>
                  <div className="text-sm text-gray-600">Absent Days</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Records
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalDays}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {filteredData.length === attendanceData.length
                    ? "All records"
                    : `${filteredData.length} of ${attendanceData.length}`}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Late Days</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.lateDays}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <Clock4 className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Half Days</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.halfDays}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Day Off</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.dayOff}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Coffee className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>

            <div className="flex flex-col sm:flex-row sm:space-x-3 gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={resetFilters}
                className="flex items-center justify-center space-x-2 w-full sm:w-auto"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Reset</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center space-x-2 w-full sm:w-auto"
              >
                <Filter className="h-4 w-4" />
                <span>{showFilters ? "Hide" : "Show"} Filters</span>
                {showFilters ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
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

              {/* Specific Date Search */}
              <div className="md:col-span-2 lg:col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Specific Date
                </label>
                <div className="flex space-x-3">
                  <input
                    type="date"
                    value={filters.searchDate}
                    onChange={(e) =>
                      handleFilterChange("searchDate", e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {filters.searchDate && (
                    <Button
                      variant="outline"
                      onClick={() => handleFilterChange("searchDate", "")}
                      className="flex items-center space-x-2"
                    >
                      <X className="h-4 w-4" />
                      <span>Clear</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Results Summary */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {filteredData.length} of {attendanceData.length} records
            </p>
            {filters.academicYear !== "all" ||
            filters.startDate ||
            filters.endDate ||
            filters.status !== "all" ||
            filters.searchDate ? (
              <p className="text-sm text-blue-600 font-medium">
                Filters Active
              </p>
            ) : null}
          </div>
        </div>

        {/* Attendance Records Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Attendance History
              </h2>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <BarChart3 className="h-4 w-4" />
                <span>Sorted by latest date</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
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
                    const workingHours = calculateWorkingHours(
                      record.timeIn,
                      record.timeOut
                    );
                    return (
                      <tr
                        key={record._id || index}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {new Date(record.date).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </span>
                          </div>
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
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {record.timeOut ? (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span>{record.timeOut}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {workingHours > 0 ? (
                            <div className="flex items-center space-x-1">
                              <span className="text-sm font-medium text-gray-900">
                                {workingHours.toFixed(2)} hrs
                              </span>
                              {workingHours >= 8 ? (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-orange-500" />
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                          <div className="truncate" title={record.reason}>
                            {record.reason || "—"}
                          </div>
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
                                {/* STATUS */}
                                <div>
                                  <Label htmlFor="status">Status</Label>
                                  <Select
                                    value={editForm.status}
                                    onValueChange={(value) =>
                                      setEditForm((prev) => ({
                                        ...prev,
                                        status: value,
                                        // Auto-clear irrelevant fields
                                        ...(value === "Day Off" && {
                                          timeIn: "",
                                          timeOut: "",
                                          reason: "",
                                        }),
                                        ...(value === "Present" && {
                                          reason: "",
                                        }),
                                      }))
                                    }
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

                                {/* CONDITIONAL INPUTS */}
                                {editForm.status !== "Day Off" && (
                                  <>
                                    <div className="grid grid-cols-2 gap-4">
                                      {/* Time In */}
                                      <div>
                                        <Label htmlFor="timeIn">Time In</Label>
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

                                      {/* Time Out */}
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

                                    {/* Reason */}
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
                                        disabled={editForm.status === "Present"}
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
                                    options={academicYear.map((year) => ({
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

                                {/* ACTION BUTTONS */}
                                <div className="flex space-x-3 pt-4">
                                  <Button
                                    type="submit"
                                    disabled={updating}
                                    className="flex-1 flex items-center justify-center space-x-2"
                                  >
                                    {updating ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
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
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40" />
                        <p className="text-lg font-medium">
                          No attendance records found
                        </p>
                        <p className="text-sm">
                          {attendanceData.length === 0
                            ? "No attendance data available for this teacher"
                            : "No records match your current filters"}
                        </p>
                        {attendanceData.length > 0 && (
                          <Button
                            variant="outline"
                            onClick={resetFilters}
                            className="mt-3"
                          >
                            Clear Filters
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Attendcebyteacher;
