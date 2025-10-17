import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import CommonForm from "@/components/common/CommonForm";
import { StaffFormControls } from "@/config";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import GlobalLoader from "@/components/common/GlobalLoader";
import ButtonLoader from "@/components/common/ButtonLoadi";
import { callCreateStaffApi } from "@/service/service";

// ✅ Zod schema for staff registration
const staffSchema = z.object({
  fullName: z.string().min(3, "least 3 characters"),
  email: z.string().email("Invalid email").optional(),
  dob: z.string().min(1, "Date of Birth is required"),
  age: z.number().min(0, "Age is required"),
  gender: z.string().min(1, "Gender is required"),
  nationalId: z.string().optional(),
  jobTitle: z.string().min(1, "Job Title is required"),
  employmentType: z.string().min(1, "Employment Type is required"),
  educationalQualifications: z.string().optional(),
  //   certifications: z.string().optional(),
  SalaryBymonth: z.string().optional(),
  notes: z.string().optional(),
});

const Staff = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      fullName: "",
      email: "",
      dob: "",
      gender: "",
      age: "",
      nationalId: "",
      jobTitle: "",
      employmentType: "",
      educationalQualifications: "",
      //   certifications: "",
      SalaryBymonth: "",
      notes: "",
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

  const handleSubmit = async (data) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await callCreateStaffApi(data);
      toast.success("Staff registered successfully!");
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

  if (isLoading) return <GlobalLoader />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-100 px-4 py-8 sm:py-12">
      {/* Header section */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center md:justify-between text-center md:text-left gap-4 mb-8">
        {/* Left side */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-indigo-700">
            Register New Staff
          </h2>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Fill in the form below to register a new staff member.
          </p>
        </div>

        {/* Right side */}
        <div className="flex flex-col items-center md:items-end gap-2">
          <h2 className="text-lg font-medium text-indigo-700">
            View Staff Records
          </h2>
          <Link to="/admin/dashboard/allstaff">
            <Button
              variant="outline"
              className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
            >
              Fetch Staff
            </Button>
          </Link>
        </div>
      </div>

      {/* Form section */}
      <div className="flex justify-center">
        <div className="w-full max-w-md md:max-w-xl lg:max-w-3xl bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-6 md:p-8 lg:p-10 space-y-6 md:space-y-8">
          <CommonForm
            formControls={StaffFormControls}
            form={form}
            handleSubmit={handleSubmit}
            btnText={isSubmitting ? <ButtonLoader /> : "Register Staff"}
            className="space-y-4 md:space-y-6"
            inputClassName="w-full rounded-lg md:rounded-xl border border-gray-300 bg-white px-4 py-2.5 md:py-3 text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black focus:border-indigo-500 transition duration-150 ease-in-out"
            labelClassName="block text-sm font-medium text-gray-700"
            errorClassName="text-red-500 text-xs mt-1"
            buttonClassName="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 md:py-3 px-4 rounded-lg md:rounded-xl shadow-md transition duration-300 ease-in-out relative"
            customLayout={{
              grid: [
                ["fullName", "email"],
                ["dob", "age"],
                ["gender", "jobTitle"],
                ["employmentType", "educationalQualifications"],
                ["SalaryBymonth", "nationalId"],
                ["notes"],
              ],
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Staff;
