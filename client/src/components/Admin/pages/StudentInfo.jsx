import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  callGetAllStudentsApi,
  callDeleteStudentApi,
  callUpdateStudentApi,
  callGetAllClassesApi,
  callGetAllParentsApi,
} from "@/service/service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Edit,
  Trash,
  Plus,
  MoreVertical,
  Users,
  GraduationCap,
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Edit2,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import GlobalLoader from "@/components/common/GlobalLoader";
import ButtonLoader from "@/components/common/ButtonLoadi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const StudentInfo = () => {
  const [students, setStudents] = useState([]);
  const [pageloading, setPageLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [classFilter, setClassFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const navigate = useNavigate();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchStudents = async () => {
    setPageLoading(true);
    const start = Date.now();
    try {
      const { students } = await callGetAllStudentsApi();
      if (students) {
        setStudents(students || []);
      } else {
        toast.error("Failed to fetch students ❌");
        setPageLoading(false);
      }
    } catch (err) {
      console.error("Error fetching students", err);
      toast.error("Something went wrong ❌");
    } finally {
      // enforce minimum loader time
      const elapsed = Date.now() - start;
      const minTime = 1000; // 2s minimum
      const remaining = minTime - elapsed;

      if (remaining > 0) {
        setTimeout(() => setPageLoading(false), remaining);
      } else {
        setPageLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, classFilter, genderFilter]);

  const handleDelete = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      await callDeleteStudentApi(id);
      toast.success("Student deleted successfully ✅");
      setStudents((prev) => prev.filter((student) => student._id !== id));
      setDeleteId(null);
      setLoading(false);
    } catch (err) {
      console.error("Error deleting student", err);
      toast.error("Failed to delete student ❌");
      setLoading(false);
    } finally {
      setLoading(false);
      setIsDialogOpen(false);
    }
  };

  const filteredStudents = students
    .filter((student) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        student.user?.fullName?.toLowerCase().includes(searchLower) ||
        student.admissionNumber?.toLowerCase().includes(searchLower) ||
        student.classId?.name?.toLowerCase().includes(searchLower) ||
        student.parent?.user?.fullName?.toLowerCase().includes(searchLower)
      );
    })
    .filter((student) => {
      if (classFilter === "all") return true;
      return student.classId?.name === classFilter;
    })
    .filter((student) => {
      if (genderFilter === "all") return true;
      return student.gender?.toLowerCase() === genderFilter.toLowerCase();
    });

  // Pagination calculations
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = filteredStudents.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const getGenderBadgeVariant = (gender) => {
    switch (gender?.toLowerCase()) {
      case "male":
        return "default";
      case "female":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getClassBadgeVariant = (className) => {
    const primaryClasses = [
      "nursery",
      "kg",
      "kindergarten",
      "prep",
      "1",
      "2",
      "3",
    ];
    return primaryClasses.some((name) =>
      className?.toLowerCase().includes(name)
    )
      ? "default"
      : "secondary";
  };

  // Get unique classes for filter
  const uniqueClasses = [
    ...new Set(
      students.map((student) => student.classId?.name).filter(Boolean)
    ),
  ];

  if (pageloading) return <GlobalLoader />;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header - All Students Page */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-3 sm:p-4">
        {/* Top Row for Mobile: Back + Add */}
        <div className="flex w-full justify-between sm:justify-start sm:w-auto">
          {/* Back Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 justify-center sm:justify-start w-[80px] sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          {/* Add Button (mobile only) */}
          <Link to="/admin/dashboard/studentRegister" className="sm:hidden">
            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </Link>
        </div>

        {/* Title Section */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
            <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
              Students
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage all student records and information
            </p>
          </div>
        </div>

        {/* Add Button (desktop) */}
        <Link to="/admin/dashboard/studentRegister" className="hidden sm:block">
          <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
            <Plus className="w-4 h-4" />
            Add Student
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Male Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {
                students.filter((s) => s.gender?.toLowerCase() === "male")
                  .length
              }
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Female Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-600">
              {
                students.filter((s) => s.gender?.toLowerCase() === "female")
                  .length
              }
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Active Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                new Set(students.map((s) => s.classId?._id).filter(Boolean))
                  .size
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card className="p-0 sm:p-4">
        <CardHeader className="px-2 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {uniqueClasses.map((className) => (
                    <SelectItem key={className} value={className}>
                      {className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="All Genders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>

              {/* Items per page selector */}
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 per page</SelectItem>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6 py-3 sm:py-4">
          {/* Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[700px] sm:min-w-0">
              <TableHeader>
                <TableRow>
                  <TableHead>Admission No</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500 py-6">
                        <GraduationCap className="h-10 w-10 mb-2 opacity-50" />
                        <p>No students found</p>
                        <p className="text-sm">
                          Try adjusting your search or filters
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentStudents.map((student) => (
                    <TableRow key={student._id}>
                      <TableCell>
                        <div className="font-mono font-medium text-blue-600">
                          {student.admissionNumber}
                        </div>
                      </TableCell>

                      <TableCell className="cursor-pointer">
                        <Link
                          className="hover:underline hover:text-blue-500"
                          to={`/admin/dashboard/StudentInfobyid/${student._id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold">
                              {student.user?.fullName?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-blue-500 dark:text-white">
                                {student.user?.fullName}
                              </div>
                              <p className="text-xs text-blue-500">
                                {student.age} years old
                              </p>
                            </div>
                          </div>
                        </Link>
                      </TableCell>

                      <TableCell className="font-medium">
                        {student.age}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getGenderBadgeVariant(student.gender)}
                          className="capitalize"
                        >
                          {student.gender}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getClassBadgeVariant(student.classId?.name)}
                        >
                          {student.classId?.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {student.parent?.user?.fullName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-3 w-3" />
                          {student.parent?.contact}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 max-w-[200px]">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate" title={student.address}>
                            {student.address}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {/* Edit button */}
                        <Link
                          className="hover:underline hover:text-blue-500"
                          to={`/admin/dashboard/StudentInfobyid/${student._id}`}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            // onClick={() =>
                            //   navigate(`/manegar/students/${student._id}`)
                            // }
                            className="flex items-center gap-1"
                          >
                            <Edit2 className="h-4 w-4" />
                            Edit
                          </Button>
                        </Link>
                        {/* Delete button */}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setDeleteId(student._id);
                            setIsDialogOpen(true);
                          }}
                          className="flex items-center gap-1"
                        >
                          <Trash className="h-4 w-4" />
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          {searchTerm && (
            <Button variant="ghost" size="sm" onClick={() => setSearchTerm("")}>
              Clear search
            </Button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {indexOfFirstItem + 1}-
              {Math.min(indexOfLastItem, filteredStudents.length)}
            </span>
            <span>of</span>
            <span className="font-medium">{filteredStudents.length}</span>
            <span>students</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="mx-2">
              {currentPage} / {totalPages || 1}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages || totalPages === 0}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Student</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this student? This action cannot
              be undone and will permanently remove all associated data
              including academic records and parent information.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end space-x-3 mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => handleDelete(deleteId)}
              disabled={loading}
            >
              {loading ? <ButtonLoader /> : "Delete Student"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentInfo;
