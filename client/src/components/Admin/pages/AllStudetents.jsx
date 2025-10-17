import React, { useEffect, useState } from "react";
import {
  callDeleteStudentApi,
  callGetAllStudentsidbyApi,
  callUpdateStudentApi,
  callGetAllParentsApi,
  callGetAllClassroomsApi,
} from "@/service/service";
import { toast } from "sonner";
import { useParams, useNavigate, Link } from "react-router-dom";
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
  Phone,
  MapPin,
  School,
  Calendar,
  DollarSign,
  Shield,
  BookOpen,
  ClipboardList,
  CalendarDays,
  UserCircle,
  Edit3,
  Save,
  X,
  GraduationCap,
  ArrowLeft,
  Trash2,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  PauseCircle,
  IdCard,
  FileText,
} from "lucide-react";
import SearchableSelect from "@/components/common/SearchableSelect";

const AllStudents = () => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [update, setUpdate] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [parents, setParents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    age: "",
    gender: "",
    contact: "",
    address: "",
    emergencyContact: "",
    previousSchool: "",
    monthlyPayment: "",
    dob: "",
    parentId: "",
    classId: "",
    status: "active",
    nationalId: "",
    notes: "",
  });

  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch parents and classrooms for dropdowns
  const fetchParentsAndClassrooms = async () => {
    try {
      const [parentsData, classroomsData] = await Promise.all([
        callGetAllParentsApi(),
        callGetAllClassroomsApi(),
      ]);

      if (parentsData?.parents) {
        setParents(parentsData.parents);
      }

      if (classroomsData?.classrooms) {
        setClassrooms(classroomsData.classrooms);
      }
    } catch (err) {
      console.error("Error fetching dropdown data", err);
    }
  };

  const fetchStudent = async () => {
    setLoading(true);
    const start = Date.now();
    try {
      const data = await callGetAllStudentsidbyApi(id);
      if (data?.student) {
        setStudent(data.student);
        setFormData({
          fullName: data.student.user?.fullName || "",
          email: data.student.user?.email || "",
          age: data.student.age || "",
          gender: data.student.gender || "",
          contact: data.student.contact || "",
          address: data.student.address || "",
          emergencyContact: data.student.emergencyContact || "",
          previousSchool: data.student.previousSchool || "",
          monthlyPayment: data.student.monthlyPayment || "",
          dob: data.student.dob
            ? new Date(data.student.dob).toISOString().split("T")[0]
            : "",
          parentId: data.student.parent?._id || "",
          classId: data.student.classId?._id || "",
          status: data.student.user?.status || "active",
          nationalId: data.student.nationalId || "",
          notes: data.student.notes || "",
        });
      } else {
        toast.error("Student not found ❌");
      }
    } catch (err) {
      console.error("Error fetching student", err);
      toast.error("Failed to load student data");
    } finally {
      const elapsed = Date.now() - start;
      const minTime = 1000;
      const remaining = minTime - elapsed;

      if (remaining > 0) {
        setTimeout(() => setLoading(false), remaining);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchStudent();
    fetchParentsAndClassrooms();
  }, [id]);

  const handleEdit = () => setIsEditing(true);

  const handleCancel = () => {
    setIsEditing(false);
    if (student) {
      setFormData({
        fullName: student.user?.fullName || "",
        email: student.user?.email || "",
        age: student.age || "",
        gender: student.gender || "",
        contact: student.contact || "",
        address: student.address || "",
        emergencyContact: student.emergencyContact || "",
        previousSchool: student.previousSchool || "",
        monthlyPayment: student.monthlyPayment || "",
        dob: student.dob
          ? new Date(student.dob).toISOString().split("T")[0]
          : "",
        parentId: student.parent?._id || "",
        classId: student.classId?._id || "",
        status: student.user?.status || "active",
        nationalId: student.nationalId || "",
        notes: student.notes || "",
      });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setUpdate(true);
    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        age: formData.age,
        gender: formData.gender,
        contact: formData.contact,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        previousSchool: formData.previousSchool,
        monthlyPayment: formData.monthlyPayment,
        dob: formData.dob,
        parentId: formData.parentId,
        classId: formData.classId,
        status: formData.status,
        nationalId: formData.nationalId,
        notes: formData.notes,
      };

      await callUpdateStudentApi(student._id, payload);
      toast.success("Student updated successfully ✅");

      // Refresh the student data
      await fetchStudent();
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating student", err);
      toast.error("Failed to update student ❌");
    } finally {
      setUpdate(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await callDeleteStudentApi(id);
      toast.success("Student deleted successfully ✅");
      navigate("/admin/dashboard/StudentInfo");
    } catch (err) {
      console.error("Error deleting student", err);
      toast.error("Failed to delete student ❌");
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

  const originalData = {
    fullName: student?.user?.fullName || "",
    email: student?.user?.email || "",
    age: student?.age || "",
    gender: student?.gender || "",
    contact: student?.contact || "",
    address: student?.address || "",
    emergencyContact: student?.emergencyContact || "",
    previousSchool: student?.previousSchool || "",
    monthlyPayment: student?.monthlyPayment || "",
    dob: student?.dob ? new Date(student.dob).toISOString().split("T")[0] : "",
    parentId: student?.parent?._id || "",
    classId: student?.classId?._id || "",
    status: student?.user?.status || "active",
    nationalId: student?.nationalId || "",
    notes: student?.notes || "",
  };

  const hasChanges = () => {
    if (!student) return false;
    return Object.keys(formData).some(
      (key) => formData[key] !== originalData[key]
    );
  };

  // Status badge configuration
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

  const navigateTo = (page) => {
    switch (page) {
      case "result":
        navigate(`/admin/student/${student._id}/result`);
        break;
      case "records":
        navigate(`/admin/student/${student._id}/records`);
        break;
      case "attendance":
        navigate(`/admin/student/${student._id}/attendance`);
        break;
      case "profile":
        navigate(`/admin/student/${student._id}/profile`);
        break;
      default:
        break;
    }
  };

  const getInitials = (name) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "ST"
    );
  };

  if (loading) return <GlobalLoader />;
  if (!student)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-gray-300 to-gray-400 flex items-center justify-center mx-auto mb-6">
              <User className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Student Not Found
            </h3>
            <p className="text-gray-600 mb-6">
              The Student profile you're looking for doesn't exist.
            </p>
            <Link to="/admin/dashboard/StudentInfo">
              <Button className="gap-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800">
                <ArrowLeft className="w-4 h-4" />
                Back to Student
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );

  const currentStatus = getStatusConfig(student.user?.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header - Student Profile Page */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
          {/* Mobile Top Row: Back + All Students */}
          <div className="hidden justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2 w-[80px] justify-center"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            <Link to="/admin/dashboard/StudentInfo">
              <Button
                variant="outline"
                className="w-[120px] justify-center border-indigo-600 text-indigo-600 hover:bg-indigo-50"
              >
                All Students
              </Button>
            </Link>
          </div>

          {/* Left Section: Back + Avatar + Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2 sm:w-auto w-[80px] justify-center sm:justify-start"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              <Avatar className="h-16 w-16 border-4 border-white shadow-lg flex-shrink-0">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-semibold">
                  {getInitials(student.user?.fullName)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 truncate">
                  {student.user?.fullName}
                </h1>

                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-700 text-xs sm:text-sm"
                  >
                    {student.admissionNumber}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-green-200 text-green-700 text-xs sm:text-sm"
                  >
                    {student.classId?.name || "N/A"}
                  </Badge>
                  <span className="text-xs sm:text-sm text-slate-500">
                    {student.gender} • {student.age} years
                  </span>
                  <Badge
                    variant="outline"
                    className={`capitalize px-2 py-1 text-xs font-medium flex items-center gap-1 ${currentStatus.color}`}
                  >
                    <currentStatus.icon
                      className={`w-3 h-3 ${currentStatus.iconColor}`}
                    />
                    {currentStatus.label}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section: All Students, Delete, Edit */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto mt-2 sm:mt-0">
            <Link
              to="/admin/dashboard/StudentInfo"
              className="w-full sm:w-auto"
            >
              <Button
                variant="outline"
                className="w-full sm:w-auto border-indigo-600 text-indigo-600 hover:bg-indigo-50"
              >
                All Students
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

        {/* Quick Stats & Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link to={`/admin/dashboard/StudentResultbyId/${student._id}`}>
            <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <BookOpen className="h-8 w-8 mb-2" />
                <span className="text-sm font-medium">Results</span>
                <Button
                  variant="ghost"
                  className="text-white hover:text-white hover:bg-white/20 mt-2 h-8"
                  onClick={() => navigateTo("result")}
                >
                  View
                </Button>
              </CardContent>
            </Card>
          </Link>
          <Link to={`/admin/dashboard/studentRecord/${student._id}`}>
            <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <ClipboardList className="h-8 w-8 mb-2" />
                <span className="text-sm font-medium">Records</span>
                <Button
                  variant="ghost"
                  className="text-white hover:text-white hover:bg-white/20 mt-2 h-8"
                >
                  View
                </Button>
              </CardContent>
            </Card>
          </Link>
          <Link to={`/admin/dashboard/studentAttendece/${student._id}`}>
            <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <CalendarDays className="h-8 w-8 mb-2" />
                <span className="text-sm font-medium">Attendance</span>
                <Button
                  variant="ghost"
                  className="text-white hover:text-white hover:bg-white/20 mt-2 h-8"
                  onClick={() => navigateTo("attendance")}
                >
                  View
                </Button>
              </CardContent>
            </Card>
          </Link>
          <Card className="bg-gradient-to-br from-slate-600 to-slate-800 text-white">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <UserCircle className="h-8 w-8 mb-2" />
              <span className="text-sm font-medium">Full Profile</span>
              <Button
                variant="ghost"
                className="text-white hover:text-white hover:bg-white/20 mt-2 h-8"
                onClick={() => navigateTo("profile")}
              >
                View
              </Button>
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
              value="academic"
              className="flex-1 min-w-[120px] text-center"
            >
              Academic Info
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
                  Basic details and contact information
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
                          {student.user?.fullName}
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
                          {student.user?.email}
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
                          {student.dob
                            ? new Date(student.dob).toLocaleDateString()
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
                          placeholder="Enter age"
                        />
                      ) : (
                        <p className="text-slate-700 font-medium">
                          {student.age} years
                        </p>
                      )}
                    </div>

                    {/* National ID Field */}
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
                          {student.nationalId || "N/A"}
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
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            {/* <SelectItem value="Other">Other</SelectItem> */}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-slate-700 font-medium">
                          {student.gender}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="contact"
                        className="flex items-center gap-2"
                      >
                        <Phone className="h-4 w-4" />
                        Contact Number
                      </Label>
                      {isEditing ? (
                        <Input
                          id="contact"
                          name="contact"
                          value={formData.contact}
                          onChange={handleInputChange}
                          placeholder="Enter contact number"
                        />
                      ) : (
                        <p className="text-slate-700 font-medium">
                          {student.contact}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="emergencyContact"
                        className="flex items-center gap-2"
                      >
                        <Shield className="h-4 w-4" />
                        Emergency Contact
                      </Label>
                      {isEditing ? (
                        <Input
                          id="emergencyContact"
                          name="emergencyContact"
                          value={formData.emergencyContact}
                          onChange={handleInputChange}
                          placeholder="Enter emergency contact"
                        />
                      ) : (
                        <p className="text-slate-700 font-medium">
                          {student.emergencyContact}
                        </p>
                      )}
                    </div>

                    {/* Status Field */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="status"
                        className="flex items-center gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4" />
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
                            className={`capitalize px-2 py-1 font-medium flex items-center gap-1 ${currentStatus.color}`}
                          >
                            <currentStatus.icon
                              className={`w-3 h-3 ${currentStatus.iconColor}`}
                            />
                            {currentStatus.label}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Academic Information Tab */}
          <TabsContent value="academic">
            <Card>
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Academic Information
                </CardTitle>
                <CardDescription>School and academic details</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <School className="h-4 w-4" />
                        Current Class
                      </Label>
                      {isEditing ? (
                        <SearchableSelect
                          options={classrooms.map((classroom) => ({
                            value: classroom._id,
                            label: `${classroom.grade} - ${classroom.section}`,
                          }))}
                          value={formData.classId}
                          onChange={(value) =>
                            handleSelectChange("classId", value)
                          }
                          placeholder="Select class"
                        />
                      ) : (
                        <p className="text-slate-700 font-medium">
                          {student.classId?.grade} - {student.classId?.section}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="previousSchool"
                        className="flex items-center gap-2"
                      >
                        <School className="h-4 w-4" />
                        Previous School
                      </Label>
                      {isEditing ? (
                        <Input
                          id="previousSchool"
                          name="previousSchool"
                          value={formData.previousSchool}
                          onChange={handleInputChange}
                          placeholder="Enter previous school"
                        />
                      ) : (
                        <p className="text-slate-700 font-medium">
                          {student.previousSchool || "N/A"}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Parent/Guardian
                      </Label>
                      {isEditing ? (
                        <SearchableSelect
                          options={parents.map((parent) => ({
                            value: parent._id,
                            label: `${parent.user?.fullName} - ${parent.contact}`,
                          }))}
                          value={formData.parentId}
                          onChange={(value) =>
                            handleSelectChange("parentId", value)
                          }
                          placeholder="Select parent"
                        />
                      ) : (
                        <div>
                          <p className="text-slate-700 font-medium">
                            {student.parent?.user?.fullName || "N/A"}
                          </p>
                          {student.parent?.contact && (
                            <p className="text-slate-500 text-sm">
                              {student.parent.contact}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="monthlyPayment"
                        className="flex items-center gap-2"
                      >
                        <DollarSign className="h-4 w-4" />
                        Monthly Payment
                      </Label>
                      {isEditing ? (
                        <Input
                          id="monthlyPayment"
                          name="monthlyPayment"
                          type="number"
                          value={formData.monthlyPayment}
                          onChange={handleInputChange}
                          placeholder="Enter monthly payment"
                        />
                      ) : (
                        <p className="text-slate-700 font-medium">
                          ${student.monthlyPayment}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Admission Date
                      </Label>
                      <p className="text-slate-700 font-medium">
                        {student.admissionDate
                          ? new Date(student.admissionDate).toLocaleDateString()
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
                  <MapPin className="h-5 w-5" />
                  Additional Information
                </CardTitle>
                <CardDescription>Address and other details</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="address"
                      className="flex items-center gap-2"
                    >
                      <MapPin className="h-4 w-4" />
                      Address
                    </Label>
                    {isEditing ? (
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Enter address"
                      />
                    ) : (
                      <p className="text-slate-700 font-medium">
                        {student.address || "N/A"}
                      </p>
                    )}
                  </div>

                  {/* Notes Field */}
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
                        placeholder="Enter any additional notes about the student"
                        rows={4}
                      />
                    ) : (
                      <div>
                        {student.notes ? (
                          <p className="text-slate-700 font-medium whitespace-pre-wrap">
                            {student.notes}
                          </p>
                        ) : (
                          <p className="text-slate-500 italic">
                            No notes available
                          </p>
                        )}
                      </div>
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
                    {hasChanges()
                      ? "You have unsaved changes"
                      : "No changes made"}
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
                    disabled={!hasChanges() || update}
                    className="flex-1 sm:flex-none gap-2 w-full sm:w-auto bg-green-600 hover:bg-green-700"
                  >
                    {update ? <ButtonLoader /> : <Save className="h-4 w-4" />}
                    Save Changes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                Delete Student Account
              </DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the
                student account and remove all associated data from our servers.
                Any records linked to this student will be lost.
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
                Delete Student
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AllStudents;
