import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Search,
  PlusCircle,
  Trash2,
  Save,
  Users,
  School,
  DoorOpen,
  X,
} from "lucide-react";
import CommonForm from "@/components/common/CommonForm";
import { ClassroomFormControls } from "@/config";
import {
  callCreateClassroomApi,
  callGetAllClassroomsApi,
  callupdateClassroomApi,
  callDeleteClassroomApi,
  callGetAllHallsApi,
  callGetAllTeachersApi,
} from "@/service/service";
import GlobalLoader from "@/components/common/GlobalLoader";
import { Link } from "react-router-dom";

const classSchema = z.object({
  grade: z.string().min(1, "Grade is required"),
  section: z.string().min(1, "Section is required"),
  classTeacher: z.string().optional(),
  academicYear: z.string().min(1, "Academic year is required"),
  hall: z.string().min(1, "Hall is required"),
});

const Class = () => {
  const [totalStudents, setTotalStudents] = useState(0);
  const [classrooms, setClassrooms] = useState([]);
  const [filteredClassrooms, setFilteredClassrooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(classSchema),
    defaultValues: {
      grade: "",
      section: "",
      classTeacher: "",
      academicYear: "",
      hall: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classroomsRes, teachersRes, hallsRes] = await Promise.all([
          callGetAllClassroomsApi(),
          callGetAllTeachersApi(),
          callGetAllHallsApi(),
        ]);

        const classes = classroomsRes.classrooms || [];
        setClassrooms(classes);
        setFilteredClassrooms(classes);

        const studentCount = classes.reduce(
          (acc, classroom) => acc + (classroom.students?.length || 0),
          0
        );
        setTotalStudents(studentCount);

        setTeachers(teachersRes.teachers || []);
        setHalls(hallsRes.halls || []);
      } catch (error) {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    const results = classrooms.filter((classroom) => {
      const hallNumber = classroom.hall?.hallNumber?.toString() || "";
      return (
        classroom.grade.toLowerCase().includes(value.toLowerCase()) ||
        classroom.section.toLowerCase().includes(value.toLowerCase()) ||
        hallNumber.includes(value)
      );
    });
    setFilteredClassrooms(results);
  };

  const handleNewClass = () => {
    form.reset({
      grade: "",
      section: "",
      classTeacher: "",
      academicYear: "",
      hall: "",
    });
    setSelectedClassroom(null);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (selectedClassroom) {
        await callupdateClassroomApi(selectedClassroom._id, data);
        toast.success("Class updated successfully");
      } else {
        await callCreateClassroomApi(data);
        toast.success("Class created successfully");
      }
      const updatedClasses = await callGetAllClassroomsApi();
      setClassrooms(updatedClasses.classrooms);
      setFilteredClassrooms(updatedClasses.classrooms);
      form.reset();
      setSelectedClassroom(null);
    } catch (error) {
      toast.error(error.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await callDeleteClassroomApi(id);
      setClassrooms((prev) => prev.filter((c) => c._id !== id));
      setFilteredClassrooms((prev) => prev.filter((c) => c._id !== id));
      setSelectedClassroom(null);
      toast.success("Class deleted successfully");
    } catch (error) {
      toast.error("Failed to delete class");
    }
  };

  const enhancedFormControls = ClassroomFormControls.map((control) => {
    if (control.id === "classTeacher") {
      return {
        ...control,
        options: teachers.map((teacher) => ({
          label: teacher.user?.fullName,
          value: teacher._id,
        })),
      };
    }
    if (control.id === "hall") {
      return {
        ...control,
        options: halls.map((hall) => ({
          label: hall.hallNumber,
          value: hall._id,
        })),
      };
    }
    return control;
  });
  if (loading) return <GlobalLoader />;
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Class Management
          </h1>
          <p className="text-muted-foreground">
            Manage classroom information and student allocations
          </p>
        </div>
        <Link to="/admin/dashboard/SeeStudents">
        <Button>See All the students</Button>
        </Link>
        <Button onClick={handleNewClass} size="lg" className="gap-2">
          <PlusCircle className="h-5 w-5" />
          New Class
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center gap-4">
            <School className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Classes</p>
              <p className="text-2xl font-bold">{classrooms.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center gap-4">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-2xl font-bold">{totalStudents}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center gap-4">
            <DoorOpen className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Available Halls</p>
              <p className="text-2xl font-bold">{halls.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Class List */}
        <div className="lg:w-1/3 space-y-4 ">
          <div className="relative">
            <Input
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search classes..."
              className="pl-10 pr-10 text-lg py-6"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <Card className="overflow-auto h-[400px]">
            <CardHeader className="bg-muted/50 p-4 border-b">
              <CardTitle className="text-lg font-semibold">
                Class List
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 border-b">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                ))
              ) : filteredClassrooms.length > 0 ? (
                filteredClassrooms.slice(-6).map((classroom) => (
                  <div
                    key={classroom._id}
                    onClick={() => {
                      setSelectedClassroom(classroom);
                      form.reset({
                        grade: classroom.grade,
                        section: classroom.section,
                        classTeacher: classroom.classTeacher?._id,
                        academicYear: classroom.academicYear,
                        hall: classroom.hall?._id,
                      });
                    }}
                    className={`p-4 border-b cursor-pointer transition-colors ${
                      selectedClassroom?._id === classroom._id
                        ? "bg-primary/10 border-l-4 border-primary"
                        : "hover:bg-muted/20"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-lg">
                          Grade {classroom.grade} - {classroom.section}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Hall {classroom.hall?.hallNumber}
                        </p>
                        {classroom.classTeacher && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Teacher: {classroom.classTeacher.user?.fullName}
                          </p>
                        )}
                      </div>
                      <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
                        {classroom.students?.length || 0}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Academic Year: {classroom.academicYear}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  <School className="h-8 w-8 mx-auto mb-2" />
                  <p>No classes found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Class Form */}
        <div className="lg:w-2/3">
          <Card className="h-full flex flex-col ">
            <CardHeader className="border-b p-6">
              <CardTitle className="text-2xl font-semibold">
                {selectedClassroom ? "Edit Class" : "Create New Class"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-6 overflow-auto">
              <CommonForm
                form={form}
                formControls={enhancedFormControls}
                handleSubmit={form.handleSubmit(onSubmit)}
                btnText={
                  isSubmitting
                    ? selectedClassroom
                      ? "Saving Changes..."
                      : "Creating Class..."
                    : selectedClassroom
                    ? "Save Changes"
                    : "Create Class"
                }
                btnIcon={isSubmitting ? null : <Save className="h-5 w-5" />}
                btnDisabled={isSubmitting}
                gridLayout="grid grid-cols-1 md:grid-cols-2 gap-6"
                inputSize="lg"
              />
            </CardContent>

            {selectedClassroom && (
              <CardFooter className="border-t p-6 flex justify-end">
                <AlertDialog
                  open={deleteDialogOpen}
                  onOpenChange={setDeleteDialogOpen}
                >
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2" size="lg">
                      <Trash2 className="h-5 w-5" />
                      Delete Class
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-xl">
                        Confirm Deletion
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-base">
                        This will permanently delete the "
                        {selectedClassroom.grade} - {selectedClassroom.section}"
                        class and all associated student records.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="mt-4">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(selectedClassroom._id)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Confirm Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Class;
