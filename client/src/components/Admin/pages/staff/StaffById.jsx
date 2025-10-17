import React, { useEffect, useState } from "react";
import {
  callGetStaffByIdApi,
  callUpdateStaffApi,
  callDeleteStaffApi,
} from "@/service/service";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import GlobalLoader from "@/components/common/GlobalLoader";
import ButtonLoader from "@/components/common/ButtonLoadi";

// Shadcn/ui components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

// Lucide icons
import {
  User,
  Mail,
  Calendar,
  Briefcase,
  GraduationCap,
  DollarSign,
  MapPin,
  Phone,
  Shield,
  Edit3,
  Save,
  X,
  ArrowLeft,
  Trash2,
  Users,
  Clock,
  Award,
  BookOpen,
  Building,
  IdCard,
  FileText,
  AlertCircle,
  PauseCircle,
  CheckCircle2,
} from "lucide-react";

const StaffById = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    dob: "",
    gender: "",
    nationalId: "",
    age: "",
    jobTitle: "",
    status: "",
    employmentType: "",
    educationalQualifications: "",
    SalaryBymonth: "",
    notes: "",
  });

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await callGetStaffByIdApi(id);
      if (response?.staff) {
        setStaff(response.staff);
        setFormData({
          fullName: response.staff.user?.fullName || "",
          email: response.staff.user?.email || "",
          status: response.staff.user?.status || "",
          dob: response.staff.dob
            ? new Date(response.staff.dob).toISOString().split("T")[0]
            : "",
          gender: response.staff.gender || "",
          nationalId: response.staff.nationalId || "",
          age: response.staff.age || "",
          jobTitle: response.staff.jobTitle || "",
          employmentType: response.staff.employmentType || "",
          educationalQualifications:
            response.staff.educationalQualifications || "",
          SalaryBymonth: response.staff.SalaryBymonth || "",
          notes: response.staff.notes || "",
        });
      } else {
        toast.error("Staff member not found ❌");
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
  }, [id]);

  const handleEdit = () => setIsEditing(true);

  const handleCancel = () => {
    setIsEditing(false);
    if (staff) {
      setFormData({
        fullName: staff.user?.fullName || "",
        email: staff.user?.email || "",
        status: staff.user?.status || "",
        dob: staff.dob ? new Date(staff.dob).toISOString().split("T")[0] : "",
        gender: staff.gender || "",
        nationalId: staff.nationalId || "",
        age: staff.age || "",
        jobTitle: staff.jobTitle || "",
        employmentType: staff.employmentType || "",
        educationalQualifications: staff.educationalQualifications || "",
        SalaryBymonth: staff.SalaryBymonth || "",
        notes: staff.notes || "",
      });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        status: formData.status,
        dob: formData.dob,
        gender: formData.gender,
        nationalId: formData.nationalId,
        age: formData.age,
        jobTitle: formData.jobTitle,
        employmentType: formData.employmentType,
        educationalQualifications: formData.educationalQualifications,
        SalaryBymonth: formData.SalaryBymonth,
        notes: formData.notes,
      };

      const response = await callUpdateStaffApi(id, payload);
      if (response.staff) {
        setStaff(response.staff);
        setIsEditing(false);
        toast.success("Staff information updated successfully ✅");
      } else {
        toast.error("Failed to update staff information ❌");
      }
    } catch (err) {
      console.error("Error updating staff", err);
      toast.error("Failed to update staff ❌");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await callDeleteStaffApi(id);
      toast.success("Staff member deleted successfully ✅");
      navigate("/admin/dashboard/staffinfo");
    } catch (err) {
      console.error("Error deleting staff", err);
      toast.error("Failed to delete staff member ❌");
    } finally {
      setDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const openDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Calculate employment duration
  const getEmploymentDuration = () => {
    if (!staff?.createdAt) return "N/A";
    const startDate = new Date(staff.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);

    if (years > 0) {
      return `${years} year${years > 1 ? "s" : ""} ${months > 0 ? `${months} month${months > 1 ? "s" : ""}` : ""}`;
    }
    return `${months} month${months > 1 ? "s" : ""}`;
  };

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
      Contract: {
        label: "Contract",
        color: "bg-purple-100 text-purple-800 border-purple-200",
      },
    };
    return (
      config[type] || {
        label: type,
        color: "bg-gray-100 text-gray-800 border-gray-200",
      }
    );
  };

  const getStatusConfig = (status) => {
    const config = {
      active: {
        label: "Active",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle2,
        iconColor: "text-green-600",
      },
      pending: {
        label: "Pending",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Clock,
        iconColor: "text-yellow-600",
      },
      blocked: {
        label: "Blocked",
        color: "bg-red-100 text-red-800 border-red-200",
        icon: AlertCircle,
        iconColor: "text-red-600",
      },
      nonActive: {
        label: "Non Active",
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: PauseCircle,
        iconColor: "text-gray-600",
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
  if (!staff)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-gray-300 to-gray-400 flex items-center justify-center mx-auto mb-6">
              <User className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Staff Not Found
            </h3>
            <p className="text-gray-600 mb-6">
              The staff profile you're looking for doesn't exist.
            </p>
            <Link to="/admin/dashboard/staffinfo">
              <Button className="gap-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800">
                <ArrowLeft className="w-4 h-4" />
                Back to Staff
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );

  const employmentBadge = getEmploymentBadge(staff.employmentType);
  const statusBadge = getStatusConfig(staff.user?.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section - Staff Profile Page */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
          {/* Left Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
            {/* Back Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2 sm:w-auto w-[80px] justify-center sm:justify-start"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            {/* Avatar + Info */}
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <Avatar className="h-16 w-16 border-4 border-white shadow-lg flex-shrink-0">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-semibold">
                  {getInitials(staff.user?.fullName)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 truncate">
                  {staff.user?.fullName}
                </h1>

                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className="bg-blue-100 text-blue-700 text-xs sm:text-sm"
                  >
                    {staff.jobTitle}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`${employmentBadge.color} text-xs sm:text-sm`}
                  >
                    {employmentBadge.label}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`${statusBadge.color} text-xs sm:text-sm`}
                  >
                    {statusBadge.label}
                  </Badge>
                  <span className="text-xs sm:text-sm text-slate-500">
                    {staff.age} years • {staff.gender}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section (All Staff, Delete, Edit) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <Link to="/admin/dashboard/staffinfo" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto border-indigo-600 text-indigo-600 hover:bg-indigo-50"
              >
                All Staff
              </Button>
            </Link>

            <Button
              variant="destructive"
              onClick={openDeleteDialog}
              className="gap-2 w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>

            {!isEditing && (
              <Button
                onClick={handleEdit}
                className="gap-2 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              >
                <Edit3 className="h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <Briefcase className="h-8 w-8 mb-2" />
              <span className="text-sm font-medium">Position</span>
              <span className="text-lg font-bold mt-1">{staff.jobTitle}</span>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <Clock className="h-8 w-8 mb-2" />
              <span className="text-sm font-medium">Employment</span>
              <span className="text-lg font-bold mt-1">
                {getEmploymentDuration()}
              </span>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <DollarSign className="h-8 w-8 mb-2" />
              <span className="text-sm font-medium">Monthly Salary</span>
              <span className="text-lg font-bold mt-1">
                ${staff.SalaryBymonth || "0"}
              </span>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <Award className="h-8 w-8 mb-2" />
              <span className="text-sm font-medium">Status</span>
              <span className="text-lg font-bold mt-1 capitalize">
                {staff.user?.status || "Active"}
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="flex flex-wrap w-full gap-2">
            <TabsTrigger
              value="personal"
              className="flex-1 min-w-[120px] text-center"
            >
              Personal Info
            </TabsTrigger>
            <TabsTrigger
              value="employment"
              className="flex-1 min-w-[120px] text-center"
            >
              Employment
            </TabsTrigger>
            <TabsTrigger
              value="additional"
              className="flex-1 min-w-[120px] text-center"
            >
              Additional Info
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal">
            <Card>
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Basic personal details and identification
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="fullName"
                        className="flex items-center gap-2"
                      >
                        <User className="h-4 w-4" />
                        Full Name
                      </Label>
                      {isEditing ? (
                        <Input
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="Enter full name"
                        />
                      ) : (
                        <p className="text-slate-700 font-medium">
                          {staff.user?.fullName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="flex items-center gap-2"
                      >
                        <Mail className="h-4 w-4" />
                        Email Address
                      </Label>
                      {isEditing ? (
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Enter email address"
                        />
                      ) : (
                        <p className="text-slate-700 font-medium">
                          {staff.user?.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dob" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Date of Birth
                      </Label>
                      {isEditing ? (
                        <Input
                          id="dob"
                          name="dob"
                          type="date"
                          value={formData.dob}
                          onChange={handleInputChange}
                        />
                      ) : (
                        <p className="text-slate-700 font-medium">
                          {staff.dob
                            ? new Date(staff.dob).toLocaleDateString()
                            : "N/A"}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="age" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Age
                      </Label>
                      {isEditing ? (
                        <Input
                          id="age"
                          name="age"
                          type="number"
                          value={formData.age}
                          onChange={handleInputChange}
                          readOnly
                          placeholder="Enter age"
                        />
                      ) : (
                        <p className="text-slate-700 font-medium">
                          {staff.age} years
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="gender"
                        className="flex items-center gap-2"
                      >
                        <User className="h-4 w-4" />
                        Gender
                      </Label>
                      {isEditing ? (
                        <Select
                          value={formData.gender}
                          onValueChange={(value) =>
                            handleSelectChange("gender", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-slate-700 font-medium capitalize">
                          {staff.gender}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="nationalId"
                        className="flex items-center gap-2"
                      >
                        <IdCard className="h-4 w-4" />
                        National ID
                      </Label>
                      {isEditing ? (
                        <Input
                          id="nationalId"
                          name="nationalId"
                          value={formData.nationalId}
                          onChange={handleInputChange}
                          placeholder="Enter national ID"
                        />
                      ) : (
                        <p className="text-slate-700 font-medium">
                          {staff.nationalId || "N/A"}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="gender"
                        className="flex items-center gap-2"
                      >
                        <User className="h-4 w-4" />
                        Status
                      </Label>
                      {isEditing ? (
                        <Select
                          value={formData.status}
                          onValueChange={(value) =>
                            handleSelectChange("status", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="blocked">Blocked</SelectItem>
                            <SelectItem value="nonActive">
                              Non Active
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`capitalize px-2 py-1 font-medium flex items-center gap-1 ${statusBadge.color}`}
                          >
                            <statusBadge.icon
                              className={`w-3 h-3 ${statusBadge.iconColor}`}
                            />
                            {statusBadge.label}
                          </Badge>
                        </div>
                      )}
                    </div>
                    {/* <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Account Status
                      </Label>
                      <Badge
                        variant="outline"
                        className={`${statusBadge.color} font-medium`}
                      >
                        {statusBadge.label}
                      </Badge>
                    </div> */}

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Member Since
                      </Label>
                      <p className="text-slate-700 font-medium">
                        {staff.createdAt
                          ? new Date(staff.createdAt).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employment Information Tab */}
          <TabsContent value="employment">
            <Card>
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Employment Information
                </CardTitle>
                <CardDescription>
                  Job details and employment information
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="jobTitle"
                        className="flex items-center gap-2"
                      >
                        <Briefcase className="h-4 w-4" />
                        Job Title
                      </Label>
                      {isEditing ? (
                        <Input
                          id="jobTitle"
                          name="jobTitle"
                          value={formData.jobTitle}
                          onChange={handleInputChange}
                          placeholder="Enter job title"
                        />
                      ) : (
                        <p className="text-slate-700 font-medium">
                          {staff.jobTitle}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="employmentType"
                        className="flex items-center gap-2"
                      >
                        <Building className="h-4 w-4" />
                        Employment Type
                      </Label>
                      {isEditing ? (
                        <Select
                          value={formData.employmentType}
                          onValueChange={(value) =>
                            handleSelectChange("employmentType", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select employment type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Full-time">Full-time</SelectItem>
                            <SelectItem value="Part-time">Part-time</SelectItem>
                            {/* <SelectItem value="Contract">Contract</SelectItem> */}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`${employmentBadge.color} font-medium`}
                          >
                            {employmentBadge.label}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="SalaryBymonth"
                        className="flex items-center gap-2"
                      >
                        <DollarSign className="h-4 w-4" />
                        Monthly Salary
                      </Label>
                      {isEditing ? (
                        <Input
                          id="SalaryBymonth"
                          name="SalaryBymonth"
                          type="number"
                          value={formData.SalaryBymonth}
                          onChange={handleInputChange}
                          placeholder="Enter monthly salary"
                        />
                      ) : (
                        <p className="text-slate-700 font-medium">
                          ${staff.SalaryBymonth || "0"}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="educationalQualifications"
                        className="flex items-center gap-2"
                      >
                        <GraduationCap className="h-4 w-4" />
                        Educational Qualifications
                      </Label>
                      {isEditing ? (
                        <Input
                          id="educationalQualifications"
                          name="educationalQualifications"
                          value={formData.educationalQualifications}
                          onChange={handleInputChange}
                          placeholder="Enter qualifications"
                        />
                      ) : (
                        <p className="text-slate-700 font-medium">
                          {staff.educationalQualifications || "N/A"}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Employment Duration
                      </Label>
                      <p className="text-slate-700 font-medium">
                        {getEmploymentDuration()}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Last Updated
                      </Label>
                      <p className="text-slate-700 font-medium">
                        {staff.updatedAt
                          ? new Date(staff.updatedAt).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Additional Information Tab */}
          <TabsContent value="additional">
            <Card>
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Additional Information
                </CardTitle>
                <CardDescription>
                  Additional notes and information
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Notes
                    </Label>
                    {isEditing ? (
                      <Textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="Enter additional notes"
                        rows={4}
                      />
                    ) : (
                      <p className="text-slate-700 font-medium">
                        {staff.notes || "No additional notes"}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Actions */}
        {isEditing && (
          <Card className="bg-white border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                {/* Left: info */}
                <div>
                  <h3 className="font-semibold text-slate-800">Edit Mode</h3>
                  <p className="text-sm text-slate-500">
                    Make changes to staff information
                  </p>
                </div>

                {/* Right: buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="flex-1 sm:flex-none gap-2 w-full sm:w-auto"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={updating}
                    className="flex-1 sm:flex-none gap-2 w-full sm:w-auto bg-green-600 hover:bg-green-700"
                  >
                    {updating ? <ButtonLoader /> : <Save className="h-4 w-4" />}
                    Save Changes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                Delete Staff Member
              </DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete{" "}
                <span className="font-semibold text-slate-800">
                  {staff.user?.fullName}
                </span>{" "}
                from the system and remove all associated data.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
                className="gap-2"
              >
                {deleting ? <ButtonLoader /> : <Trash2 className="h-4 w-4" />}
                Delete Staff
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default StaffById;
