import { Menu, X, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  callGetAllStudentsApi,
  callGetAllParentsApi,
  callGetAllTeachersApi,
} from "@/service/service";

const Header = ({ onToggleSidebar, isSidebarOpen }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const [allStudents, setAllStudents] = useState([]);
  const [allParents, setAllParents] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);

  const navigate = useNavigate();

  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await callGetAllStudentsApi();
        setAllStudents(response?.students || []);
      } catch (error) {
        console.error("Error fetching students:", error);
        setAllStudents([]);
      }
    };
    fetchStudents();
  }, []);

  // Fetch parents
  useEffect(() => {
    const fetchParents = async () => {
      try {
        const response = await callGetAllParentsApi();
        setAllParents(response?.parents || []);
      } catch (error) {
        console.error("Error fetching parents:", error);
        setAllParents([]);
      }
    };
    fetchParents();
  }, []);

  // Fetch teachers
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await callGetAllTeachersApi();
        setAllTeachers(response?.teachers || []);
      } catch (error) {
        console.error("Error fetching teachers:", error);
        setAllTeachers([]);
      }
    };
    fetchTeachers();
  }, []);

  // Handle search
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === "") {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    // Students
    const filteredStudents = allStudents
      .filter(
        (student) =>
          student?.user?.fullName
            ?.toLowerCase()
            .includes(query.toLowerCase()) ||
          student?.email?.toLowerCase().includes(query.toLowerCase()) ||
          student?.studentId?.toLowerCase().includes(query.toLowerCase())
      )
      .map((s) => ({ ...s, type: "student" }));

    // Parents
    const filteredParents = allParents
      .filter(
        (parent) =>
          parent?.user?.fullName?.toLowerCase().includes(query.toLowerCase()) ||
          parent?.user?.email?.toLowerCase().includes(query.toLowerCase()) ||
          parent?.contact?.toLowerCase().includes(query.toLowerCase())
      )
      .map((p) => ({ ...p, type: "parent" }));

    // Teachers
    const filteredTeachers = allTeachers
      .filter(
        (teacher) =>
          teacher?.user?.fullName
            ?.toLowerCase()
            .includes(query.toLowerCase()) ||
          teacher?.user?.email?.toLowerCase().includes(query.toLowerCase()) ||
          teacher?.employeeId?.toLowerCase().includes(query.toLowerCase())
      )
      .map((t) => ({ ...t, type: "teacher" }));

    setSearchResults([
      ...filteredStudents,
      ...filteredParents,
      ...filteredTeachers,
    ]);
    setShowResults(true);
  };

  // Handle select
  const handleSelect = (item) => {
    if (item.type === "student") {
      navigate(`/admin/dashboard/StudentInfobyid/${item._id}`);
    } else if (item.type === "parent") {
      navigate(`/admin/dashboard/parant/${item._id}`);
    } else if (item.type === "teacher") {
      navigate(`/admin/dashboard/teacher/${item._id}`);
    }

    setSearchQuery("");
    setShowResults(false);
    setSearchResults([]);
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Sidebar toggle */}
        <button
          className="lg:hidden p-2 text-gray-700 dark:text-gray-300"
          onClick={onToggleSidebar}
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Search */}
        <div className="flex-1 px-4 relative">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search students, parents, or teachers..."
              value={searchQuery}
              onChange={handleSearchChange}
              onClick={(e) => {
                e.stopPropagation();
                if (searchResults.length > 0) setShowResults(true);
              }}
              className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Search Results */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-4 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              {searchResults.map((item) => (
                <div
                  key={item._id}
                  className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                  onClick={() => handleSelect(item)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item?.user?.fullName || "Unknown"}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.type === "student"
                          ? item?.classId?.name || "No class"
                          : item.type === "parent"
                            ? item?.contact || "No contact"
                            : item?.user?.email || "No subject"}
                      </p>
                    </div>
                    {item.type === "student" && item.studentId && (
                      <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded">
                        {item.studentId}
                      </span>
                    )}
                    {item.type === "parent" && (
                      <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                        Parent
                      </span>
                    )}
                    {item.type === "teacher" && (
                      <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                        Teacher
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No results */}
          {showResults && searchQuery && searchResults.length === 0 && (
            <div className="absolute top-full left-4 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg z-50">
              <div className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                No results found matching "{searchQuery}"
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
