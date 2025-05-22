import { useUser } from "@/useContaxt/UseContext";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, ChevronDown, Menu, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const Header = ({ title, onToggleSidebar, isSidebarOpen }) => {
  const { user } = useUser();
  const [openDropdown, setOpenDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    console.log("Logged out");
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-700 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Mobile sidebar toggle button */}
        <button
          className="lg:hidden p-2 text-gray-700 dark:text-gray-300"
          onClick={onToggleSidebar}
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Title */}
        <div className="flex justify-center place-items-center gap-1.5">
        <img
                src="/images/admin.jpg"
                alt="Avatar"
                className="w-13 h-13 rounded-full object-cover border-2 border-indigo-200 shadow-sm"
              />
           <h1>Ibnu Khatiir school</h1>
        </div>
        {/* <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight animate-pulse bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text">
            {title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {getGreeting()},{" "}
            <span className="font-medium">{user?.name || "Admin"}</span>
          </p>
        </div> */}

        {/* Right section: Notifications & Profile */}
        <div className="flex items-center gap-3">
          {/* Notification bell */}
          <div className="relative group">
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition">
              <Bell size={20} />
            </button>
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-1 text-xs text-white bg-black rounded-md opacity-0 group-hover:opacity-100 transition">
              Notifications
            </span>
          </div>

          {/* Profile dropdown */}
          <motion.div
            ref={dropdownRef}
            className="relative flex items-center gap-2 group cursor-pointer p-1.5 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            onClick={() => setOpenDropdown((prev) => !prev)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative">
              <img
                src="/images/admin.jpg"
                alt="Avatar"
                className="w-9 h-9 rounded-full object-cover border-2 border-indigo-200 shadow-sm"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
            </div>

            <div className="hidden sm:block text-left max-w-[160px] truncate">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.name || "Admin"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email || "admin@school.edu"}
              </p>
            </div>

            <motion.div
              animate={{ rotate: openDropdown ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={18} className="text-gray-400" />
            </motion.div>

            {/* Dropdown menu */}
            <AnimatePresence>
              {openDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute top-full right-0 mt-2 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 z-50"
                >
                  <button
                    onClick={() => {
                      setOpenDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      setOpenDropdown(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100 dark:hover:bg-red-600/10"
                  >
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </header>
  );
};

export default Header;
