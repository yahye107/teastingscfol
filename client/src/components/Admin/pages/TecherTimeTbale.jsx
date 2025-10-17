import React, { useEffect, useState } from "react";
import {
  callGetTeacherWeeklyTimetableApi,
  callGetTeacherTodayTimetableApi,
  callUpdateTimetableApi,
  callDeleteTimetableApi,
  callGetAllTeachersApi,
  callGetAllClassesApi,
  callGetAllHallsApi,
  callGetAllsubjectssApi,
} from "@/service/service";

import { toast } from "sonner";
import {
  Pencil,
  Trash,
  CalendarDays,
  Table2,
  Search,
  X,
  ArrowLeft,
  Clock,
  Users,
  BookOpen,
  Building,
  Filter,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import GlobalLoader from "@/components/common/GlobalLoader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SearchableSelect from "@/components/common/SearchableSelect";

const TeacherTimetable = () => {
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [halls, setHalls] = useState([]);
  const [weeklyTimetable, setWeeklyTimetable] = useState([]);
  const [todayTimetable, setTodayTimetable] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [viewMode, setViewMode] = useState("weekly");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [today, setToday] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [visibleCount, setVisibleCount] = useState(6);
  const [filters, setFilters] = useState({
    day: "",
    class: "",
    subject: "",
  });
  const [formData, setFormData] = useState({
    classId: "",
    subjectId: "",
    hallId: "",
    day: "",
    periodStart: "",
    periodEnd: "",
  });
  const [loading, setLoading] = useState(false);

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
  const hasMore = visibleCount < filteredTeachers.length;
  const hasLess = visibleCount > 6;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teachersRes, classesRes, subjectsRes, hallsRes] =
          await Promise.all([
            callGetAllTeachersApi(),
            callGetAllClassesApi(),
            callGetAllsubjectssApi(),
            callGetAllHallsApi(),
          ]);

        setTeachers(teachersRes.teachers || []);
        setFilteredTeachers(teachersRes.teachers || []);
        setClasses(classesRes.classrooms || []);
        setSubjects(subjectsRes.subjects || []);
        setHalls(hallsRes.halls || []);
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
      if (!selectedTeacherId) return;

      setIsLoading(true);
      try {
        if (viewMode === "weekly") {
          const weekly =
            await callGetTeacherWeeklyTimetableApi(selectedTeacherId);
          setWeeklyTimetable(weekly || []);
        } else {
          const todayRes =
            await callGetTeacherTodayTimetableApi(selectedTeacherId);
          setTodayTimetable(todayRes?.periods || []);
          setToday(todayRes?.day || "");
        }
      } catch (err) {
        toast.error("Failed to load timetable");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTimetable();
  }, [selectedTeacherId, viewMode]);

  const filterTimetable = (timetable) => {
    return timetable.filter((entry) => {
      const matchesDay = !filters.day || entry.day === filters.day;
      const matchesClass = !filters.class || entry.class?._id === filters.class;
      const matchesSubject =
        !filters.subject || entry.subject?._id === filters.subject;
      return matchesDay && matchesClass && matchesSubject;
    });
  };

  const groupTimetableByDay = (timetable) => {
    return timetable.reduce((acc, entry) => {
      if (!acc[entry.day]) {
        acc[entry.day] = [];
      }
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

  useEffect(() => {
    setFilters({ day: "", class: "", subject: "" });
  }, [viewMode]);

  const handleSearch = (value) => {
    setSearchQuery(value);
    const filtered = teachers.filter((t) =>
      t.user?.fullName?.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredTeachers(filtered);
  };

  const handleTeacherSelect = (id) => {
    setSelectedTeacherId(id);
    setEditingId(null);
    setFormData({
      classId: "",
      subjectId: "",
      hallId: "",
      day: "",
      periodStart: "",
      periodEnd: "",
    });
  };

  const handleEdit = (entry) => {
    setFormData({
      classId: entry.class?._id || "",
      subjectId: entry.subject?._id || "",
      hallId: entry.hall?._id || "",
      day: entry.day || "",
      periodStart: entry.startTime || "",
      periodEnd: entry.endTime || "",
    });
    setEditingId(entry._id);
    setIsEditDialogOpen(true);
  };

  const confirmDelete = (id) => {
    setEntryToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!entryToDelete || !selectedTeacherId) return;

    setLoading(true);
    try {
      await callDeleteTimetableApi(selectedTeacherId, entryToDelete);
      toast.success("Timetable entry deleted successfully");

      const updatedTimetable =
        await callGetTeacherWeeklyTimetableApi(selectedTeacherId);
      setWeeklyTimetable(updatedTimetable || []);
    } catch (err) {
      toast.error("Failed to delete timetable entry");
    } finally {
      setLoading(false);
      setIsDeleteDialogOpen(false);
      setEntryToDelete(null);
    }
  };

  const handleUpdate = async () => {
    if (!editingId || !selectedTeacherId) return;

    setLoading(true);
    try {
      const updates = {
        class: formData.classId,
        subject: formData.subjectId,
        hall: formData.hallId,
        day: formData.day,
        startTime: formData.periodStart,
        endTime: formData.periodEnd,
      };

      await callUpdateTimetableApi(editingId, updates);
      toast.success("Timetable updated successfully");

      const updatedData =
        await callGetTeacherWeeklyTimetableApi(selectedTeacherId);
      setWeeklyTimetable(updatedData || []);

      setIsEditDialogOpen(false);
      setEditingId(null);
      setFormData({
        classId: "",
        subjectId: "",
        hallId: "",
        day: "",
        periodStart: "",
        periodEnd: "",
      });
    } catch (err) {
      toast.error("Failed to update timetable");
    } finally {
      setLoading(false);
    }
  };

  const getSelectedTeacher = () => {
    return teachers.find((t) => t._id === selectedTeacherId);
  };
  const subjectOptions = subjects.map((s) => ({ label: s.name, value: s._id }));
  const classOptions = classes.map((c) => ({
    label: `Grade ${c.name}`,
    value: c._id,
  }));
  const hallOptions = halls.map((h) => ({
    label: `Hall ${h.hallNumber}`,
    value: h._id,
  }));
  const dayOptions = daysOfWeek.map((d) => ({ label: d, value: d }));

  const FilterControls = () => (
    <div className="bg-gray-50/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="h-4 w-4 text-gray-600" />
        <h3 className="text-sm font-medium text-gray-700">Filter Timetable</h3>
      </div>
      <div className="flex flex-col md:flex-row gap-3">
        {viewMode === "weekly" && (
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Day
            </label>
            <SearchableSelect
              options={[{ label: "All Days", value: "" }, ...dayOptions]}
              value={filters.day}
              onChange={(val) => handleFilterChange("day", val)}
              placeholder="All Days"
            />
          </div>
        )}

        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Class
          </label>
          <SearchableSelect
            options={[{ label: "All Classes", value: "" }, ...classOptions]}
            value={filters.class}
            onChange={(val) => handleFilterChange("class", val)}
            placeholder="All Classes"
          />
        </div>

        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Subject
          </label>
          <SearchableSelect
            options={[{ label: "All Subjects", value: "" }, ...subjectOptions]}
            value={filters.subject}
            onChange={(val) => handleFilterChange("subject", val)}
            placeholder="All Subjects"
          />
        </div>
      </div>
    </div>
  );

  if (isLoading) return <GlobalLoader />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 text-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Teacher Timetable
              </h1>
              <p className="text-gray-600 mt-2">
                Manage and view teacher schedules efficiently
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Teachers
            </Button>
          </div>

          {/* Search Section */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search teachers by name..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearch("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  aria-label="Clear search"
                >
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {/* Teachers Grid */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Select Teacher
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTeachers.slice(0, visibleCount).map((teacher) => (
                  <div
                    key={teacher._id}
                    onClick={() => handleTeacherSelect(teacher._id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      selectedTeacherId === teacher._id
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
                    }`}
                  >
                    <h3 className="font-semibold text-gray-900 truncate">
                      {teacher.user?.fullName}
                    </h3>
                  </div>
                ))}
              </div>

              {/* Show More/Less Buttons */}
              <div className="mt-6 flex justify-center gap-3">
                {hasMore && (
                  <Button
                    onClick={() => setVisibleCount((prev) => prev + 6)}
                    variant="outline"
                    className="gap-2"
                  >
                    Show More Teachers
                  </Button>
                )}
                {hasLess && (
                  <Button
                    onClick={() => setVisibleCount(6)}
                    variant="outline"
                    className="gap-2"
                  >
                    Show Less
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Timetable Section */}
        {selectedTeacherId && (
          <div className="space-y-6">
            {/* View Mode Tabs and Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {getSelectedTeacher()?.user?.fullName}'s Timetable
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {viewMode === "weekly"
                      ? "Weekly Schedule"
                      : "Today's Schedule"}
                  </p>
                </div>

                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                  <Button
                    onClick={() => setViewMode("daily")}
                    variant={viewMode === "daily" ? "default" : "ghost"}
                    className={`gap-2 ${
                      viewMode === "daily" ? "shadow-sm" : "text-gray-600"
                    }`}
                  >
                    <CalendarDays className="h-4 w-4" />
                    Daily View
                  </Button>
                  <Button
                    onClick={() => setViewMode("weekly")}
                    variant={viewMode === "weekly" ? "default" : "ghost"}
                    className={`gap-2 ${
                      viewMode === "weekly" ? "shadow-sm" : "text-gray-600"
                    }`}
                  >
                    <Table2 className="h-4 w-4" />
                    Weekly View
                  </Button>
                </div>
              </div>

              <FilterControls />
            </div>

            {/* Timetable Display */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-blue-50/50">
                      <tr>
                        {viewMode === "weekly" && (
                          <th className="p-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                            Day
                          </th>
                        )}
                        <th className="p-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                          Time
                        </th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                          Class
                        </th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                          Subject
                        </th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                          Hall
                        </th>
                        <th className="p-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {isLoading ? (
                        <tr>
                          <td
                            colSpan={viewMode === "weekly" ? 6 : 5}
                            className="p-8 text-center"
                          >
                            <div className="flex justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                            <p className="text-gray-500 mt-2">
                              Loading timetable...
                            </p>
                          </td>
                        </tr>
                      ) : viewMode === "weekly" ? (
                        Object.entries(filteredWeeklyTimetable).length > 0 ? (
                          Object.entries(filteredWeeklyTimetable).map(
                            ([day, entries]) =>
                              entries.map((entry, index) => (
                                <tr
                                  key={entry._id}
                                  className="hover:bg-gray-50/80 transition-colors"
                                >
                                  {index === 0 && (
                                    <td
                                      rowSpan={entries.length}
                                      className="p-4 font-semibold text-gray-900 align-top"
                                    >
                                      {day}
                                    </td>
                                  )}
                                  <td className="p-4">
                                    <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium">
                                      <Clock className="h-3 w-3" />
                                      {entry.startTime} - {entry.endTime}
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <div className="flex items-center gap-2">
                                      <Users className="h-4 w-4 text-gray-400" />
                                      <span className="font-medium text-gray-900">
                                        Grade {entry.class?.name}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <div className="flex items-center gap-2">
                                      <BookOpen className="h-4 w-4 text-gray-400" />
                                      <span className="text-gray-900">
                                        {entry.subject?.name}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <div className="flex items-center gap-2">
                                      <Building className="h-4 w-4 text-gray-400" />
                                      <span className="text-gray-900">
                                        Hall {entry.hall?.hallNumber}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <div className="flex gap-2">
                                      <Button
                                        onClick={() => handleEdit(entry)}
                                        variant="outline"
                                        size="sm"
                                        className="gap-1 hover:bg-blue-50 hover:text-blue-700"
                                      >
                                        <Pencil className="h-3 w-3" />
                                        Edit
                                      </Button>
                                      <Button
                                        onClick={() => confirmDelete(entry._id)}
                                        variant="outline"
                                        size="sm"
                                        className="gap-1 hover:bg-red-50 hover:text-red-700 text-red-600 border-red-200"
                                      >
                                        <Trash className="h-3 w-3" />
                                        Delete
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                          )
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-8 text-center">
                              <div className="text-gray-500">
                                <Table2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                <p>No timetable entries found</p>
                                <p className="text-sm">
                                  Try adjusting your filters
                                </p>
                              </div>
                            </td>
                          </tr>
                        )
                      ) : filteredTodayTimetable.length > 0 ? (
                        filteredTodayTimetable.map((entry) => (
                          <tr
                            key={entry._id}
                            className="hover:bg-gray-50/80 transition-colors"
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium">
                                <Clock className="h-3 w-3" />
                                {entry.startTime} - {entry.endTime}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-400" />
                                <span className="font-medium text-gray-900">
                                  Grade {entry.class?.name}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-900">
                                  {entry.subject?.name}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-900">
                                  Hall {entry.hall?.hallNumber}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleEdit(entry)}
                                  variant="outline"
                                  size="sm"
                                  className="gap-1 hover:bg-blue-50 hover:text-blue-700"
                                >
                                  <Pencil className="h-3 w-3" />
                                  Edit
                                </Button>
                                <Button
                                  onClick={() => confirmDelete(entry._id)}
                                  variant="outline"
                                  size="sm"
                                  className="gap-1 hover:bg-red-50 hover:text-red-700 text-red-600 border-red-200"
                                >
                                  <Trash className="h-3 w-3" />
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-8 text-center">
                            <div className="text-gray-500">
                              <CalendarDays className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                              <p>No schedule for today</p>
                              <p className="text-sm">
                                Try checking the weekly view
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4 p-4">
                {(viewMode === "weekly"
                  ? Object.values(filteredWeeklyTimetable).flat()
                  : filteredTodayTimetable
                ).map((entry) => (
                  <div
                    key={entry._id}
                    className="p-4 border border-gray-200 rounded-xl bg-white shadow-xs hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-1">
                        {viewMode === "weekly" && (
                          <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                            {entry.day}
                          </span>
                        )}
                        <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-sm">
                          <Clock className="h-3 w-3" />
                          {entry.startTime} - {entry.endTime}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          onClick={() => handleEdit(entry)}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => confirmDelete(entry._id)}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Class:</span>
                        <span>Grade {entry.class?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Subject:</span>
                        <span>{entry.subject?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Hall:</span>
                        <span>{entry.hall?.hallNumber}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* No Teacher Selected State */}
        {!selectedTeacherId && (
          <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <Table2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Teacher Selected
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Select a teacher from the list above to view and manage their
              timetable schedule.
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash className="h-5 w-5 text-red-600" />
              Delete Schedule Entry
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently remove this
              schedule entry from the teacher's timetable.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Trash className="h-4 w-4" />
              )}
              Delete Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Schedule Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-blue-600" />
              Edit Schedule Entry
            </DialogTitle>
            <DialogDescription>
              Update the schedule details for this timetable entry.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Day</label>
                <SearchableSelect
                  options={subjectOptions}
                  value={formData.subjectId}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, subjectId: val }))
                  }
                  placeholder="Select Subject"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Class
                </label>
                <SearchableSelect
                  options={classOptions}
                  value={formData.classId}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, classId: val }))
                  }
                  placeholder="Select Class"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Subject
                </label>
                <SearchableSelect
                  options={hallOptions}
                  value={formData.hallId}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, hallId: val }))
                  }
                  placeholder="Select Hall"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Hall
                </label>
                <SearchableSelect
                  options={dayOptions}
                  value={formData.day}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, day: val }))
                  }
                  placeholder="Select Day"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.periodStart}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      periodStart: e.target.value,
                    }))
                  }
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  End Time
                </label>
                <input
                  type="time"
                  value={formData.periodEnd}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      periodEnd: e.target.value,
                    }))
                  }
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={loading} className="gap-2">
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Pencil className="h-4 w-4" />
              )}
              Update Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherTimetable;
