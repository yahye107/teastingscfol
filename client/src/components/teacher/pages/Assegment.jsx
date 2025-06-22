import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  callGetAllClassroomsApi,
  callGetAllsubjectssApi,
  callCreateAssignmentApi,
  callGetTeacherAssignmentsApi,
} from "@/service/service";
import CommonForm from "@/components/common/CommonForm";
import { TeacherAssignmentFormControls } from "@/config";
import { useUser } from "@/useContaxt/UseContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import GlobalLoader from "@/components/common/GlobalLoader";
import {
  SearchIcon,
  CalendarIcon,
  XIcon,
  FileTextIcon,
  BookOpenIcon,
  UsersIcon,
  BookmarkIcon,
} from "lucide-react";

const assignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  link: z.string().url("Enter a valid URL"),
  classroomId: z.string().min(1, "Select a class"),
  subjectId: z.string().min(1, "Select a subject"),
});

const Assignments = () => {
  const { user } = useUser();
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTitle, setSearchTitle] = useState("");
  const [searchGrade, setSearchGrade] = useState("");
  const [searchSubject, setSearchSubject] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: "",
      description: "",
      link: "",
      classroomId: "",
      subjectId: "",
    },
  });

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        const [classesRes, subjectsRes, assignmentsRes] = await Promise.all([
          callGetAllClassroomsApi(),
          callGetAllsubjectssApi(),
          callGetTeacherAssignmentsApi(user._id),
        ]);

        setClasses(classesRes?.classrooms || []);
        setSubjects(subjectsRes?.subjects || []);
        setAssignments(assignmentsRes?.data?.assignments || []);
      } catch (error) {
        toast.error("Error loading data");
      } finally {
        setIsLoading(false);
      }
    };

    if (user?._id) fetchAllData();
  }, [user]);

  const handleCreateAssignment = async (data) => {
    if (isSubmitting) return; // prevent double submission
    setIsSubmitting(true);
    try {
      await callCreateAssignmentApi(user._id, data);
      toast.success("Assignment created!");
      form.reset();
      setIsFormOpen(false);

      const response = await callGetTeacherAssignmentsApi(user._id);
      setAssignments(response.data?.assignments || []);
    } catch (err) {
      toast.error("Failed to create assignment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const enhancedFormControls = TeacherAssignmentFormControls.map((control) => {
    if (control.id === "classroomId") {
      return {
        ...control,
        options: classes.map((cls) => ({
          label: `Grade ${cls.grade} - ${cls.section}`,
          value: cls._id,
        })),
      };
    }
    if (control.id === "subjectId") {
      return {
        ...control,
        options: subjects.map((subj) => ({
          label: subj.name,
          value: subj._id,
        })),
      };
    }
    return control;
  });

  const filteredAssignments = assignments.filter((assignment) => {
    const titleMatch = assignment.title
      .toLowerCase()
      .includes(searchTitle.toLowerCase());

    const gradeMatch =
      `${assignment.classroom?.grade} ${assignment.classroom?.section}`
        .toLowerCase()
        .includes(searchGrade.toLowerCase());

    const subjectMatch = assignment.subject?.name
      .toLowerCase()
      .includes(searchSubject.toLowerCase());

    const dateMatch = searchDate
      ? new Date(assignment.createdAt).toLocaleDateString("en-CA") ===
        searchDate
      : true;

    return titleMatch && gradeMatch && subjectMatch && dateMatch;
  });

  if (isLoading) return <GlobalLoader />;

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600 mt-2">
            Create and manage your classroom assignments
          </p>
        </div>

        <Button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="bg-indigo-600 hover:bg-indigo-700 flex gap-2"
        >
          {isFormOpen ? (
            <>
              <XIcon size={18} /> Close Form
            </>
          ) : (
            <>
              <FileTextIcon size={18} /> New Assignment
            </>
          )}
        </Button>
      </div>

      {/* Assignment Creation - Slide Down Form */}
      {isFormOpen && (
        <section className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 animate-fadeIn">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BookOpenIcon size={20} /> Create New Assignment
          </h2>
          <CommonForm
            formControls={enhancedFormControls}
            form={form}
            handleSubmit={handleCreateAssignment}
            btnText={isSubmitting ? "Creating..." : "Create Assignment"}
            isSubmitting={isSubmitting}
          />
        </section>
      )}

      {/* Search Section */}
      <section className="bg-white p-5 rounded-2xl shadow-sm border">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <SearchIcon size={20} /> Search Assignments
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by title..."
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Grade/Class Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UsersIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by grade or section..."
                value={searchGrade}
                onChange={(e) => setSearchGrade(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Subject Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BookOpenIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by subject..."
                value={searchSubject}
                onChange={(e) => setSearchSubject(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTitle("");
                setSearchDate("");
              }}
              disabled={!searchTitle && !searchDate}
            >
              <XIcon size={18} />
            </Button>
          </div>
        </div>
      </section>

      {/* Assignments Display */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <BookmarkIcon size={20} /> Your Assignments
            <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {filteredAssignments.length}
            </span>
          </h2>
        </div>

        {filteredAssignments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssignments.map((assignment) => (
              <div
                key={assignment._id}
                className="group relative p-5 rounded-2xl shadow-sm bg-white border border-gray-200 hover:border-indigo-300 transition-all duration-300 hover:shadow-md overflow-hidden"
              >
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-medium px-3 py-1 rounded-bl-lg">
                  {assignment.subject?.name}
                </div>

                <div className="mb-2 text-sm text-gray-500 flex items-center">
                  <CalendarIcon size={14} className="mr-1" />
                  {new Date(assignment.createdAt).toLocaleString("en-GB", {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                  })}
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                  {assignment.title}
                </h3>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {assignment.description}
                </p>

                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <UsersIcon size={14} className="mr-1" />
                  <span>
                    Grade {assignment.classroom?.grade} -{" "}
                    {assignment.classroom?.section}
                  </span>
                </div>

                <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                  <a
                    href={assignment.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:underline flex items-center"
                  >
                    <FileTextIcon size={16} className="mr-1" />
                    View Resource
                  </a>

                  <Link
                    to={`/teacher/dashboard/assignment-details/${assignment._id}`}
                  >
                    <Button variant="outline" size="sm">
                      Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-2xl shadow-inner border border-dashed border-gray-200">
            <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <BookOpenIcon className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-medium text-gray-700 mb-2">
              {searchTitle || searchDate
                ? "No matching assignments"
                : "No assignments yet"}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {searchTitle || searchDate
                ? "Try adjusting your search filters"
                : "Create your first assignment using the 'New Assignment' button"}
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Assignments;
