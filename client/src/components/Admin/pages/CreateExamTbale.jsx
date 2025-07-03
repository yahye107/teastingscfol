import React, { useEffect, useState } from "react";
import {
  callCreateExamApi,
  callGetAllClassesApi,
  callGetAllHallsApi,
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
import { ArrowLeft, Plus, Trash } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const examSchema = z.object({
  title: z.string().min(1, "Title is required"),
  classId: z.string().min(1, "Class is required"),
  halls: z
    .array(
      z.object({
        hallId: z.string().min(1, "Hall is required"),
        count: z.coerce
          .number()
          .min(1, "Min 1 student")
          .max(100, "Max 100 per hall"),
      })
    )
    .min(1, "At least one hall"),
  exams: z
    .array(
      z.object({
        subjectId: z.string().min(1, "Subject is required"),
        date: z.string().min(1, "Date is required"),
        startTime: z.string().min(1, "Start time required"),
        endTime: z.string().min(1, "End time required"),
        day: z
          .string()
          .min(1, "Day is required")
          .refine(
            (val) =>
              [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ].includes(val),
            {
              message: "Please select a valid day.",
            }
          ),
      })
    )
    .min(1, "At least one subject"),
});

const CreateExamTable = () => {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [halls, setHalls] = useState([]);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log(halls);
  const form = useForm({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: "",
      classId: "",
      halls: [{ hallId: "", count: "" }],
      exams: [
        {
          subjectId: "",
          date: "",
          startTime: "",
          endTime: "",
          day: "",
        },
      ],
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classesRes, subjectsRes, hallsRes] = await Promise.all([
          callGetAllClassesApi(),
          callGetAllsubjectssApi(),
          callGetAllHallsApi(),
        ]);
        console.log("Halls Response:", hallsRes);
        setClasses(classesRes.classrooms || []);
        setSubjects(subjectsRes.subjects || []);
        setHalls(hallsRes.halls || []);
      } catch (err) {
        console.error("Error loading exam form data:", err);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const enhancedFormControls = ExamFormControls.map((control) => {
    if (control.id === "classId") {
      return {
        ...control,
        options: classes.map((cls) => ({
          label: `Grade ${cls.grade} - ${cls.section}`,
          value: cls._id,
        })),
      };
    }

    if (control.id === "halls") {
      return {
        ...control,
        subFields: control.subFields.map((subField) => {
          if (subField.id === "hallId") {
            return {
              ...subField,
              dynamic: true,
              options: halls.map((hall) => ({
                label: hall?.hallNumber,
                value: hall._id,
              })),
            };
          }
          return subField;
        }),
      };
    }

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
          return subField;
        }),
      };
    }

    return control;
  });

  const handleSubmit = async (data) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await callCreateExamApi(data);
      toast.success("Exam created successfully");
      form.reset();
    } catch (error) {
      console.error("Exam creation failed:", error);
      toast.error("Failed to create exam");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <GlobalLoader />;

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6 lg:p-8">
      <div className="flex justify-between mb-6">
        {/* Back Button */}
        <Button
          variant="outline"
          className="text-black flex items-center"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Manage Exam Table Button */}
        <Link to="/admin/dashboard/manageExam">
          <Button
            variant="solid"
            className="bg-primary text-white flex items-center"
            // onClick={() => navigate("/manage-exam-table")} // Assuming this is the correct path
          >
            Manage Exam Table
          </Button>
        </Link>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">
            Create New Exam Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CommonForm
            formControls={enhancedFormControls}
            handleSubmit={form.handleSubmit(handleSubmit)}
            form={form}
            btnText={isSubmitting ? "Creating..." : "Create Exam"}
            btnDisabled={isSubmitting} // ✅ Disable during submission
            customComponents={{
              arrayAddButton: ({ onClick }) => (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClick}
                  className="mt-2 border-primary text-primary hover:bg-primary/10"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Item
                </Button>
              ),
              arrayRemoveButton: ({ onClick, disabled }) => (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={onClick}
                  disabled={disabled}
                  className="ml-2"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              ),
            }}
            btnClass="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateExamTable;
