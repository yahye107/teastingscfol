import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
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

const teacherSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email"),
  dob: z.string().min(1, "DOB required"),
  age: z.string().min(1, "Age required"),
  gender: z.enum(["Male", "Female", "Other"]),
  contact: z.string().min(1, "Contact number is required"),
  address: z.string().min(1, "Address is required"),
  qualification: z.string().min(1, "Qualification is required"),
  subjects: z.string().min(1, "Subject is required"), // Changed from array to string
  experience: z.string().min(1, "Experience is required"),
  SalaryBymonth: z.string().min(1, "Salary is required"),
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
      qualification: "",
      subjects: "",
      SalaryBymonth: "",
      experience: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const subjectsData = await callGetAllsubjectssApi();
        setSubjects(subjectsData.subjects || []);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        subjectIds: [formData.subjects], // Convert to array for backend
      };

      await callCreateTeacherApi(payload);
      toast.success("Teacher registered successfully!");
      form.reset();
    } catch (error) {
      toast.error("Registration failed. Please try again.");
      console.error("Registration error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const enhancedFormControls = TeacherFormControls.map((control) => {
    const baseStyle =
      "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black focus:border-indigo-500 transition duration-150 ease-in-out";

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
            Register new teachers with professional details
          </p>
        </div>

        <div className="flex flex-col items-center md:items-end gap-2">
          <h2 className="text-lg font-medium text-blue-700">
            View Teacher Records
          </h2>
          <Link to="/admin/dashboard/TeacherInfo">
            <Button
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              Teacher Directory
            </Button>
          </Link>
        </div>
      </div>

      {/* Form Container */}
      <div className="flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-8 lg:p-10 space-y-8"
        >
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {[...Array(7)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-1/4 rounded-full" />
                  <Skeleton className="h-10 rounded-xl" />
                </div>
              ))}
              <Skeleton className="h-12 rounded-xl mt-4" />
            </motion.div>
          ) : (
            <CommonForm
              formControls={enhancedFormControls}
              form={form}
              handleSubmit={handleSubmit}
              btnText={isSubmitting ? "Registering..." : "Register Teacher"}
              className="space-y-6"
              inputClassName="w-full rounded-lg md:rounded-xl border border-gray-300 bg-white px-4 py-2.5 md:py-3 text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black focus:border-indigo-500 transition duration-150 ease-in-out"
              labelClassName="block text-sm font-medium text-black"
              errorClassName="text-red-500 text-xs mt-1"
              buttonClassName="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition duration-300 ease-in-out relative"
              buttonProps={{
                disabled: isSubmitting,
                children: isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <motion.div
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    />
                    <span>Registering...</span>
                  </div>
                ) : (
                  "Register Teacher"
                ),
              }}
              customLayout={{
                grid: [
                  ["fullName", "email"],
                  ["dob", "age"],
                  ["gender", "contact"],
                  ["qualification", "experience"],
                  ["subjects", "SalaryBymonth"],
                  ["address"],
                ],
                gridClassName: "grid grid-cols-1 md:grid-cols-2 gap-6",
                fullWidthFields: ["address"],
              }}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default RegTeachers;
