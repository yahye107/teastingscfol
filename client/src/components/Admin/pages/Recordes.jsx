import React, { useState, useEffect, useMemo } from "react";
import {
  callGetPaymentsByClassIdApi,
  callGetAllClassroomsApi,
  callGetStudentsByClassroomApi,
} from "@/service/service";
import { Button } from "@/components/ui/button";
import SearchableSelect from "@/components/common/SearchableSelect";
import GlobalLoader from "@/components/common/GlobalLoader";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Filter,
  X,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";

const Records = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [expandedStudents, setExpandedStudents] = useState({});

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterAcademicYear, setFilterAcademicYear] = useState("all"); // NEW: Academic year filter
  const [filterStatus, setFilterStatus] = useState("all");

  // Months for filtering
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Toggle student details
  const toggleStudentDetails = (studentId) => {
    setExpandedStudents((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  // Fetch classrooms on component mount
  useEffect(() => {
    const fetchClassrooms = async () => {
      setLoading(true);
      try {
        const response = await callGetAllClassroomsApi();
        setClassrooms(response.classrooms || []);
      } catch (error) {
        console.error("Failed to fetch classrooms:", error);
        toast.error("Failed to load classrooms");
      } finally {
        setLoading(false);
      }
    };

    fetchClassrooms();
  }, []);

  // Fetch students when a classroom is selected
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClassroom) return;

      setStudentsLoading(true);
      try {
        const response = await callGetStudentsByClassroomApi(
          selectedClassroom._id
        );
        setStudents(response.students || []);
        // Reset expanded state
        setExpandedStudents({});
      } catch (error) {
        console.error("Failed to fetch students:", error);
        toast.error("Failed to load students");
      } finally {
        setStudentsLoading(false);
      }
    };

    fetchStudents();
  }, [selectedClassroom]);

  // Fetch payments when students change
  useEffect(() => {
    const fetchPayments = async () => {
      if (!selectedClassroom || students.length === 0) return;

      setPaymentsLoading(true);
      try {
        const response = await callGetPaymentsByClassIdApi(
          selectedClassroom._id
        );
        setPayments(response.data || []);
      } catch (error) {
        console.error("Failed to fetch payments:", error);
        toast.error("Failed to load payment records");
      } finally {
        setPaymentsLoading(false);
      }
    };

    fetchPayments();
  }, [selectedClassroom, students]);

  // Create student map for consistent student data
  const studentMap = useMemo(() => {
    const map = {};
    students.forEach((student) => {
      map[student._id] = student;
    });
    return map;
  }, [students]);

  // Filtered payments with improved search
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      // Get consistent student data from studentMap
      const student = studentMap[payment.student?._id] || payment.student;
      const studentName =
        student?.user?.fullName?.toLowerCase() || "unknown student";

      // Search term filter - FIXED: search works properly now
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matches = [
          studentName,
          payment.month?.toLowerCase(),
          payment.academicYear?.toLowerCase(),
          payment.year?.toString(),
          payment.method?.toLowerCase(),
          payment.status?.toLowerCase(),
          payment.sentBy?.toLowerCase(),
          payment.note?.toLowerCase(),
        ].some((value) => value?.includes(term));

        if (!matches) return false;
      }

      // Other filters
      if (filterMonth !== "all" && payment.month !== filterMonth) return false;
      if (filterYear !== "all" && payment.year.toString() !== filterYear)
        return false;
      // NEW: Academic year filter
      if (
        filterAcademicYear !== "all" &&
        payment.academicYear !== filterAcademicYear
      )
        return false;
      if (filterStatus !== "all" && payment.status !== filterStatus)
        return false;

      return true;
    });
  }, [
    payments,
    searchTerm,
    filterMonth,
    filterYear,
    filterAcademicYear,
    filterStatus,
    studentMap,
  ]);

  // Group payments by student
  const paymentsByStudent = useMemo(() => {
    const grouped = {};

    filteredPayments.forEach((payment) => {
      const studentId = payment.student?._id;
      if (!studentId) return;

      if (!grouped[studentId]) {
        // FIXED: Use consistent student data from studentMap
        grouped[studentId] = {
          student: studentMap[studentId] || payment.student,
          payments: [],
        };
      }

      grouped[studentId].payments.push(payment);
    });

    // Add students without payments - FIXED: Use consistent student data
    students.forEach((student) => {
      if (!grouped[student._id]) {
        grouped[student._id] = {
          student: studentMap[student._id] || student,
          payments: [],
        };
      }
    });

    return grouped;
  }, [filteredPayments, students, studentMap]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    return {
      totalPaid: filteredPayments.reduce((sum, pay) => sum + pay.amount, 0),
      totalStudents: Object.keys(paymentsByStudent).length,
      paidCount: filteredPayments.filter((p) => p.status === "Paid").length,
      pendingCount: filteredPayments.filter((p) => p.status === "Unpaid")
        .length,
      partialCount: filteredPayments.filter((p) => p.status === "Partial")
        .length,
    };
  }, [filteredPayments, paymentsByStudent]);

  // Get unique academic years for filter
  const academicYears = useMemo(() => {
    const years = new Set();
    payments.forEach((payment) => {
      if (payment.academicYear) {
        years.add(payment.academicYear);
      }
    });
    return Array.from(years).sort().reverse();
  }, [payments]);

  // Export to CSV
  const exportToCSV = () => {
    if (filteredPayments.length === 0) {
      toast.info("No data to export");
      return;
    }

    const headers = [
      "Student Name",
      "Class",
      "Month",
      "Year",
      "Academic Year", // NEW: Added academic year
      "Amount",
      "Status",
      "Method",
      "Payment Date",
      "Due Date",
      "Sent By",
      "Note",
    ];

    const rows = filteredPayments.map((pay) => {
      // FIXED: Use consistent student data
      const student = studentMap[pay.student?._id] || pay.student;
      return [
        student?.user?.fullName || "Unknown",
        selectedClassroom?.name || "Unknown",
        pay.month || "Unknown",
        pay.year,
        pay.academicYear || "N/A", // NEW: Academic year
        `$${pay.amount.toFixed(2)}`,
        pay.status,
        pay.method,
        pay.date ? format(new Date(pay.date), "MMM dd, yyyy") : "N/A",
        pay.dueDate ? format(new Date(pay.dueDate), "MMM dd, yyyy") : "N/A",
        pay.sentBy || "N/A",
        pay.note || "",
      ];
    });

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += headers.join(",") + "\r\n";
    rows.forEach((row) => {
      csvContent += row.map((field) => `"${field}"`).join(",") + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `payments-${selectedClassroom?.name || "class"}-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <GlobalLoader />;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Class Payment Records</CardTitle>
          <CardDescription>
            Search for a class, view payment records, and generate reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Select Class
              </label>
              <SearchableSelect
                options={classrooms.map((c) => ({
                  label: c.name,
                  value: c._id,
                }))}
                value={selectedClassroom?._id || ""}
                onChange={(value) => {
                  const classroom = classrooms.find((c) => c._id === value);
                  setSelectedClassroom(classroom);
                  setFilterMonth("all");
                  setFilterYear("all");
                  setFilterAcademicYear("all"); // Reset academic year filter
                  setFilterStatus("all");
                  setSearchTerm("");
                }}
                placeholder="Search and select class"
              />
            </div>

            {selectedClassroom && (
              <Card className="bg-blue-50 border border-blue-100">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="font-medium text-gray-700">Class:</div>
                    <div>{selectedClassroom.name}</div>

                    <div className="font-medium text-gray-700">Students:</div>
                    <div>{students.length}</div>

                    <div className="font-medium text-gray-700">
                      Total Payments:
                    </div>
                    <div>{filteredPayments.length}</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {selectedClassroom && (
            <>
              <div className="flex flex-wrap items-center gap-4 py-4 border-t border-gray-200">
                <div className="relative flex-1 min-w-[300px]">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    placeholder="Search payments by student, month, academic year..."
                    className="pl-10 py-5"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setFilterMonth("all");
                      setFilterYear("all");
                      setFilterAcademicYear("all");
                      setFilterStatus("all");
                    }}
                    className="flex items-center"
                  >
                    <X className="mr-2 h-4 w-4" /> Clear
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={exportToCSV}
                    disabled={filteredPayments.length === 0}
                    className="flex items-center"
                  >
                    <Download className="mr-2 h-4 w-4" /> Download Report
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Month
                  </label>
                  <Select value={filterMonth} onValueChange={setFilterMonth}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Months" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Months</SelectItem>
                      {months.map((month) => (
                        <SelectItem key={month} value={month}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Year
                  </label>
                  <Select value={filterYear} onValueChange={setFilterYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {Array.from(
                        { length: 10 },
                        (_, i) => new Date().getFullYear() - i
                      ).map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* NEW: Academic Year Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Academic Year
                  </label>
                  <Select
                    value={filterAcademicYear}
                    onValueChange={setFilterAcademicYear}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Academic Years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Academic Years</SelectItem>
                      {academicYears.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Status
                  </label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Unpaid">Unpaid</SelectItem>
                      <SelectItem value="Partial">Partial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card className="border border-blue-100">
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-500 mb-1">Total Paid</div>
                    <div className="text-2xl font-bold text-blue-600">
                      ${summary.totalPaid.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-green-100">
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-500 mb-1">Students</div>
                    <div className="text-2xl font-bold text-green-600">
                      {summary.totalStudents}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-purple-100">
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-500 mb-1">
                      Paid Records
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                      {summary.paidCount}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-amber-100">
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-500 mb-1">
                      Pending/Partial
                    </div>
                    <div className="text-2xl font-bold text-amber-600">
                      {summary.pendingCount + summary.partialCount}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {studentsLoading || paymentsLoading ? (
                <GlobalLoader />
              ) : students.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="text-xl font-medium mb-2">
                      No students found
                    </div>
                    <p className="text-gray-500">
                      This class doesn't have any enrolled students
                    </p>
                  </CardContent>
                </Card>
              ) : Object.keys(paymentsByStudent).length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="text-xl font-medium mb-2">
                      No payment records
                    </div>
                    <p className="text-gray-500">
                      No payments match your search criteria
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Student Payment Records</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead className="text-right">
                            Total Paid
                          </TableHead>
                          <TableHead className="text-center">Records</TableHead>
                          <TableHead>Last Payment</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(paymentsByStudent).map(
                          ([studentId, { student, payments }]) => {
                            const totalPaid = payments.reduce(
                              (sum, p) => sum + p.amount,
                              0
                            );
                            const lastPayment =
                              payments.length > 0
                                ? new Date(
                                    Math.max(
                                      ...payments.map((p) =>
                                        new Date(p.date).getTime()
                                      )
                                    )
                                  )
                                : null;

                            // Get most common status or default
                            const statusCount = payments.reduce((acc, p) => {
                              acc[p.status] = (acc[p.status] || 0) + 1;
                              return acc;
                            }, {});

                            const mostFrequentStatus = Object.keys(
                              statusCount
                            ).reduce(
                              (a, b) =>
                                statusCount[a] > statusCount[b] ? a : b,
                              "No Payments"
                            );

                            const isExpanded = expandedStudents[studentId];

                            return (
                              <React.Fragment key={studentId}>
                                <TableRow className="hover:bg-gray-50">
                                  <TableCell className="font-medium">
                                    {/* FIXED: Consistent student name */}
                                    {student?.user?.fullName ||
                                      "Unknown Student"}
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    ${totalPaid.toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge variant="outline">
                                      {payments.length}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {lastPayment
                                      ? format(lastPayment, "MMM dd, yyyy")
                                      : "N/A"}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        mostFrequentStatus === "Paid"
                                          ? "success"
                                          : mostFrequentStatus === "Pending"
                                          ? "warning"
                                          : mostFrequentStatus === "Partial"
                                          ? "destructive"
                                          : "outline"
                                      }
                                    >
                                      {mostFrequentStatus}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() =>
                                        toggleStudentDetails(studentId)
                                      }
                                    >
                                      {isExpanded ? (
                                        <ChevronUp className="h-4 w-4" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </TableCell>
                                </TableRow>

                                {isExpanded && payments.length > 0 && (
                                  <TableRow>
                                    <TableCell colSpan={6} className="p-0">
                                      <div className="p-4 bg-gray-50 border-t">
                                        <h3 className="font-medium mb-3 text-gray-700">
                                          Payment Details
                                        </h3>
                                        <div className="overflow-x-auto">
                                          <table className="min-w-full divide-y divide-gray-200">
                                            <thead>
                                              <tr className="bg-gray-100">
                                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                                                  Month/Year
                                                </th>
                                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                                                  Academic Year
                                                </th>
                                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                                                  Amount
                                                </th>
                                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                                                  Method
                                                </th>
                                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                                                  Date
                                                </th>
                                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                                                  Status
                                                </th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                              {payments.map((payment) => (
                                                <tr
                                                  key={payment._id}
                                                  className="hover:bg-gray-50"
                                                >
                                                  <td className="px-4 py-2 text-sm">
                                                    {payment.month}{" "}
                                                    {payment.year}
                                                  </td>
                                                  <td className="px-4 py-2 text-sm">
                                                    {payment.academicYear ||
                                                      "N/A"}
                                                  </td>
                                                  <td className="px-4 py-2 text-sm font-medium">
                                                    ${payment.amount.toFixed(2)}
                                                  </td>
                                                  <td className="px-4 py-2 text-sm">
                                                    {payment.method}
                                                  </td>
                                                  <td className="px-4 py-2 text-sm">
                                                    {payment.date
                                                      ? format(
                                                          new Date(
                                                            payment.date
                                                          ),
                                                          "MMM dd, yyyy"
                                                        )
                                                      : "N/A"}
                                                  </td>
                                                  <td className="px-4 py-2 text-sm">
                                                    <Badge
                                                      variant={
                                                        payment.status ===
                                                        "Paid"
                                                          ? "success"
                                                          : payment.status ===
                                                            "Pending"
                                                          ? "warning"
                                                          : "destructive"
                                                      }
                                                      className="text-xs"
                                                    >
                                                      {payment.status}
                                                    </Badge>
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </React.Fragment>
                            );
                          }
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Records;
