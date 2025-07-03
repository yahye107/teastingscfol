import React, { useState, useMemo } from "react";
import { useUser } from "@/useContaxt/UseContext";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Filter, X, Search } from "lucide-react";
import { format } from "date-fns";
import GlobalLoader from "@/components/common/GlobalLoader";
import { useEffect } from "react";

const Fees = () => {
  const { user } = useUser();
  const studentInfo = user?.studentProfile;
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [loading, setLoading] = useState(true);
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

  // Extract fee records from studentInfo
  const feeRecords = studentInfo?.feeRecordes || [];

  useEffect(() => {
    // Set timeout for 2 seconds (2000 ms)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    // Cleanup timeout if component unmounts
    return () => clearTimeout(timer);
  }, []);
  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalPaid = feeRecords
      .filter((r) => r.status === "Paid")
      .reduce((sum, record) => sum + record.amount, 0);

    const monthlyFee = studentInfo?.classId?.monthlyFee || 0;
    const totalDebt = feeRecords
      .filter((r) => r.status !== "Paid")
      .reduce((sum, record) => sum + (monthlyFee - record.amount), 0);

    return {
      totalPaid,
      totalDebt: totalDebt > 0 ? totalDebt : 0,
      paidCount: feeRecords.filter((r) => r.status === "Paid").length,
      pendingCount: feeRecords.filter((r) => r.status === "Unpaid").length,
      partialCount: feeRecords.filter((r) => r.status === "Partial").length,
      totalRecords: feeRecords.length,
    };
  }, [feeRecords, studentInfo]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return feeRecords.filter((record) => {
      // Search term filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matches = [
          record.month?.toLowerCase(),
          record.year?.toString(),
          record.method?.toLowerCase(),
          record.status?.toLowerCase(),
          record.sentBy?.toLowerCase(),
          record.note?.toLowerCase(),
          record.academicYear?.toLowerCase(),
        ].some((value) => value?.includes(term));

        if (!matches) return false;
      }

      // Other filters
      if (filterYear !== "all" && record.year.toString() !== filterYear)
        return false;
      if (filterMonth !== "all" && record.month !== filterMonth) return false;
      if (filterStatus !== "all" && record.status !== filterStatus)
        return false;

      return true;
    });
  }, [feeRecords, searchTerm, filterYear, filterMonth, filterStatus]);

  // Available years from records
  const availableYears = useMemo(() => {
    const years = new Set();
    feeRecords.forEach((record) => years.add(record.year.toString()));
    return Array.from(years).sort((a, b) => b - a);
  }, [feeRecords]);

  // Export to CSV
  const exportToCSV = () => {
    if (filteredRecords.length === 0) return;

    const headers = [
      "Month",
      "Year",
      "Academic Year",
      "Amount",
      "Status",
      "Method",
      "Payment Date",
      "Due Date",
      "Sent By",
      "Note",
    ];

    const rows = filteredRecords.map((record) => [
      record.month || "Unknown",
      record.year,
      record.academicYear,
      `$${record.amount.toFixed(2)}`,
      record.status,
      record.method,
      record.date ? format(new Date(record.date), "MMM dd, yyyy") : "N/A",
      record.dueDate ? format(new Date(record.dueDate), "MMM dd, yyyy") : "N/A",
      record.sentBy || "N/A",
      record.note || "",
    ]);

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
      `fee-records-${user?.fullName || "student"}-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!studentInfo) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Fee Information</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No fee information available for your account
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (loading) return <GlobalLoader />;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fee Records</CardTitle>
          <CardDescription>
            View your payment history and fee status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Student Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border border-blue-100">
              <CardContent className="p-4">
                <div className="text-sm text-gray-500 mb-1">Student</div>
                <div className="text-lg font-medium truncate">
                  {user?.fullName || "Unknown"}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-green-100">
              <CardContent className="p-4">
                <div className="text-sm text-gray-500 mb-1">Monthly Fee</div>
                <div className="text-lg font-medium text-green-600">
                  ${studentInfo?.classId?.monthlyFee?.toFixed(2) || "0.00"}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-purple-100">
              <CardContent className="p-4">
                <div className="text-sm text-gray-500 mb-1">Class</div>
                <div className="text-lg font-medium">
                  {studentInfo?.classId?.name || "Unknown"}
                  {studentInfo?.classId?.section &&
                    ` (${studentInfo.classId.section})`}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Actions */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="relative flex-1 min-w-[300px]">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                placeholder="Search records by month, year, method..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setFilterYear("all");
                  setFilterMonth("all");
                  setFilterStatus("all");
                }}
                className="flex items-center"
              >
                <X className="mr-2 h-4 w-4" /> Clear
              </Button>

              <Button
                variant="secondary"
                onClick={exportToCSV}
                disabled={filteredRecords.length === 0}
                className="flex items-center"
              >
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

            <Card className="border border-rose-100">
              <CardContent className="p-4">
                <div className="text-sm text-gray-500 mb-1">Total Debt</div>
                <div className="text-2xl font-bold text-rose-600">
                  ${summary.totalDebt.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-green-100">
              <CardContent className="p-4">
                <div className="text-sm text-gray-500 mb-1">Paid Records</div>
                <div className="text-2xl font-bold text-green-600">
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

          {/* Fee Records Table */}
          {filteredRecords.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-xl font-medium mb-2">
                  {feeRecords.length === 0
                    ? "No fee records available"
                    : "No records match your filters"}
                </div>
                <p className="text-gray-500">
                  {feeRecords.length === 0
                    ? "You don't have any fee records yet"
                    : "Try adjusting your search or filters"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Month/Year</TableHead>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Sent By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record._id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {record.month || "Unknown"} {record.year}
                      </TableCell>
                      <TableCell>{record.academicYear}</TableCell>
                      <TableCell>${record.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            record.status === "Paid"
                              ? "success"
                              : record.status === "Pending"
                              ? "warning"
                              : "destructive"
                          }
                        >
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.method}</TableCell>
                      <TableCell>
                        {record.date
                          ? format(new Date(record.date), "MMM dd, yyyy")
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {record.dueDate
                          ? format(new Date(record.dueDate), "MMM dd, yyyy")
                          : "N/A"}
                      </TableCell>
                      <TableCell>{record.sentBy || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Fees;
