import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
import {
  callDeleteTeacherApi,
  callGetAllsubjectssApi,
  callGetAllTeachersApi,
  callUpdateTeacherApi,
} from "@/service/service";
import { BarLoader } from "react-spinners";
import GlobalLoader from "@/components/common/GlobalLoader";

const TeacherInfo = () => {
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [editableTeacher, setEditableTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  const [allSubjects, setAllSubjects] = useState([]);

  const [loadingSubjects, setLoadingSubjects] = useState(false);

  useEffect(() => {
    const fetchExtraData = async () => {
      try {
        const subjectsRes = await callGetAllsubjectssApi();
        setAllSubjects(subjectsRes.subjects || []);
      } catch (err) {
        console.error("Failed to load subjects", err);
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchExtraData();
  }, []);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const { teachers } = await callGetAllTeachersApi();
        const recentTeachers = teachers.slice(-5);
        setTeachers(teachers);
        setFilteredTeachers(teachers.slice(-5));
      } catch (err) {
        console.error("Error fetching teachers", err);
        toast.error("Failed to load teachers");
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    const results = teachers.filter((teacher) =>
      teacher.user?.fullName?.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredTeachers(results);
  };

  const handleSelect = (teacher) => {
    setSelectedTeacher(teacher);
    setEditableTeacher({
      ...teacher,
      user: { ...teacher.user },
      subjects: teacher.subjects?.[0]?._id || "", // Assuming single subject selection
    });
  };

  const handleDelete = async (id) => {
    try {
      await callDeleteTeacherApi(id);
      setTeachers((prev) => prev.filter((t) => t._id !== id));
      setFilteredTeachers((prev) => prev.filter((t) => t._id !== id));
      setSelectedTeacher(null);
      toast.success("Teacher deleted");
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  const handleEditChange = (field, value, nested = false) => {
    setEditableTeacher((prev) => {
      if (nested) {
        return { ...prev, user: { ...prev.user, [field]: value } };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleSave = async () => {
    try {
      await callUpdateTeacherApi(editableTeacher._id, {
        fullName: editableTeacher.user?.fullName,
        email: editableTeacher.user.email,
        subjects: [editableTeacher.subjects], // Send as array
        contact: editableTeacher.contact,
        dob: editableTeacher.dob,
        qualification: editableTeacher.qualification,
        experience: editableTeacher.experience,
        SalaryBymonth: editableTeacher.SalaryBymonth,
      });

      toast.success("Teacher updated");

      setTeachers((prev) =>
        prev.map((t) =>
          t._id === editableTeacher._id ? { ...editableTeacher } : t
        )
      );
      setFilteredTeachers((prev) =>
        prev.map((t) =>
          t._id === editableTeacher._id ? { ...editableTeacher } : t
        )
      );
      setSelectedTeacher({ ...editableTeacher });
    } catch (err) {
      console.error(err);
      toast.error("Update failed");
    }
  };

  const getSelectedSubjectName = () => {
    if (!editableTeacher?.subjects) return "Select subject";
    const selectedSubject = allSubjects.find(
      (s) => s._id === editableTeacher.subjects
    );
    return selectedSubject?.name || "Select subject";
  };
  if (loading) return <GlobalLoader />;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <div className="space-y-2">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="gap-2 text-black"
        >
          <ArrowLeft className="h-4 w-4 text-black" />
          Back to Teachers
        </Button>
        <h1 className="text-2xl font-bold">Recent Teachers</h1>
        <div className="relative">
          <Input
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search recent teachers..."
            className="pl-10"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Teachers List */}
        <Card className="lg:col-span-1">
          <CardContent className="p-2 space-y-2 overflow-y-auto max-h-[360px]">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))
            ) : filteredTeachers.length > 0 ? (
              filteredTeachers.map((teacher) => (
                <Button
                  key={teacher._id}
                  variant={
                    selectedTeacher?._id === teacher._id ? "secondary" : "ghost"
                  }
                  onClick={() => handleSelect(teacher)}
                  className="w-full justify-start h-12 text-left px-3"
                >
                  <div className="truncate">
                    <p className="font-medium">{teacher.user?.fullName}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {teacher.user?.email}
                    </p>
                  </div>
                </Button>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No teachers found
              </p>
            )}
          </CardContent>
        </Card>

        {/* Teacher Details */}
        <div className="lg:col-span-2 space-y-4">
          {selectedTeacher && editableTeacher ? (
            <Card>
              <CardHeader className="px-4 py-3 flex items-center justify-between">
                <CardTitle>Teacher Details</CardTitle>
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
                          teacher's information?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={async () => {
                            if (editableTeacher) {
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
                        onClick={() => setTeacherToDelete(selectedTeacher)}
                      >
                        <Trash className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="w-[90vw] max-w-sm sm:max-w-lg rounded-xl p-4 sm:p-6">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this teacher.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={async () => {
                            if (teacherToDelete) {
                              await handleDelete(teacherToDelete._id);
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
                  value={editableTeacher.user?.fullName}
                  onChange={(e) =>
                    handleEditChange("fullName", e.target.value, true)
                  }
                />
                <EditItem
                  label="Email"
                  value={editableTeacher.user?.email}
                  onChange={(e) =>
                    handleEditChange("email", e.target.value, true)
                  }
                />
                <EditItem
                  label="Contact"
                  value={editableTeacher.contact}
                  onChange={(e) => handleEditChange("contact", e.target.value)}
                />
                <EditItem
                  label="DOB"
                  type="date"
                  value={editableTeacher.dob?.slice(0, 10)}
                  onChange={(e) => handleEditChange("dob", e.target.value)}
                />
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Subject</p>
                  <Select
                    value={editableTeacher.subjects}
                    onValueChange={(value) =>
                      handleEditChange("subjects", value)
                    }
                    disabled={loadingSubjects}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue asChild>
                        <span className="flex items-center">
                          {editableTeacher.subjects ? (
                            <span className="font-medium">
                              {allSubjects.find(
                                (s) => s._id === editableTeacher.subjects
                              )?.name || "No subject"}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              Select subject
                            </span>
                          )}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {allSubjects.map((subject) => (
                        <SelectItem key={subject._id} value={subject._id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{subject.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <EditItem
                  label="Qualification"
                  value={editableTeacher.qualifications}
                  onChange={(e) =>
                    handleEditChange("qualification", e.target.value)
                  }
                />
                <EditItem
                  label="Experience (years)"
                  value={editableTeacher.experience}
                  onChange={(e) =>
                    handleEditChange("experience", e.target.value)
                  }
                />
                <EditItem
                  label="Salary By Month"
                  value={`$${editableTeacher.SalaryBymonth || 0}`}
                  onChange={(e) => {
                    const value =
                      parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0;
                    handleEditChange("SalaryBymonth", value);
                  }}
                />
                <EditItem label="Age" value={editableTeacher.age} />
                <EditItem
                  label="Gender"
                  value={editableTeacher.gender}
                  disabled
                />
                <EditItem
                  label="Password"
                  value={editableTeacher.user?.rawPassword}
                  disabled
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="h-48 flex items-center justify-center">
                <p className="text-muted-foreground">
                  Select a teacher to view details
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

export default TeacherInfo;
