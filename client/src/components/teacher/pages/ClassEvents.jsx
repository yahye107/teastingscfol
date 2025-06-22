import React, { useEffect, useState } from "react";
import {
  callCreateClassEventApi,
  callGetAllClassesApi,
} from "@/service/service";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import CommonForm from "@/components/common/CommonForm";
import { TeacherEventFormControls } from "@/config";
import { toast } from "sonner";

const eventSchema = z.object({
  title: z.string().min(2, "Title is required"),
  message: z.string().min(5, "Message must be at least 5 characters"),
  classId: z.string().min(1, "Class is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
});

const ClassEvents = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const form = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      message: "",
      classId: "",
      date: "",
      startTime: "",
      endTime: "",
    },
  });

  useEffect(() => {
    async function fetchClasses() {
      try {
        const res = await callGetAllClassesApi();
        setClasses(res.classrooms || []);
      } catch (err) {
        setError("Failed to load classes");
      }
    }
    fetchClasses();
  }, []);

  const handleSubmit = async (formData) => {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      await callCreateClassEventApi(formData);
      toast("Event created successfully!");
      form.reset();
    } catch (err) {
      setError("Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  const enhancedFormControls = TeacherEventFormControls.map((control) => {
    if (control.id === "classId") {
      return {
        ...control,
        options: classes.map((cls) => ({
          label: `Grade ${cls.grade} - ${cls.section}`,
          value: cls._id,
        })),
      };
    }
    return control;
  });

  return (
    <div className="min-h-screen p-8 flex flex-col items-center">
      <h1 className="text-xl font-extrabold text-black drop-shadow-lg mb-10 md:text-3xl">
        Create a Class Event 🚀
      </h1>

      {error && (
        <p className="text-red-300 bg-red-900 bg-opacity-70 px-6 py-3 rounded-lg mb-6 border-2 border-red-500 font-semibold shadow-lg animate-shake">
          {error}
        </p>
      )}

      <div className="w-full max-w-4xl bg-white bg-opacity-90 rounded-3xl shadow-2xl p-4 md:p-12 border-4 border-pink-500 animate-fadeIn">
        <CommonForm
          formControls={enhancedFormControls}
          form={form}
          handleSubmit={form.handleSubmit(handleSubmit)}
          btnText={loading ? "Creating..." : "Create Event"}
          btnClassName="bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-8 rounded-full transition-transform transform hover:scale-110 shadow-xl"
          inputClassName="border-2 border-pink-500 focus:border-pink-700 rounded-lg p-3 placeholder-pink-400"
          labelClassName="text-pink-700 font-semibold mb-2 block"
          errorClassName="text-red-600 text-sm mt-1"
        />
      </div>
    </div>
  );
};

export default ClassEvents;
