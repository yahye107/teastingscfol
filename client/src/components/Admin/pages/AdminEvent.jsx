import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import CommonForm from "@/components/common/CommonForm";
import GlobalLoader from "@/components/common/GlobalLoader";
import { Button } from "@/components/ui/button";
import { callCreateGeneralEventApi } from "@/service/service";
import { AdminEventFormControls } from "@/config";

const eventSchema = z.object({
  title: z.string().min(2, "Title is required"),
  message: z.string().min(5, "Message must be at least 5 characters"),
  audience: z.enum(["all", "student", "teacher", "parent", "staff"]),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
});

const AdminEvent = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const form = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      message: "",
      audience: "all",
      date: "",
      startTime: "",
      endTime: "",
    },
  });

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    setLoading(true);
    try {
      await callCreateGeneralEventApi(formData);
      form.reset();
      toast.success("Event created successfully!");
    } catch (error) {
      console.error("Event creation failed:", error);
      toast.error("Failed to create event. Please try again.");
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  if (loading) return <GlobalLoader />;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 bg-white dark:bg-gray-900 shadow-xl rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
          Create New Event
        </h2>
        <Link to="/admin/dashboard/mangingEvents">
          <Button variant="outline" className="text-sm font-medium">
            Manage Events
          </Button>
        </Link>
      </div>

      <CommonForm
        formControls={AdminEventFormControls}
        form={form}
        handleSubmit={form.handleSubmit(handleSubmit)}
        btnText={isSubmitting ? "Creating..." : "Create Event"}
        buttonClassName={`w-full py-3 text-white rounded-xl transition duration-300 ${
          isSubmitting
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
        errorClassName="text-sm text-red-500 mt-1"
        labelClassName="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-1"
        inputClassName="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {isSubmitting && (
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Submitting event...
        </div>
      )}
    </div>
  );
};

export default AdminEvent;
