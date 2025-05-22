import React, { useEffect, useState } from "react";
import {
  callGetAllClassesApi,
  callGetClassExamTableApi,
  callUpdateExamApi,
  callDeleteExamApi,
  callGetAllsubjectssApi,
} from "@/service/service";
import GlobalLoader from "@/components/common/GlobalLoader";
import CommonForm from "@/components/common/CommonForm";
import { ExamFormControls } from "@/config";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
const ManageExamTable = () => {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [exams, setExams] = useState([]);
  const [editSubject, setEditSubject] = useState(null);
  const [deleteExamId, setDeleteExamId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const subjectForm = useForm({
    resolver: zodResolver(
      z.object({
        subjectId: z.string().min(1, "Subject is required"),
        date: z.string().min(1, "Date is required"),
        startTime: z.string().min(1, "Start time required"),
        endTime: z.string().min(1, "End time required"),
        day: z.string().min(1, "Day is required"),
      })
    ),
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classesRes, subjectsRes] = await Promise.all([
          callGetAllClassesApi(),
          callGetAllsubjectssApi(),
        ]);
        setClasses(classesRes.classrooms || []);
        setSubjects(subjectsRes.subjects || []);
      } catch (err) {
        console.error("Error loading data:", err);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const enhancedFormControls = ExamFormControls.map((control) => {
    if (control.id === "exams") {
      return {
        ...control,
        subFields: control.subFields.map((subField) => {
          if (subField.id === "subjectId") {
            return {
              ...subField,
              options: subjects.map((subject) => ({
                label: subject.name,
                value: subject._id,
              })),
            };
          }
          if (subField.id === "date") {
            return { ...subField, type: "date" };
          }
          if (subField.id === "startTime" || subField.id === "endTime") {
            return { ...subField, type: "time" };
          }
          return subField;
        }),
      };
    }
    return control;
  });

  const filteredClasses = classes.filter((cls) =>
    `Grade ${cls.grade} ${cls.section}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const handleClassSelect = async (classId) => {
    try {
      setLoading(true);
      const res = await callGetClassExamTableApi(classId);
      setExams(res.exams || []);
      setSelectedClass(classId);
    } catch (err) {
      console.error("Error loading exams:", err);
      toast.error("Failed to load exam schedule");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubject = async (data) => {
    try {
      const updatedExams = exams.map((exam) => {
        if (exam._id === editSubject.examId) {
          return {
            ...exam,
            exams: exam.exams.map((subject, index) =>
              index === editSubject.subjectIndex
                ? {
                    ...data,
                    date: new Date(data.date).toISOString(),
                  }
                : subject
            ),
          };
        }
        return exam;
      });

      await callUpdateExamApi(editSubject.examId, {
        ...updatedExams.find((e) => e._id === editSubject.examId),
      });

      toast.success("Schedule updated successfully");
      setEditSubject(null);
      handleClassSelect(selectedClass);
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed to update schedule");
    }
  };

  const handleDeleteExam = async () => {
    try {
      await callDeleteExamApi(deleteExamId);
      toast.success("Exam deleted successfully");
      handleClassSelect(selectedClass);
    } catch (error) {
      console.error("Deletion failed:", error);
      toast.error("Failed to delete exam");
    } finally {
      setDeleteExamId(null);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) return <GlobalLoader />;

  return (
    <div className="mx-auto max-w-4xl p-2 md:p-4 lg:p-6">
      {/* Back Button */}
      <Button
        variant="outline"
        className="mb-4 md:mb-6 text-black"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card className="shadow-lg mb-4 md:mb-6">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl font-bold text-primary">
            Manage Exam Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Class Selection */}
          <div className="mb-4 md:mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search classes..."
                className="pl-8 text-sm md:text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-4">
              {filteredClasses.slice(0, 4).map((cls) => (
                <Button
                  key={cls._id}
                  variant={selectedClass === cls._id ? "default" : "outline"}
                  onClick={() => handleClassSelect(cls._id)}
                  className="text-left h-auto py-2 text-sm md:text-base"
                >
                  <div className="w-full">
                    <p className="font-medium">
                      Grade {cls.grade} - {cls.section}
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {cls.students?.length || 0} students
                    </p>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Exams List */}
          {exams.length > 0 ? (
            <div className="space-y-3 md:space-y-4">
              {exams.map((exam) => (
                <Card key={exam._id} className="relative">
                  <CardHeader className="p-3 md:p-6">
                    <CardTitle className="flex justify-between items-center text-base md:text-lg">
                      {exam.title}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 md:p-2"
                            onClick={() => setDeleteExamId(exam._id)}
                          >
                            <Trash className="h-4 w-4 text-red-600" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-[90vw] rounded-lg">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-lg">
                              Confirm Delete
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-sm md:text-base">
                              Are you sure you want to delete this entire exam
                              schedule?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="text-sm md:text-base">
                              Cancel
                            </AlertDialogCancel>
                            <Button
                              variant="destructive"
                              className="text-sm md:text-base"
                              onClick={handleDeleteExam}
                            >
                              Delete
                            </Button>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 md:p-6">
                    <div className="space-y-3 md:space-y-4">
                      {exam.exams.map((schedule, index) => (
                        <div
                          key={index}
                          className="border-b pb-3 md:pb-4 group relative"
                        >
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <p className="font-medium text-sm md:text-base">
                                {schedule.subjectId?.name}
                              </p>
                              <p className="text-xs md:text-sm">
                                {formatDate(schedule.date)} ({schedule.day})
                              </p>
                              <p className="text-xs md:text-sm text-muted-foreground">
                                {schedule.startTime} - {schedule.endTime}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 md:p-2 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                              onClick={() => {
                                setEditSubject({
                                  examId: exam._id,
                                  subjectIndex: index,
                                  ...schedule,
                                  date: new Date(schedule.date)
                                    .toISOString()
                                    .split("T")[0],
                                });
                                subjectForm.reset({
                                  ...schedule,
                                  subjectId: schedule.subjectId?._id,
                                  date: new Date(schedule.date)
                                    .toISOString()
                                    .split("T")[0],
                                });
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            selectedClass && (
              <p className="text-center text-sm md:text-base">
                No exams found for this class
              </p>
            )
          )}
        </CardContent>
      </Card>

      {/* Edit Subject Modal */}
      {editSubject && (
        <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center">
          <Card className="w-full max-w-md mx-4 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">
                Edit Subject Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CommonForm
                formControls={
                  enhancedFormControls.find((c) => c.id === "exams")?.subFields
                }
                handleSubmit={subjectForm.handleSubmit(handleUpdateSubject)}
                form={subjectForm}
                btnText="Update Schedule"
                defaultValues={editSubject}
              />
              <Button
                className="mt-4 w-full"
                variant="outline"
                onClick={() => setEditSubject(null)}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ManageExamTable;
