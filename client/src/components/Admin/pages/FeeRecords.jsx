import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  callGetAllStudentsApi,
  callGetAllParentsApi,
  callGetPaymentsByStudentIdApi,
  callDeletePaymentApi,
  callUpdatePaymentApi,
  callCreatePaymentApi,
} from "@/service/service";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SearchableSelect from "@/components/common/SearchableSelect";
import GlobalLoader from "@/components/common/GlobalLoader";
import CommonForm from "@/components/common/CommonForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Info,
  Search,
  Filter,
  X,
  Edit,
  Save,
  Trash2,
  Download,
} from "lucide-react";
import { PaymentFormControls } from "@/config";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format, set } from "date-fns";
import ButtonLoader from "@/components/common/ButtonLoadi";

// Updated payment schema
const paymentSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .pipe(z.coerce.number().min(0.01, "Amount must be at least 0.01")),
  sentBy: z.string().min(1, "Sent by is required"),
  method: z.enum(["Cash", "Bank Transfer", "Avc +", "Check", "Other"]),
  note: z.string().optional(),
  date: z.string().min(1, "Payment date is required"),
  dueDate: z.string().optional(),
  academicYear: z.string().min(1, "Academic year is required"),
  // year: z
  //   .string()
  //   .min(1, "Year is required")
  //   .pipe(z.coerce.number().min(2000, "Year must be after 2000")),
  month: z.enum([
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
    "Unknown", // Added for forgotten months
  ]),
  status: z.enum(["Paid", "Unpaid", "Partial"]).optional(),
});

