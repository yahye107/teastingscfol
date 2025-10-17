import React, { useEffect, useState } from "react";
import { callGetAllStaffApi, callDeleteStaffApi } from "@/service/service";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import GlobalLoader from "@/components/common/GlobalLoader";

// Shadcn/ui components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Lucide icons
import {
  Users,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  GraduationCap,
  DollarSign,
  User,
  Filter,
  MoreVertical,
  Shield,
  ArrowLeft,
} from "lucide-react";
import ButtonLoader from "@/components/common/ButtonLoadi";

const AllStaff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [employmentFilter, setEmploymentFilter] = useState("all");
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    staffId: null,
    staffName: "",
  });
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await callGetAllStaffApi();
      if (response?.staff) {
        setStaff(response.staff);
      } else {
        toast.error("Failed to fetch staff data");
      }
    } catch (err) {
      console.error("Error fetching staff", err);
      toast.error("Failed to load staff data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleDelete = async () => {
    if (!deleteDialog.staffId) return;

    setDeleting(true);
    try {
      await callDeleteStaffApi(deleteDialog.staffId);
      toast.success("Staff member deleted successfully ✅");
      setStaff(staff.filter((s) => s._id !== deleteDialog.staffId));
      setDeleteDialog({ open: false, staffId: null, staffName: "" });
    } catch (err) {
      console.error("Error deleting staff", err);
      toast.error("Failed to delete staff member ❌");
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteDialog = (staffId, staffName) => {
    setDeleteDialog({ open: true, staffId, staffName });
  };

  // Filter staff based on search and employment type
  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      member.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEmployment =
      employmentFilter === "all" || member.employmentType === employmentFilter;

    return matchesSearch && matchesEmployment;
  });

  const getEmploymentBadge = (type) => {
    const config = {
      "Full-time": {
        label: "Full Time",
        color: "bg-green-100 text-green-800 border-green-200",
      },
      "Part-time": {
        label: "Part Time",
        color: "bg-blue-100 text-blue-800 border-blue-200",
      },
      //   Contract: {
      //     label: "Contract",
      //     color: "bg-purple-100 text-purple-800 border-purple-200",
      //   },
    };
    return (
      config[type] || {
        label: type,
        color: "bg-gray-100 text-gray-800 border-gray-200",
      }
    );
  };

  const getStatusBadge = (status) => {
    const config = {
      active: {
        label: "Active",
        color: "bg-green-100 text-green-800 border-green-200",
      },
      inactive: {
        label: "Inactive",
        color: "bg-gray-100 text-gray-800 border-gray-200",
      },
      pending: {
        label: "Pending",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      },
    };
    return config[status] || config.active;
  };

  const getInitials = (name) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "S"
    );
  };

  if (loading) return <GlobalLoader />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section all staff page*/}
        {/* Header - Staff Management Page */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-3 sm:p-4">
          {/* Top Row for Mobile: Back + Add */}
          <div className="flex w-full justify-between sm:justify-start sm:w-auto">
            {/* Back Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 justify-center sm:justify-start"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            {/* Add Button (mobile only) */}
            <Link to="/admin/dashboard/staff" className="sm:hidden">
              <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg shadow-lg">
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </Link>
          </div>

          {/* Title Section */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">
                Staff Management
              </h1>
              <p className="text-slate-600 dark:text-gray-400 mt-1">
                Manage all staff members and their information
              </p>
            </div>
          </div>

          {/* Add Button for larger screens */}
          <Link to="/admin/dashboard/staff" className="hidden sm:block">
            <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg shadow-lg">
              <Plus className="h-4 w-4" />
              Add New Staff
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">
                    Total Staff
                  </p>
                  <p className="text-3xl font-bold mt-1">{staff.length}</p>
                </div>
                <Users className="h-10 w-10 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">
                    Full Time
                  </p>
                  <p className="text-3xl font-bold mt-1">
                    {
                      staff.filter((s) => s.employmentType === "Full-time")
                        .length
                    }
                  </p>
                </div>
                <Briefcase className="h-10 w-10 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">
                    Part Time
                  </p>
                  <p className="text-3xl font-bold mt-1">
                    {
                      staff.filter((s) => s.employmentType === "Part-time")
                        .length
                    }
                  </p>
                </div>
                <Calendar className="h-10 w-10 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Active</p>
                  <p className="text-3xl font-bold mt-1">
                    {staff.filter((s) => s.user?.status === "active").length}
                  </p>
                </div>
                <Shield className="h-10 w-10 text-white/80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="border-0">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search staff by name, email, or job title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-0 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <Select
                    value={employmentFilter}
                    onValueChange={setEmploymentFilter}
                  >
                    <SelectTrigger className="w-40 border-0 bg-slate-50 focus:ring-2 focus:ring-blue-500">
                      <SelectValue placeholder="Employment Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Full-time">Full Time</SelectItem>
                      <SelectItem value="Part-time">Part Time</SelectItem>
                      {/* <SelectItem value="Contract">Contract</SelectItem> */}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staff Table */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Staff Members ({filteredStaff.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredStaff.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No staff members found
                </h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  {searchTerm || employmentFilter !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "Get started by adding your first staff member"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-slate-700">
                        Staff Member
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        Contact
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        Job Details
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        Employment
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        Status
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff.map((member) => {
                      const employmentBadge = getEmploymentBadge(
                        member.employmentType
                      );
                      const statusBadge = getStatusBadge(member.user?.status);

                      return (
                        <TableRow
                          key={member._id}
                          className="group hover:bg-blue-50/50 transition-colors duration-150 cursor-pointer"
                          onClick={() =>
                            navigate(`/admin/dashboard/staff/${member._id}`)
                          }
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                                {getInitials(member.user?.fullName)}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                                  {member.user?.fullName}
                                </div>
                                <div className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                  <Briefcase className="h-3 w-3" />
                                  {member.jobTitle}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3 w-3 text-slate-400" />
                                <span className="text-slate-700">
                                  {member.user?.email}
                                </span>
                              </div>
                              {member.dob && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar className="h-3 w-3 text-slate-400" />
                                  <span className="text-slate-600">
                                    {new Date(member.dob).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm text-slate-700">
                                <span className="font-medium">Age:</span>{" "}
                                {member.age}
                              </div>
                              {member.educationalQualifications && (
                                <div className="flex items-center gap-1 text-sm text-slate-600">
                                  <GraduationCap className="h-3 w-3" />
                                  <span
                                    className="truncate max-w-[150px]"
                                    title={member.educationalQualifications}
                                  >
                                    {member.educationalQualifications}
                                  </span>
                                </div>
                              )}
                              {member.SalaryBymonth && (
                                <div className="flex items-center gap-1 text-sm text-slate-600">
                                  <DollarSign className="h-3 w-3" />
                                  <span>${member.SalaryBymonth}/month</span>
                                </div>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${employmentBadge.color} font-medium`}
                            >
                              {employmentBadge.label}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${statusBadge.color} font-medium`}
                            >
                              {statusBadge.label}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <div className="flex justify-end gap-2">
                              {/* <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 border-blue-200 text-blue-600 hover:bg-blue-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(
                                    `/admin/dashboard/staff/${member._id}`
                                  );
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 border-green-200 text-green-600 hover:bg-green-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(
                                    `/admin/dashboard/staff/${member._id}/edit`
                                  );
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button> */}
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 border-red-200 text-red-600 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDeleteDialog(
                                    member._id,
                                    member.user?.fullName
                                  );
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete Staff Member
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <span className="font-semibold text-slate-800">
                {deleteDialog.staffName}
              </span>{" "}
              from the system and remove all associated data.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() =>
                setDeleteDialog({ open: false, staffId: null, staffName: "" })
              }
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? <ButtonLoader /> : "Delete Staff"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllStaff;
