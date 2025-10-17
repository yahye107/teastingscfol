import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { callDeleteTeacherApi, callGetAllTeachersApi } from "@/service/service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Trash,
  Plus,
  Users,
  Phone,
  Mail,
  MapPin,
  Calendar,
  GraduationCap,
  Briefcase,
  DollarSign,
  Star,
  ChevronLeft,
  ChevronRight,
  User,
  BookOpen,
  Award,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
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
import GlobalLoader from "@/components/common/GlobalLoader";
import ButtonLoader from "@/components/common/ButtonLoadi";

const AllTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [pageLoading, setPageLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [genderFilter, setGenderFilter] = useState("all");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const navigate = useNavigate();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  const fetchTeachers = async () => {
    setPageLoading(true);
    const start = Date.now();
    try {
      const { teachers } = await callGetAllTeachersApi();
      if (teachers) {
        setTeachers(teachers || []);
      } else {
        toast.error("Failed to fetch teachers ❌");
        setPageLoading(false);
      }
    } catch (err) {
      console.error("Error fetching teachers", err);
      toast.error("Something went wrong ❌");
    } finally {
      const elapsed = Date.now() - start;
      const minTime = 1000;
      const remaining = minTime - elapsed;
      if (remaining > 0) {
        setTimeout(() => setPageLoading(false), remaining);
      } else {
        setPageLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, genderFilter, experienceFilter]);

  const handleDelete = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      await callDeleteTeacherApi(id);
      toast.success("Teacher deleted successfully ✅");
      setTeachers((prev) => prev.filter((teacher) => teacher._id !== id));
      setDeleteId(null);
    } catch (err) {
      console.error("Error deleting teacher", err);
      toast.error("Failed to delete teacher ❌");
    } finally {
      setLoading(false);
      setIsDialogOpen(false);
    }
  };

  const filteredTeachers = teachers
    .filter((teacher) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        teacher.user?.fullName?.toLowerCase().includes(searchLower) ||
        teacher.qualifications?.toLowerCase().includes(searchLower) ||
        teacher.contact?.toLowerCase().includes(searchLower)
      );
    })
    .filter((teacher) => {
      if (genderFilter === "all") return true;
      return teacher.gender?.toLowerCase() === genderFilter.toLowerCase();
    })
    .filter((teacher) => {
      if (experienceFilter === "all") return true;
      const exp = parseInt(teacher.experience) || 0;
      switch (experienceFilter) {
        case "junior":
          return exp < 5;
        case "mid":
          return exp >= 5 && exp < 10;
        case "senior":
          return exp >= 10;
        default:
          return true;
      }
    });

  // Pagination calculations
  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTeachers = filteredTeachers.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Calculate stats
  const totalTeachers = teachers.length;
  const maleTeachers = teachers.filter(
    (t) => t.gender?.toLowerCase() === "male"
  ).length;
  const femaleTeachers = teachers.filter(
    (t) => t.gender?.toLowerCase() === "female"
  ).length;
  const totalExperience = teachers.reduce(
    (total, teacher) => total + (parseInt(teacher.experience) || 0),
    0
  );
  const avgExperience =
    totalTeachers > 0 ? (totalExperience / totalTeachers).toFixed(1) : 0;

  const getExperienceLevel = (experience) => {
    const exp = parseInt(experience) || 0;
    if (exp < 3)
      return { level: "Beginner", color: "bg-blue-100 text-blue-700" };
    if (exp < 8)
      return { level: "Intermediate", color: "bg-green-100 text-green-700" };
    if (exp < 15)
      return { level: "Experienced", color: "bg-purple-100 text-purple-700" };
    return { level: "Expert", color: "bg-orange-100 text-orange-700" };
  };

  const getGenderIcon = (gender) => {
    return gender?.toLowerCase() === "male" ? "👨" : "👩";
  };

  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  if (pageLoading) return <GlobalLoader />;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header - All Teachers Page */}
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
          <Link to="/admin/dashboard/Tescher" className="sm:hidden">
            <Button className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg">
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </Link>
        </div>

        {/* Title Section */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Teaching Staff
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage all teaching staff and their profiles
            </p>
          </div>
        </div>

        {/* Add Button for larger screens */}
        <Link to="/admin/dashboard/Tescher" className="hidden sm:block">
          <Button className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg">
            <Plus className="w-4 h-4" />
            Add Teacher
          </Button>
        </Link>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  Total Teachers
                </p>
                <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
                  {totalTeachers}
                </p>
              </div>
              <div className="p-3 rounded-full bg-emerald-500/20">
                <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Male Teachers
                </p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {maleTeachers}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/20">
                <span className="text-2xl">👨</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 border-pink-200 dark:border-pink-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-pink-600 dark:text-pink-400">
                  Female Teachers
                </p>
                <p className="text-3xl font-bold text-pink-900 dark:text-pink-100">
                  {femaleTeachers}
                </p>
              </div>
              <div className="p-3 rounded-full bg-pink-500/20">
                <span className="text-2xl">👩</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  Avg. Experience
                </p>
                <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                  {avgExperience}y
                </p>
              </div>
              <div className="p-3 rounded-full bg-amber-500/20">
                <Star className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search teachers by name, qualification, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="All Genders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={experienceFilter}
                onValueChange={setExperienceFilter}
              >
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Experience Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Experience</SelectItem>
                  <SelectItem value="junior">Junior (0-4 yrs)</SelectItem>
                  <SelectItem value="mid">Mid (5-9 yrs)</SelectItem>
                  <SelectItem value="senior">Senior (10+ yrs)</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[130px]">
                  <SelectValue placeholder="Show per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9">9 per page</SelectItem>
                  <SelectItem value="12">12 per page</SelectItem>
                  <SelectItem value="18">18 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Teachers Grid */}
      {currentTeachers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <GraduationCap className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No teachers found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm ||
              genderFilter !== "all" ||
              experienceFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by adding your first teacher"}
            </p>
            {!searchTerm &&
              genderFilter === "all" &&
              experienceFilter === "all" && (
                <Link to="/admin/dashboard/teacherRegister">
                  <Button className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600">
                    <Plus className="w-4 h-4" />
                    Add Teacher
                  </Button>
                </Link>
              )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentTeachers.map((teacher) => {
              const experienceLevel = getExperienceLevel(teacher.experience);
              const age = calculateAge(teacher.dob);

              return (
                <Card
                  key={teacher._id}
                  className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-emerald-500 group"
                >
                  <CardContent className="p-6">
                    {/* Header with avatar and actions */}
                    <div className="flex items-start justify-between mb-4">
                      <Link
                        className=""
                        to={`/admin/dashboard/teacher/${teacher._id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-xl">
                              {teacher.user?.fullName?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className="absolute -bottom-1 -right-1 text-2xl">
                              {getGenderIcon(teacher.gender)}
                            </div>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                              {teacher.user?.fullName}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Teacher ID: {teacher._id?.slice(-8)}
                            </p>
                          </div>
                        </div>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeleteId(teacher._id);
                          setIsDialogOpen(true);
                        }}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Qualifications and Experience */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Award className="h-4 w-4 text-emerald-500" />
                        <span className="text-gray-600 dark:text-gray-300 font-medium">
                          {teacher.qualifications}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge className={experienceLevel.color}>
                          <Star className="w-3 h-3 mr-1" />
                          {experienceLevel.level}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700"
                        >
                          {teacher.experience || 0} years exp
                        </Badge>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-300">
                          {teacher.contact || "Not provided"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-300 truncate">
                          {teacher.user?.email}
                        </span>
                      </div>
                      {teacher.address && (
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                          <span className="text-gray-600 dark:text-gray-300 line-clamp-2">
                            {teacher.address}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Footer with salary and age */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-semibold text-gray-700">
                          ${teacher.SalaryBymonth || "0"}/mo
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{age}y</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span className="capitalize">{teacher.gender}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-500">
              Showing {indexOfFirstItem + 1}-
              {Math.min(indexOfLastItem, filteredTeachers.length)} of{" "}
              {filteredTeachers.length} teachers
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="h-9 w-9 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="h-9 w-9 p-0"
                    >
                      {page}
                    </Button>
                  )
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages || totalPages === 0}
                className="h-9 w-9 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDelete(deleteId)}
              disabled={loading}
              className="gap-2"
            >
              {loading ? <ButtonLoader /> : <Trash className="h-4 w-4" />}
              Remove Teacher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      ;
    </div>
  );
};

export default AllTeachers;
