import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  callUpdateTeacherApi,
  callGetTeacherByIdApi,
  callGetTeacherWeeklyTimetableApi,
  callGetTeacherTodayTimetableApi,
  callDeleteTeacherApi,
  callRemoveSubjectsFromTeacherApi,
} from "@/service/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Phone,
  Mail,
  MapPin,
  User,
  Calendar,
  GraduationCap,
  Briefcase,
  DollarSign,
  BookOpen,
  Clock,
  Users,
  Building,
  ArrowLeft,
  Edit,
  Save,
  X,
  Star,
  Award,
  CalendarDays,
  BookText,
  School,
  ChartBar,
  BarChart3,
  Target,
  CheckCircle2,
  ClipboardList,
  Trash,
  Trash2,
  DollarSignIcon,
  IdCard,
  Plus,
  FileText,
  AlertCircle,
  PauseCircle,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import GlobalLoader from "@/components/common/GlobalLoader";
import ButtonLoader from "@/components/common/ButtonLoadi";

const TeacherOnly = () => {
  const { id } = useParams();
  const [teacher, setTeacher] = useState(null);
  const [weeklyTimetable, setWeeklyTimetable] = useState([]);
  const [todayTimetable, setTodayTimetable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timetableLoading, setTimetableLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    gender: "",
    dob: "",
    nationalId: "",
    contact: "",
    address: "",
    qualifications: "",
    SalaryBymonth: "",
    experience: "",
    status: "active",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // New state for subject removal dialog
  const [isRemoveSubjectDialogOpen, setIsRemoveSubjectDialogOpen] =
    useState(false);
  const [subjectToRemove, setSubjectToRemove] = useState(null);
  const [removingSubject, setRemovingSubject] = useState(false);

  // Status configuration
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

  const fetchTeacherData = async () => {
    setLoading(true);
    const start = Date.now();
    try {
      const [teacherResponse, weeklyResponse, todayResponse] =
        await Promise.all([
          callGetTeacherByIdApi(id),
          callGetTeacherWeeklyTimetableApi(id),
          callGetTeacherTodayTimetableApi(id),
        ]);

      if (teacherResponse.teacher) {
        setTeacher(teacherResponse.teacher);
        setFormData({
          fullName: teacherResponse.teacher.user?.fullName || "",
          email: teacherResponse.teacher.user?.email || "",
          gender: teacherResponse.teacher.gender || "",
          nationalId: teacherResponse.teacher.nationalId || "",
          dob: teacherResponse.teacher.dob
            ? new Date(teacherResponse.teacher.dob).toISOString().split("T")[0]
            : "",
          contact: teacherResponse.teacher.contact || "",
          address: teacherResponse.teacher.address || "",
          qualifications: teacherResponse.teacher.qualifications || "",
          SalaryBymonth: teacherResponse.teacher.SalaryBymonth || "",
          experience: teacherResponse.teacher.experience || "",
          status: teacherResponse.teacher.user?.status || "active",
          notes: teacherResponse.teacher.notes || "",
        });
      }

      if (weeklyResponse) {
        setWeeklyTimetable(weeklyResponse);
      }

      if (todayResponse) {
        setTodayTimetable(todayResponse.periods);
      }
    } catch (err) {
      console.error("Error fetching teacher data", err);
      toast.error("Something went wrong ❌");
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
    fetchTeacherData();
  }, [id]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form data to original values when canceling
      setFormData({
        fullName: teacher.user?.fullName || "",
        email: teacher.user?.email || "",
        gender: teacher.gender || "",
        nationalId: teacher.nationalId || "",
        dob: teacher.dob
          ? new Date(teacher.dob).toISOString().split("T")[0]
          : "",
        contact: teacher.contact || "",
        address: teacher.address || "",
        qualifications: teacher.qualifications || "",
        SalaryBymonth: teacher.SalaryBymonth || "",
        experience: teacher.experience || "",
        status: teacher.user?.status || "active",
        notes: teacher.notes || "",
      });
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSelectChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Check if there are any changes
  const hasChanges = () => {
    if (!teacher) return false;

    const originalData = {
      fullName: teacher.user?.fullName || "",
      email: teacher.user?.email || "",
      gender: teacher.gender || "",
      nationalId: teacher.nationalId || "",
      dob: teacher.dob ? new Date(teacher.dob).toISOString().split("T")[0] : "",
      contact: teacher.contact || "",
      address: teacher.address || "",
      qualifications: teacher.qualifications || "",
      SalaryBymonth: teacher.SalaryBymonth || "",
      experience: teacher.experience || "",
      status: teacher.user?.status || "active",
      notes: teacher.notes || "",
    };

    return Object.keys(formData).some(
      (key) => formData[key] !== originalData[key]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        gender: formData.gender,
        nationalId: formData.nationalId,
        dob: formData.dob,
        contact: formData.contact,
        address: formData.address,
        qualifications: formData.qualifications,
        SalaryBymonth: formData.SalaryBymonth,
        experience: formData.experience,
        status: formData.status,
        notes: formData.notes,
      };

      const response = await callUpdateTeacherApi(id, payload);
      if (response.teacher) {
        setTeacher(response.teacher);
        setIsEditing(false);
        toast.success("Teacher information updated successfully ✅");
      } else {
        toast.error("Failed to update teacher information ❌");
      }
    } catch (err) {
      console.error("Error updating teacher", err);
      toast.error("Something went wrong ❌");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await callDeleteTeacherApi(id);
      toast.success("Teacher deleted successfully ✅");
      navigate("/admin/dashboard/allTeacher");
    } catch (err) {
      console.error("Error deleting teacher", err);
      toast.error("Failed to delete teacher ❌");
    } finally {
      setDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const openDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
  };

  // Open remove subject dialog
  const openRemoveSubjectDialog = (subject) => {
    setSubjectToRemove(subject);
    setIsRemoveSubjectDialogOpen(true);
  };

  // Close remove subject dialog
  const closeRemoveSubjectDialog = () => {
    setIsRemoveSubjectDialogOpen(false);
    setSubjectToRemove(null);
  };

  // Handle subject removal
  const handleRemoveSubject = async () => {
    if (!subjectToRemove) return;

    setRemovingSubject(true);
    try {
      await callRemoveSubjectsFromTeacherApi({
        teacherId: teacher._id,
        subjectIds: [subjectToRemove._id],
      });

      // Update local state to remove the subject from UI
      setTeacher((prev) => ({
        ...prev,
        subjects: prev.subjects.filter((s) => s._id !== subjectToRemove._id),
      }));

      toast.success("Subject removed successfully ✅");
      closeRemoveSubjectDialog();
    } catch (err) {
      console.error("Failed to remove subject:", err);
      toast.error("Failed to remove subject ❌");
    } finally {
      setRemovingSubject(false);
    }
  };

  const getExperienceLevel = (experience) => {
    const exp = parseInt(experience) || 0;
    if (exp < 3)
      return { level: "Beginner", color: "from-blue-500 to-cyan-500" };
    if (exp < 8)
      return { level: "Intermediate", color: "from-green-500 to-emerald-500" };
    if (exp < 15)
      return { level: "Experienced", color: "from-purple-500 to-violet-500" };
    return { level: "Expert", color: "from-orange-500 to-red-500" };
  };

  const formatTime = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const getCurrentDay = () => {
    return new Date().toLocaleDateString("en-US", { weekday: "long" });
  };

  const calculateSessionStats = () => {
    if (!weeklyTimetable.length) return { total: 0, byDay: {} };

    const byDay = {};
    let total = 0;

    weeklyTimetable.forEach((session) => {
      if (!byDay[session.day]) byDay[session.day] = 0;
      byDay[session.day] += 1;
      total += 1;
    });

    return { total, byDay };
  };

  const calculateTotalHours = (sessions) => {
    if (!sessions || sessions.length === 0) return 0;

    const totalMinutes = sessions.reduce((total, session) => {
      if (!session.startTime || !session.endTime) return total;

      const [startHour, startMinute] = session.startTime.split(":").map(Number);
      const [endHour, endMinute] = session.endTime.split(":").map(Number);

      if (isNaN(startHour) || isNaN(endHour)) return total;

      const start = startHour * 60 + startMinute;
      const end = endHour * 60 + endMinute;

      const duration = end - start;
      return total + Math.max(duration, 0);
    }, 0);

    return (totalMinutes / 60).toFixed(1);
  };

  const getDayColor = (day) => {
    const colors = {
      Monday: "bg-blue-100 text-blue-700",
      Tuesday: "bg-green-100 text-green-700",
      Wednesday: "bg-purple-100 text-purple-700",
      Thursday: "bg-orange-100 text-orange-700",
      Friday: "bg-red-100 text-red-700",
      Saturday: "bg-indigo-100 text-indigo-700",
      Sunday: "bg-gray-100 text-gray-700",
    };
    return colors[day] || "bg-gray-100 text-gray-700";
  };

  const calculateDashboardStats = () => {
    const totalSessions = weeklyTimetable.length;
    const totalHours = calculateTotalHours(weeklyTimetable);
    const totalSubjects = teacher?.subjects?.length || 0;
    const averageSessionsPerDay =
      totalSessions > 0 ? (totalSessions / 5).toFixed(1) : 0;

    return {
      totalSessions,
      totalHours,
      totalSubjects,
      averageSessionsPerDay,
    };
  };

  if (loading) return <GlobalLoader />;

  if (!teacher) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-gray-300 to-gray-400 flex items-center justify-center mx-auto mb-6">
              <User className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Teacher Not Found
            </h3>
            <p className="text-gray-600 mb-6">
              The teacher profile you're looking for doesn't exist.
            </p>
            <Link to="/admin/dashboard/allTeacher">
              <Button className="gap-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800">
                <ArrowLeft className="w-4 h-4" />
                Back to Teachers
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const experienceLevel = getExperienceLevel(teacher.experience);
  const sessionStats = calculateSessionStats();
  const currentDay = getCurrentDay();
  const dashboardStats = calculateDashboardStats();
  const statusConfig = getStatusConfig(teacher.user?.status);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header teacher profile page */}
      <div className="w-full flex flex-col gap-4">
        {/* Top Row: Left Section (Back + Title) */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2 w-[80px] sm:w-auto justify-center sm:justify-start"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="text-center sm:text-left mt-2 sm:mt-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Teacher Profile
            </h1>
            <p className="text-sm text-gray-600">
              Manage teacher information and schedule
            </p>
          </div>
        </div>

        {/* Bottom Row: Right Section (Buttons) */}
        <div className="flex flex-wrap gap-2 w-full">
          <Link
            to={`/admin/dashboard/AttenedeceTeachers/${teacher._id}`}
            className="w-full sm:w-auto"
          >
            <Button
              variant="outline"
              className="gap-2 w-full sm:w-auto justify-center border-gray-300"
            >
              <ClipboardList className="w-4 h-4" />
              Attendance Record
            </Button>
          </Link>

          <Link to="/admin/dashboard/allTeacher" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto border-indigo-600 text-indigo-600 hover:bg-indigo-50"
            >
              All Teachers
            </Button>
          </Link>

          <Link
            to={`/admin/dashboard/AttenedeceTeachers/${teacher._id}`}
            className="w-full sm:w-auto"
          >
            <Button
              variant="outline"
              className="gap-2 w-full sm:w-auto justify-center bg-green-400 border-gray-300"
            >
              <DollarSignIcon className="w-4 h-4" />
              Payment Record
            </Button>
          </Link>

          <Button
            variant="destructive"
            onClick={openDeleteDialog}
            className="gap-2 w-full sm:w-auto justify-center"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>

          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleEditToggle}
                className="gap-2 w-full sm:w-auto justify-center border-gray-300"
                disabled={saving}
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="gap-2 w-full sm:w-auto justify-center bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                disabled={saving || !hasChanges()}
              >
                <Save className="w-4 h-4" />
                {saving ? <ButtonLoader /> : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleEditToggle}
              className="gap-2 w-full sm:w-auto justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="container mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            {/* Profile Summary */}
            <Card className="border shadow-sm">
              <CardContent className="p-6">
                <div className="text-center">
                  <div
                    className={`w-24 h-24 rounded-full bg-gradient-to-r ${experienceLevel.color} flex items-center justify-center text-white font-semibold text-2xl mx-auto mb-4 shadow-lg`}
                  >
                    {teacher.user?.fullName?.charAt(0)?.toUpperCase()}
                  </div>
                  {isEditing ? (
                    <div className="space-y-3 mb-3">
                      <Input
                        value={formData.fullName}
                        onChange={(e) =>
                          handleInputChange("fullName", e.target.value)
                        }
                        placeholder="Full Name"
                        className="text-center font-bold"
                      />
                    </div>
                  ) : (
                    <>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">
                        {teacher.user?.fullName}
                      </h2>
                      <p className="text-gray-600 mb-3">
                        Professional Educator
                      </p>
                    </>
                  )}
                  <Badge
                    className={`bg-gradient-to-r ${experienceLevel.color} text-white border-0`}
                  >
                    <Star className="w-3 h-3 mr-1" />
                    {experienceLevel.level}
                  </Badge>
                </div>

                <Separator className="my-6" />

                {/* Status Display */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Status
                    </span>
                    {isEditing ? (
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          handleSelectChange("status", value)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="blocked">Blocked</SelectItem>
                          <SelectItem value="nonActive">Non Active</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        variant="outline"
                        className={`capitalize px-2 py-1 font-medium flex items-center gap-1 ${statusConfig.color}`}
                      >
                        <statusConfig.icon
                          className={`w-3 h-3 ${statusConfig.iconColor}`}
                        />
                        {statusConfig.label}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">
                        Subjects
                      </span>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-700"
                    >
                      {teacher.subjects?.length || 0}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-900">
                        Weekly Sessions
                      </span>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700"
                    >
                      {sessionStats.total}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium text-purple-900">
                        Experience
                      </span>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-purple-100 text-purple-700"
                    >
                      {teacher.experience || 0}y
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Contact Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 shrink-0">
                    <Mail className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-500">Email</p>
                    {isEditing ? (
                      <Input
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        placeholder="Enter email"
                        className="w-full"
                      />
                    ) : (
                      <p
                        className="font-medium text-gray-900 break-words"
                        title={teacher.user?.email}
                      >
                        {teacher.user?.email || "Not provided"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <Phone className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Contact</p>
                    {isEditing ? (
                      <Input
                        value={formData.contact}
                        onChange={(e) =>
                          handleInputChange("contact", e.target.value)
                        }
                        placeholder="Enter contact number"
                        className="w-full"
                      />
                    ) : (
                      <p className="font-medium text-gray-900">
                        {teacher.contact || "Not provided"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-orange-100">
                    <MapPin className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Address</p>
                    {isEditing ? (
                      <Input
                        value={formData.address}
                        onChange={(e) =>
                          handleInputChange("address", e.target.value)
                        }
                        placeholder="Enter address"
                        className="w-full"
                      />
                    ) : (
                      <p className="font-medium text-gray-900">
                        {teacher.address || "Not provided"}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="xl:col-span-3 space-y-6">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="flex flex-wrap w-full gap-2 bg-white">
                <TabsTrigger
                  value="overview"
                  className="flex-1 min-w-[120px] text-center"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="subjects"
                  className="flex-1 min-w-[120px] text-center"
                >
                  Subjects
                </TabsTrigger>
                <TabsTrigger
                  value="schedule"
                  className="flex-1 min-w-[120px] text-center"
                >
                  Weekly Schedule
                </TabsTrigger>
                <TabsTrigger
                  value="today"
                  className="flex-1 min-w-[120px] text-center"
                >
                  Today's Classes
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 mt-3">
                {/* Modern Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Total Sessions Card */}
                  <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm font-medium mb-1">
                            Total Sessions
                          </p>
                          <p className="text-3xl font-bold">
                            {dashboardStats.totalSessions}
                          </p>
                          <p className="text-blue-100 text-xs mt-1">
                            This week
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                          <CalendarDays className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Teaching Hours Card */}
                  <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100 text-sm font-medium mb-1">
                            Teaching Hours
                          </p>
                          <p className="text-3xl font-bold">
                            {dashboardStats.totalHours}h
                          </p>
                          <p className="text-green-100 text-xs mt-1">
                            Weekly total
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                          <Clock className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Subjects Card */}
                  <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100 text-sm font-medium mb-1">
                            Subjects
                          </p>
                          <p className="text-3xl font-bold">
                            {dashboardStats.totalSubjects}
                          </p>
                          <p className="text-purple-100 text-xs mt-1">
                            Teaching
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Average Sessions Card */}
                  <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-100 text-sm font-medium mb-1">
                            Daily Average
                          </p>
                          <p className="text-3xl font-bold">
                            {dashboardStats.averageSessionsPerDay}
                          </p>
                          <p className="text-orange-100 text-xs mt-1">
                            Sessions per day
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                          <BarChart3 className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Rest of Overview Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Professional Details */}
                  <Card className="border shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="w-5 h-5" />
                        Professional Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Qualifications and National ID */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-2">
                            Qualifications
                          </p>
                          {isEditing ? (
                            <Input
                              value={formData.qualifications}
                              onChange={(e) =>
                                handleInputChange(
                                  "qualifications",
                                  e.target.value
                                )
                              }
                              placeholder="Enter qualifications"
                            />
                          ) : (
                            <p className="font-medium text-gray-900">
                              {teacher.qualifications || "Not provided"}
                            </p>
                          )}
                        </div>
                        <div className="">
                          <p className="text-sm text-gray-500 mb-2 items-center gap-2 flex flex-row">
                            <IdCard className="h-4 w-4" />
                            National ID
                          </p>
                          {isEditing ? (
                            <Input
                              value={formData.nationalId}
                              onChange={(e) =>
                                handleInputChange("nationalId", e.target.value)
                              }
                              placeholder="Enter national ID"
                            />
                          ) : (
                            <p className="text-slate-700 font-medium break-words">
                              {teacher.nationalId || "N/A"}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Experience and Salary */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-2">
                            Experience
                          </p>
                          {isEditing ? (
                            <Input
                              value={formData.experience}
                              onChange={(e) =>
                                handleInputChange("experience", e.target.value)
                              }
                              placeholder="Years"
                              type="number"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="secondary"
                                className="bg-blue-100 text-blue-700"
                              >
                                {teacher.experience || 0} years
                              </Badge>
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="text-sm text-gray-500 mb-2">
                            Monthly Salary
                          </p>
                          {isEditing ? (
                            <Input
                              value={formData.SalaryBymonth}
                              onChange={(e) =>
                                handleInputChange(
                                  "SalaryBymonth",
                                  e.target.value
                                )
                              }
                              placeholder="Amount"
                              type="number"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-green-500" />
                              <span className="font-semibold text-gray-900">
                                ${teacher.SalaryBymonth || "0"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Notes Section */}
                      <div className="border-t pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <p className="text-sm font-medium text-gray-700">
                            Additional Notes
                          </p>
                        </div>
                        {isEditing ? (
                          <Textarea
                            value={formData.notes}
                            onChange={(e) =>
                              handleInputChange("notes", e.target.value)
                            }
                            placeholder="Enter additional notes about the teacher..."
                            rows={4}
                            className="w-full resize-none"
                          />
                        ) : (
                          <div className="bg-gray-50 rounded-lg p-4 min-h-[100px]">
                            {teacher.notes ? (
                              <p className="text-gray-700 whitespace-pre-wrap">
                                {teacher.notes}
                              </p>
                            ) : (
                              <div className="text-center py-4 text-gray-500">
                                <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                <p className="text-sm">No notes available</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Personal Information */}
                  <Card className="border shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Full Name</span>
                        {isEditing ? (
                          <Input
                            value={formData.fullName}
                            onChange={(e) =>
                              handleInputChange("fullName", e.target.value)
                            }
                            placeholder="Full Name"
                            className="w-48"
                          />
                        ) : (
                          <span className="font-medium text-gray-900">
                            {teacher.user?.fullName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Gender</span>
                        {isEditing ? (
                          <Select
                            value={formData.gender}
                            onValueChange={(value) =>
                              handleSelectChange("gender", value)
                            }
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline" className="capitalize">
                            {teacher.gender || "Not provided"}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Date of Birth
                        </span>
                        {isEditing ? (
                          <Input
                            type="date"
                            value={formData.dob}
                            onChange={(e) =>
                              handleInputChange("dob", e.target.value)
                            }
                            className="w-48"
                          />
                        ) : (
                          <span className="font-medium text-gray-900">
                            {teacher.dob
                              ? new Date(teacher.dob).toLocaleDateString()
                              : "Not provided"}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Age</span>
                        <span className="font-medium text-gray-900">
                          {teacher.age || "N/A"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Weekly Session Distribution */}
                <Card className="border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarDays className="w-5 h-5" />
                      Weekly Session Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
                      {[
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday",
                        "Sunday",
                      ].map((day) => (
                        <div key={day} className="text-center">
                          <div
                            className={`p-3 rounded-lg ${getDayColor(day)} mb-2`}
                          >
                            <span className="text-sm font-medium">
                              {day.slice(0, 3)}
                            </span>
                          </div>
                          <div className="text-xl font-bold text-gray-900">
                            {sessionStats.byDay[day] || 0}
                          </div>
                          <div className="text-xs text-gray-500">sessions</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Subjects Tab */}
              {/* Subjects Tab */}
              <TabsContent value="subjects" className="space-y-6 mt-3">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <CardTitle className="flex items-center gap-2 text-2xl">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                          <BookText className="w-5 h-5" />
                        </div>
                        <div>
                          Teaching Subjects
                          <div className="text-sm font-normal text-gray-500 mt-1">
                            {teacher.subjects?.length || 0} subject
                            {teacher.subjects?.length !== 1 ? "s" : ""} assigned
                          </div>
                        </div>
                      </CardTitle>

                      {teacher.subjects?.length > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-700">
                              {teacher.subjects?.length} subject
                              {teacher.subjects?.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent>
                    {!teacher.subjects || teacher.subjects.length === 0 ? (
                      <div className="text-center py-16 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                          <BookOpen className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No Subjects Assigned
                        </h3>
                        <p className="text-gray-500 max-w-sm mx-auto mb-6">
                          This teacher doesn't have any subjects assigned yet.
                          Add subjects to start tracking their teaching
                          schedule.
                        </p>
                        <Button className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                          <Plus className="w-4 h-4" />
                          Add Subjects
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Stats Overview */}
                        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-blue-500 text-white">
                                <BookText className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-blue-900">
                                  Total Subjects
                                </p>
                                <p className="text-2xl font-bold text-blue-700">
                                  {teacher.subjects.length}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-green-500 text-white">
                                <Clock className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-green-900">
                                  Weekly Sessions
                                </p>
                                <p className="text-2xl font-bold text-green-700">
                                  {sessionStats.total}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-purple-500 text-white">
                                <BarChart3 className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-purple-900">
                                  Teaching Hours
                                </p>
                                <p className="text-2xl font-bold text-purple-700">
                                  {dashboardStats.totalHours}h
                                </p>
                              </div>
                            </div>
                          </div>
                        </div> */}

                        {/* Subjects Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                          {teacher.subjects.map((subject, index) => (
                            <Card
                              key={subject._id}
                              className="group relative overflow-hidden border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 bg-white"
                            >
                              {/* Animated gradient border effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>

                              <CardContent className="p-5 relative">
                                {/* Header with subject name and action */}
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div
                                        className={`p-2 rounded-lg ${
                                          index % 3 === 0
                                            ? "bg-blue-100 text-blue-600"
                                            : index % 3 === 1
                                              ? "bg-green-100 text-green-600"
                                              : "bg-purple-100 text-purple-600"
                                        }`}
                                      >
                                        <BookOpen className="w-4 h-4" />
                                      </div>
                                      <Badge
                                        variant="outline"
                                        className={`font-mono text-xs ${
                                          index % 3 === 0
                                            ? "bg-blue-50 text-blue-700 border-blue-200"
                                            : index % 3 === 1
                                              ? "bg-green-50 text-green-700 border-green-200"
                                              : "bg-purple-50 text-purple-700 border-purple-200"
                                        }`}
                                      >
                                        {subject.code}
                                      </Badge>
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-lg leading-tight truncate">
                                      {subject.name}
                                    </h3>
                                  </div>

                                  <Button
                                    onClick={() =>
                                      openRemoveSubjectDialog(subject)
                                    }
                                    variant="ghost"
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 ml-2 flex-shrink-0"
                                    title={`Remove ${subject.name}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>

                                {/* Subject Description */}
                                {subject.description && (
                                  <div className="mt-3">
                                    <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                                      {subject.description}
                                    </p>
                                  </div>
                                )}

                                {/* Session Info */}
                                <div className="mt-4 pt-3 border-t border-gray-100">
                                  <div className="flex items-center justify-between text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      <span>
                                        {(() => {
                                          const subjectSessions =
                                            weeklyTimetable.filter(
                                              (session) =>
                                                session.subject?._id ===
                                                subject._id
                                            ).length;
                                          return `${subjectSessions} session${subjectSessions !== 1 ? "s" : ""}/week`;
                                        })()}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Users className="w-3 h-3" />
                                      <span>Multiple classes</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Hover Actions */}
                                {/* <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <Button
                                    onClick={() =>
                                      openRemoveSubjectDialog(subject)
                                    }
                                    variant="outline"
                                    size="sm"
                                    className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 shadow-sm"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Remove
                                  </Button>
                                </div> */}
                              </CardContent>
                            </Card>
                          ))}
                        </div>

                        {/* Quick Actions Footer */}
                        <div className="mt-8 pt-6 border-t border-gray-200">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Info className="w-4 h-4" />
                              <span>
                                Click the remove button to unassign a subject
                                from this teacher
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <Link to="/admin/dashboard/assignSubjectsToTeacher">
                                <Button
                                  variant="outline"
                                  className="gap-2 border-green-200 text-green-700 hover:bg-green-50"
                                >
                                  <Plus className="w-4 h-4" />
                                  Add New Subject
                                </Button>
                              </Link>
                              {/* <Button className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                                <BookOpen className="w-4 h-4" />
                                Manage Assignments
                              </Button> */}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Weekly Schedule Tab */}
              <TabsContent value="schedule" className="space-y-6 mt-3">
                <Card className="border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarDays className="w-5 h-5" />
                      Weekly Schedule
                      <Badge variant="secondary" className="ml-2">
                        {weeklyTimetable.length} sessions
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!weeklyTimetable || weeklyTimetable.length === 0 ? (
                      <div className="text-center py-12 border rounded-lg bg-gray-50">
                        <CalendarDays className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">
                          No schedule for this week
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-gray-50">
                              <th className="text-left p-3 font-medium text-gray-700">
                                Day
                              </th>
                              <th className="text-left p-3 font-medium text-gray-700">
                                Time
                              </th>
                              <th className="text-left p-3 font-medium text-gray-700">
                                Subject
                              </th>
                              <th className="text-left p-3 font-medium text-gray-700">
                                Class
                              </th>
                              <th className="text-left p-3 font-medium text-gray-700">
                                Hall
                              </th>
                              <th className="text-left p-3 font-medium text-gray-700">
                                Type
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {weeklyTimetable.map((session) => (
                              <tr
                                key={session._id}
                                className="border-b hover:bg-gray-50 transition-colors"
                              >
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`w-2 h-2 rounded-full ${
                                        session.day === currentDay
                                          ? "bg-blue-500"
                                          : "bg-gray-300"
                                      }`}
                                    ></span>
                                    {session.day}
                                    {session.day === currentDay && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs bg-blue-50 text-blue-700"
                                      >
                                        Today
                                      </Badge>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 font-medium text-gray-900">
                                  {formatTime(session.startTime)} -{" "}
                                  {formatTime(session.endTime)}
                                </td>
                                <td className="p-3">
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {session.subject?.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {session.subject?.code}
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3">
                                  <div className="font-medium text-gray-900">
                                    {session.class?.name}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <div className="font-medium text-gray-900">
                                    Hall {session.hall?.hallNumber}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Capacity: {session.hall?.capacity}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <Badge variant="outline">
                                    {session.hall?.type}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Today's Classes Tab */}
              <TabsContent value="today" className="space-y-6 mt-3">
                <Card className="border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 w-5" />
                      Today's Schedule - {currentDay}
                      {todayTimetable && (
                        <Badge variant="secondary" className="ml-2">
                          {todayTimetable.length} classes
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!todayTimetable || todayTimetable.length === 0 ? (
                      <div className="text-center py-12 border rounded-lg bg-gray-50">
                        <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">
                          No classes scheduled for today
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {todayTimetable.map((session) => (
                          <div
                            key={session._id}
                            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 text-lg mb-1">
                                  {session.subject?.name}
                                </h4>
                                <p className="text-sm text-gray-600 mb-2">
                                  {session.subject?.code} •{" "}
                                  {session.class?.name}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-gray-900">
                                  {formatTime(session.startTime)} -{" "}
                                  {formatTime(session.endTime)}
                                </div>
                                <Badge variant="outline" className="mt-1">
                                  {session.hall?.type}
                                </Badge>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Building className="w-4 h-4 text-gray-400" />
                                <span>Hall {session.hall?.hallNumber}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-gray-400" />
                                <span>Capacity: {session.hall?.capacity}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span>
                                  {(() => {
                                    const start = new Date(
                                      `1970-01-01T${session.startTime}Z`
                                    );
                                    const end = new Date(
                                      `1970-01-01T${session.endTime}Z`
                                    );
                                    const duration =
                                      (end - start) / (1000 * 60 * 60);
                                    return `${duration}h`;
                                  })()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Delete Teacher Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash className="h-5 w-5 text-red-600" />
              Remove Teacher
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently remove the
              teacher from the system and delete all associated data including
              their teaching records and schedule information.
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
              Remove Teacher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Subject Dialog */}
      <Dialog
        open={isRemoveSubjectDialogOpen}
        onOpenChange={setIsRemoveSubjectDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Remove Subject
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove the subject{" "}
              <strong>"{subjectToRemove?.name}"</strong> from this teacher? This
              action will remove the subject from the teacher's assigned
              subjects.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={closeRemoveSubjectDialog}
              disabled={removingSubject}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveSubject}
              disabled={removingSubject}
              className="gap-2"
            >
              {removingSubject ? (
                <ButtonLoader />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Remove Subject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherOnly;
