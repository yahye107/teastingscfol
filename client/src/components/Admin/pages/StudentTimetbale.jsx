import React, { useEffect, useState } from "react";
import {
  callGetStudentWeeklyTimetableApi,
  callGetStudentTodayTimetableApi,
  callGetAllClassesApi,
} from "@/service/service";
import { toast } from "sonner";
import {
  CalendarDaysIcon,
  Table2Icon,
  SearchIcon,
  XIcon,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import GlobalLoader from "@/components/common/GlobalLoader";

const StudentTimetable = () => {
  const [classes, setClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [weeklyTimetable, setWeeklyTimetable] = useState([]);
  const [todayTimetable, setTodayTimetable] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [viewMode, setViewMode] = useState("weekly");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ day: "", subject: "" });
  const [visibleCount, setVisibleCount] = useState(3);
  const navigate = useNavigate();
  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const hasMore = visibleCount < filteredClasses.length;
  const hasLess = visibleCount > 3;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const classesRes = await callGetAllClassesApi();
        setClasses(classesRes.classrooms || []);
        setFilteredClasses(classesRes.classrooms || []);
        setIsLoading(false);
      } catch (err) {
        toast.error("Failed to load data");
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchTimetable = async () => {
      if (!selectedClassId) return;

      setIsLoading(true);
      try {
        if (viewMode === "weekly") {
          const weekly = await callGetStudentWeeklyTimetableApi(
            selectedClassId
          );
          setWeeklyTimetable(weekly || []);
        } else {
          const todayRes = await callGetStudentTodayTimetableApi(
            selectedClassId
          );
          setTodayTimetable(todayRes?.periods || []);
        }
      } catch (err) {
        toast.error("Failed to load timetable");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTimetable();
  }, [selectedClassId, viewMode]);

  const handleSearch = (value) => {
    setSearchQuery(value);
    const filtered = classes.filter((cls) =>
      cls.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredClasses(filtered);
  };

  const handleClassSelect = (id) => {
    setSelectedClassId(id);
    setFilters({ day: "", subject: "" });
  };

  const filterTimetable = (timetable) => {
    if (!Array.isArray(timetable)) return [];
    return timetable.filter((entry) => {
      const matchesDay =
        viewMode === "weekly"
          ? !filters.day || entry.day === filters.day
          : true;
      const matchesSubject =
        !filters.subject || entry.subjectName === filters.subject;
      return matchesDay && matchesSubject;
    });
  };

  const groupTimetableByDay = (timetable) => {
    return timetable.reduce((acc, entry) => {
      if (!acc[entry.day]) acc[entry.day] = [];
      acc[entry.day].push(entry);
      return acc;
    }, {});
  };

  const filteredWeeklyTimetable = groupTimetableByDay(
    filterTimetable(weeklyTimetable)
  );
  const filteredTodayTimetable = filterTimetable(todayTimetable);

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({ ...prev, [filterType]: value }));
  };
  if (isLoading) return <GlobalLoader />;
  return (
    <div className="min-h-screen bg-white text-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 space-y-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Student Timetable
          </h1>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="gap-2 text-black"
          >
            <ArrowLeft className="h-4 w-4 text-black" />
            Back to Create
          </Button>

          {/* Search and Class Selection */}
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search classes..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearch("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  aria-label="Clear search"
                >
                  <XIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                </button>
              )}
            </div>

            {/* Class Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredClasses.slice(0, visibleCount).map((cls) => (
                <div
                  key={cls._id}
                  onClick={() => handleClassSelect(cls._id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedClassId === cls._id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <h3 className="font-medium text-gray-900 truncate">
                    {cls.name}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">
                    {cls.section} • {cls.students?.length || 0} students
                  </p>
                </div>
              ))}
            </div>

            {/* Show More/Less Buttons */}
            <div className="mt-6 flex justify-center gap-4">
              {hasMore && (
                <button
                  onClick={() => setVisibleCount((prev) => prev + 4)}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
                >
                  Show More
                </button>
              )}
              {hasLess && (
                <button
                  onClick={() => setVisibleCount(3)}
                  className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 font-medium hover:bg-gray-300 transition"
                >
                  Show Less
                </button>
              )}
            </div>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="mb-6 space-y-4">
          <div className="border-b border-gray-200">
            <div className="flex space-x-4">
              <button
                onClick={() => setViewMode("daily")}
                className={`pb-2 px-1 transition-colors ${
                  viewMode === "daily"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <CalendarDaysIcon className="inline mr-2 h-5 w-5" />
                Daily View
              </button>
              <button
                onClick={() => setViewMode("weekly")}
                className={`pb-2 px-1 transition-colors ${
                  viewMode === "weekly"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Table2Icon className="inline mr-2 h-5 w-5" />
                Weekly View
              </button>
            </div>
          </div>

          {/* Filters */}
          {selectedClassId && (
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              {viewMode === "weekly" && (
                <select
                  value={filters.day}
                  onChange={(e) => handleFilterChange("day", e.target.value)}
                  className="p-2 border rounded-lg flex-1 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Days</option>
                  {daysOfWeek.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={filters.subject}
                onChange={(e) => handleFilterChange("subject", e.target.value)}
                className="p-2 border rounded-lg flex-1 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Subjects</option>
                {[
                  ...new Set(weeklyTimetable.map((item) => item.subjectName)),
                ].map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Timetable Display */}
        {selectedClassId ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block max-h-[500px] overflow-y-auto border-t border-gray-200">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {viewMode === "weekly" && (
                      <th className="p-4 text-left text-sm font-semibold text-gray-900">
                        Day
                      </th>
                    )}
                    <th className="p-4 text-left text-sm font-semibold text-gray-900">
                      Time
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-900">
                      Subject
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-900">
                      Teacher
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-900">
                      Hall
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center">
                        <div className="animate-pulse flex space-x-4">
                          <div className="flex-1 space-y-4 py-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : viewMode === "weekly" ? (
                    Object.entries(filteredWeeklyTimetable).map(
                      ([day, entries]) =>
                        entries.map((entry) => (
                          <tr
                            key={`${day}-${entry.startTime}`}
                            className="hover:bg-gray-50"
                          >
                            {viewMode === "weekly" && (
                              <td className="p-4 font-medium text-sm text-gray-900">
                                {day}
                              </td>
                            )}
                            <td className="p-4">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                                {entry.startTime} - {entry.endTime}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-gray-900">
                              {entry.subjectName}
                            </td>
                            <td className="p-4 text-sm text-gray-900">
                              {entry.teacherName}
                            </td>
                            <td className="p-4 text-sm text-gray-900">
                              {entry.hallNumber}
                            </td>
                          </tr>
                        ))
                    )
                  ) : filteredTodayTimetable.length > 0 ? (
                    filteredTodayTimetable.map((entry) => (
                      <tr
                        key={`${entry.day}-${entry.startTime}`}
                        className="hover:bg-gray-50"
                      >
                        <td className="p-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                            {entry.startTime} - {entry.endTime}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-900">
                          {entry.subjectName}
                        </td>
                        <td className="p-4 text-sm text-gray-900">
                          {entry.teacherName}
                        </td>
                        <td className="p-4 text-sm text-gray-900">
                          {entry.hallNumber}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-gray-500">
                        No classes found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3 p-3">
              {(viewMode === "weekly"
                ? Object.values(filteredWeeklyTimetable).flat()
                : filteredTodayTimetable
              ).map((entry) => (
                <div
                  key={`${entry.day}-${entry.startTime}`}
                  className="p-3 border rounded-lg bg-white shadow-xs"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      {viewMode === "weekly" && (
                        <span className="text-sm font-medium text-gray-900">
                          {entry.day}
                        </span>
                      )}
                      <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mt-1">
                        {entry.startTime} - {entry.endTime}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Subject:</span>{" "}
                      {entry.subjectName}
                    </p>
                    <p>
                      <span className="font-medium">Teacher:</span>{" "}
                      {entry.teacherName}
                    </p>
                    <p>
                      <span className="font-medium">Hall:</span>{" "}
                      {entry.hallNumber}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center p-8 text-gray-500">
            Select a class to view timetable
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentTimetable;
