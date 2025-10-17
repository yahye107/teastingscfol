import React, { useEffect, useState } from "react";
import {
  callGetStudentWeeklyTimetableApi,
  callGetStudentTodayTimetableApi,
  callGetAllClassesApi,
  callGetAllsubjectssApi,
} from "@/service/service";
import { toast } from "sonner";
import {
  CalendarDaysIcon,
  Table2Icon,
  SearchIcon,
  XIcon,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FilterIcon,
  UsersIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import GlobalLoader from "@/components/common/GlobalLoader";
import SearchableSelect from "@/components/common/SearchableSelect";

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
  const [visibleCount, setVisibleCount] = useState(6);
  const [showFilters, setShowFilters] = useState(false);

  const [subjects, setSubjects] = useState([]);
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
  const hasLess = visibleCount > 6;

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
    const fetchSubjects = async () => {
      try {
        const res = await callGetAllsubjectssApi();
        setSubjects(res.subjects || []);
      } catch (err) {
        toast.error("Failed to load subjects");
      }
    };
    fetchSubjects();
  }, []);
  useEffect(() => {
    const fetchTimetable = async () => {
      if (!selectedClassId) return;

      setIsLoading(true);
      try {
        if (viewMode === "weekly") {
          const weekly =
            await callGetStudentWeeklyTimetableApi(selectedClassId);
          setWeeklyTimetable(weekly || []);
        } else {
          const todayRes =
            await callGetStudentTodayTimetableApi(selectedClassId);
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

  const getSelectedClassName = () => {
    const selectedClass = classes.find((cls) => cls._id === selectedClassId);
    return selectedClass ? selectedClass.name : "";
  };
  const subjectOptions = subjects.map((s) => ({
    label: s.name,
    value: s.name,
  }));

  const dayOptions = daysOfWeek.map((d) => ({ label: d, value: d }));
  if (isLoading) return <GlobalLoader />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 text-slate-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Student Timetable
              </h1>
              <p className="text-slate-600 mt-2">
                Manage and view your class schedules
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-100 w-fit"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to create
            </Button>
          </div>

          {/* Search and Stats */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="relative flex-1 max-w-2xl">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search classes by name..."
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 transition-all"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSearch("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    aria-label="Clear search"
                  >
                    <XIcon className="h-5 w-5 text-slate-400 hover:text-slate-600 transition-colors" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                  <UsersIcon className="h-4 w-4 text-blue-600" />
                  <span>{filteredClasses.length} classes</span>
                </div>
                {selectedClassId && (
                  <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium">
                      {getSelectedClassName()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Class Selection Grid */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClasses.slice(0, visibleCount).map((cls) => (
              <div
                key={cls._id}
                onClick={() => handleClassSelect(cls._id)}
                className={`group p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                  selectedClassId === cls._id
                    ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-100 scale-[1.02]"
                    : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-lg hover:scale-[1.01]"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                    {cls.name}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                    <UsersIcon className="h-3 w-3" />
                    <span>{cls.students?.length || 0}</span>
                  </div>
                </div>
                <p className="text-slate-600 text-sm mb-2">{cls.section}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>Class ID: {cls._id.slice(-6)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Show More/Less Buttons */}
          {(hasMore || hasLess) && (
            <div className="flex justify-center mt-8">
              <div className="flex gap-3">
                {hasMore && (
                  <Button
                    onClick={() => setVisibleCount((prev) => prev + 6)}
                    variant="outline"
                    className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-100"
                  >
                    <ChevronDown className="h-4 w-4" />
                    Load More Classes
                  </Button>
                )}
                {hasLess && (
                  <Button
                    onClick={() => setVisibleCount(6)}
                    variant="outline"
                    className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-100"
                  >
                    <ChevronUp className="h-4 w-4" />
                    Show Less
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Timetable Section */}
        {selectedClassId && (
          <div className="space-y-6">
            {/* View Mode and Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* View Mode Toggle */}
                  <div className="flex bg-slate-100 rounded-xl p-1">
                    <button
                      onClick={() => setViewMode("daily")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                        viewMode === "daily"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <CalendarDaysIcon className="h-4 w-4" />
                      Daily View
                    </button>
                    <button
                      onClick={() => setViewMode("weekly")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                        viewMode === "weekly"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Table2Icon className="h-4 w-4" />
                      Weekly View
                    </button>
                  </div>

                  {/* Filter Toggle */}
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-100"
                  >
                    <FilterIcon className="h-4 w-4" />
                    Filters
                    {showFilters ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Active Filters Display */}
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  {(filters.day || filters.subject) && (
                    <>
                      <span>Active filters:</span>
                      {filters.day && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                          {filters.day}
                        </span>
                      )}
                      {filters.subject && (
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                          {filters.subject}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Expandable Filters */}
              {showFilters && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {viewMode === "weekly" && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Filter by Day
                        </label>
                        <SearchableSelect
                          options={dayOptions}
                          value={filters.day}
                          onChange={(val) => handleFilterChange("day", val)}
                          placeholder="Select Day"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Filter by Subject
                      </label>
                      <SearchableSelect
                        options={[
                          { label: "All Subjects", value: "" },
                          ...subjectOptions,
                        ]}
                        value={filters.subject}
                        onChange={(val) => handleFilterChange("subject", val)}
                        placeholder="Select Subject"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Timetable Display */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Desktop Table */}
              <div className="hidden lg:block">
                <div className="max-h-[600px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-slate-50 to-blue-50/50 sticky top-0">
                      <tr>
                        {viewMode === "weekly" && (
                          <th className="p-6 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                            Day
                          </th>
                        )}
                        <th className="p-6 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                          Time
                        </th>
                        <th className="p-6 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                          Subject
                        </th>
                        <th className="p-6 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                          Teacher
                        </th>
                        <th className="p-6 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                          Location
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {isLoading ? (
                        <tr>
                          <td
                            colSpan={viewMode === "weekly" ? 5 : 4}
                            className="p-8 text-center"
                          >
                            <div className="flex justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                          </td>
                        </tr>
                      ) : viewMode === "weekly" ? (
                        Object.entries(filteredWeeklyTimetable).map(
                          ([day, entries]) =>
                            entries.map((entry, index) => (
                              <tr
                                key={`${day}-${entry.startTime}-${index}`}
                                className="hover:bg-blue-50/30 transition-colors group"
                              >
                                <td className="p-6">
                                  <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                                    {day}
                                  </span>
                                </td>
                                <td className="p-6">
                                  <div className="flex items-center gap-2">
                                    <ClockIcon className="h-4 w-4 text-blue-500" />
                                    <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                      {entry.startTime} - {entry.endTime}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-6">
                                  <span className="font-medium text-slate-900">
                                    {entry.subjectName}
                                  </span>
                                </td>
                                <td className="p-6">
                                  <div className="flex items-center gap-2">
                                    <UserIcon className="h-4 w-4 text-slate-400" />
                                    <span className="text-slate-700">
                                      {entry.teacherName}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-6">
                                  <div className="flex items-center gap-2">
                                    <MapPinIcon className="h-4 w-4 text-slate-400" />
                                    <span className="text-slate-700">
                                      Hall {entry.hallNumber}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            ))
                        )
                      ) : filteredTodayTimetable.length > 0 ? (
                        filteredTodayTimetable.map((entry, index) => (
                          <tr
                            key={`${entry.day}-${entry.startTime}-${index}`}
                            className="hover:bg-blue-50/30 transition-colors group"
                          >
                            <td className="p-6">
                              <div className="flex items-center gap-2">
                                <ClockIcon className="h-4 w-4 text-blue-500" />
                                <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                  {entry.startTime} - {entry.endTime}
                                </span>
                              </div>
                            </td>
                            <td className="p-6">
                              <span className="font-medium text-slate-900">
                                {entry.subjectName}
                              </span>
                            </td>
                            <td className="p-6">
                              <div className="flex items-center gap-2">
                                <UserIcon className="h-4 w-4 text-slate-400" />
                                <span className="text-slate-700">
                                  {entry.teacherName}
                                </span>
                              </div>
                            </td>
                            <td className="p-6">
                              <div className="flex items-center gap-2">
                                <MapPinIcon className="h-4 w-4 text-slate-400" />
                                <span className="text-slate-700">
                                  Hall {entry.hallNumber}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={viewMode === "weekly" ? 5 : 4}
                            className="p-8 text-center text-slate-500"
                          >
                            <div className="flex flex-col items-center gap-3">
                              <CalendarDaysIcon className="h-12 w-12 text-slate-300" />
                              <p className="text-lg font-medium">
                                No classes scheduled
                              </p>
                              <p className="text-sm">
                                Try adjusting your filters
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-4 p-6">
                {(viewMode === "weekly"
                  ? Object.values(filteredWeeklyTimetable).flat()
                  : filteredTodayTimetable
                ).map((entry, index) => (
                  <div
                    key={`${entry.day}-${entry.startTime}-${index}`}
                    className="p-5 border-2 border-slate-100 rounded-2xl bg-white hover:border-blue-200 transition-all shadow-xs"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-2">
                        {viewMode === "weekly" && (
                          <span className="text-lg font-semibold text-slate-900">
                            {entry.day}
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4 text-blue-500" />
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            {entry.startTime} - {entry.endTime}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="text-sm text-slate-600">Subject</p>
                          <p className="font-semibold text-slate-900">
                            {entry.subjectName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <UserIcon className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="text-sm text-slate-600">Teacher</p>
                          <p className="font-medium text-slate-900">
                            {entry.teacherName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <MapPinIcon className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="text-sm text-slate-600">Location</p>
                          <p className="font-medium text-slate-900">
                            Hall {entry.hallNumber}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!selectedClassId && filteredClasses.length > 0 && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                <Table2Icon className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                Select a Class
              </h3>
              <p className="text-slate-600 mb-6">
                Choose a class from the list above to view its timetable and
                schedule details.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentTimetable;
