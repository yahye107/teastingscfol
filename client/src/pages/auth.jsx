// Authpage.jsx
import Login from "@/components/auth/Login";
import React from "react";
import useInputFocusScroll from "@/components/common/inputFocus";

const Authpage = () => {
  useInputFocusScroll();
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] md:min-h-screen bg-gray-100  dark:bg-gray-900 space-y-6">
      {/* <ul className="flex space-x-6 text-gray-700 dark:text-gray-300 font-medium">
        <li className="hover:text-blue-500 cursor-pointer transition-colors">
          Contact Me
        </li>
        <li className="hover:text-blue-500 cursor-pointer transition-colors">
          About
        </li>
        <li className="hover:text-blue-500 cursor-pointer transition-colors">
          Help
        </li>
      </ul> */}

      <div
        className="
        md:bg-white dark:bg-gray-800 
        rounded-3xl 
       sm:p-12
       p-8  
      shadow-2xl  
        w-11/12 sm:w-full 
        max-w-xs sm:max-w-md
        transition-all duration-500
        mx-auto
      "
      >
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">
          Login
        </h1>
        <Login />
      </div>
    </div>
  );
};

export default Authpage;
