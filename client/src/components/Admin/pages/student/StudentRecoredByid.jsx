import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import GlobalLoader from "@/components/common/GlobalLoader";
import CommonForm from "@/components/common/CommonForm";
import SearchableSelect from "@/components/common/SearchableSelect";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Plus,
  FileText,
  Search,
  X,
  Edit,
  Save,
  Trash2,
  Download,
  User,
  CreditCard,
  DollarSign,
  Calendar,
  Filter,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Clock,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  callGetAllStudentsidbyApi,
  callGetPaymentsByStudentIdApi,
  callCreatePaymentApi,
  callUpdatePaymentApi,
  callDeletePaymentApi,
} from "@/service/service";
import { PaymentFormControls } from "@/config";
import ButtonLoader from "@/components/common/ButtonLoadi";
import exportData from "@/components/common/Export";

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
    "Unknown",
  ]),
  status: z.enum(["Paid", "Unpaid", "Partial"]).optional(),
});

const StudentRecoredByid = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [action, setAction] = useState(""); // "add" | "view"
  const [showParentInfo, setShowParentInfo] = useState(false);
  const [parentInfo, setParentInfo] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  // Filters / search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterAcademicYear, setFilterAcademicYear] = useState("all");
  const [filterMethod, setFilterMethod] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Edit form
  const editForm = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: "",
      sentBy: "",
      method: "Cash",
      note: "",
      date: new Date().toISOString().slice(0, 10),
      dueDate: "",
      academicYear: "",
      month: "January",
      status: "Paid",
    },
  });

  // Main form for adding payments
  const form = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: "",
      sentBy: "",
      method: "Cash",
      note: "",
      date: new Date().toISOString().slice(0, 10),
      dueDate: "",
      academicYear: "",
      year: new Date().getFullYear().toString(),
      month: "January",
      status: "Paid",
    },
  });

  // academicYears helper
  const academicYears = useMemo(() => {
    const years = [];
    for (let year = 1900; year <= 2300; year++) {
      years.push(`${year}-${year + 1}`);
    }
    return years;
  }, []);

  // fetch student and payments
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const studentRes = await callGetAllStudentsidbyApi(id);
        const s = studentRes?.student ?? null;
        if (!s) {
          toast.error("Student not found");
          setLoading(false);
          return;
        }
        setStudent(s);
        setParentInfo(s.parent ?? null);

        // load payments for this student
        await loadPayments(s._id);
        // prefill amount in form when adding
        form.reset({
          ...form.getValues(),
          amount: s.monthlyPayment?.toString() || "",
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load student or payments");
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadPayments = async (studentId) => {
    setPaymentsLoading(true);
    try {
      const res = await callGetPaymentsByStudentIdApi(studentId);
      const list =
        res?.data ?? res?.payments ?? (Array.isArray(res) ? res : []);
      setPayments(list);
    } catch (err) {
      console.error("Failed loading payments", err);
      toast.error("Failed to load payments");
    } finally {
      setPaymentsLoading(false);
    }
  };

  // Open edit dialog
  const openEditDialog = (payment) => {
    setEditingPayment(payment);
    editForm.reset({
      amount: payment.amount?.toString() || "",
      sentBy: payment.sentBy || "",
      method: payment.method || "Cash",
      note: payment.note || "",
      date: payment.date
        ? new Date(payment.date).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      dueDate: payment.dueDate
        ? new Date(payment.dueDate).toISOString().slice(0, 10)
        : "",
      academicYear: payment.academicYear || "",
      month: payment.month || "January",
      status: payment.status || "Paid",
    });
    setShowEditDialog(true);
  };

  // Close edit dialog
  const closeEditDialog = () => {
    setShowEditDialog(false);
    setEditingPayment(null);
    editForm.reset();
  };

  // derived payments with debt
  const paymentsWithDebt = useMemo(() => {
    if (!student || payments.length === 0) return [];
    return payments.map((payment) => {
      const monthlyPayment = student.monthlyPayment || 0;
      const debt = monthlyPayment - (payment.amount || 0);
      return {
        ...payment,
        debt: debt > 0 ? debt : 0,
        isUnknownMonth: !payment.month || payment.month === "Unknown",
      };
    });
  }, [payments, student]);

  const filteredPayments = useMemo(() => {
    return paymentsWithDebt.filter((payment) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matches = [
          payment.month?.toLowerCase(),
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
        ].some((v) => v?.includes(term));
        if (!matches) return false;
      }
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

  const summary = useMemo(() => {
    return {
      totalPaid: filteredPayments.reduce((s, p) => s + (p.amount || 0), 0),
      totalDebt: filteredPayments.reduce((s, p) => s + (p.debt || 0), 0),
      recordCount: filteredPayments.length,
      unknownMonths: filteredPayments.filter((p) => p.isUnknownMonth).length,
    };
  }, [filteredPayments]);

  // add payment
  const handlePaymentSubmit = async (data) => {
    if (isSubmitting) return;
    if (!student) {
      toast.error("Student not loaded");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        student: student._id,
        amount: Number(data.amount),
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
      toast.success("Payment created");
      await loadPayments(student._id);
      form.reset();
      setIsSubmitting(false);
      setAction("");
    } catch (err) {
      console.error("Create payment error", err);
      toast.error("Failed to create payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  // update payment in dialog
  const handleEditSubmit = async (data) => {
    if (!editingPayment) return;
    setUpdateLoading(true);
    try {
      const updatedPayload = {
        ...data,
        amount: Number(data.amount),
      };
      await callUpdatePaymentApi(editingPayment._id, updatedPayload);
      toast.success("Payment updated");
      await loadPayments(student._id);
      closeEditDialog();
    } catch (err) {
      console.error("Update payment error", err);
      toast.error("Failed to update payment");
    } finally {
      setUpdateLoading(false);
    }
  };

  const confirmDelete = (payment) => {
    setPaymentToDelete(payment);
    setShowDeleteConfirm(true);
  };

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;
    try {
      await callDeletePaymentApi(paymentToDelete._id || paymentToDelete.id);
      setPayments((p) => p.filter((x) => x._id !== paymentToDelete._id));
      toast.success("Payment deleted");
    } catch (err) {
      console.error("Delete error", err);
      toast.error("Failed to delete payment");
    } finally {
      setShowDeleteConfirm(false);
      setPaymentToDelete(null);
    }
  };

  const headers = [
    "Month",
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
    pay.academicYear,
    `$${(pay.amount || 0).toFixed(2)}`,
    pay.method,
    pay.date ? format(new Date(pay.date), "MMM dd, yyyy") : "N/A",
    pay.dueDate ? format(new Date(pay.dueDate), "MMM dd, yyyy") : "N/A",
    pay.status,
    pay.debt > 0 ? `$${pay.debt.toFixed(2)}` : "$0.00",
    pay.sentBy || "N/A",
  ]);

  const exportDataSet = { headers, rows };

  if (loading) return <GlobalLoader />;

  if (!student)
    return (
      <div className="p-6">
        <p className="text-red-600">Student not found</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Back
        </Button>
      </div>
    );

  const enhancedFormControls = PaymentFormControls.map((control) => {
    const baseStyle =
      "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 transition duration-200";

    if (control.id === "academicYear") {
      return {
        ...control,
        options: academicYears.map((year) => ({
          label: year,
          value: year,
        })),
        className: baseStyle,
      };
    }

    if (control.id === "method") {
      return {
        ...control,
        options: control.options.map((option) => ({
          label: option,
          value: option,
        })),
        className: baseStyle,
      };
    }

    if (control.id === "month") {
      return {
        ...control,
        options: control.options.map((option) => ({
          label: option,
          value: option,
        })),
        className: baseStyle,
      };
    }

    if (control.id === "student") {
      return null;
    }

    return { ...control, className: baseStyle };
  }).filter(Boolean);

  // Status badge configuration
  const getStatusConfig = (status) => {
    switch (status) {
      case "Paid":
        return {
          color: "bg-green-50 text-green-700 border-green-200",
          icon: <CheckCircle2 className="h-3 w-3" />,
        };
      case "Unpaid":
        return {
          color: "bg-red-50 text-red-700 border-red-200",
          icon: <AlertCircle className="h-3 w-3" />,
        };
      case "Partial":
        return {
          color: "bg-yellow-50 text-yellow-700 border-yellow-200",
          icon: <Clock className="h-3 w-3" />,
        };
      default:
        return {
          color: "bg-gray-50 text-gray-700 border-gray-200",
          icon: <Clock className="h-3 w-3" />,
        };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Header Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Left section */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Button
                variant="secondary" // Or "filled"/custom style
                size="sm"
                onClick={() =>
                  navigate(`/admin/dashboard/StudentInfobyid/${id}`)
                }
                className="flex items-center gap-2 bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1 rounded-md"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              <div className="hidden sm:block w-px h-6 bg-gray-300"></div>

              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard className="h-5 sm:h-6 w-5 sm:w-6 text-purple-600" />
                  Fee Records & Payments
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  Manage payment records for {student.user?.fullName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Student Profile Card */}
        <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col items-center sm:flex-row sm:items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                    {student.user?.fullName}
                  </h2>
                  <div className="flex flex-col md:flex-row md:items-center gap-2 mt-2 text-sm text-gray-600">
                    <span>
                      Admission: <strong>{student.admissionNumber}</strong>
                    </span>
                    <span className="hidden md:inline">•</span>
                    <span>
                      Class: <strong>{student.classId?.name}</strong>
                    </span>
                    <span className="hidden md:inline">•</span>
                    <span>
                      Monthly Fee: <strong>${student.monthlyPayment}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right section */}
              <Button
                variant="outline"
                onClick={() => setShowParentInfo(true)}
                className="flex items-center gap-2 w-full md:w-auto"
              >
                <User className="h-4 w-4" />
                Parent Info
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              action === "add" ? "ring-2 ring-purple-500" : ""
            }`}
            onClick={() => setAction(action === "add" ? "" : "add")}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <Plus className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Add New Payment
                  </h3>
                  <p className="text-sm text-gray-600">
                    Record a new payment transaction
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              action === "view" ? "ring-2 ring-purple-500" : ""
            }`}
            onClick={() => setAction(action === "view" ? "" : "view")}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    View Payment History
                  </h3>
                  <p className="text-sm text-gray-600">
                    Browse and manage all payment records
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Payment Form */}
        {action === "add" && (
          <Card className="border-purple-100 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent">
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Plus className="h-5 w-5" />
                Add Payment Record
              </CardTitle>
              <CardDescription>
                Create a new payment record for {student.user?.fullName}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <CommonForm
                form={form}
                formControls={enhancedFormControls}
                handleSubmit={handlePaymentSubmit}
                btnText={isSubmitting ? <ButtonLoader /> : "Create Payment"}
                defaultValues={{
                  amount: student.monthlyPayment?.toString() || "",
                }}
                gridConfig="grid grid-cols-1 md:grid-cols-2 gap-4"
                submitButtonClass="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              />
            </CardContent>
          </Card>
        )}

        {/* Payment History */}
        {action === "view" && (
          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    Payment History
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {filteredPayments.length} of {payments.length} records
                    {searchTerm && ` matching "${searchTerm}"`}
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
                  {/* <Button
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
                    <X className="mr-2 h-4 w-4" /> Clear
                  </Button> */}
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
                          exportData("csv", exportDataSet, "payments")
                        }
                      >
                        Export as CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          exportData("excel", exportDataSet, "payments")
                        }
                      >
                        Export as Excel
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          exportData("word", exportDataSet, "payments")
                        }
                      >
                        Export as Word
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
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
                    ].map((m) => ({ label: m, value: m })),
                  ]}
                  value={filterMonth}
                  onChange={setFilterMonth}
                  placeholder="Filter by Month"
                />
                <SearchableSelect
                  options={[
                    { label: "All Years", value: "all" },
                    ...academicYears.map((y) => ({ label: y, value: y })),
                  ]}
                  value={filterAcademicYear}
                  onChange={setFilterAcademicYear}
                  placeholder="Academic Year"
                />
                <SearchableSelect
                  options={[
                    { label: "All Methods", value: "all" },
                    ...["Cash", "Bank Transfer", "Avc +", "Check", "Other"].map(
                      (m) => ({ label: m, value: m })
                    ),
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
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSearchTerm("");
                      setFilterYear("all");
                      setFilterMonth("all");
                      setFilterAcademicYear("all");
                      setFilterMethod("all");
                      setFilterStatus("all");
                    }}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Reset Filters
                  </Button>
                </div>
              </div>

              {paymentsLoading ? (
                <GlobalLoader />
              ) : payments.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="text-xl font-medium mb-2">
                    No payment records found
                  </div>
                  <p className="text-gray-500 mb-4">
                    This student hasn't made any payments yet
                  </p>
                  <Button
                    onClick={() => setAction("add")}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  >
                    Add First Payment
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-gray-900">
                              ${summary.totalPaid.toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-600">Total Paid</p>
                          </div>
                          <DollarSign className="h-8 w-8 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-red-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-gray-900">
                              ${summary.totalDebt.toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-600">Total Debt</p>
                          </div>
                          <AlertCircle className="h-8 w-8 text-red-500" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-purple-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-gray-900">
                              {summary.recordCount}
                            </p>
                            <p className="text-sm text-gray-600">Records</p>
                          </div>
                          <BarChart3 className="h-8 w-8 text-purple-500" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-yellow-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-gray-900">
                              {summary.unknownMonths}
                            </p>
                            <p className="text-sm text-gray-600">
                              Unknown Months
                            </p>
                          </div>
                          <Clock className="h-8 w-8 text-yellow-500" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Payments Table */}
                  <div className="rounded-lg border shadow-sm overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead>Month</TableHead>
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
                          <TableRow key={pay._id}>
                            <TableCell className="font-medium">
                              {pay.isUnknownMonth ? (
                                <Badge variant="warning">
                                  <span className="flex items-center">
                                    <Info className="h-4 w-4 mr-1" />
                                    Unknown
                                  </span>
                                </Badge>
                              ) : (
                                pay.month || "Unknown"
                              )}
                            </TableCell>

                            <TableCell>{pay.academicYear}</TableCell>

                            <TableCell>
                              ${(pay.amount || 0).toFixed(2)}
                            </TableCell>

                            <TableCell>{pay.method}</TableCell>

                            <TableCell>
                              {pay.date
                                ? format(new Date(pay.date), "MMM dd, yyyy")
                                : "N/A"}
                            </TableCell>
                            <TableCell>
                              {pay.dueDate
                                ? format(new Date(pay.dueDate), "MMM dd, yyyy")
                                : "N/A"}
                            </TableCell>

                            <TableCell>
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

                            <TableCell>{pay.sentBy || "N/A"}</TableCell>

                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEditDialog(pay)}
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

        {/* Edit Payment Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-lg w-full">
            <DialogHeader>
              <DialogTitle className="items-center gap-2 hidden">
                <Edit className="h-5 w-5 text-purple-600" />
                Edit Payment Record
              </DialogTitle>
              <DialogDescription className="hidden">
                Update payment details for {student?.user?.fullName}
              </DialogDescription>
            </DialogHeader>

            {/* Payment Reference - Shows current payment details for context */}
            {editingPayment && (
              <div className="p-4 bg-gray-50 rounded-lg hidden md:block border mb-4">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  Current Payment Details
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Month:</span>
                    <p className="font-medium">
                      {editingPayment.month || "Unknown"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Academic Year:</span>
                    <p className="font-medium">{editingPayment.academicYear}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Amount:</span>
                    <p className="font-medium">
                      ${(editingPayment.amount || 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Method:</span>
                    <p className="font-medium">{editingPayment.method}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <Badge
                      variant={
                        editingPayment.status === "Paid"
                          ? "success"
                          : editingPayment.status === "Pending"
                            ? "warning"
                            : "destructive"
                      }
                    >
                      {editingPayment.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">Payment Date:</span>
                    <p className="font-medium">
                      {editingPayment.date
                        ? format(new Date(editingPayment.date), "MMM dd, yyyy")
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Form */}
            <CommonForm
              form={editForm}
              formControls={enhancedFormControls}
              handleSubmit={handleEditSubmit}
              btnText={updateLoading ? <ButtonLoader /> : "Update Payment"}
              // gridConfig="grid grid-cols-1 md:grid-cols-2 gap-2" // smaller gap
              inputClassName="bg-white p-2 text-sm dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-blue-500"
              labelClassName="text-xs font-medium text-gray-700 dark:text-gray-300"
              buttonClassName="py-1 px-2 text-sm rounded bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 w-full"
              customLayout={{
                grid: [
                  ["month", "academicYear", "amount", "method"],
                  ["sentBy", "date", "dueDate"],
                  // ["status", "debt"],
                  ["note"],
                ],
              }}
            />

            <DialogFooter>
              <Button
                variant="outline"
                onClick={closeEditDialog}
                className="flex-1"
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Parent Info Dialog */}
        <Dialog open={showParentInfo} onOpenChange={setShowParentInfo}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-purple-600" />
                Parent Information
              </DialogTitle>
              <DialogDescription>
                Contact details for {student.user?.fullName}'s parent
              </DialogDescription>
            </DialogHeader>
            {parentInfo ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {parentInfo.user?.fullName || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600">Parent Name</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {parentInfo.contact || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600">Contact Number</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {parentInfo.user?.email || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600">Email Address</p>
                  </div>
                </div>
              </div>
            ) : (
              <p>No parent information available</p>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                Confirm Deletion
              </DialogTitle>
              <DialogDescription>
                This action cannot be undone. The payment record will be
                permanently removed.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {paymentToDelete && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="font-medium text-gray-900">Payment Details</p>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <p>
                      Date:{" "}
                      {paymentToDelete.date
                        ? format(new Date(paymentToDelete.date), "MMM dd, yyyy")
                        : "N/A"}
                    </p>
                    <p>
                      Amount: ${Number(paymentToDelete.amount || 0).toFixed(2)}
                    </p>
                    <p>Method: {paymentToDelete.method}</p>
                    <p>Status: {paymentToDelete.status}</p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeletePayment}
                className="flex-1"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default StudentRecoredByid;
