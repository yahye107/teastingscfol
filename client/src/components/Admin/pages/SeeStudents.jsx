import React, { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Search,
  Save,
  Loader2,
  Eye,
  Trash2,
  X,
} from "lucide-react";
import {
  callGetAllClassroomsApi,
  callUpdateStudentApi,
  callGetStudentsByClassroomApi,
  callGetAllHallsApi,
  callDeleteStudentApi,
} from "@/service/service";
import GlobalLoader from "@/components/common/GlobalLoader";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const SeeStudents = () => {
  // Data states
  const [classrooms, setClassrooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [halls, setHalls] = useState([]);

  // UI and selection states
  const [loading, setLoading] = useState(true);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [isUpdating, setIsUpdating] = useState({});
  const [studentDetails, setStudentDetails] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  
  // Search and filter states
  const [classSearchTerm, setClassSearchTerm] = useState("");
  const [studentSearchTerm, setStudentSearchTerm] = useState("");

  const { register, handleSubmit, setValue, getValues } = useForm();

  // Initial data fetch for classrooms and halls
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classroomsRes, hallsRes] = await Promise.all([
          callGetAllClassroomsApi(),
          callGetAllHallsApi(),
        ]);
        setClassrooms(classroomsRes.classrooms || []);
        setHalls(hallsRes.halls || []);
      } catch (error) {
        toast.error("Failed to load initial classroom and hall data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch students when a classroom is selected
  const fetchStudents = async (classroomId) => {
    try {
      const response = await callGetStudentsByClassroomApi(classroomId);
      const studentsWithDetails = response.students.map(student => ({
        ...student,
        classroom: classrooms.find(c => c._id === student.classId),
        hall: halls.find(h => h._id === student.hallId)
      }));
      setStudents(studentsWithDetails);
    } catch (error) {
      toast.error("Failed to load students for the selected class.");
    }
  };
  
  // Memoized list of filtered classrooms based on search
  const filteredClassrooms = useMemo(() => {
    if (!classSearchTerm) return [];
    return classrooms.filter(c =>
      c.grade.toLowerCase().includes(classSearchTerm.toLowerCase()) ||
      c.section.toLowerCase().includes(classSearchTerm.toLowerCase())
    );
  }, [classSearchTerm, classrooms]);
  
  // Memoized list of filtered students based on search
  const filteredStudents = useMemo(() => {
    return students.filter(student =>
      (student.user?.fullName || "").toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
      (student.admissionNumber || "").toLowerCase().includes(studentSearchTerm.toLowerCase())
    );
  }, [studentSearchTerm, students]);

  // Handle selecting a class from the search results
  const handleClassSelect = (classroom) => {
    setSelectedClassroom(classroom);
    fetchStudents(classroom._id);
    setClassSearchTerm(""); // Clear search input
    setStudentSearchTerm(""); // Reset student search
  };
  
  // Handle form submission to update a student's class and hall
  const handleUpdateSubmit = async (studentId) => {
    setIsUpdating(prev => ({ ...prev, [studentId]: true }));
    // Use getValues to get the latest form state for a specific student
    const data = getValues();
    try {
      const updatePayload = {
        classId: data[`classroom-${studentId}`],
        hallId: data[`hall-${studentId}`]
      };
      
      await callUpdateStudentApi(studentId, updatePayload);
      
      // Optimistically update local state for better UX
      setStudents(prev => prev.map(student => 
        student._id === studentId 
          ? { 
              ...student, 
              classroom: classrooms.find(c => c._id === updatePayload.classId),
              hall: halls.find(h => h._id === updatePayload.hallId),
              classId: updatePayload.classId,
              hallId: updatePayload.hallId
            } 
          : student
      ));
      
      toast.success("Student updated successfully!");
    } catch (error) {
      toast.error("Failed to update student. Please try again.");
    } finally {
      setIsUpdating(prev => ({ ...prev, [studentId]: false }));
    }
  };

  // Handle deleting a student after confirmation
  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
      await callDeleteStudentApi(studentToDelete._id);
      toast.success("Student deleted successfully.");
      // Remove student from local state
      setStudents(prev => prev.filter(s => s._id !== studentToDelete._id));
      setStudentToDelete(null); // Close the dialog
    } catch (error) {
      toast.error("Failed to delete student.");
    }
  };

  // Open the details dialog for a student
  const openStudentDetails = (student) => {
    setStudentDetails(student);
    setIsDetailsOpen(true);
  };
  
  // Render loading screen while fetching initial data
  if (loading) return <GlobalLoader />;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Student Management</h1>
        <p className="text-muted-foreground">
          {selectedClassroom ? "Manage students below." : "First, find and select a class to begin."}
        </p>
      </div>

      {/* --- STEP 1: CLASS SELECTION --- */}
      <Card className="shadow-sm">
        <CardHeader>
            <CardTitle className="text-lg">
                {selectedClassroom ? `Selected Class: ${selectedClassroom.grade} - ${selectedClassroom.section}` : "Select a Class"}
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="relative w-full md:w-1/2">
                    <p className="text-sm font-medium mb-2">Search for a class by grade or section</p>
                    <Search className="absolute left-3 top-[calc(50%+4px)] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="e.g., 'Grade 10' or 'Section A'"
                        className="pl-10"
                        value={classSearchTerm}
                        onChange={(e) => setClassSearchTerm(e.target.value)}
                        disabled={!!selectedClassroom}
                    />
                    {/* --- Classroom search results --- */}
                    {filteredClassrooms.length > 0 && (
                        <div className="absolute z-20 mt-1 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {filteredClassrooms.map(classroom => (
                            <div
                            key={classroom._id}
                            onClick={() => handleClassSelect(classroom)}
                            className="p-3 border-b cursor-pointer hover:bg-muted transition-colors"
                            >
                            <div className="font-medium">Grade {classroom.grade} - {classroom.section}</div>
                            <div className="text-sm text-muted-foreground">Hall: {classroom.hall.hallNumber || 'N/A'}</div>
                            </div>
                        ))}
                        </div>
                    )}
                </div>
                {selectedClassroom && (
                    <div className="w-full md:w-1/2 flex items-end h-full">
                         <Button variant="outline" onClick={() => setSelectedClassroom(null)}>
                            <X className="mr-2 h-4 w-4"/> Change Class
                        </Button>
                    </div>
                )}
            </div>
        </CardContent>
      </Card>
      
      {/* --- STEP 2: STUDENT MANAGEMENT (TABLE & SEARCH) --- */}
      {selectedClassroom && (
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-lg">
              Students in {selectedClassroom.grade} - {selectedClassroom.section}
            </CardTitle>
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students by name or ID..."
                className="pl-10"
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-100">
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    {/* <TableHead className="hidden lg:table-cell">Current Hall</TableHead> */}
                    <TableHead>Assign Class</TableHead>
                    {/* <TableHead>Assign Hall</TableHead> */}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <TableRow key={student._id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{student.user?.fullName}</span>
                            <span className="text-xs text-muted-foreground">ID: {student.admissionNumber}</span>
                          </div>
                        </TableCell>
                        {/* <TableCell className="hidden lg:table-cell">Hall {student.hall?.hallNumber || "N/A"}</TableCell> */}
                        <TableCell>
                          <select
                            {...register(`classroom-${student._id}`)}
                            defaultValue={student.classId}
                            className="w-full p-2 border rounded text-sm bg-background"
                          >
                            {classrooms.map(c => <option key={c._id} value={c._id}>Grade {c.grade} - {c.section}</option>)}
                          </select>
                        </TableCell>
                        {/* <TableCell>
                          <select
                            {...register(`hall-${student._id}`)}
                            defaultValue={student.hallId}
                            className="w-full p-2 border rounded text-sm bg-background"
                          >
                             {halls.map(h => <option key={h._id} value={h._id}>Hall {h.hallNumber}</option>)}
                          </select>
                        </TableCell> */}
                        <TableCell>
                          <div className="flex justify-end items-center gap-2">
                            <Button size="icon" variant="ghost" onClick={() => handleUpdateSubmit(student._id)} disabled={isUpdating[student._id]}>
                              {isUpdating[student._id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => openStudentDetails(student)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setStudentToDelete(student)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {student.user?.fullName}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleDeleteStudent}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-48 text-muted-foreground">
                        No students found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* --- STUDENT DETAILS DIALOG --- */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{studentDetails?.user?.fullName || "Student Details"}</DialogTitle>
            <DialogDescription>ID: {studentDetails?.admissionNumber}</DialogDescription>
          </DialogHeader>
          {studentDetails && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 py-4">
              <div><h3 className="text-sm font-medium text-muted-foreground">Email</h3><p>{studentDetails.user?.email || "N/A"}</p></div><br />
              <div><h3 className="text-sm font-medium text-muted-foreground">Contact</h3><p>{studentDetails.contact || "N/A"}</p></div>
              <div><h3 className="text-sm font-medium text-muted-foreground">Class</h3><p>Grade {studentDetails.classroom?.grade} - {studentDetails.classroom?.section}</p></div>
              <div className="col-span-2"><h3 className="text-sm font-medium text-muted-foreground">Parent</h3><p>{studentDetails.parent?.user?.fullName || "N/A"}</p></div>
              <div><h3 className="text-sm font-medium text-muted-foreground">Parent Email</h3><p>{studentDetails.parent?.user?.email || "N/A"}</p></div>
               <div className="col-span-2"><h3 className="text-sm font-medium text-muted-foreground">Parent Contect</h3><p>{studentDetails.parent?.contact || "N/A"}</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SeeStudents;
