import {
  BarChart2,
  LogOut,
  Settings,
  Users,
  BookOpen,
  FileText,
  Bus,
  ClipboardList,
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
  AlignLeft,
  CreditCard,
  Award,
  LayoutGrid,
  Bookmark,
  ListChecks,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
// import { useUser } from "@/useCOntext/UseCOntext";
import React from "react";
import useMediaQuery from "@/components/common/useMediaQuery";

const NAV_ITEMS = [
  {
    section: "Dashboard",
    icon: LayoutGrid,
    color: "#6366f1",
    href: "/admin/dashboard",
  },
  {
    section: "User Management",
    icon: Users,
    color: "#10b981",
    subItems: [
      {
        name: "Students",
        href: "studentRegister",
        icon: GraduationCap,
      },
      { name: "Parents", href: "Parantsregister", icon: UserPlus },
      { name: "Teachers", href: "Tescher", icon: UserCheck },
      { name: "Staff", href: "/admindash/users/staff", icon: UserCog },
      { name: "Users", href: "usersinfo", icon: User },
    ],
  },
  {
    section: "School Structure",
    icon: Bookmark,
    color: "#8b5cf6",
    subItems: [
      { name: "Classes", href: "class", icon: Notebook },
      { name: "Subjects", href: "subjects", icon: BookOpen },
      { name: "Halls", href: "Halls", icon: BookOpen },
      { name: "Timetable", href: "timeTable", icon: Clock },
    ],
  },
  {
    section: "Exams",
    icon: ClipboardList,
    color: "#2563eb",
    subItems: [
      { name: "ExamTbale", href: "ExamTbale", icon: Clock },
      { name: "Hall Assignments", href: "exam-halls", icon: ListChecks },

      {
        name: "Student Hall Info",
        href: "StudentHallInfo",
        icon: GraduationCap,
      },
    ],
  },
  {
    section: "School Anouncement",
    icon: School,
    color: "#8b5cf6",
    subItems: [
      { name: "Events", href: "AdminEvents", icon: Settings },
      { name: "Anouncement", href: "AdminAnouncement", icon: Settings },
      { name: "Manage Marks", href: "Track", icon: FileText },
      // { name: "View Marks", href: "MarkHistroy", icon: FileText },
      {
        name: "Reports",
        icon: ClipboardList,
        color: "#3b82f6",
        href: "/admindash/reports",
      },

      { name: "Teacher Attendence", href: "Tatendence", icon: GraduationCap },
      { name: "Attendence Histroy", href: "Histroyattendence", icon: Clock },
    ],
  },
  {
    section: "Finance",
    icon: CreditCard,
    color: "#f59e0b",
    subItems: [
      {
        name: "Fee Records",
        href: "FeeRecords",
        icon: FileText,
      },
      {
        name: "Records",
        href: "Recordes",
        icon: Award,
      },
    ],
  },

  {
    section: "Logistics",
    icon: Package,
    color: "#ef4444",
    subItems: [
      {
        name: "Transportation",
        href: "/admindash/logistics/transport",
        icon: BusFront,
      },
      {
        name: "Inventory",
        href: "/admindash/logistics/inventory",
        icon: FolderOpen,
      },
    ],
  },
];

const ManegarHeader = () => {
  const [activeMenu, setActiveMenu] = useState(null);
  //   const { user, setUser } = useUser();
  const navigate = useNavigate();
  const navRef = useRef(null);
  const isDesktop = useMediaQuery("(max-width: 1160px)");
  const handleLogout = async () => {
    // try {
    //   const response = await calllogoutUserApi();
    //   if (response.success) {
    //     setUser(null);
    //     navigate("/auth");
    //     toast.success("User logged out successfully!");
    //   }
    // } catch (error) {
    //   toast.error("Logout failed. Please try again.");
    // }
  };
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const toggleMenu = (index) => {
    setActiveMenu(activeMenu === index ? null : index);
  };

  return (
    <header className="w-full bg-white h-17 flex items-center justify-center shadow-md border-b border-gray-100">
      <div className="flex items-center justify-center px-6 py-3">
        {/* Logo */}
        {/* <div className="flex items-center gap-2">
          <LayoutDashboard className="text-indigo-600" size={24} />
          <span className="font-semibold text-gray-800">Manager Panel</span>
        </div> */}

        {/* Navigation */}
        <nav ref={navRef} className="flex items-center gap-6 relative w-full">
          {NAV_ITEMS.map((item, index) => {
            const hasSubItems = item.subItems;
            const isActive = activeMenu === index;

            return (
              <div key={index} className="relative">
                <button
                  onClick={() =>
                    hasSubItems ? toggleMenu(index) : navigate(item.href)
                  }
                  className="flex items-center gap-1 text-md font-medium  text-gray-700 hover:text-indigo-600"
                >
                  <item.icon size={18} style={{ color: item.color }} />
                  {item.section}
                  {hasSubItems && <ChevronDown size={16} />}
                </button>

                {/* Dropdown */}
                <AnimatePresence>
                  {hasSubItems && isActive && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`absolute top-10 left-0 bg-white shadow-lg rounded-lg border p-2 z-50 
        ${item.section === "Logistics" ? (isDesktop ? "w-32" : "w-48") : "w-48"}`}
                    >
                      {item.subItems.map((sub, idx) => (
                        <Link
                          key={idx}
                          to={sub.href}
                          onClick={() => setActiveMenu(null)}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-md text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          <sub.icon size={16} style={{ color: item.color }} />
                          {sub.name}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* User Info + Logout */}
        <div className="flex items-center gap-4">
          {/* <div className="flex items-center gap-2">
            <img
              src="/images/admin.jpg"
              alt="Admin"
              className="w-8 h-8 rounded-full border"
            />
            <div className="text-sm">
              <p className="font-medium text-gray-800">
                {user?.name || "Manager"}
              </p>
              <p className="text-xs text-gray-500">
                {user?.email || "admin@school.edu"}
              </p>
            </div>
          </div> */}
          {/* <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-100 rounded-lg"
          >
            <LogOut size={16} />
            Logout
          </button> */}
        </div>
      </div>
    </header>
  );
};

export default ManegarHeader;
