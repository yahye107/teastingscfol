import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { callCreateGeneralAnouncementApi } from "@/service/service";
import CommonForm from "@/components/common/CommonForm";
import GlobalLoader from "@/components/common/GlobalLoader";
import { toast } from "sonner";
import { AdminAnouncementFormControls } from "@/config";

// Zod schema
const announcementSchema = z.object({
  title: z.string().min(2, "Title is required"),
  message: z.string().min(5, "Message must be at least 5 characters"),
  audience: z.enum(["all", "student", "teacher", "parent", "staff"]),
});

const TeacherAnouncement = () => {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const form = useForm({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: "",
      message: "",
      audience: "all",
    },
  });

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    // setLoading(true);
    try {
      await callCreateGeneralAnouncementApi(formData);
      form.reset();
      toast.success("Announcement created successfully!");
    } catch (error) {
      console.error("Announcement creation failed:", error);
      toast.error("Failed to create announcement. Please try again.");
    } finally {
      setIsSubmitting(false);
      //   setLoading(false);
    }
  };

  if (loading) return <GlobalLoader />;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
        Create Announcement
      </h2>
      <CommonForm
        formControls={AdminAnouncementFormControls}
        form={form}
        handleSubmit={form.handleSubmit(handleSubmit)}
        btnText={isSubmitting ? "Sending..." : "Send Announcement"}
        buttonClassName={`w-full py-3 text-white rounded-lg focus:outline-none ${
          isSubmitting ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
        }`}
        errorClassName="text-sm text-red-500 mt-2"
        labelClassName="block text-lg font-medium text-gray-700 mb-2"
        inputClassName="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
      />
      {isSubmitting && (
        <div className="mt-4 text-center text-gray-500">
          Sending announcement...
        </div>
      )}
    </div>
  );
};

export default TeacherAnouncement;
