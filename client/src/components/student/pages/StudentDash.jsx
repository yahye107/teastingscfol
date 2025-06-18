import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useNavigation } from "react-router-dom";

import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import Header from "../common/Header";
import Sidebar from "../common/sidebar";

const StudentDash = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigation = useNavigate();
  const location = useLocation();
  const [showProgress, setShowProgress] = useState(false);

  useEffect(() => {
    if (navigation.state === "loading") {
      setShowProgress(true);
    } else {
      const timer = setTimeout(() => setShowProgress(false), 300);
      return () => clearTimeout(timer);
    }
  }, [navigation.state]);

  const closeMobileSidebar = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white text-gray-900 relative">
      {/* Top Loading Progress Bar */}
      <AnimatePresence>
        {showProgress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ProgressBar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Effects - Light version */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50 opacity-80" />
        <div className="absolute inset-0 backdrop-blur-sm bg-white/30" />
      </div>

      {/* Header */}
      <div className="relative">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          isSidebarOpen={sidebarOpen}
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Sidebar */}
        <div
          className={`fixed lg:static z-40 lg:z-auto transition-all duration-300 h-screen ${
            sidebarOpen ? "left-0" : "-left-full"
          } lg:left-0`}
        >
          <Sidebar onItemClick={closeMobileSidebar} />
        </div>

        {/* Light blur overlay instead of black background */}
        <AnimatePresence>
          {sidebarOpen && window.innerWidth < 1024 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-30 backdrop-blur-sm bg-white/20 lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-white">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

// ProgressBar Component
const ProgressBar = () => (
  <div className="h-1 w-full bg-gray-100 overflow-hidden">
    <div className="h-full bg-indigo-500 animate-progress" />
  </div>
);

export default StudentDash;
