import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  callregisterStudetsApi,
  callGetAllClassesApi,
  callGetAllParentsApi,
} from "@/service/service";
import { StudentFormControls } from "@/config";
import CommonForm from "@/components/common/CommonForm";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import GlobalLoader from "@/components/common/GlobalLoader";
import { ArrowLeft } from "lucide-react";
import ButtonLoader from "@/components/common/ButtonLoadi";

const studentSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().optional(), // required only if you use student emails
  dob: z.string().min(1, "DOB required"),
  gender: z.string().min(1, "select the gender"),
  age: z.number().min(0, "Age is required"),
  classId: z.string(),
  parentId: z.string().min(1, "Parent is required"),
  contact: z.string().min(1, "Contact is required"),
  emergencyContact: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  previousSchool: z.string().optional(),
  notes: z.string().optional(),
  nationalId: z.string().optional(),
  monthlyPayment: z.union([
    z.number().min(0, "Must be positive"),
    z.string().transform((val) => parseFloat(val) || 0),
  ]),
});

const RegStudents = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parents, setParents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const form = useForm({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      fullName: "",
      email: "",
      dob: "",
      age: "",
      gender: "",
      classId: "",
      parentId: "",
      contact: "",
      emergencyContact: "",
      address: "",
      previousSchool: "",
      monthlyPayment: "",
      nationalId: "",
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
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [parentsData, classesData] = await Promise.all([
          callGetAllParentsApi(),
          callGetAllClassesApi(),
        ]);
        setParents(parentsData.parents || []);
        setClasses(classesData.classrooms || []);
        // setIsLoading(false);
      } catch (err) {
        console.error("Error fetching parents", err);
        toast.error("Failed to load prantes data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (formData) => {
    if (isSubmitting) return; // Prevent multiple submissions
    setIsSubmitting(true);
    try {
      await callregisterStudetsApi(formData);
      toast.success("Student registered successfully!");
      form.reset();
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Failed to register staff. Please try again.";
      toast.error(message);
      console.error("Error registering staff:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const enhancedFormControls = StudentFormControls.map((control) => {
    const baseStyle =
      "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black focus:border-indigo-500 transition duration-150 ease-in-out";

    if (control.id === "classId") {
      return {
        ...control,
        options: classes.map((cls) => ({ label: cls.name, value: cls._id })),
        className: `${baseStyle} md:rounded-xl`,
      };
    }

    if (control.id === "parentId") {
      return {
        ...control,
        options: parents.map((parent) => ({
          label: parent.user?.fullName,
          value: parent._id,
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
            Student Registration
          </h2>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Register new Student
          </p>
        </div>

        <div className="flex flex-col items-center md:items-end gap-2">
          <h2 className="text-lg font-medium text-blue-700">
            View All The Students
          </h2>
          <Link to="/admin/dashboard/StudentInfo">
            <Button variant="outline" className="flex items-center gap-2">
              {/* <ArrowLeft className="w-4 h-4" /> */}
              Get All Students
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
            btnText={isSubmitting ? <ButtonLoader /> : "Register Student"}
            className="space-y-6"
            inputClassName="w-full rounded-lg md:rounded-xl border border-gray-300 bg-white px-4 py-2.5 md:py-3 text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black focus:border-indigo-500"
            labelClassName="block text-sm font-medium text-black"
            // errorClassName="text-red-500 text-xs mt-1"
            buttonClassName="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md"
            customLayout={{
              grid: [
                ["fullName", "email"],
                ["dob", "age"],
                ["gender", "address"],
                ["classId", "nationalId"],
                ["monthlyPayment", "contact"],
                ["emergencyContact", "previousSchool"],
                ["parentId"],
                ["notes"],
              ],
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default RegStudents;
