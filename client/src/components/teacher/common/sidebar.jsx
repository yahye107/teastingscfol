import {
  BarChart2,
  LogOut,
  Settings,
  BookOpen,
  FileText,
  Calendar,
  Bus,
  ClipboardList,
  MessageSquare,
  Megaphone,
  DollarSign,
  School,
  UserCheck,
  UserPlus,
  UserCog,
  FolderOpen,
  ChevronDown,
  GraduationCap,
  User,
  Notebook,
  Clock,
  BusFront,
  Package,
  CreditCard,
  Award,
  LayoutGrid,
  Bookmark,
  AlignLeft,
} from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { href, Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useUser } from "@/useContaxt/UseContext";
import { calllogoutUserApi } from "@/service/service";

const SIDEBAR_ITEMS = [
  {
    section: "Dashboard",
    icon: LayoutGrid,
    color: "#6366f1",
    href: "/admin/dashboard",
  },
  {
    section: "Attendance",
    icon: UserCheck,
    color: "#10b981",
    href: "/teacher/dashboard/attendance",
  },
  {
    section: "Gradebook",
    icon: FileText,
    color: "#f59e0b",
    href: "/teacher/dashboard/Gradebook",
  },
  {
    section: "Assignments",
    icon: ClipboardList,
    color: "#ef4444",
    href: "",
  },
  {
    section: "Communications",
    icon: MessageSquare,
    color: "#3b82f6",
    subItems: [
      {
        name: "Messages",
        href: "/teacher/dashboard/massages",
        icon: MessageSquare,
      },
      {
        name: "Announcements",
        href: "/teacher/dashboard/ClassEvents",
        icon: Megaphone,
      },
    ],
  },
  {
    section: "Calendar",
    icon: Calendar,
    color: "#8b5cf6",
    href: "/teacher/dashboard/celender",
  },
  {
    section: "Resources",
    icon: FolderOpen,
    color: "#10b981",
    href: "/admin/resources",
  },
  {
    section: "Profile",
    icon: User,
    color: "#6366f1",
    href: "/admin/profile",
  },
];

{
  /* Logout Button */
}

const Sidebar = ({ onItemClick }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState(null);
  const { user, setUser } = useUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const response = await calllogoutUserApi();
      if (response.success) {
        setUser(null);
        navigate("/auth");
        toast.success("User logged out successfully!");
      }
    } catch (error) {
      toast.error("Logout failed. Please try again.");
    }
  };

  const handleNavigation = (href) => {
    navigate(href);
    onItemClick();
  };

  const handleMainItemClick = (item, index) => {
    if (item.href) {
      handleNavigation(item.href);
    } else if (item.subItems) {
      setActiveSection(activeSection === index ? null : index);
    }
  };

  return (
    <motion.div
      className={`relative z-10 h-full ${
        isSidebarOpen ? "w-64" : "w-20"
      } transition-all duration-300 bg-white border-r border-gray-100 shadow-lg`}
    >
      <div className="p-4 flex flex-col h-full">
        {/* Toggle Menu Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-lg hover:bg-indigo-50 mb-6 transition-colors self-start"
        >
          <AlignLeft size={22} className="text-indigo-600" />
        </button>

        {/* User Info */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="relative">
            <img
              src="/images/teacher.jpg"
              alt="Admin"
              className="w-9 h-9 rounded-full object-cover border-2 border-indigo-200 shadow-sm"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
          </div>
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 truncate"
              >
                <h3 className="font-semibold text-gray-900 truncate">
                  {user?.name || "Admin"}
                </h3>
                <p className="text-sm text-gray-500 truncate">
                  {user?.email || "admin@school.edu"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-grow space-y-1">
          {SIDEBAR_ITEMS.map((item, index) => {
            const isActive = activeSection === index;
            const hasSubItems = item.subItems;

            return (
              <div key={index}>
                <div
                  onClick={() => handleMainItemClick(item, index)}
                  className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                    hasSubItems ? "" : "hover:bg-gray-50"
                  } ${isActive ? "bg-indigo-50" : ""}`}
                >
                  <div className="flex items-center">
                    <item.icon
                      size={20}
                      className={`${hasSubItems ? "stroke-[1.5]" : ""}`}
                      style={{ color: item.color }}
                    />
                    {isSidebarOpen && (
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        {item.section}
                      </span>
                    )}
                  </div>

                  {isSidebarOpen && hasSubItems && (
                    <motion.div
                      animate={{ rotate: isActive ? 180 : 0 }}
                      className="ml-2 text-gray-400"
                    >
                      <ChevronDown size={16} />
                    </motion.div>
                  )}
                </div>

                {/* Sub Items */}
                <AnimatePresence>
                  {isSidebarOpen && hasSubItems && isActive && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="ml-9 mt-1 space-y-1"
                    >
                      {item.subItems.map((subItem, idx) => (
                        <Link
                          key={idx}
                          to={subItem.href}
                          onClick={onItemClick}
                          className="flex items-center px-3 py-2 text-sm rounded-lg transition-colors hover:bg-indigo-50 text-gray-600 hover:text-indigo-700"
                        >
                          <subItem.icon
                            size={16}
                            className="stroke-[1.5] mr-2"
                            style={{ color: item.color }}
                          />
                          {subItem.name}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>
        <div className="mb-10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-2.5 text-sm text-red-600 hover:text-white hover:bg-red-500 rounded-xl transition-all"
          >
            <LogOut size={18} />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
        {/* Logout */}
        <div
          onClick={() => {
            handleLogout();
            onItemClick();
          }}
          className="flex items-center mt-4 p-2.5 rounded-xl hover:bg-red-50 text-red-600 cursor-pointer transition-colors group"
        >
          <LogOut size={20} className="group-hover:stroke-[2.2]" />
          {isSidebarOpen && (
            <span className="ml-3 text-sm font-medium">Logout</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
