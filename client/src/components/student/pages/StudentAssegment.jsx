import React, { useState, useEffect, useMemo } from "react";
import {
  callGetStudentAssignments,
  callMarkAssignmentViewed,
  callMarkAssignmentCompleted,
} from "@/service/service";
import { ClipLoader } from "react-spinners";
import { format, isBefore, isAfter, differenceInMinutes } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useUser } from "@/useContaxt/UseContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import GlobalLoader from "@/components/common/GlobalLoader";

const StudentAssignments = () => {
  const { user } = useUser();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState({});
  const [submissionText, setSubmissionText] = useState({});
  const [assignmentStatuses, setAssignmentStatuses] = useState({});
  const [viewedTimestamps, setViewedTimestamps] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [teacherFilter, setTeacherFilter] = useState("All");

  // Initialize from localStorage
  useEffect(() => {
    const savedViewTimestamps = localStorage.getItem("viewedTimestamps");
    if (savedViewTimestamps) {
      setViewedTimestamps(JSON.parse(savedViewTimestamps));
    }
  }, []);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        const response = await callGetStudentAssignments();

        if (response?.success && response.assignments) {
          setAssignments(response.assignments);

          // Initialize assignment statuses
          const initialStatuses = {};
          response.assignments.forEach((asg) => {
            initialStatuses[asg._id] = asg.status || "Not Viewed";
          });
          setAssignmentStatuses(initialStatuses);
        } else {
          throw new Error("Unexpected response format");
        }
      } catch (err) {
        console.error("Failed to fetch assignments:", err);
        setError("Failed to load assignments. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  // Filter assignments based on search and filters
  const filteredAssignments = useMemo(() => {
    return assignments.filter((asg) => {
      const assignment = asg.assignment;
      if (!assignment) return false;

      // Status filter
      if (statusFilter !== "All") {
        if (statusFilter === "Overdue") {
          const dueDate = assignment.dueDate
            ? new Date(assignment.dueDate)
            : null;
          if (
            !dueDate ||
            !isAfter(new Date(), dueDate) ||
            asg.status === "Completed"
          ) {
            return false;
          }
        } else if (asg.status !== statusFilter) {
          return false;
        }
      }

      // Subject filter
      if (
        subjectFilter !== "All" &&
        assignment.subject?.name !== subjectFilter
      ) {
        return false;
      }

      // Teacher filter
      if (
        teacherFilter !== "All" &&
        assignment.teacher?.fullName !== teacherFilter
      ) {
        return false;
      }

      // Search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSubject = assignment.subject?.name
          ?.toLowerCase()
          .includes(searchLower);
        const matchesTeacher = assignment.teacher?.fullName
          ?.toLowerCase()
          .includes(searchLower);
        const matchesTitle = assignment.title
          .toLowerCase()
          .includes(searchLower);
        const matchesDescription = assignment.description
          .toLowerCase()
          .includes(searchLower);

        if (
          !(
            matchesSubject ||
            matchesTeacher ||
            matchesTitle ||
            matchesDescription
          )
        ) {
          return false;
        }
      }

      return true;
    });
  }, [assignments, statusFilter, subjectFilter, teacherFilter, searchTerm]);

  // Get unique values for filters
  const uniqueSubjects = useMemo(() => {
    const subjects = new Set();
    assignments.forEach((asg) => {
      if (asg.assignment?.subject?.name) {
        subjects.add(asg.assignment.subject.name);
      }
    });
    return Array.from(subjects);
  }, [assignments]);

  const uniqueTeachers = useMemo(() => {
    const teachers = new Set();
    assignments.forEach((asg) => {
      if (asg.assignment?.teacher?.fullName) {
        teachers.add(asg.assignment.teacher.fullName);
      }
    });
    return Array.from(teachers);
  }, [assignments]);

  const handleSubmissionChange = (assignmentId, text) => {
    setSubmissionText((prev) => ({ ...prev, [assignmentId]: text }));
  };

  const handleStatusChange = async (assignmentId, newStatus) => {
    try {
      const assignmentStatus = assignments.find(
        (asg) => asg._id === assignmentId
      );
      const currentStatus = assignmentStatus.status;

      // Prevent changing to Completed without viewing
      if (newStatus === "Completed" && currentStatus !== "Viewed") {
        toast.warning(
          "You must view the assignment before marking as complete"
        );
        return;
      }

      // Prevent marking as completed too quickly after viewing
      if (newStatus === "Completed" && viewedTimestamps[assignmentId]) {
        const minutesSinceView = differenceInMinutes(
          new Date(),
          new Date(viewedTimestamps[assignmentId])
        );

        if (minutesSinceView < 5) {
          toast.warning(
            "Please spend sufficient time on the assignment before marking as complete"
          );
          return;
        }
      }

      // Update status locally immediately for UI responsiveness
      setAssignmentStatuses((prev) => ({ ...prev, [assignmentId]: newStatus }));

      // Handle Viewed status
      if (newStatus === "Viewed") {
        await callMarkAssignmentViewed({
          studentId: user.studentProfile._id,
          assignmentId: assignmentStatus.assignment._id,
        });

        // Update local state
        setAssignments((prev) =>
          prev.map((item) =>
            item._id === assignmentId ? { ...item, status: "Viewed" } : item
          )
        );

        // Record the view timestamp
        const newTimestamps = {
          ...viewedTimestamps,
          [assignmentId]: new Date().toISOString(),
        };
        setViewedTimestamps(newTimestamps);
        localStorage.setItem("viewedTimestamps", JSON.stringify(newTimestamps));
      }
      // Handle Completed status
      else if (newStatus === "Completed") {
        setSubmitting((prev) => ({ ...prev, [assignmentId]: true }));

        await callMarkAssignmentCompleted({
          studentId: user.studentProfile._id,
          assignmentId: assignmentStatus.assignment._id,
          submission: submissionText[assignmentId] || "Submitted",
        });

        // Update local state
        setAssignments((prev) =>
          prev.map((item) =>
            item._id === assignmentId
              ? {
                  ...item,
                  status: "Completed",
                  submission: submissionText[assignmentId] || "Submitted",
                  submittedAt: new Date().toISOString(),
                }
              : item
          )
        );

        // Clear submission text
        setSubmissionText((prev) => {
          const newState = { ...prev };
          delete newState[assignmentId];
          return newState;
        });

        toast.success("Assignment submitted successfully!");
      }
    } catch (err) {
      console.error("Status change failed:", err);
      toast.error("Failed to update assignment status");

      // Revert status on error
      setAssignmentStatuses((prev) => ({
        ...prev,
        [assignmentId]: assignments.find((asg) => asg._id === assignmentId)
          .status,
      }));
    } finally {
      setSubmitting((prev) => ({ ...prev, [assignmentId]: false }));
    }
  };

  const getStatusColor = (status, dueDate) => {
    const now = new Date();

    if (status === "Completed") {
      return "bg-green-100 text-green-800";
    }

    if (dueDate && isAfter(now, new Date(dueDate))) {
      return "bg-red-100 text-red-800";
    }

    switch (status) {
      case "Viewed":
        return "bg-blue-100 text-blue-800";
      case "Late":
        return "bg-yellow-100 text-yellow-800";
      case "Overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status, dueDate) => {
    const now = new Date();

    if (status === "Completed") return "Completed";

    if (dueDate && isAfter(now, new Date(dueDate))) {
      return "Overdue";
    }

    return status || "Not Viewed";
  };

  if (loading) {
    return <GlobalLoader />;
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 text-lg mb-4">{error}</p>
        <Button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold mb-2">No Assignments</h2>
        <p className="text-gray-500">
          You don't have any assignments at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">Your Assignments</h1>

      {/* Filters Section */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="md:col-span-2">
          <Input
            placeholder="Search assignments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            <SelectItem value="Not Viewed">Not Viewed</SelectItem>
            <SelectItem value="Viewed">Viewed</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            {/* <SelectItem value="Overdue">Overdue</SelectItem> */}
          </SelectContent>
        </Select>

        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Subjects</SelectItem>
            {uniqueSubjects.map((subject) => (
              <SelectItem key={subject} value={subject}>
                {subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={teacherFilter} onValueChange={setTeacherFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by teacher" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Teachers</SelectItem>
            {uniqueTeachers.map((teacher) => (
              <SelectItem key={teacher} value={teacher}>
                {teacher}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredAssignments.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No assignments match your filters</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredAssignments.map((assignmentStatus) => {
            const assignment = assignmentStatus.assignment;
            if (!assignment) return null;

            const now = new Date();
            const dueDate = assignment.dueDate
              ? new Date(assignment.dueDate)
              : null;
            const isOverdue = dueDate && isAfter(now, dueDate);
            const isSubmitted = assignmentStatus.status === "Completed";
            const lastViewed = viewedTimestamps[assignmentStatus._id]
              ? new Date(viewedTimestamps[assignmentStatus._id])
              : null;

            return (
              <div
                key={assignmentStatus._id}
                className={`bg-white rounded-xl shadow-md p-5 border-l-4 ${
                  isSubmitted
                    ? "border-green-500"
                    : isOverdue
                    ? "border-red-500"
                    : "border-blue-500"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">
                      {assignment.title}
                    </h2>
                    <p className="text-gray-600 mb-3">
                      {assignment.description}
                    </p>

                    <div className="flex flex-wrap gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-500">Subject</p>
                        <p className="font-medium">
                          {assignment.subject?.name || "Unknown Subject"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">Class</p>
                        <p className="font-medium">
                          {assignment.classroom
                            ? `Grade ${assignment.classroom.grade} - ${assignment.classroom.section}`
                            : "Unknown Class"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">Teacher</p>
                        <p className="font-medium">
                          {assignment.teacher?.fullName || "Unknown Teacher"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2">
                      <a
                        href={assignment.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                        onClick={() => {
                          // Automatically mark as viewed when link is clicked
                          if (
                            assignmentStatus.status !== "Viewed" &&
                            assignmentStatus.status !== "Completed"
                          ) {
                            handleStatusChange(assignmentStatus._id, "Viewed");
                          }
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-1"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                            clipRule="evenodd"
                          />
                        </svg>
                        View Assignment
                      </a>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <div className="mt-2 text-right">
                      <p className="text-sm text-gray-500">Assigned on</p>
                      <p className="text-sm font-medium">
                        {assignment.createdAt
                          ? format(
                              new Date(assignment.createdAt),
                              "MMM dd, yyyy hh:mm a"
                            )
                          : "Unknown date"}
                      </p>
                    </div>

                    {assignment.dueDate && (
                      <div
                        className={`mt-2 text-right ${
                          isOverdue && !isSubmitted ? "text-red-500" : ""
                        }`}
                      >
                        <p className="text-sm text-gray-500">Due date</p>
                        <p className="text-sm font-medium">
                          {format(
                            new Date(assignment.dueDate),
                            "MMM dd, yyyy hh:mm a"
                          )}
                          {isOverdue && !isSubmitted && (
                            <span className="ml-1">(Overdue)</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Selector */}
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      Assignment Status
                    </p>
                    <Select
                      value={
                        assignmentStatuses[assignmentStatus._id] || "Not Viewed"
                      }
                      onValueChange={(value) =>
                        handleStatusChange(assignmentStatus._id, value)
                      }
                      disabled={isSubmitted || submitting[assignmentStatus._id]}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Not Viewed">Not Viewed</SelectItem>
                        {/* <SelectItem value="Viewed">Viewed</SelectItem> */}
                        <SelectItem
                          value="Completed"
                          disabled={
                            assignmentStatus.status !== "Viewed" ||
                            (lastViewed &&
                              differenceInMinutes(new Date(), lastViewed) < 5)
                          }
                        >
                          {lastViewed &&
                          differenceInMinutes(new Date(), lastViewed) < 5
                            ? `Complete (${
                                5 - differenceInMinutes(new Date(), lastViewed)
                              }m)`
                            : "Complete"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div
                    className={`text-right ${
                      isOverdue && !isSubmitted ? "text-red-500" : ""
                    }`}
                  >
                    <p className="text-sm text-gray-500">Current Status</p>
                    <p
                      className={`text-sm font-medium ${getStatusColor(
                        assignmentStatus.status,
                        assignment.dueDate
                      )} px-3 py-1 rounded-full`}
                    >
                      {getStatusText(
                        assignmentStatus.status,
                        assignment.dueDate
                      )}
                    </p>
                  </div>
                </div>

                {/* Submission Section */}
                {assignmentStatuses[assignmentStatus._id] === "Viewed" &&
                  !isSubmitted && (
                    <div className="mt-4 pt-4 border-t">
                      <h3 className="font-medium mb-2">Your Submission</h3>
                      <div className="space-y-4">
                        {/* <Textarea
                          placeholder="Enter your submission here..."
                          value={submissionText[assignmentStatus._id] || ""}
                          onChange={(e) =>
                            handleSubmissionChange(
                              assignmentStatus._id,
                              e.target.value
                            )
                          }
                          readonly
                          disabled={submitting[assignmentStatus._id]}
                        /> */}
                        <div className="flex justify-end">
                          <Button
                            onClick={() =>
                              handleStatusChange(
                                assignmentStatus._id,
                                "Completed"
                              )
                            }
                            disabled={
                              submitting[assignmentStatus._id] ||
                              !submissionText[assignmentStatus._id] ||
                              (lastViewed &&
                                differenceInMinutes(new Date(), lastViewed) < 5)
                            }
                          >
                            {submitting[assignmentStatus._id]
                              ? "Submitting..."
                              : lastViewed &&
                                differenceInMinutes(new Date(), lastViewed) < 5
                              ? `Submit in ${
                                  5 -
                                  differenceInMinutes(new Date(), lastViewed)
                                } min`
                              : "Submit Assignment"}
                          </Button>
                        </div>
                        {isOverdue && (
                          <p className="text-red-500 text-sm">
                            This assignment is overdue. Late submissions may be
                            penalized.
                          </p>
                        )}
                        {lastViewed &&
                          differenceInMinutes(new Date(), lastViewed) < 5 && (
                            <p className="text-yellow-600 text-sm">
                              Please spend at least 5 minutes on the assignment
                              before submitting.
                            </p>
                          )}
                      </div>
                    </div>
                  )}

                {/* Completed Submission Display */}
                {isSubmitted && (
                  <div className="mt-4 pt-4 border-t">
                    <h3 className="font-medium mb-2">Your Submission</h3>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-green-800 font-medium">
                            Submitted on:{" "}
                            {assignmentStatus.submittedAt
                              ? format(
                                  new Date(assignmentStatus.submittedAt),
                                  "MMM dd, yyyy hh:mm a"
                                )
                              : "Unknown date"}
                          </p>
                          <p className="mt-2 text-green-700">
                            {assignmentStatus.submission}
                          </p>
                        </div>
                        <span className="text-green-800 font-medium">
                          ✓ Submitted
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentAssignments;
