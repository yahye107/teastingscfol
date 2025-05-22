import React, { useEffect, useState } from "react";
import { StudentAttendanceFormControls } from "@/config";
import CommonForm from "@/components/common/CommonForm";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  callMarkStudentAttendanceApi,
  callGetAllClassesApi,
  callGetStudentsByClassroomApi,
  callGetAllsubjectssApi,
} from "@/service/service";
import { useUser } from "@/useContaxt/UseContext";
import GlobalLoader from "@/components/common/GlobalLoader";
import { ClipLoader } from "react-spinners";
import { toast } from "sonner";

const studentAttendanceSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  subject: z.string().min(1, "Subject is required"),
  date: z.string().min(1, "Date is required"),
  periodStart: z.string().min(1, "Period start time is required"),
  periodEnd: z.string().min(1, "Period end time is required"),
  attendanceList: z
    .array(
      z.object({
        studentId: z.string().min(1, "Student ID is required"),
        status: z.enum(["Present", "Absent", "Late", "Excused"]),
      })
    )
    .min(1, "At least one student must be marked"),
});

const StudentAttendance = () => {
  const { user } = useUser();
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(studentAttendanceSchema),
    defaultValues: {
      classId: "",
      subject: "",
      date: "",
      periodStart: "",
      periodEnd: "",
      attendanceList: [],
    },
  });

  const teacherId = user?._id;
  const { control, watch, handleSubmit, reset, setValue } = form;
  const { fields, replace } = useFieldArray({
    control,
    name: "attendanceList",
  });

  const attendanceList = watch("attendanceList");
  const selectedClassId = watch("classId");

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
        setInitialLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClassId) return;

      try {
        setStudentsLoading(true);
        const res = await callGetStudentsByClassroomApi(selectedClassId);
        const studentList = res.students || [];
        setStudents(studentList);

        const initialAttendance = studentList.map((student) => ({
          studentId: student._id,
          status: "Present",
        }));
        replace(initialAttendance);
      } catch (error) {
        toast.error("Failed to load students");
      } finally {
        setStudentsLoading(false);
      }
    };

    fetchStudents();
  }, [selectedClassId, replace]);

  const handleStatusChange = (index, newStatus) => {
    setValue(`attendanceList.${index}.status`, newStatus, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Present":
        return "bg-green-100 border-green-500";
      case "Absent":
        return "bg-red-100 border-red-500";
      case "Late":
        return "bg-yellow-100 border-yellow-500";
      case "Excused":
        return "bg-purple-100 border-purple-500";
      default:
        return "bg-gray-100 border-gray-300";
    }
  };

  const onSubmit = async (formData) => {
    if (!teacherId) {
      toast.error("Teacher information missing");
      return;
    }

    try {
      setSubmitting(true);
      await callMarkStudentAttendanceApi(user._id, formData);
      toast.success("Attendance submitted successfully!");
      toast("Attendance submitted successfully!");
      reset();
      setStudents([]);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Attendance submission failed"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const enhancedFormControls = StudentAttendanceFormControls.filter(
    (control) => control.id !== "attendanceList"
  ).map((control) => {
    if (control.id === "classId") {
      return {
        ...control,
        options: classes.map((cls) => ({
          label: `Grade ${cls.grade} - ${cls.section}`,
          value: cls._id,
        })),
        disabled: initialLoading,
      };
    }
    if (control.id === "subject") {
      return {
        ...control,
        options: subjects.map((sub) => ({
          label: sub.name,
          value: sub._id,
        })),
        disabled: initialLoading,
      };
    }
    return control;
  });

  if (initialLoading) return <GlobalLoader />;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Student Attendance Management
      </h1>

      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <CommonForm
          formControls={enhancedFormControls}
          form={form}
          handleSubmit={handleSubmit(onSubmit)}
          btnText={
            <div className="flex items-center justify-center gap-2">
              {submitting && <ClipLoader size={18} color="#ffffff" />}
              {submitting ? "Submitting..." : "Submit Attendance"}
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
              Student Attendance List
            </h3>

            {form.formState.errors.attendanceList && (
              <p className="text-red-500 mb-4 font-medium">
                {form.formState.errors.attendanceList.message}
              </p>
            )}

            <div className="grid gap-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-sm text-gray-500">
                      {index + 1}.
                    </span>
                    <span className="font-medium text-gray-700">
                      {students[index]?.user?.fullName ||
                        `Student ${index + 1}`}
                    </span>
                  </div>

                  <select
                    value={attendanceList[index]?.status || "Present"}
                    onChange={(e) => handleStatusChange(index, e.target.value)}
                    className={`px-4 py-2 border rounded-md w-36 focus:outline-none focus:ring-2 transition-all ${getStatusColor(
                      attendanceList[index]?.status
                    )}`}
                    disabled={submitting}
                  >
                    {["Present", "Absent", "Late", "Excused"].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default StudentAttendance;
