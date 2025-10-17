import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import CommonForm from "@/components/common/CommonForm";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { TeacherFormControls } from "@/config";
import {
  callCreateTeacherApi,
  callGetAllsubjectssApi,
} from "@/service/service";
import GlobalLoader from "@/components/common/GlobalLoader";
import ButtonLoader from "@/components/common/ButtonLoadi";

const teacherSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string(),
  dob: z.string().min(1, "DOB required"),
  age: z.number().min(0, "Age is required"),
  gender: z.string().min(1, "select the gender"),
  contact: z.string().min(1, "Contact number is required"),
  address: z.string(),
  qualification: z.string(),
  subjects: z.string(),
  nationalId: z.string().optional(),
  experience: z.string(),
  SalaryBymonth: z.string(),
  notes: z.string().optional(),
});

const RegTeachers = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subjects, setSubjects] = useState([]);

  const form = useForm({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      fullName: "",
      email: "",
      dob: "",
      age: "",
      gender: "",
      contact: "",
      address: "",
      nationalId: "",
      qualification: "",
      subjects: "",
      SalaryBymonth: "",
      notes: "",
      experience: "",
    },
  });
  const dob = form.watch("dob");
  useEffect(() => {
    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();

      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      form.setValue("age", age);
    }
  }, [dob, form]);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const subjectsData = await callGetAllsubjectssApi();
        setSubjects(subjectsData.subjects || []);
      } catch (error) {
        console.error("Error fetching subjects", error);
        toast.error("Failed to load subjects data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (formData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        subjectIds: [formData.subjects],
      };

      await callCreateTeacherApi(payload);
      toast.success("Teacher registered successfully!");
      form.reset();
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to register staff. Please try again.";
      toast.error(message);
      console.error("Error registering staff:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const enhancedFormControls = TeacherFormControls.map((control) => {
    const baseStyle =
      "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black focus:border-indigo-500";

    if (control.id === "subjects") {
      return {
        ...control,
        options: subjects.map((subject) => ({
          label: subject.name,
          value: subject._id,
        })),
        className: `${baseStyle} md:rounded-xl`,
      };
    }

    return { ...control, className: baseStyle };
  });

  if (isLoading) return <GlobalLoader />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 px-4 py-8 sm:py-12">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-blue-700">
            Teacher Registration
          </h2>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Register new teachers
          </p>
        </div>

        <div className="flex flex-col items-center md:items-end gap-2">
          <h2 className="text-lg font-medium text-blue-700">View Teachers</h2>
          <Link to="/admin/dashboard/allTeacher">
            <Button
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              Teachers
            </Button>
          </Link>
        </div>
      </div>

      {/* Form Container */}
      <div className="flex justify-center">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-8 lg:p-10 space-y-8">
          <CommonForm
            formControls={enhancedFormControls}
            form={form}
            handleSubmit={handleSubmit}
            btnText={isSubmitting ? <ButtonLoader /> : "Register Teacher"}
            className="space-y-6"
            inputClassName="w-full rounded-lg md:rounded-xl border border-gray-300 bg-white px-4 py-2.5 md:py-3 text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black focus:border-indigo-500"
            labelClassName="block text-sm font-medium text-black"
            // errorClassName="text-red-500 text-xs mt-1"
            buttonClassName="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md"
            customLayout={{
              grid: [
                ["fullName", "email"],
                ["dob", "age"],
                ["gender", "contact"],
                ["qualification", "experience"],
                ["subjects", "SalaryBymonth"],
                ["address", "nationalId"],
                ["notes"],
              ],
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default RegTeachers;
