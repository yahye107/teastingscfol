import React, { useState, useEffect } from "react";
import {
  callGetAllsubjectssApi,
  callGetAllTeachersApi,
  callAssignSubjectsToTeacherApi,
} from "@/service/service";
import {
  Users,
  BookOpen,
  Check,
  Plus,
  X,
  Loader2,
  Search,
  ArrowLeft,
} from "lucide-react";
import SearchableSelect from "@/components/common/SearchableSelect";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import GlobalLoader from "@/components/common/GlobalLoader";
const AssignSubjectsToTeacher = () => {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const navigate = useNavigate();

  // Fetch teachers and subjects on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setPageLoading(true);
        const [teachersRes, subjectsRes] = await Promise.all([
          callGetAllTeachersApi(),
          callGetAllsubjectssApi(),
        ]);

        // console.log("Teachers response:", teachersRes);
        // console.log("Subjects response:", subjectsRes);

        // Fix: Use the correct response structure
        setTeachers(teachersRes?.data?.teachers || teachersRes?.teachers || []);
        setSubjects(subjectsRes?.data?.subjects || subjectsRes?.subjects || []);
        setFilteredSubjects(
          subjectsRes?.data?.subjects || subjectsRes?.subjects || []
        );
      } catch (error) {
        console.error("Error fetching data:", error);
        setMessage({
          type: "error",
          text: "Failed to load data. Please try again.",
        });
      } finally {
        setPageLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter subjects based on search
  useEffect(() => {
    if (searchTerm) {
      const filtered = subjects.filter(
        (subject) =>
          subject.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          subject.code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSubjects(filtered);
    } else {
      setFilteredSubjects(subjects);
    }
  }, [searchTerm, subjects]);

  const handleSubjectToggle = (subjectId) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleAssignSubjects = async () => {
    if (!selectedTeacher) {
      setMessage({ type: "error", text: "Please select a teacher." });
      return;
    }

    if (selectedSubjects.length === 0) {
      setMessage({
        type: "error",
        text: "Please select at least one subject.",
      });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      //   console.log("Sending assignment:", {
      //     teacherId: selectedTeacher,
      //     subjectIds: selectedSubjects,
      //   });

      // Fix: Pass data as object
      const response = await callAssignSubjectsToTeacherApi({
        teacherId: selectedTeacher,
        subjectIds: selectedSubjects,
      });

      //   console.log("Assignment response:", response);

      if (response.status === 200) {
        setMessage({
          type: "success",
          text: `Successfully assigned ${response.data.assignedCount} subjects to teacher!`,
        });

        // Reset form
        setSelectedSubjects([]);
        setSearchTerm("");

        // Update teacher list with new subject assignments
        const updatedTeachers = teachers.map((teacher) =>
          teacher._id === selectedTeacher ? response.data.teacher : teacher
        );
        setTeachers(updatedTeachers);
      }
    } catch (error) {
      console.error("Assignment error:", error);

      // More detailed error handling
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to assign subjects. Please try again.";

      setMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const getSelectedTeacherName = () => {
    const teacher = teachers.find((t) => t._id === selectedTeacher);
    return teacher?.user?.fullName || teacher?.fullName || "Unknown Teacher";
  };

  const getSelectedSubjectsCount = () => {
    const teacher = teachers.find((t) => t._id === selectedTeacher);
    return teacher?.subjects?.length || 0;
  };

  const getAlreadyAssignedSubjects = () => {
    if (!selectedTeacher) return [];
    const teacher = teachers.find((t) => t._id === selectedTeacher);
    return (
      teacher?.subjects?.map((subject) =>
        typeof subject === "object" ? subject._id : subject
      ) || []
    );
  };

  const isSubjectAlreadyAssigned = (subjectId) => {
    const assignedSubjects = getAlreadyAssignedSubjects();
    return assignedSubjects.includes(subjectId);
  };

  if (pageLoading) {
    return (
      //   <div className="min-h-screen flex items-center justify-center bg-gray-50">
      //     <div className="text-center">
      //       <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
      //       <p className="text-gray-600">Loading assignment panel...</p>
      //     </div>
      //   </div>
      <GlobalLoader />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          {/* Back Button */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              onClick={() => navigate(-1)} // ← works with react-router
              className="flex items-center gap-2 border-gray-300 hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>

          {/* Header Section */}
          <div className="flex flex-col items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-purple-800 bg-clip-text text-transparent">
                Assign Subjects to Teacher
              </h1>
              <p className="text-gray-600 mt-2">
                Manage subject assignments and teaching responsibilities
              </p>
            </div>
          </div>
        </div>

        {/* Debug Info - Remove in production */}
        {process.env.NODE_ENV === "development" && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-sm text-yellow-800">
              <strong>Debug Info:</strong> Teachers: {teachers.length} |
              Subjects: {subjects.length} | Selected: {selectedSubjects.length}
            </p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Teacher Selection */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">
                Select Teacher
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose Teacher
                </label>
                {/* <select
                  value={selectedTeacher}
                  onChange={(e) => {
                    setSelectedTeacher(e.target.value);
                    setSelectedSubjects([]); // Clear selection when teacher changes
                    setMessage({ type: "", text: "" });
                  }}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">Select a teacher...</option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.user?.fullName || teacher.fullName}
                      {teacher.subjects?.length > 0 &&
                        ` (${teacher.subjects.length} subjects)`}
                    </option>
                  ))}
                </select> */}
                <SearchableSelect
                  options={teachers.map((teacher) => ({
                    label: `${teacher.user?.fullName || teacher.fullName}${
                      teacher.subjects?.length
                        ? ` (${teacher.subjects.length} subjects)`
                        : ""
                    }`,
                    value: teacher._id,
                  }))}
                  value={selectedTeacher}
                  onChange={(value) => {
                    setSelectedTeacher(value);
                    setSelectedSubjects([]); // clear selected subjects when teacher changes
                    setMessage({ type: "", text: "" }); // reset any success/error messages
                  }}
                  placeholder="Select a teacher..."
                />
              </div>

              {selectedTeacher && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Current Assignment
                  </h3>
                  <p className="text-blue-700">
                    <strong>{getSelectedTeacherName()}</strong> is currently
                    teaching <strong>{getSelectedSubjectsCount()}</strong>{" "}
                    subject
                    {getSelectedSubjectsCount() !== 1 ? "s" : ""}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Subject Selection */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-800">
                Select Subjects
                {selectedSubjects.length > 0 && (
                  <span className="ml-2 text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    {selectedSubjects.length} selected
                  </span>
                )}
              </h2>
            </div>

            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search subjects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                />
              </div>
            </div>

            {/* Subjects List */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredSubjects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No subjects found matching your search.
                </div>
              ) : (
                filteredSubjects.map((subject) => {
                  const isAssigned = isSubjectAlreadyAssigned(subject._id);
                  const isSelected = selectedSubjects.includes(subject._id);

                  return (
                    <div
                      key={subject._id}
                      onClick={() =>
                        !isAssigned && handleSubjectToggle(subject._id)
                      }
                      className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? "border-green-500 bg-green-50 shadow-md"
                          : isAssigned
                            ? "border-gray-300 bg-gray-100 cursor-not-allowed"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full border-2 ${
                              isSelected
                                ? "bg-green-500 border-green-500"
                                : isAssigned
                                  ? "bg-gray-400 border-gray-400"
                                  : "border-gray-400"
                            }`}
                          />
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {subject.name}
                              {isAssigned && (
                                <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                                  Already assigned
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Code: {subject.code} • {subject.description}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              {selectedTeacher && selectedSubjects.length > 0 && (
                <p className="text-gray-700">
                  Ready to assign <strong>{selectedSubjects.length}</strong>{" "}
                  subject
                  {selectedSubjects.length !== 1 ? "s" : ""} to{" "}
                  <strong>{getSelectedTeacherName()}</strong>
                </p>
              )}
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={() => {
                  setSelectedTeacher("");
                  setSelectedSubjects([]);
                  setSearchTerm("");
                  setMessage({ type: "", text: "" });
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all w-full sm:w-auto"
              >
                <X className="w-4 h-4 inline mr-2" />
                Clear
              </button>

              <button
                onClick={handleAssignSubjects}
                disabled={
                  loading || !selectedTeacher || selectedSubjects.length === 0
                }
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 inline mr-2" />
                    Assign Subjects
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Message Display */}
          {message.text && (
            <div
              className={`mt-4 p-4 rounded-xl border ${
                message.type === "error"
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-green-50 border-green-200 text-green-700"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {/* <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {teachers.length}
                </p>
                <p className="text-gray-600">Total Teachers</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {subjects.length}
                </p>
                <p className="text-gray-600">Available Subjects</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <Check className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {teachers.reduce(
                    (acc, teacher) => acc + (teacher.subjects?.length || 0),
                    0
                  )}
                </p>
                <p className="text-gray-600">Total Assignments</p>
              </div>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default AssignSubjectsToTeacher;
