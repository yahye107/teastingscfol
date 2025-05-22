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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import CommonForm from "@/components/common/CommonForm";
import { TimetableFormControls } from "@/config";
import { toast } from "sonner";
import {
  PencilIcon,
  TrashIcon,
  CalendarDaysIcon,
  Table2Icon,
  SearchIcon,
  XIcon,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useNetworkApi } from "@/components/common/useNetworkApi";
import GlobalLoader from "@/components/common/GlobalLoader";
const timetableSchema = z
  .object({
    teacherId: z.string().min(1, "Teacher is required"),
    classId: z.string().min(1, "Class is required"),
    subjectId: z.string().min(1, "Subject is required"),
    hallId: z.string().min(1, "Hall is required"),
    day: z.string().min(1, "Day is required"),
    periodStart: z.string().min(1, "Start time is required"),
    periodEnd: z.string().min(1, "End time is required"),
  })
  .refine((data) => data.periodStart < data.periodEnd, {
    message: "End time must be after start time",
    path: ["periodEnd"],
  });

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
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [visibleCount, setVisibleCount] = useState(3);
  const [filters, setFilters] = useState({
    day: "",
    class: "",
    subject: "",
  });
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
  const hasLess = visibleCount > 3;

  const form = useForm({
    resolver: zodResolver(timetableSchema),
    defaultValues: {
      teacherId: "",
      classId: "",
      subjectId: "",
      hallId: "",
      day: "",
      periodStart: "",
      periodEnd: "",
    },
  });

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
          const weekly = await callGetTeacherWeeklyTimetableApi(
            selectedTeacherId
          );
          setWeeklyTimetable(weekly || []);
        } else {
          const todayRes = await callGetTeacherTodayTimetableApi(
            selectedTeacherId
          );
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
    form.reset();
  };

  const handleEdit = (entry) => {
    form.reset({
      teacherId: selectedTeacherId,
      classId: entry.class?._id,
      subjectId: entry.subject?._id,
      hallId: entry.hall?._id,
      day: entry.day,
      periodStart: entry.startTime,
      periodEnd: entry.endTime,
    });
    setEditingId(entry._id);
  };

  const confirmDelete = (id) => {
    setEntryToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!entryToDelete || !selectedTeacherId) return;

    try {
      await callDeleteTimetableApi(selectedTeacherId, entryToDelete);
      toast.success("Timetable entry deleted successfully");

      const updatedTimetable = await callGetTeacherWeeklyTimetableApi(
        selectedTeacherId
      );
      setWeeklyTimetable(updatedTimetable || []);
    } catch (err) {
      toast.error("Failed to delete timetable entry");
    } finally {
      setIsDeleteDialogOpen(false);
      setEntryToDelete(null);
    }
  };

  const handleSubmit = async (data) => {
    try {
      if (editingId) {
        const updates = {
          class: data.classId,
          subject: data.subjectId,
          hall: data.hallId,
          day: data.day,
          startTime: data.periodStart,
          endTime: data.periodEnd,
        };

        await callUpdateTimetableApi(editingId, updates);
        toast.success("Timetable updated successfully");
      }

      const updatedData =
        viewMode === "weekly"
          ? await callGetTeacherWeeklyTimetableApi(selectedTeacherId)
          : await callGetTeacherTodayTimetableApi(selectedTeacherId);

      if (viewMode === "weekly") {
        setWeeklyTimetable(updatedData || []);
      } else {
        setTodayTimetable(updatedData?.periods || []);
      }

      form.reset();
      setEditingId(null);
    } catch (err) {
      toast.error("Failed to update timetable");
    }
  };

  const enhancedFormControls = TimetableFormControls.map((control) => {
    if (control.id === "teacherId") {
      return {
        ...control,
        options: teachers.map((t) => ({
          label: t.user?.fullName,
          value: t._id,
        })),
      };
    }
    if (control.id === "classId") {
      return {
        ...control,
        options: classes.map((cls) => ({
          label: cls.name,
          value: cls._id,
        })),
      };
    }
    if (control.id === "subjectId") {
      return {
        ...control,
        options: subjects.map((subject) => ({
          label: subject.name,
          value: subject._id,
        })),
      };
    }
    if (control.id === "hallId") {
      return {
        ...control,
        options: halls.map((hall) => ({
          label: hall.hallNumber,
          value: hall._id,
        })),
      };
    }
    return control;
  });

  const FilterControls = () => (
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
        value={filters.class}
        onChange={(e) => handleFilterChange("class", e.target.value)}
        className="p-2 border rounded-lg flex-1 focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Classes</option>
        {classes.map((cls) => (
          <option key={cls._id} value={cls._id}>
            Grade {cls.name}
          </option>
        ))}
      </select>

      <select
        value={filters.subject}
        onChange={(e) => handleFilterChange("subject", e.target.value)}
        className="p-2 border rounded-lg flex-1 focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Subjects</option>
        {subjects.map((subject) => (
          <option key={subject._id} value={subject._id}>
            {subject.name}
          </option>
        ))}
      </select>
    </div>
  );
  if (isLoading) return <GlobalLoader />;
  return (
    <div className="min-h-screen bg-white text-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 space-y-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Teacher Timetable
          </h1>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="gap-2 text-black"
          >
            <ArrowLeft className="h-4 w-4 text-black" />
            Back to Teachers
          </Button>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search teachers..."
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTeachers.slice(0, visibleCount).map((teacher) => (
              <div
                key={teacher._id}
                onClick={() => handleTeacherSelect(teacher._id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedTeacherId === teacher._id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <h3 className="font-medium text-gray-900 truncate">
                  {teacher.user?.fullName}
                </h3>
                <p className="text-sm text-gray-500 truncate">
                  {teacher.subject?.name}
                </p>
              </div>
            ))}
          </div>

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

          {selectedTeacherId && <FilterControls />}
        </div>

        {selectedTeacherId ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                      Class
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-900">
                      Subject
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-900">
                      Hall
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center">
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
                          <tr key={entry._id} className="hover:bg-gray-50">
                            <td className="p-4 font-medium text-sm text-gray-900">
                              {day}
                            </td>
                            <td className="p-4">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                                {entry.startTime} - {entry.endTime}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-gray-900">
                              Grade {entry.class?.name}
                            </td>
                            <td className="p-4 text-sm text-gray-900">
                              {entry.subject?.name}
                            </td>
                            <td className="p-4 text-sm text-gray-900">
                              {entry.hall?.hallNumber}
                            </td>
                            <td className="p-4 flex gap-2">
                              <button
                                onClick={() => handleEdit(entry)}
                                className="p-2 hover:bg-gray-100 rounded"
                                aria-label="Edit entry"
                              >
                                <PencilIcon className="w-4 h-4 text-blue-500" />
                              </button>
                              <button
                                onClick={() => confirmDelete(entry._id)}
                                className="p-2 hover:bg-gray-100 rounded"
                                aria-label="Delete entry"
                              >
                                <TrashIcon className="w-4 h-4 text-red-500" />
                              </button>
                            </td>
                          </tr>
                        ))
                    )
                  ) : filteredTodayTimetable.length > 0 ? (
                    filteredTodayTimetable.map((entry) => (
                      <tr key={entry._id} className="hover:bg-gray-50">
                        <td className="p-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                            {entry.startTime} - {entry.endTime}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-900">
                          Grade {entry.class?.name}
                        </td>
                        <td className="p-4 text-sm text-gray-900">
                          {entry.subject?.name}
                        </td>
                        <td className="p-4 text-sm text-gray-900">
                          {entry.hall?.hallNumber}
                        </td>
                        <td className="p-4 flex gap-2">
                          <button
                            onClick={() => handleEdit(entry)}
                            className="p-2 hover:bg-gray-100 rounded"
                            aria-label="Edit entry"
                          >
                            <PencilIcon className="w-4 h-4 text-blue-500" />
                          </button>
                          <button
                            onClick={() => confirmDelete(entry._id)}
                            className="p-2 hover:bg-gray-100 rounded"
                            aria-label="Delete entry"
                          >
                            <TrashIcon className="w-4 h-4 text-red-500" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-gray-500">
                        No matching entries found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3 p-3">
              {(viewMode === "weekly"
                ? Object.values(filteredWeeklyTimetable).flat()
                : filteredTodayTimetable
              ).map((entry) => (
                <div
                  key={entry._id}
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
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="p-1.5 hover:bg-gray-100 rounded"
                        aria-label="Edit entry"
                      >
                        <PencilIcon className="w-4 h-4 text-blue-500" />
                      </button>
                      <button
                        onClick={() => confirmDelete(entry._id)}
                        className="p-1.5 hover:bg-gray-100 rounded"
                        aria-label="Delete entry"
                      >
                        <TrashIcon className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Class:</span>
                      {entry.class?.name}
                    </p>
                    <p>
                      <span className="font-medium">Subject:</span>{" "}
                      {entry.subject?.name}
                    </p>
                    <p>
                      <span className="font-medium">Hall:</span>{" "}
                      {entry.hall?.hallNumber}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center p-8 text-gray-500">
            Select a teacher to view timetable
          </div>
        )}

        {editingId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Edit Schedule</h3>
                <button
                  onClick={() => setEditingId(null)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                  aria-label="Close modal"
                >
                  <XIcon className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              <CommonForm
                formControls={enhancedFormControls}
                form={form}
                handleSubmit={form.handleSubmit(handleSubmit)}
                btnText="Update Schedule"
                gridLayout="grid grid-cols-1 md:grid-cols-2 gap-4"
              />
            </div>
          </div>
        )}

        {isDeleteDialogOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <TrashIcon className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold">Delete Schedule</h3>
              </div>
              <p className="text-gray-600">
                Are you sure you want to delete this schedule entry? This action
                cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors"
                >
                  Delete Entry
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherTimetable;
