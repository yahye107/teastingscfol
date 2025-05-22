import CommonForm from "@/components/common/CommonForm";
import { TimetableFormControls } from "@/config";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  callCreateOrUpdateTimetableApi,
  callUpdateTimetableApi,
  callDeleteTimetableApi,
  callGetAllTimetablesApi,
  callGetAllTeachersApi,
  callGetAllsubjectssApi,
  callGetAllHallsApi,
  callGetAllClassesApi,
} from "@/service/service";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Search, Plus, Trash2, Edit, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import GlobalLoader from "@/components/common/GlobalLoader";

const timetableSchema = z
  .object({
    teacherId: z.string().min(1, "Teacher is required"),
    classId: z.string().min(1, "Class is required"),
    subjectId: z.string().min(1, "Subject is required"),
    hallId: z.string().min(1, "Hall is required"),
    day: z.string().min(1, "Day is required"),
    periodStart: z.string().min(1, "Start time is required"),
    periodEnd: z.string().min(1, "End time is required"),
  })
  .refine((data) => data.periodStart < data.periodEnd, {
    message: "End time must be after start time",
    path: ["periodEnd"],
  });

const TimeTable = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timetables, setTimetables] = useState([]);
  const [filteredTimetables, setFilteredTimetables] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [halls, setHalls] = useState([]);

  const form = useForm({
    resolver: zodResolver(timetableSchema),
    defaultValues: {
      teacherId: "",
      classId: "",
      subjectId: "",
      hallId: "",
      day: "",
      periodStart: "",
      periodEnd: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [timetablesRes, teachersRes, classesRes, subjectsRes, hallsRes] =
          await Promise.all([
            callGetAllTimetablesApi(),
            callGetAllTeachersApi(),
            callGetAllClassesApi(),
            callGetAllsubjectssApi(),
            callGetAllHallsApi(),
          ]);

        setTimetables(timetablesRes.timetables || []);
        setFilteredTimetables(timetablesRes.timetables || []);
        setTeachers(teachersRes.teachers || []);
        setClasses(classesRes.classrooms || []);
        setSubjects(subjectsRes.subjects || []);
        setHalls(hallsRes.halls || []);
        setIsLoading(false);
      } catch (err) {
        toast.error("Failed to load data");
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const enhancedFormControls = TimetableFormControls.map((control) => {
    if (control.id === "teacherId") {
      return {
        ...control,
        options: teachers.map((teacher) => ({
          label: teacher.user?.fullName,
          value: teacher._id,
        })),
      };
    }
    if (control.id === "classId") {
      return {
        ...control,
        options: classes.map((cls) => ({
          label: `Grade ${cls.grade} - ${cls.section}`,
          value: cls._id,
        })),
      };
    }
    if (control.id === "subjectId") {
      return {
        ...control,
        options: subjects.map((subject) => ({
          label: subject.name,
          value: subject._id,
        })),
      };
    }
    if (control.id === "hallId") {
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

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
    const results = timetables.filter(
      (timetable) =>
        timetable.day.toLowerCase().includes(value) ||
        timetable.teacher?.user?.fullName.toLowerCase().includes(value) ||
        timetable.subject?.name.toLowerCase().includes(value) ||
        timetable.class?.grade.toString().includes(value)
    );
    setFilteredTimetables(results);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setFilteredTimetables(timetables);
  };

  const handleSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (selectedTimetable) {
        await callUpdateTimetableApi(selectedTimetable._id, data);
        toast.success("Timetable updated successfully!");
      } else {
        await callCreateOrUpdateTimetableApi(data);
        toast.success("Timetable created successfully!");
      }
      const updated = await callGetAllTimetablesApi();
      setTimetables(updated.timetables || []);
      setFilteredTimetables(updated.timetables || []);
      form.reset();
      setSelectedTimetable(null);
    } catch (error) {
      toast.error(error.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await callDeleteTimetableApi(id);
      setTimetables((prev) => prev.filter((t) => t._id !== id));
      setFilteredTimetables((prev) => prev.filter((t) => t._id !== id));
      if (selectedTimetable?._id === id) {
        form.reset();
        setSelectedTimetable(null);
      }
      toast.success("Timetable deleted successfully!");
    } catch (error) {
      toast.error(error.message || "Delete failed");
    }
  };
  if (isLoading) return <GlobalLoader />;
  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        {/* <div className="relative w-full sm:max-w-md">
          <Input
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search timetables..."
            className="pl-10 pr-10"
          />
          <div className="absolute inset-y-0 left-3 flex items-center">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-3 flex items-center"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div> */}

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto text-black">
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
            <Link to="/admin/dashboard/studentTimetable" className="w-full">
              <Button variant="outline" className="w-full">
                Student View
              </Button>
            </Link>
            <Link to="/admin/dashboard/teacherTimetable" className="w-full">
              <Button variant="outline" className="w-full">
                Teacher View
              </Button>
            </Link>
          </div>

          <Button
            onClick={() => {
              form.reset();
              setSelectedTimetable(null);
            }}
            className="gap-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            New Entry
          </Button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="shadow-lg">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                {selectedTimetable
                  ? "Edit Timetable Entry"
                  : "Create New Entry"}
              </CardTitle>
              {selectedTimetable && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete the timetable entry.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(selectedTimetable._id)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <CommonForm
              formControls={enhancedFormControls}
              form={form}
              handleSubmit={form.handleSubmit(handleSubmit)}
              btnText={
                isSubmitting
                  ? selectedTimetable
                    ? "Saving..."
                    : "Creating..."
                  : selectedTimetable
                  ? "Save Changes"
                  : "Create Entry"
              }
              btnDisabled={isSubmitting}
              customLayout={{
                grid: [
                  ["teacherId", "classId"],
                  ["subjectId", "hallId"],
                  ["day"],
                  ["periodStart", "periodEnd"],
                ],
                gridClassName: "grid grid-cols-1 md:grid-cols-2 gap-4",
                fullWidthFields: ["day"],
              }}
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default TimeTable;
