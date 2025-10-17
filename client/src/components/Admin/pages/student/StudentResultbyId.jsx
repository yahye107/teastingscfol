import React, { useEffect, useState } from "react";
import {
  callGetAllStudentsidbyApi,
  callGetStudentResultsApi,
  callGetAttendanceRatesBySubjectApi,
  callGetRegisteredAcademicYearsApi,
  callUpdateResultForStudentApi,
  callGetAllsubjectssApi,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Edit2,
  Save,
  X,
  Download,
  User,
  BookOpen,
  Calendar,
  BarChart3,
  Award,
} from "lucide-react";
import { ClipLoader } from "react-spinners";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import GlobalLoader from "@/components/common/GlobalLoader";
import SearchableSelect from "@/components/common/SearchableSelect";
import { useUser } from "@/useContaxt/UseContext";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import exportData from "@/components/common/Export";

const updateSchema = z.object({
  firstExam: z.number().min(0).max(100).optional(),
  midExam: z.number().min(0).max(100).optional(),
  thirdExam: z.number().min(0).max(100).optional(),
  finalExam: z.number().min(0).max(100).optional(),
  activities: z.number().min(0).max(100).optional(),
});

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const StudentResultbyId = () => {
  const [student, setStudent] = useState(null);
  const [results, setResults] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedYear, setSelectedYear] = useState("");
  const [attendanceRates, setAttendanceRates] = useState({});
  const [editingResultId, setEditingResultId] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const { id } = useParams();
  const { user } = useUser();
  const navigate = useNavigate();
  // Use ref to track editing result ID reliably
  const editingResultRef = React.useRef(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      firstExam: 0,
      midExam: 0,
      thirdExam: 0,
      finalExam: 0,
      activities: 0,
    },
  });

  // Fetch initial student data (without results)
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
          setSelectedYear(yearsRes[0]);
        }
      } catch (error) {
        toast.error("Failed to load student data");
        console.error("Error fetching data:", error);
      } finally {
        const elapsed = Date.now() - start;
        const minTime = 1000; // 2s minimum
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

  // Fetch results when studentId or academicYear changes
  useEffect(() => {
    const fetchResults = async () => {
      if (!id || !selectedYear) return;

      try {
        setResultsLoading(true);
        const response = await callGetStudentResultsApi(id, selectedYear);

        setResults(response?.data?.results || []);
        // console.log("API Results:", response?.data?.results);
      } catch (error) {
        console.error("Error fetching results:", error);
        toast.error("Failed to load student results");
        setResults([]);
      } finally {
        setResultsLoading(false);
      }
    };

    fetchResults();
  }, [id, selectedYear]);

  // Calculate statistics based on API results
  useEffect(() => {
    if (results.length > 0 && selectedYear) {
      const totals = results.map((result) => ({
        subject: result.subject,
        total: result.total,
        attendance: result.attendanceRate || 0,
      }));

      const averageTotal =
        totals.length > 0
          ? totals.reduce((sum, item) => sum + item.total, 0) / totals.length
          : 0;

      const gradeDistribution = {
        A: totals.filter((item) => item.total >= 90).length,
        B: totals.filter((item) => item.total >= 80 && item.total < 90).length,
        C: totals.filter((item) => item.total >= 70 && item.total < 80).length,
        D: totals.filter((item) => item.total >= 60 && item.total < 70).length,
        F: totals.filter((item) => item.total < 60).length,
      };

      setStats({
        averageTotal: Math.round(averageTotal * 10) / 10,
        totalSubjects: totals.length,
        gradeDistribution,
        subjectTotals: totals,
      });
    } else {
      setStats(null);
    }
  }, [results, selectedYear]);

  // Fetch attendance rates
  useEffect(() => {
    const fetchAttendanceRates = async () => {
      if (!student || !selectedYear || !student.classId?._id) return;

      try {
        const classId = student.classId._id;
        let newAttendanceRates = {};

        if (selectedSubject === "all") {
          const attendancePromises = results
            .filter((result) => result.academicYear === selectedYear)
            .map(async (result) => {
              const subject = subjects.find((s) => s.name === result.subject);
              if (!subject?._id) return null;

              try {
                const response = await callGetAttendanceRatesBySubjectApi(
                  classId,
                  subject._id,
                  selectedYear
                );

                const studentAttendance = response?.data?.find(
                  (item) => item.studentId?.toString() === student._id
                );

                return {
                  subjectId: subject._id,
                  attendanceRate: Number(
                    studentAttendance?.attendanceRate ??
                      result.attendanceRate ??
                      0
                  ),
                };
              } catch (error) {
                return {
                  subjectId: subject._id,
                  attendanceRate: result.attendanceRate || 0,
                };
              }
            });

          const validPromises = attendancePromises.filter((p) => p !== null);
          const attendanceResults = await Promise.all(validPromises);

          attendanceResults.forEach((result) => {
            if (result) {
              newAttendanceRates[result.subjectId] = result.attendanceRate;
            }
          });
        } else {
          try {
            const subject = subjects.find((s) => s._id === selectedSubject);
            const response = await callGetAttendanceRatesBySubjectApi(
              classId,
              selectedSubject,
              selectedYear
            );

            const studentAttendance = response?.data?.find(
              (item) => item.studentId?.toString() === student._id
            );

            newAttendanceRates[selectedSubject] = Number(
              studentAttendance?.attendanceRate ?? 0
            );
          } catch (error) {
            newAttendanceRates[selectedSubject] = 0;
          }
        }

        setAttendanceRates(newAttendanceRates);
      } catch (error) {
        console.error("Error fetching attendance rates:", error);
        const fallbackRates = {};
        results.forEach((result) => {
          const subject = subjects.find((s) => s.name === result.subject);
          if (subject) {
            fallbackRates[subject._id] = result.attendanceRate || 0;
          }
        });
        setAttendanceRates(fallbackRates);
      }
    };

    if (results.length > 0) {
      fetchAttendanceRates();
    }
  }, [student, selectedSubject, selectedYear, results, subjects]);

  // Filter results
  const filteredResults = results.filter((result) => {
    const subjectMatch =
      selectedSubject === "all" ||
      result.subject === selectedSubject ||
      subjects.find((s) => s._id === selectedSubject)?.name === result.subject;
    return subjectMatch;
  });

  // FIXED: Handle edit with proper state management
  const handleEdit = (result) => {
    // console.log("✏️ Editing result:", result);
    // console.log("📊 Result ID from data:", result._id || result.id);

    const resultId = result._id || result.id;
    editingResultRef.current = resultId;
    setEditingResultId(resultId);

    const setFormValue = (field, value) => {
      const numValue = Number(value) || 0;
      // console.log(`📝 Setting ${field}:`, {
      //   original: value,
      //   converted: numValue,
      // });
      setValue(field, numValue);
    };

    setFormValue("firstExam", result.firstExam);
    setFormValue("midExam", result.midExam);
    setFormValue("thirdExam", result.thirdExam);
    setFormValue("finalExam", result.finalExam);
    setFormValue("activities", result.activities);

    setEditDialogOpen(true);

    // setTimeout(() => {
    //   console.log("✅ After handleEdit:");
    //   console.log("   - editingResultId state:", editingResultId);
    //   console.log("   - editingResultRef:", editingResultRef.current);
    //   console.log("   - editDialogOpen:", editDialogOpen);
    //   console.log("   - Current form values:", watch());
    // }, 100);
  };

  // FIXED: Handle cancel edit
  const handleCancelEdit = () => {
    // console.log("❌ Canceling edit");
    editingResultRef.current = null;
    setEditingResultId(null);
    setEditDialogOpen(false);
    reset({
      firstExam: 0,
      midExam: 0,
      thirdExam: 0,
      finalExam: 0,
      activities: 0,
    });
  };

  // FIXED: Enhanced form input handling
  const handleInputChange = (field, value) => {
    const numValue = value === "" ? 0 : Number(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setValue(field, numValue);
    }
  };

  // FIXED: Handle update result with better error handling
  const handleUpdateResult = async (data) => {
    // console.log("🎯 FORM SUBMITTED");
    // console.log("📝 Form data received:", data);

    const currentEditingId = editingResultRef.current || editingResultId;
    // console.log("🆔 Using result ID:", currentEditingId);

    if (!currentEditingId) {
      // console.log("❌ NO RESULT ID AVAILABLE");
      toast.error("No result selected for editing");
      return;
    }

    if (!user?._id) {
      toast.error("User not authenticated");
      return;
    }

    try {
      setUpdating(true);

      const formatField = (value) => {
        const num = Number(value);
        return isNaN(num) ? 0 : Math.max(0, Math.min(100, num));
      };

      const formattedData = {
        firstExam: formatField(data.firstExam),
        midExam: formatField(data.midExam),
        thirdExam: formatField(data.thirdExam),
        finalExam: formatField(data.finalExam),
        activities: formatField(data.activities),
        updatedBy: user._id,
      };

      // console.log("📤 Final formatted data for API:", formattedData);

      const validationErrors = [];
      Object.entries(formattedData).forEach(([key, value]) => {
        if (key !== "updatedBy" && (value < 0 || value > 100)) {
          validationErrors.push(`${key}: ${value} (must be 0-100)`);
        }
      });

      if (validationErrors.length > 0) {
        // console.log("❌ Validation errors:", validationErrors);
        toast.error(`Invalid scores: ${validationErrors.join(", ")}`);
        return;
      }

      // console.log("🚀 Calling update API with:", {
      //   resultId: currentEditingId,
      //   data: formattedData,
      // });

      const response = await callUpdateResultForStudentApi(
        currentEditingId,
        formattedData
      );

      // console.log("✅ API Response:", response);

      // FIXED: Check if response is the updated object (has _id) instead of checking status
      if (response && response._id) {
        // console.log("✅ Update successful - received updated result object");
        toast.success("Result updated successfully");

        // Update the local state with the updated result
        setResults((prevResults) =>
          prevResults.map((result) =>
            result._id === currentEditingId
              ? {
                  ...result,
                  ...formattedData,
                  total: calculateNewTotal(formattedData),
                }
              : result
          )
        );

        handleCancelEdit();
      } else if (
        response &&
        (response.status === 200 || response.status === 201)
      ) {
        // Fallback: if API returns proper HTTP response
        // console.log("✅ Update successful - received HTTP response");
        toast.success("Result updated successfully");

        // console.log("🔄 Refetching results...");
        const resultsResponse = await callGetStudentResultsApi(
          id,
          selectedYear
        );
        // console.log("📥 New results:", resultsResponse.data);

        setResults(resultsResponse.data?.results || []);
        handleCancelEdit();
      } else {
        throw new Error(
          `Unexpected response format: ${JSON.stringify(response)}`
        );
      }
    } catch (error) {
      // console.error("❌ UPDATE ERROR DETAILS:");
      // console.error("   - Error message:", error.message);
      // console.error("   - Response status:", error.response?.status);
      // console.error("   - Response data:", error.response?.data);
      // console.error("   - Full error:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Unknown error occurred";

      toast.error(`Failed to update result: ${errorMessage}`);
    } finally {
      setUpdating(false);
    }
  };

  // Calculate total marks
  const calculateTotal = (result) => {
    return result.total;
  };

  // Get grade based on total
  const getGrade = (total) => {
    if (total >= 90)
      return { grade: "A", color: "bg-green-100 text-green-800" };
    if (total >= 80) return { grade: "B", color: "bg-blue-100 text-blue-800" };
    if (total >= 70)
      return { grade: "C", color: "bg-yellow-100 text-yellow-800" };
    if (total >= 60)
      return { grade: "D", color: "bg-orange-100 text-orange-800" };
    return { grade: "F", color: "bg-red-100 text-red-800" };
  };

  // Prepare chart data
  const chartData = filteredResults.map((result) => {
    const total = calculateTotal(result);
    const gradeInfo = getGrade(total);
    return {
      subject: result.subject,
      total,
      grade: gradeInfo.grade,
      firstExam: result.firstExam || 0,
      midExam: result.midExam || 0,
      thirdExam: result.thirdExam || 0,
      finalExam: result.finalExam || 0,
      activities: result.activities || 0,
    };
  });
  const optionsWithAll = [{ label: "All", value: "all" }, ...subjects];
  const gradeData = stats
    ? Object.entries(stats.gradeDistribution).map(([grade, count]) => ({
        name: grade,
        value: count,
      }))
    : [];
  const headers = [
    "Subject",
    "First Exam",
    "Mid Exam",
    "Third Exam",
    "Final Exam",
    "Activities",
    "Total",
    "Grade",
    "Status",
  ];
  const rows = results.map((res) => {
    const total =
      res.firstExam +
      res.midExam +
      res.thirdExam +
      res.finalExam +
      res.activities;
    const grade =
      total >= 90
        ? "A"
        : total >= 80
          ? "B"
          : total >= 70
            ? "C"
            : total >= 60
              ? "D"
              : "F";
    const status = total >= 50 ? "Pass" : "Fail";

    return [
      res.subject || "Unknown",
      res.firstExam ?? 0,
      res.midExam ?? 0,
      res.thirdExam ?? 0,
      res.finalExam ?? 0,
      res.activities ?? 0,
      total,
      grade,
      status,
    ];
  });
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
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left side: back + title */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button
            onClick={() => navigate(`/admin/dashboard/StudentInfobyid/${id}`)}
          >
            ← Back
          </Button>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Student Results
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Manage and view student academic performance
            </p>
          </div>
        </div>

        {/* Right side: Export */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer w-full sm:w-auto text-center">
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

      {/* Student Info Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Student Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Full Name</p>
              <p className="text-lg font-semibold">{student.user?.fullName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">
                Admission Number
              </p>
              <Badge variant="secondary">{student.admissionNumber}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Class</p>
              <p className="text-lg font-semibold">{student.classId?.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Parent</p>
              <p className="text-lg font-semibold">
                {student.parent?.user?.fullName || "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Content */}
      <Tabs defaultValue="results" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="results" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Results
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <SearchableSelect
                    options={optionsWithAll}
                    value={selectedSubject}
                    onChange={setSelectedSubject}
                    placeholder="Select Subject"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Academic Year</label>
                  <SearchableSelect
                    options={academicYears.map((year) => ({
                      label: year,
                      value: year,
                    }))}
                    value={selectedYear}
                    onChange={setSelectedYear}
                    placeholder="Academic Year"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Table */}
          {!selectedYear ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center text-gray-500">
                  <Calendar className="mx-auto h-12 w-12 mb-4" />
                  <p>Please select an academic year to view results</p>
                </div>
              </CardContent>
            </Card>
          ) : resultsLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <ClipLoader size={32} color="#3B82F6" />
                  <p className="mt-2 text-gray-500">Loading results...</p>
                </div>
              </CardContent>
            </Card>
          ) : filteredResults.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center text-gray-500">
                  <BookOpen className="mx-auto h-12 w-12 mb-4" />
                  <p>No results found for the selected criteria</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Academic Results</CardTitle>
                <CardDescription>
                  Showing results for {selectedYear}
                  {selectedSubject !== "all" &&
                    ` • ${subjects.find((s) => s._id === selectedSubject)?.name}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-center">
                          Attendance
                        </TableHead>
                        <TableHead className="text-center">
                          First Exam
                        </TableHead>
                        <TableHead className="text-center">Mid Exam</TableHead>
                        <TableHead className="text-center">
                          Third Exam
                        </TableHead>
                        <TableHead className="text-center">
                          Final Exam
                        </TableHead>
                        <TableHead className="text-center">
                          Activities
                        </TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead className="text-center">Grade</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResults.map((result) => {
                        const subject = subjects.find(
                          (s) => s.name === result.subject
                        );
                        const subjectId = subject?._id;
                        const attendanceRate = subjectId
                          ? Number(attendanceRates[subjectId]) ||
                            result.attendanceRate ||
                            0
                          : result.attendanceRate || 0;

                        const total = calculateTotal(result);
                        const gradeInfo = getGrade(total);

                        return (
                          <TableRow key={result._id}>
                            <TableCell className="font-medium">
                              {result.subject || "Unknown Subject"}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={
                                  attendanceRate >= 80
                                    ? "default"
                                    : attendanceRate >= 60
                                      ? "secondary"
                                      : "destructive"
                                }
                              >
                                {attendanceRate.toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {result.firstExam?.toFixed(1) || "0.0"}
                            </TableCell>
                            <TableCell className="text-center">
                              {result.midExam?.toFixed(1) || "0.0"}
                            </TableCell>
                            <TableCell className="text-center">
                              {result.thirdExam?.toFixed(1) || "0.0"}
                            </TableCell>
                            <TableCell className="text-center">
                              {result.finalExam?.toFixed(1) || "0.0"}
                            </TableCell>
                            <TableCell className="text-center">
                              {result.activities?.toFixed(1) || "0.0"}
                            </TableCell>
                            <TableCell className="text-center font-semibold">
                              {total.toFixed(1)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className={gradeInfo.color}>
                                {gradeInfo.grade}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(result)}
                                className="flex items-center gap-1"
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
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {stats && selectedYear && !resultsLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Performance Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {stats.averageTotal}
                      </p>
                      <p className="text-sm text-blue-600">Average Score</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {stats.totalSubjects}
                      </p>
                      <p className="text-sm text-green-600">Total Subjects</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">
                        {results.length > 0
                          ? results.reduce((sum, r) => sum + (r.total || 0), 0)
                          : 0}
                      </p>
                      <p className="text-sm text-red-600">Total Marks</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Grade Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Grade Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={gradeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {gradeData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Subject Performance */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Subject Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="subject" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="firstExam"
                        name="First Exam"
                        fill="#0088FE"
                      />
                      <Bar dataKey="midExam" name="Mid Exam" fill="#00C49F" />
                      <Bar
                        dataKey="thirdExam"
                        name="Third Exam"
                        fill="#FFBB28"
                      />
                      <Bar
                        dataKey="finalExam"
                        name="Final Exam"
                        fill="#FF8042"
                      />
                      <Bar
                        dataKey="activities"
                        name="Activities"
                        fill="#8884D8"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center text-gray-500">
                  <BarChart3 className="mx-auto h-12 w-12 mb-4" />
                  <p>
                    {resultsLoading
                      ? "Loading analytics..."
                      : "Select an academic year to view analytics"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog - FIXED */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          // console.log("🔘 Dialog open change:", open);
          if (!open) {
            handleCancelEdit();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Result</DialogTitle>
            <DialogDescription>
              Update the marks for{" "}
              {
                filteredResults.find(
                  (r) =>
                    (r._id || r.id) ===
                    (editingResultRef.current || editingResultId)
                )?.subject
              }
              {editingResultRef.current && ` (ID: ${editingResultRef.current})`}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleSubmit(
              (data) => {
                // console.log("✅ Form submitted with data:", data);
                // console.log("🆔 Current editing ID:", editingResultRef.current);
                handleUpdateResult(data);
              },
              (errors) => {
                // console.log("❌ Form validation errors:", errors);
              }
            )}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              {[
                { field: "firstExam", label: "First Exam" },
                { field: "midExam", label: "Mid Exam" },
                { field: "thirdExam", label: "Third Exam" },
                { field: "finalExam", label: "Final Exam" },
                { field: "activities", label: "Activities", fullWidth: true },
              ].map(({ field, label, fullWidth }) => (
                <div key={field} className={fullWidth ? "col-span-2" : ""}>
                  <label className="text-sm font-medium">{label}</label>
                  <Input
                    type="number"
                    defaultValue={
                      filteredResults.find(
                        (r) =>
                          (r._id || r.id) ===
                          (editingResultRef.current || editingResultId)
                      )?.[field] ?? 0
                    }
                    {...register(field, {
                      valueAsNumber: true,
                      min: 0,
                      max: 100,
                    })}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    onBlur={(e) => {
                      if (e.target.value === "") {
                        setValue(field, 0);
                      }
                    }}
                    min={0}
                    max={100}
                    step="0.1"
                    className="text-center"
                  />

                  {errors[field] && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors[field].message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Current: {watch(field)}
                  </p>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEdit}
                disabled={updating}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button type="submit" disabled={updating}>
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
  );
};

export default StudentResultbyId;
