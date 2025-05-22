import React, { useEffect, useState } from "react";
import {
  callGetAllClassesApi,
  callGetAllsubjectssApi,
  callGetStudentsByClassroomApi,
  callSubmitResultsForClassSubjectApi,
} from "@/service/service";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import CommonForm from "@/components/common/CommonForm";
import { ResultFormControls } from "@/config";
import { ClipLoader } from "react-spinners";
import { toast } from "sonner";
import GlobalLoader from "@/components/common/GlobalLoader";
import { useUser } from "@/useContaxt/UseContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Schema for validation
export const resultSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  subjectId: z.string().min(1, "Subject is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  results: z
    .array(
      z.object({
        studentId: z.string(),
        firstExam: z.number().min(0).max(100),
        midExam: z.number().min(0).max(100),
        thirdExam: z.number().min(0).max(100),
        finalExam: z.number().min(0).max(100),
        activities: z.number().min(0).max(100),
      })
    )
    .min(1, "At least one result is required"),
});

const Gradebook = ({ teacherId }) => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const { user } = useUser();
  const form = useForm({
    resolver: zodResolver(resultSchema),
    defaultValues: {
      classId: "",
      subjectId: "",
      academicYear: "",
      results: [],
    },
  });

  const { control, setValue, handleSubmit, reset, watch, formState, register } =
    form;
  const { fields } = useFieldArray({ control, name: "results" });
  const selectedClassId = watch("classId");

  // Fetch classes and subjects
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [classesRes, subjectsRes] = await Promise.all([
          callGetAllClassesApi(),
          callGetAllsubjectssApi(),
        ]);
        setClasses(classesRes.classrooms);
        setSubjects(subjectsRes.subjects);
      } catch (error) {
        toast.error("Failed to load initial data");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch students by selected class
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClassId) return;

      try {
        setStudentsLoading(true);
        const res = await callGetStudentsByClassroomApi(selectedClassId);
        const studentList = res.students || [];
        setStudents(studentList);

        const initialResults = studentList.map((student) => ({
          studentId: student._id,
          firstExam: 0,
          midExam: 0,
          thirdExam: 0,
          finalExam: 0,
          activities: 0,
        }));

        setValue("results", initialResults);
      } catch (error) {
        toast.error("Failed to load students");
        setValue("results", []);
      } finally {
        setStudentsLoading(false);
      }
    };

    fetchStudents();
  }, [selectedClassId, setValue]);

  // Submit results
  const onSubmit = async (data) => {
    try {
      setSubmitting(true);

      const payload = {
        classId: data.classId,
        subjectId: data.subjectId,
        academicYear: data.academicYear,
        results: data.results.map((result) => ({
          studentId: result.studentId,
          firstExam: Number(result.firstExam),
          midExam: Number(result.midExam),
          thirdExam: Number(result.thirdExam),
          finalExam: Number(result.finalExam),
          activities: Number(result.activities),
        })),
      };

      await callSubmitResultsForClassSubjectApi(user._id, payload);

      toast.success("Results submitted successfully!");
      reset();
    } catch (error) {
      toast.error(error.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Enhance form controls with live options
  const enhancedFormControls = ResultFormControls.filter(
    (control) => control.id !== "results"
  ).map((control) => {
    if (control.id === "classId") {
      return {
        ...control,
        options: classes.map((cls) => ({
          label: `Grade ${cls.grade} - ${cls.section}`,
          value: cls._id,
        })),
        disabled: loading,
      };
    }
    if (control.id === "subjectId") {
      return {
        ...control,
        options: subjects.map((subject) => ({
          label: subject.name,
          value: subject._id,
        })),
        disabled: loading,
      };
    }
    return control;
  });

  if (loading) return <GlobalLoader />;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Grade Management System
      </h1>
      <Link to="/teacher/dashboard/UpdateGradebook">
        <Button
          variant="outline"
          className="border-blue-600 text-blue-600 hover:bg-blue-50"
        >
          update Exist one
        </Button>
      </Link>
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <CommonForm
          formControls={enhancedFormControls}
          form={form}
          handleSubmit={handleSubmit(onSubmit)}
          btnText={
            <div className="flex items-center justify-center gap-2">
              {submitting && <ClipLoader size={18} color="#ffffff" />}
              {submitting ? "Submitting..." : "Submit Results"}
            </div>
          }
          disabled={submitting || studentsLoading}
        />
      </div>

      {studentsLoading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      ) : (
        fields.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              Student Marks Entry
            </h3>

            {formState.errors.results && (
              <p className="text-red-500 mb-4 font-medium">
                {formState.errors.results.message}
              </p>
            )}

            <div className="grid gap-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="border p-4 rounded-md bg-gray-50"
                >
                  <p className="font-medium mb-3">
                    {students[index]?.user?.fullName || `Student ${index + 1}`}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      "firstExam",
                      "midExam",
                      "thirdExam",
                      "finalExam",
                      "activities",
                    ].map((fieldName) => (
                      <div key={fieldName} className="space-y-1">
                        <label className="text-sm text-gray-600 capitalize">
                          {fieldName.replace(/([A-Z])/g, " $1")}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          {...register(`results.${index}.${fieldName}`, {
                            valueAsNumber: true,
                          })}
                          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={submitting}
                        />
                        {formState.errors.results?.[index]?.[fieldName] && (
                          <span className="text-red-500 text-sm">
                            {formState.errors.results[index][fieldName].message}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default Gradebook;
