import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Search, Edit, Trash, Save, ArrowLeft } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import GlobalLoader from "@/components/common/GlobalLoader";

const StudentInfo = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editableStudent, setEditableStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [allClasses, setAllClasses] = useState([]);
  const [allParents, setAllParents] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  useEffect(() => {
    const fetchExtraData = async () => {
      try {
        const [classRes, parentRes] = await Promise.all([
          callGetAllClassesApi(),
          //   callGetAllParentsApi(),
        ]);
        setAllClasses(classRes.classrooms || []);
        // setAllParents(parentRes.parents || []);
      } catch (err) {
        console.error("Failed to load classes or parents", err);
      } finally {
        setLoadingClasses(false);
      }
    };
    fetchExtraData();
  }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { students } = await callGetAllStudentsApi();
        setStudents(students);
        setFilteredStudents(students.slice(-5)); // default view: 5
      } catch (err) {
        console.error("Error fetching students", err);
        toast.error("Failed to load students");
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    const results = students.filter(
      (student) =>
        student.user?.fullName?.toLowerCase().includes(value.toLowerCase()) ||
        student.admissionNumber?.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredStudents(results);
  };

  const handleSelect = (student) => {
    setSelectedStudent(student);
    setEditableStudent({
      ...student,
      user: { ...student.user },
      classId: student.classId?._id || "",
    });
  };

  const handleDelete = async (id) => {
    try {
      await callDeleteStudentApi(id);
      setStudents((prev) => prev.filter((s) => s._id !== id));
      setFilteredStudents((prev) => prev.filter((s) => s._id !== id));
      setSelectedStudent(null);
      toast.success("Student deleted");
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  const handleEditChange = (field, value, nested = false) => {
    setEditableStudent((prev) => {
      if (nested) {
        return { ...prev, user: { ...prev.user, [field]: value } };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleSave = async () => {
    try {
      await callUpdateStudentApi(editableStudent._id, {
        fullName: editableStudent.user?.fullName,
        email: editableStudent.user.email,
        classId: editableStudent.classId,
        contact: editableStudent.contact,
        dob: editableStudent.dob,
        monthlyPayment: editableStudent.monthlyPayment,
      });

      toast.success("Student updated");

      setStudents((prev) =>
        prev.map((s) =>
          s._id === editableStudent._id ? { ...editableStudent } : s
        )
      );
      setFilteredStudents((prev) =>
        prev.map((s) =>
          s._id === editableStudent._id ? { ...editableStudent } : s
        )
      );
      setSelectedStudent({ ...editableStudent });
    } catch (err) {
      console.error(err);
      toast.error("Update failed");
    }
  };

  const getSelectedClassName = () => {
    if (!editableStudent?.classId) return "Select class";
    const selectedClass = allClasses.find(
      (c) => c._id === editableStudent.classId
    );
    return selectedClass
      ? `${selectedClass.name} - ${selectedClass.section}`
      : "Select class";
  };
  if (loading) return <GlobalLoader />;
  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4 ">
      <div className="space-y-2">
        <Button
          variant="outline"
          className="text-black"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <h1 className="text-2xl font-bold">Recent Students</h1>
        <div className="relative">
          <Input
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search recent students..."
            className="pl-10"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Students List */}
        <Card className="lg:col-span-1 h-[400px]">
          <CardContent className="p-2 space-y-2 overflow-y-auto max-h-[360px]">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))
            ) : filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <Button
                  key={student._id}
                  variant={
                    selectedStudent?._id === student._id ? "secondary" : "ghost"
                  }
                  onClick={() => handleSelect(student)}
                  className="w-full justify-start h-12 text-left px-3"
                >
                  <div className="truncate">
                    <p className="font-medium">{student.user?.fullName}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {student.user?.email}
                    </p>
                  </div>
                </Button>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No students found
              </p>
            )}
          </CardContent>
        </Card>

        {/* Student Details */}
        <div className="lg:col-span-2 space-y-4">
          {selectedStudent && editableStudent ? (
            <Card>
              <CardHeader className="px-4 py-3 flex items-center justify-between">
                <CardTitle>Student Details</CardTitle>
                <div className="space-x-2">
                  <AlertDialog
                    open={saveDialogOpen}
                    onOpenChange={setSaveDialogOpen}
                  >
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="default">
                        <Save className="h-4 w-4 mr-1" /> Save
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="w-[90vw] max-w-sm sm:max-w-lg rounded-xl p-4 sm:p-6">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Save Changes?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to save the changes made to this
                          student’s information?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={async () => {
                            if (editableStudent) {
                              await handleSave();
                              setSaveDialogOpen(false);
                            }
                          }}
                        >
                          Yes, Save
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setStudentToDelete(selectedStudent)}
                      >
                        <Trash className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="w-[90vw] max-w-sm sm:max-w-lg rounded-xl p-4 sm:p-6">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this student.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={async () => {
                            if (studentToDelete) {
                              await handleDelete(studentToDelete._id);
                              setDeleteDialogOpen(false);
                            }
                          }}
                        >
                          Yes, Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-2 gap-3">
                <EditItem
                  label="Full Name"
                  value={editableStudent.user?.fullName}
                  onChange={(e) =>
                    handleEditChange("fullName", e.target.value, true)
                  }
                />
                <EditItem
                  label="Email"
                  value={editableStudent.user?.email}
                  onChange={(e) =>
                    handleEditChange("email", e.target.value, true)
                  }
                />
                <EditItem
                  label="Contact"
                  value={editableStudent.contact}
                  onChange={(e) => handleEditChange("contact", e.target.value)}
                />
                <EditItem
                  label="DOB"
                  type="date"
                  value={editableStudent.dob?.slice(0, 10)}
                  onChange={(e) => handleEditChange("dob", e.target.value)}
                />
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Class</p>
                  <Select
                    value={editableStudent.classId}
                    onValueChange={(value) =>
                      handleEditChange("classId", value)
                    }
                    disabled={loadingClasses}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue asChild>
                        <span className="flex items-center">
                          {editableStudent.classId ? (
                            <>
                              <span className="font-medium">
                                {allClasses.find(
                                  (c) => c._id === editableStudent.classId
                                )?.name || "No class"}
                              </span>
                              <span className="text-muted-foreground ml-2">
                                (
                                {allClasses.find(
                                  (c) => c._id === editableStudent.classId
                                )?.section || ""}
                                )
                              </span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">
                              Select class
                            </span>
                          )}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {allClasses.map((cls) => (
                        <SelectItem key={cls._id} value={cls._id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{cls.name}</span>
                            {/* <Badge variant="outline">{cls.section}</Badge> */}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* <EditItem
                  label="Class Section"
                  value={editableStudent.classId?.section || ""}
                  disabled
                /> */}
                <EditItem
                  label="Password"
                  value={editableStudent.user?.rawPassword}
                  disabled
                />
                <EditItem label="Age" value={editableStudent.age} disabled />
                <EditItem
                  label="Gender"
                  value={editableStudent.gender}
                  disabled
                />
                <EditItem
                  label="Emergency Contact"
                  value={editableStudent.emergencyContact}
                  disabled
                />
                <EditItem
                  label="Previous School"
                  value={editableStudent.previousSchool}
                  disabled
                />
                <EditItem
                  label="Monthly Payment"
                  value={`$${editableStudent.monthlyPayment || 0}`}
                  onChange={(e) => {
                    // Remove non-numeric characters and parse as float
                    const value =
                      parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0;
                    handleEditChange("monthlyPayment", value);
                  }}
                />
                <EditItem
                  label="Parant name"
                  value={editableStudent.parent?.user?.fullName || "N/A"}
                  disabled
                />
                <EditItem
                  label="Parant Emial"
                  value={editableStudent.parent?.user?.email || "N/A"}
                  disabled
                />
                <EditItem
                  label="Parant Number"
                  value={editableStudent.parent?.contact || "N/A"}
                  disabled
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="h-48 flex items-center justify-center">
                <p className="text-muted-foreground">
                  Select a student to view details
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

const EditItem = ({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}) => (
  <div className="space-y-1">
    <p className="text-sm text-muted-foreground">{label}</p>
    <Input
      type={type}
      value={value || ""}
      onChange={onChange}
      disabled={disabled}
    />
  </div>
);

export default StudentInfo;
