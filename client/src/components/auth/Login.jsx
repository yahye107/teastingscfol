import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { callloginUserApi } from "@/service/service";
import { motion } from "framer-motion";
import { Loader2, Lock, User } from "lucide-react";
import { useUser } from "@/useContaxt/UseContext";
import { ClipLoader } from "react-spinners";
import CommonForm from "../common/CommonForm";
import { LoginFormControls } from "@/config";
import ButtonLoader from "../common/ButtonLoadi";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const Login = () => {
  const navigate = useNavigate();
  const [loading, setIsLoading] = React.useState(false);
  const { setUser } = useUser(); // 👈 this!

  const form = useForm({
    resolver: zodResolver(loginSchema),

    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = async (data) => {
    setIsLoading(true);
    if (loading) return;
    try {
      const res = await callloginUserApi(data);

      // ✅ Set user context manually
      setUser(res.user || res); // depends on what your API returns

      // ✅ Now do the redirect
      const role = res.user?.role || res.role;
      if (role === "parent") {
        navigate("/parent/dashboard");
      } else if (role === "admin") {
        navigate("/admin/dashboard");
      } else if (role === "student") {
        navigate("/student/dashboard");
      } else if (role === "teacher") {
        navigate("/teacher/dashboard");
      } else {
        navigate("/");
      }

      toast.success("Login successful", {
        position: "top-center",
        duration: 2000,
      });
      if (status === "blocked") {
        toast("you have been clocked");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed", {
        position: "top-center",
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div>
      <CommonForm
        formControls={LoginFormControls}
        form={form}
        handleSubmit={handleSubmit}
        btnText={loading ? <ButtonLoader /> : "Login"}
        inputClassName="
  border-0 border-b-2 border-gray-700 rounded-none px-4 py-3
  focus:outline-none focus:ring-0 focus:border-b-blue-400
  md:border md:border-gray-300 md:rounded-xl md:px-4 md:px-8
  md:focus:ring-2 md:focus:ring-blue-400 md:focus:border-blue-400
"
        labelClassName="text-sm font-medium text-gray-700 mb-1"
        buttonClassName="w-full py-3 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition"
        customLayout={{
          icons: {
            email: User,
            password: Lock,
          },
        }}
        iconClassName="text-gray-400 md:text-gray-600 md:mr-6 lg:text-gray-700"
      />
    </div>
  );
};

export default Login;
