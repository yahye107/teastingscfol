import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import CommonForm from "@/components/common/CommonForm";
import { ParantsFormControls } from "@/config";
import { callregisterParentssApi } from "@/service/service";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import GlobalLoader from "@/components/common/GlobalLoader";
import { BarLoader } from "react-spinners";

const parentSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  occupation: z.string().min(2),
  contact: z.string().min(6),
  address: z.string().min(5),
});

const Parants = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [loading, setLoading] = useState(true);
  const form = useForm({
    resolver: zodResolver(parentSchema),
    defaultValues: {
      fullName: "",
      email: "",
      occupation: "",
      contact: "",
      address: "",
    },
  });

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (getData) => {
    if (isSubmitting) return; // Prevent multiple submissions
    setIsSubmitting(true);
    try {
      const response = await callregisterParentssApi(getData);
      toast.success("Parent registered successfully!");
      form.reset();
    } catch (error) {
      toast.error("Failed to register parent. Please try again.");
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  if (isLoading) return <GlobalLoader />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-100 px-4 py-8 sm:py-12">
      {/* Top section: paragraph (left) and button (right) */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center md:justify-between text-center md:text-left gap-4 mb-8">
        {/* Left paragraph */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-indigo-700">
            Register as Parent
          </h2>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Fill in the form below to register a parent account.
          </p>
        </div>

        {/* Right button and label */}

        <div className="flex flex-col items-center md:items-end gap-2">
          <h2 className="text-lg font-medium text-indigo-700">
            Get Parents Info
          </h2>
          <Link to="/admin/dashboard/parantinfo">
            <Button
              variant="outline"
              className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
            >
              Fetch Parents
            </Button>
          </Link>
        </div>
      </div>

      {/* Centered Form */}
      <div className="flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md md:max-w-xl lg:max-w-3xl bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-6 md:p-8 lg:p-10 space-y-6 md:space-y-8"
        >
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-1/4 rounded-full" />
                  <Skeleton className="h-10 rounded-lg md:rounded-xl" />
                </div>
              ))}
              <Skeleton className="h-12 rounded-lg md:rounded-xl mt-4" />
            </motion.div>
          ) : (
            <CommonForm
              formControls={ParantsFormControls}
              form={form}
              handleSubmit={handleSubmit}
              btnText={isSubmitting ? "Registering..." : "Register Parent"}
              className="space-y-4 md:space-y-6"
              inputClassName="w-full rounded-lg md:rounded-xl border border-gray-300 bg-white px-4 py-2.5 md:py-3 text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black focus:border-indigo-500 transition duration-150 ease-in-out"
              labelClassName="block text-sm font-medium text-gray-700"
              errorClassName="text-red-500 text-xs mt-1"
              buttonClassName="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 md:py-3 px-4 rounded-lg md:rounded-xl shadow-md transition duration-300 ease-in-out relative"
              buttonProps={{
                disabled: isSubmitting,
                children: isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <motion.div
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    />
                    <span className="text-sm md:text-base">Registering...</span>
                  </div>
                ) : (
                  "Register Parent"
                ),
              }}
              customLayout={{
                grid: [
                  ["fullName", "email"],
                  ["occupation", "contact"],
                  ["address"],
                ],
                gridClassName: "grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6",
                fullWidthFields: ["address"],
              }}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Parants;
