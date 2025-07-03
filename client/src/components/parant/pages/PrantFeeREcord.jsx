import React, { useState, useEffect, useMemo } from "react";
import { useUser } from "@/useContaxt/UseContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  SearchIcon,
  DownloadIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  InfoIcon,
  DollarSignIcon,
  CalendarIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ClockIcon,
} from "lucide-react";

const ParentFeeRecords = () => {
  const { user } = useUser();
  const children = user?.parentProfile?.children || [];
  const [expandedChildren, setExpandedChildren] = useState({});
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Toggle child details
  const toggleChildDetails = (childId) => {
    setExpandedChildren((prev) => ({
      ...prev,
      [childId]: !prev[childId],
    }));
  };

  // Extract unique academic years and months from records
  const academicYears = useMemo(() => {
    const years = new Set();
    children.forEach((child) => {
      child.feeRecordes?.forEach((fee) => {
        if (fee.academicYear) years.add(fee.academicYear);
      });
    });
    return Array.from(years).sort().reverse();
  }, [children]);

  const months = useMemo(() => {
    const monthOrder = [
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
    const allMonths = new Set();
    children.forEach((child) => {
      child.feeRecordes?.forEach((fee) => {
        if (fee.month) allMonths.add(fee.month);
      });
    });
    return Array.from(allMonths).sort(
      (a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b)
    );
  }, [children]);

  // Filter children and their records
  const filteredChildren = useMemo(() => {
    return children
      .filter((child) =>
        child?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map((child) => ({
        ...child,
        feeRecordes: (child.feeRecordes || []).filter(
          (fee) =>
            (selectedYear === "all" || fee.academicYear === selectedYear) &&
            (selectedStatus === "all" || fee.status === selectedStatus) &&
            (selectedMonth === "all" || fee.month === selectedMonth)
        ),
      }))
      .filter((child) => child.feeRecordes.length > 0 || searchTerm);
  }, [children, searchTerm, selectedYear, selectedStatus, selectedMonth]);

  // Calculate family summary
  const familySummary = useMemo(() => {
    return filteredChildren.reduce(
      (summary, child) => {
        child.feeRecordes.forEach((fee) => {
          summary.total += parseFloat(fee.amount);
          summary.debt += fee.dept || 0;

          if (fee.status === "Paid") {
            summary.paid += parseFloat(fee.amount);
          } else {
            summary.pending += parseFloat(fee.amount);
          }

          if (
            fee.status !== "Paid" &&
            fee.dueDate &&
            new Date(fee.dueDate) < new Date()
          ) {
            summary.overdue += parseFloat(fee.amount);
          }
        });
        return summary;
      },
      { total: 0, paid: 0, pending: 0, overdue: 0, debt: 0 }
    );
  }, [filteredChildren]);

  // Export to CSV
  const exportToCSV = () => {
    let csvContent =
      "Child,Amount,Date,Due Date,Month,Status,Method,Academic Year,Debt\n";

    children.forEach((child) => {
      child.feeRecordes?.forEach((fee) => {
        csvContent += `"${child.name}","${fee.amount}","${fee.date}","${
          fee.dueDate
        }","${fee.month}","${fee.status}","${fee.method}","${
          fee.academicYear
        }","${fee.dept || 0}"\n`;
      });
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "family_fee_records.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  // Get status badge with enhanced statuses
  const getStatusBadge = (status, dueDate) => {
    const isOverdue =
      status !== "Paid" && dueDate && new Date(dueDate) < new Date();

    if (isOverdue) {
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          <AlertCircleIcon className="h-4 w-4 mr-1" />
          Overdue
        </Badge>
      );
    }

    switch (status) {
      case "Paid":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            Paid
          </Badge>
        );
      case "Partial":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <ClockIcon className="h-4 w-4 mr-1" />
            Partial
          </Badge>
        );
      case "Unpaid":
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
            <ClockIcon className="h-4 w-4 mr-1" />
            Unpaid
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Toggle all children
  const toggleAllChildren = () => {
    if (Object.keys(expandedChildren).length === filteredChildren.length) {
      setExpandedChildren({});
    } else {
      const allExpanded = {};
      filteredChildren.forEach((child) => {
        allExpanded[child._id] = true;
      });
      setExpandedChildren(allExpanded);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Family Fee Records
          </h1>
          <p className="text-gray-600 mt-1">
            Manage school fees for your children
          </p>
        </div>

        <Button variant="outline" onClick={exportToCSV}>
          <DownloadIcon className="h-4 w-4 mr-2" />
          Export Records
        </Button>
      </div>

      {/* Family Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="border border-blue-100 bg-blue-50">
          <CardContent className="p-4 flex items-center">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <DollarSignIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-700">Paid Fees </p>
              <p className="text-xl font-bold text-blue-900">
                ${familySummary.total.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* <Card className="border border-green-100 bg-green-50">
          <CardContent className="p-4 flex items-center">
            <div className="bg-green-100 p-3 rounded-full mr-4">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-700">Paid Fees</p>
              <p className="text-xl font-bold text-green-900">
                ${familySummary.paid.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-amber-100 bg-amber-50">
          <CardContent className="p-4 flex items-center">
            <div className="bg-amber-100 p-3 rounded-full mr-4">
              <ClockIcon className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-amber-700">Pending Fees</p>
              <p className="text-xl font-bold text-amber-900">
                ${familySummary.pending.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-red-100 bg-red-50">
          <CardContent className="p-4 flex items-center">
            <div className="bg-red-100 p-3 rounded-full mr-4">
              <AlertCircleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-red-700">Overdue Fees</p>
              <p className="text-xl font-bold text-red-900">
                ${familySummary.overdue.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card> */}

        <Card className="border border-purple-100 bg-purple-50">
          <CardContent className="p-4 flex items-center">
            <div className="bg-purple-100 p-3 rounded-full mr-4">
              <DollarSignIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-purple-700">Total Debt</p>
              <p className="text-xl font-bold text-purple-900">
                ${familySummary.debt.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by child's name..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder="Academic Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {academicYears.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Month" />
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
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Partial">Partial</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredChildren.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="text-gray-300 mb-4">
              <InfoIcon className="h-20 w-20 mx-auto" />
            </div>
            <h3 className="text-xl font-medium text-gray-700 mb-2">
              {children.length === 0
                ? "No children registered yet"
                : "No matching fee records found"}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-4">
              {children.length === 0
                ? "You haven't added any children to your account yet"
                : "Try adjusting your search or filter criteria"}
            </p>
            <Button
              variant="ghost"
              className="text-blue-600"
              onClick={() => {
                setSearchTerm("");
                setSelectedYear("all");
                setSelectedStatus("all");
                setSelectedMonth("all");
              }}
            >
              Clear all filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end mb-2">
            <Button variant="outline" size="sm" onClick={toggleAllChildren}>
              {Object.keys(expandedChildren).length === filteredChildren.length
                ? "Collapse All"
                : "Expand All"}
            </Button>
          </div>

          {filteredChildren.map((child) => {
            const childSummary = child.feeRecordes.reduce(
              (summary, fee) => {
                summary.total += parseFloat(fee.amount);
                summary.debt += fee.dept || 0;

                if (fee.status === "Paid") {
                  summary.paid += parseFloat(fee.amount);
                } else {
                  summary.pending += parseFloat(fee.amount);

                  if (fee.dueDate && new Date(fee.dueDate) < new Date()) {
                    summary.overdue += parseFloat(fee.amount);
                  }
                }
                return summary;
              },
              { total: 0, paid: 0, pending: 0, overdue: 0, debt: 0 }
            );

            const isExpanded = expandedChildren[child._id];

            return (
              <Card key={child._id} className="overflow-hidden">
                <CardHeader
                  className={`p-4 cursor-pointer ${
                    isExpanded ? "bg-blue-50" : "bg-white"
                  }`}
                  onClick={() => toggleChildDetails(child._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-800 rounded-xl w-12 h-12 flex items-center justify-center">
                        <span className="font-bold text-lg">
                          {child?.name?.charAt(0) || "C"}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg">
                          {child?.name || "Unnamed Child"}
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge
                            variant="secondary"
                            className="bg-blue-100 text-blue-800"
                          >
                            {child.class.name || "Grade N/A"}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="bg-purple-100 text-purple-800"
                          >
                            {child.class.section || "Section N/A"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right hidden md:block">
                        <p className="text-xs text-gray-600">Total Fees</p>
                        <p className="font-semibold text-gray-800">
                          ${childSummary.total.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right hidden md:block">
                        <p className="text-xs text-gray-600">Debt</p>
                        <p className="font-semibold text-red-600">
                          ${childSummary.debt.toFixed(2)}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon">
                        {isExpanded ? (
                          <ChevronUpIcon className="h-5 w-5" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="p-0">
                    {child.feeRecordes.length === 0 ? (
                      <div className="py-8 text-center text-gray-500">
                        No fee records found for {child.name}
                      </div>
                    ) : (
                      <Table className="border-t">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[180px]">
                              Description
                            </TableHead>
                            <TableHead>Month</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Debt</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Method</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {child.feeRecordes.map((fee) => (
                            <TableRow key={fee._id}>
                              <TableCell>
                                <div className="font-medium">
                                  {fee.note || "School Fees"}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {fee.academicYear}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{fee.month}</Badge>
                              </TableCell>
                              <TableCell>
                                <div
                                  className={
                                    fee.dueDate &&
                                    new Date(fee.dueDate) < new Date() &&
                                    fee.status !== "Paid"
                                      ? "text-red-600 font-medium"
                                      : ""
                                  }
                                >
                                  {formatDate(fee.dueDate)}
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                ${parseFloat(fee.amount).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right font-medium text-red-600">
                                ${(fee.dept || 0).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(fee.status)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{fee.method}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}

                          {/* Summary row */}
                          <TableRow className="bg-gray-50 font-semibold">
                            <TableCell colSpan={3} className="text-right">
                              Totals:
                            </TableCell>
                            <TableCell className="text-right">
                              ${childSummary.total.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right text-red-600">
                              ${childSummary.debt.toFixed(2)}
                            </TableCell>
                            {/* <TableCell colSpan={2}>
                              <div className="flex gap-2">
                                <Badge className="bg-green-100 text-green-800">
                                  Paid: ${childSummary.paid.toFixed(2)}
                                </Badge>
                                <Badge className="bg-amber-100 text-amber-800">
                                  Pending: ${childSummary.pending.toFixed(2)}
                                </Badge>
                              </div>
                            </TableCell> */}
                          </TableRow>
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ParentFeeRecords;