const FeeRecords = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [payments, setPayments] = useState([]);
  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [parentInfo, setParentInfo] = useState(null);
  const [showParentInfo, setShowParentInfo] = useState(false);
  const [allParents, setAllParents] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [editablePayments, setEditablePayments] = useState({});
  const [updateLoading, setUpdateLoading] = useState(false);
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterAcademicYear, setFilterAcademicYear] = useState("all");
  const [filterMethod, setFilterMethod] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const form = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: "",
      sentBy: "",
      method: "Avc +",
      note: "",
      date: new Date().toISOString().slice(0, 10),
      dueDate: "",
      academicYear: "",
      // year: new Date().getFullYear().toString(),
      month: "January",
      status: "Paid",
    },
  });

  // Generate academic years (1900-2300)
  const academicYears = useMemo(() => {
    const years = [];
    for (let year = 1900; year <= 2300; year++) {
      years.push(`${year}-${year + 1}`);
    }
    return years;
  }, []);

  // Enhanced form controls (removed student field)
  const enhancedFormControls = useMemo(() => {
    const baseStyle =
      "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black focus:border-indigo-500 transition duration-150 ease-in-out";

    // Filter out student control
    return PaymentFormControls.filter(
      (control) => control.id !== "student"
    ).map((control) => {
      const enhancedControl = { ...control };

      // Add base styling
      enhancedControl.className = baseStyle;

      // Handle specific controls
      switch (control.id) {
        case "academicYear":
          enhancedControl.options = academicYears.map((year) => ({
            label: year,
            value: year,
          }));
          enhancedControl.className += " md:rounded-xl";
          break;

        case "method":
        case "month":
          enhancedControl.options = control.options.map((option) => ({
            label: option,
            value: option,
          }));
          break;
      }

      return enhancedControl;
    });
  }, [academicYears]);

  // Calculate debt for each payment
  const paymentsWithDebt = useMemo(() => {
    if (!selectedStudent || payments.length === 0) return [];

    return payments.map((payment) => {
      const monthlyPayment = selectedStudent.monthlyPayment || 0;
      const debt = monthlyPayment - payment.amount;
      return {
        ...payment,
        debt: debt > 0 ? debt : 0,
        isUnknownMonth: !payment.month || payment.month === "Unknown",
      };
    });
  }, [payments, selectedStudent]);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return paymentsWithDebt.filter((payment) => {
      // Search term filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matches = [
          payment.month?.toLowerCase(),
          // payment.year?.toString(),
          payment.academicYear?.toLowerCase(),
          payment.method?.toLowerCase(),
          payment.sentBy?.toLowerCase(),
          payment.note?.toLowerCase(),
          payment.status?.toLowerCase(),
          payment.debt?.toString(),
          payment.date
            ? format(new Date(payment.date), "MMM dd, yyyy").toLowerCase()
            : "",
          payment.dueDate
            ? format(new Date(payment.dueDate), "MMM dd, yyyy").toLowerCase()
            : "",
        ].some((value) => value?.includes(term));

        if (!matches) return false;
      }

      // Other filters (use "all" to mean no filter)
      if (filterYear !== "all" && payment.year.toString() !== filterYear)
        return false;
      if (filterMonth !== "all" && payment.month !== filterMonth) return false;
      if (
        filterAcademicYear !== "all" &&
        payment.academicYear !== filterAcademicYear
      )
        return false;
      if (filterMethod !== "all" && payment.method !== filterMethod)
        return false;
      if (filterStatus !== "all" && payment.status !== filterStatus)
        return false;

      return true;
    });
  }, [
    paymentsWithDebt,
    searchTerm,
    filterYear,
    filterMonth,
    filterAcademicYear,
    filterMethod,
    filterStatus,
  ]);

  // Summary statistics
  const summary = useMemo(() => {
    return {
      totalPaid: filteredPayments.reduce((sum, pay) => sum + pay.amount, 0),
      totalDebt: filteredPayments.reduce((sum, pay) => sum + pay.debt, 0),
      recordCount: filteredPayments.length,
      unknownMonths: filteredPayments.filter((p) => p.isUnknownMonth).length,
    };
  }, [filteredPayments]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const studentsList = await callGetAllStudentsApi();
        setStudents(studentsList.students || []);

        if (selectedStudent) {
          const student = studentsList.students?.find(
            (s) => s._id === selectedStudent._id
          );
          if (selectedStudent?.parent) {
            setParentInfo(selectedStudent.parent);
          } else {
            setParentInfo(null);
          }
        }
      } catch (err) {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedStudent]);

  useEffect(() => {
    if (selectedStudent) {
      loadPayments(selectedStudent._id);
      form.reset({
        ...form.getValues(),
        amount: selectedStudent.monthlyPayment?.toString() || "",
      });
    }
  }, [selectedStudent]);

  const loadPayments = async (studentId) => {
    setPaymentsLoading(true);
    try {
      const res = await callGetPaymentsByStudentIdApi(studentId);
      setPayments(res.data || []);
    } catch {
      toast.error("Failed to load payments");
    } finally {
      setPaymentsLoading(false);
    }
  };

  const handlePaymentSubmit = async (data) => {
    if (isSubmitting) return;
    if (!selectedStudent) {
      toast.error("Select a student first");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        student: selectedStudent._id,
        amount: Number(data.amount),
        // year: Number(data.year),
        month: data.month,
        academicYear: data.academicYear,
        date: data.date,
        dueDate: data.dueDate || undefined,
        note: data.note || undefined,
        method: data.method,
        sentBy: data.sentBy,
        status: data.status || "Paid",
      };

      await callCreatePaymentApi(payload);
      toast.success("Payment record created successfully!");
      loadPayments(selectedStudent._id);
      form.reset();
      setAction("");
    } catch (err) {
      console.error("Payment error:", err);
      toast.error(err.response?.data?.message || "Failed to create payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enable editing for a specific payment
  const startEditing = (paymentId) => {
    setEditingPaymentId(paymentId);

    // Set initial editable values
    const payment = payments.find((p) => p._id === paymentId);
    if (payment) {
      setEditablePayments({
        ...editablePayments,
        [paymentId]: {
          month: payment.month,
          // year: payment.year,
          amount: payment.amount,
          method: payment.method,
          status: payment.status,
          sentBy: payment.sentBy,
          academicYear: payment.academicYear,
        },
      });
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingPaymentId(null);
  };

  // Handle field changes during editing
  const handleFieldChange = (paymentId, field, value) => {
    setEditablePayments({
      ...editablePayments,
      [paymentId]: {
        ...editablePayments[paymentId],
        [field]: value,
      },
    });
  };

  // Save edited payment
  const saveEditedPayment = async (paymentId) => {
    const payment = payments.find((p) => p._id === paymentId);
    if (!payment) return;

    const updatedFields = editablePayments[paymentId];
    if (!updatedFields) return;
    setUpdateLoading(true);
    try {
      const updatedPayment = {
        ...payment,
        ...updatedFields,
      };

      await callUpdatePaymentApi(paymentId, updatedPayment);
      toast.success("Payment updated successfully!");
      setUpdateLoading(false);
      loadPayments(selectedStudent._id);
    } catch (err) {
      toast.error("Failed to update payment");

      console.error("Update error:", err);
    }
  };

  // Confirm and delete payment
  const confirmDelete = (payment) => {
    setPaymentToDelete(payment);
    setShowDeleteConfirm(true);
  };

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;

    try {
      // API call to delete payment would go here
      // await callDeletePaymentApi(paymentToDelete._id);
      await callDeletePaymentApi(paymentToDelete._id);
      // For now, just remove from local state
      setPayments(payments.filter((p) => p._id !== paymentToDelete._id));
      toast.success("Payment deleted successfully!");
    } catch (err) {
      toast.error("Failed to delete payment");
    } finally {
      setShowDeleteConfirm(false);
      setPaymentToDelete(null);
    }
  };

  // Export data to CSV
  const exportToCSV = () => {
    if (filteredPayments.length === 0) {
      toast.info("No data to export");
      return;
    }

    const headers = [
      "Month",
      // "Year",
      "Academic Year",
      "Amount",
      "Method",
      "Payment Date",
      "Due Date",
      "Status",
      "Debt",
      "Sent By",
    ];

    const rows = filteredPayments.map((pay) => [
      pay.month || "Unknown",
      // pay.year,
      pay.academicYear,
      `$${pay.amount.toFixed(2)}`,
      pay.method,
      pay.date ? format(new Date(pay.date), "MMM dd, yyyy") : "N/A",
      pay.dueDate ? format(new Date(pay.dueDate), "MMM dd, yyyy") : "N/A",
      pay.status,
      pay.debt > 0 ? `$${pay.debt.toFixed(2)}` : "$0.00",
      pay.sentBy || "N/A",
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
      `payments-${selectedStudent.user.fullName}-${new Date()
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
      <h2 className="text-2xl font-semibold">Fee Records</h2>

      <SearchableSelect
        options={students.map((s) => ({
          label: s.user.fullName,
          value: s._id,
        }))}
        value={selectedStudent?._id || ""}
        onChange={(val) => {
          const student = students.find((s) => s._id === val);
          setSelectedStudent(student);
          setAction("");
        }}
        placeholder="Search and select student"
      />

      {selectedStudent && (
        <>
          <div className="flex flex-wrap items-center gap-4 py-2">
            <div className="font-medium">
              <span className="text-gray-600">Student:</span>{" "}
              {selectedStudent.user.fullName}
            </div>
            <div className="font-medium">
              <span className="text-gray-600">Monthly Fee:</span> $
              {selectedStudent.monthlyPayment}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="flex items-center"
              onClick={() => setShowParentInfo(true)}
            >
              <Info className="mr-1 h-4 w-4" /> Parent Info
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 my-4">
            <Button
              onClick={() => setAction("add")}
              className="flex-1 min-w-[200px]"
            >
              ➕ Add New Record
            </Button>
            <Button
              onClick={() => setAction("view")}
              className="flex-1 min-w-[200px]"
            >
              📄 View Payment History
            </Button>
          </div>

          {action === "add" && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>
                  Add Payment Record for {selectedStudent.user.fullName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium">
                    Student: {selectedStudent.user.fullName}
                  </div>
                  <div className="text-sm text-gray-600">
                    Monthly Fee: ${selectedStudent.monthlyPayment}
                  </div>
                </div>

                <CommonForm
                  form={form}
                  formControls={enhancedFormControls}
                  handleSubmit={handlePaymentSubmit}
                  btnText={isSubmitting ? <ButtonLoader /> : "Add Payment"}
                  defaultValues={{
                    amount: selectedStudent.monthlyPayment?.toString() || "",
                  }}
                  gridConfig="grid grid-cols-1 md:grid-cols-2 gap-4"
                />
              </CardContent>
            </Card>
          )}

          {action === "view" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    Payment History
                    <CardDescription className="mt-1">
                      Showing {filteredPayments.length} of {payments.length}{" "}
                      records
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search payments..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("");
                        setFilterYear("all");
                        setFilterMonth("all");
                        setFilterAcademicYear("all");
                        setFilterMethod("all");
                        setFilterStatus("all");
                      }}
                    >
                      <X className="mr-2 h-4 w-4" /> Clear Filters
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={exportToCSV}
                      className="flex items-center"
                    >
                      <Download className="h-4 w-4 mr-2" /> Export CSV
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                  {/* <SearchableSelect
                    options={[
                      { label: "All Years", value: "all" },
                      ...Array.from({ length: 20 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return {
                          label: year.toString(),
                          value: year.toString(),
                        };
                      }),
                    ]}
                    value={filterYear}
                    onChange={setFilterYear}
                    placeholder="Filter by Year"
                  /> */}

                  <SearchableSelect
                    options={[
                      { label: "All Months", value: "all" },
                      ...[
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
                        "Unknown",
                      ].map((month) => ({ label: month, value: month })),
                    ]}
                    value={filterMonth}
                    onChange={setFilterMonth}
                    placeholder="Filter by Month"
                  />

                  <SearchableSelect
                    options={[
                      { label: "All Years", value: "all" },
                      ...academicYears.map((year) => ({
                        label: year,
                        value: year,
                      })),
                    ]}
                    value={filterAcademicYear}
                    onChange={setFilterAcademicYear}
                    placeholder="Academic Year"
                  />

                  <SearchableSelect
                    options={[
                      { label: "All Methods", value: "all" },
                      ...[
                        "Cash",
                        "Bank Transfer",
                        "Avc +",
                        "Check",
                        "Other",
                      ].map((method) => ({
                        label: method,
                        value: method,
                      })),
                    ]}
                    value={filterMethod}
                    onChange={setFilterMethod}
                    placeholder="Payment Method"
                  />

                  <SearchableSelect
                    options={[
                      { label: "All Statuses", value: "all" },
                      { label: "Paid", value: "Paid" },
                      { label: "Unpaid", value: "Unpaid" },
                      { label: "Partial", value: "Partial" },
                    ]}
                    value={filterStatus}
                    onChange={setFilterStatus}
                    placeholder="Payment Status"
                  />
                </div>

                {paymentsLoading ? (
                  <GlobalLoader />
                ) : payments.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="text-xl font-medium mb-2">
                      No payment records found
                    </div>
                    <p className="text-gray-500 mb-4">
                      This student hasn't made any payments yet
                    </p>
                    <Button onClick={() => setAction("add")}>
                      Add Payment Record
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card className="bg-blue-50 dark:bg-blue-900/20">
                        <CardContent className="p-4">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Total Paid
                          </div>
                          <div className="text-2xl font-bold">
                            ${summary.totalPaid.toFixed(2)}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-rose-50 dark:bg-rose-900/20">
                        <CardContent className="p-4">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Total Debt
                          </div>
                          <div className="text-2xl font-bold text-red-500">
                            ${summary.totalDebt.toFixed(2)}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-purple-50 dark:bg-purple-900/20">
                        <CardContent className="p-4">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Records
                          </div>
                          <div className="text-2xl font-bold">
                            {summary.recordCount}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-amber-50 dark:bg-amber-900/20">
                        <CardContent className="p-4">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Unknown Months
                          </div>
                          <div className="text-2xl font-bold text-amber-500">
                            {summary.unknownMonths}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Payment Table */}
                    <div className="rounded-lg border shadow-sm overflow-hidden">
                      <Table>
                        <TableHeader className="bg-gray-50 dark:bg-gray-800">
                          <TableRow>
                            <TableHead>Month</TableHead>
                            {/* <TableHead>Year</TableHead> */}
                            <TableHead>Academic Year</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Payment Date</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Debt</TableHead>
                            <TableHead>Sent By</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredPayments.map((pay) => (
                            <TableRow
                              key={pay._id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <TableCell className="font-medium">
                                {pay.isUnknownMonth && !editingPaymentId ? (
                                  <Badge variant="warning">
                                    <span className="flex items-center">
                                      <Info className="h-4 w-4 mr-1" />
                                      Unknown
                                    </span>
                                  </Badge>
                                ) : editingPaymentId === pay._id ? (
                                  <Select
                                    value={
                                      editablePayments[pay._id]?.month ||
                                      pay.month ||
                                      ""
                                    }
                                    onValueChange={(value) =>
                                      handleFieldChange(pay._id, "month", value)
                                    }
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue placeholder="Month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {[
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
                                        "Unknown",
                                      ].map((month) => (
                                        <SelectItem key={month} value={month}>
                                          {month}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  pay.month || "Unknown"
                                )}
                              </TableCell>

                              {/* <TableCell>
                                {editingPaymentId === pay._id ? (
                                  <Input
                                    type="number"
                                    className="w-20"
                                    value={
                                      editablePayments[pay._id]?.year ||
                                      pay.year
                                    }
                                    onChange={(e) =>
                                      handleFieldChange(
                                        pay._id,
                                        "year",
                                        e.target.value
                                      )
                                    }
                                  />
                                ) : (
                                  pay.year
                                )}
                              </TableCell> */}

                              <TableCell>
                                {editingPaymentId === pay._id ? (
                                  <Select
                                    value={
                                      editablePayments[pay._id]?.academicYear ||
                                      pay.academicYear
                                    }
                                    onValueChange={(value) =>
                                      handleFieldChange(
                                        pay._id,
                                        "academicYear",
                                        value
                                      )
                                    }
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue placeholder="Academic Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">
                                        All Years
                                      </SelectItem>
                                      {academicYears.map((year) => (
                                        <SelectItem key={year} value={year}>
                                          {year}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  pay.academicYear
                                )}
                              </TableCell>

                              <TableCell>
                                {editingPaymentId === pay._id ? (
                                  <Input
                                    type="number"
                                    className="w-24"
                                    step="0.01"
                                    value={
                                      editablePayments[pay._id]?.amount ||
                                      pay.amount
                                    }
                                    onChange={(e) =>
                                      handleFieldChange(
                                        pay._id,
                                        "amount",
                                        e.target.value
                                      )
                                    }
                                  />
                                ) : (
                                  `$${pay.amount.toFixed(2)}`
                                )}
                              </TableCell>

                              <TableCell>
                                {editingPaymentId === pay._id ? (
                                  <Select
                                    value={
                                      editablePayments[pay._id]?.method ||
                                      pay.method
                                    }
                                    onValueChange={(value) =>
                                      handleFieldChange(
                                        pay._id,
                                        "method",
                                        value
                                      )
                                    }
                                  >
                                    <SelectTrigger className="w-36">
                                      <SelectValue placeholder="Method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {[
                                        "Cash",
                                        "Bank Transfer",
                                        "Avc +",
                                        "Check",
                                        "Other",
                                      ].map((method) => (
                                        <SelectItem key={method} value={method}>
                                          {method}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  pay.method
                                )}
                              </TableCell>

                              <TableCell>
                                {pay.date
                                  ? format(new Date(pay.date), "MMM dd, yyyy")
                                  : "N/A"}
                              </TableCell>

                              <TableCell>
                                {pay.dueDate
                                  ? format(
                                      new Date(pay.dueDate),
                                      "MMM dd, yyyy"
                                    )
                                  : "N/A"}
                              </TableCell>

                              <TableCell>
                                {editingPaymentId === pay._id ? (
                                  <Select
                                    value={
                                      editablePayments[pay._id]?.status ||
                                      pay.status
                                    }
                                    onValueChange={(value) =>
                                      handleFieldChange(
                                        pay._id,
                                        "status",
                                        value
                                      )
                                    }
                                  >
                                    <SelectTrigger className="w-28">
                                      <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {["Paid", "Pending", "Partial"].map(
                                        (status) => (
                                          <SelectItem
                                            key={status}
                                            value={status}
                                          >
                                            {status}
                                          </SelectItem>
                                        )
                                      )}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Badge
                                    variant={
                                      pay.status === "Paid"
                                        ? "success"
                                        : pay.status === "Pending"
                                          ? "warning"
                                          : "destructive"
                                    }
                                  >
                                    {pay.status}
                                  </Badge>
                                )}
                              </TableCell>

                              <TableCell>
                                {pay.debt > 0 ? (
                                  <span className="text-red-500">
                                    ${pay.debt.toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="text-green-500">$0.00</span>
                                )}
                              </TableCell>

                              <TableCell>
                                {editingPaymentId === pay._id ? (
                                  <Input
                                    value={
                                      editablePayments[pay._id]?.sentBy ||
                                      pay.sentBy
                                    }
                                    onChange={(e) =>
                                      handleFieldChange(
                                        pay._id,
                                        "sentBy",
                                        e.target.value
                                      )
                                    }
                                  />
                                ) : (
                                  pay.sentBy || "N/A"
                                )}
                              </TableCell>

                              <TableCell>
                                {editingPaymentId === pay._id ? (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => saveEditedPayment(pay._id)}
                                      className="bg-blue-600 text-white hover:bg-blue-700 flex items-center"
                                    >
                                      {updateLoading ? (
                                        <ButtonLoader />
                                      ) : (
                                        <span className="flex items-center">
                                          <Save className="h-4 w-4 mr-1" />
                                          Save
                                        </span>
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={cancelEditing}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => startEditing(pay._id)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => confirmDelete(pay)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {filteredPayments.length === 0 && (
                        <div className="py-12 text-center text-gray-500">
                          No payments match your filters
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Parent Info Dialog */}
          <Dialog open={showParentInfo} onOpenChange={setShowParentInfo}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Parent Information</DialogTitle>
              </DialogHeader>
              {parentInfo ? (
                <div className="space-y-3">
                  <div>
                    <strong className="block text-sm text-gray-500">
                      Name:
                    </strong>
                    <p>{parentInfo.user?.fullName || "N/A"}</p>
                  </div>
                  <div>
                    <strong className="block text-sm text-gray-500">
                      Contact:
                    </strong>
                    <p>{parentInfo.contact || "N/A"}</p>
                  </div>
                  <div>
                    <strong className="block text-sm text-gray-500">
                      Email:
                    </strong>
                    <p>{parentInfo.user?.email || "N/A"}</p>
                  </div>
                </div>
              ) : (
                <p>No parent information available</p>
              )}
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. Please confirm you want to
                  delete
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-gray-700 dark:text-gray-300">
                  Are you sure you want to delete this payment record?
                </p>
                {paymentToDelete && (
                  <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <p>
                      <span className="font-medium">Date:</span>{" "}
                      {paymentToDelete.date
                        ? format(new Date(paymentToDelete.date), "MMM dd, yyyy")
                        : "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Amount:</span> $
                      {paymentToDelete.amount.toFixed(2)}
                    </p>
                    <p>
                      <span className="font-medium">Method:</span>{" "}
                      {paymentToDelete.method}
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeletePayment}>
                  Delete Payment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default FeeRecords;
