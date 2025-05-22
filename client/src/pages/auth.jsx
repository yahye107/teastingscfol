// Authpage.jsx
import Login from "@/components/auth/Login";
import React from "react";
import { motion } from "framer-motion";
import { Outlet } from "react-router-dom";

const Authpage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-4xl bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl shadow-indigo-100 overflow-hidden grid grid-cols-1 md:grid-cols-2 border border-white/20"
      >
        <div className="hidden md:block bg-gradient-to-br from-indigo-600 to-blue-500 p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/subtle-prism.svg')]" />
          <div className="h-full flex flex-col justify-center text-white relative space-y-6">
            <motion.h2
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              className="text-5xl font-bold tracking-tight"
            >
              Welcome Back
            </motion.h2>
            <p className="text-lg opacity-90 leading-relaxed">
              Streamline your educational journey with our integrated platform.
            </p>
          </div>
        </div>
        <div className="p-8 md:p-12">
          <Login />
        </div>
      </motion.div>
    </div>
  );
};

export default Authpage;
