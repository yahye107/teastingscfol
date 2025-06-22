import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { callGetAssignmentDetails } from "@/service/service";
import { useUser } from "@/useContaxt/UseContext";
import { format } from "date-fns";
import {
  ArrowLeft,
  Search,
  FileText,
  Users,
  Calendar,
  BookOpen,
  Link as LinkIcon,
  Eye,
  CheckCircle,
  Clock,
  Download,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";

const AssignmentDetails = () => {
  const { assignmentId } = useParams();
  const { user } = useUser();
  const [assignment, setAssignment] = useState(null);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssignmentDetails = async () => {
      try {
        setIsLoading(true);
        const response = await callGetAssignmentDetails(assignmentId);
        if (response.success) {
          setAssignment(response.data.assignment);
          setStudents(response.data.students);
          setFilteredStudents(response.data.students);
        }
      } catch (error) {
        console.error("Error fetching assignment details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignmentDetails();
  }, [assignmentId]);

  // Frontend search and filter
  useEffect(() => {
    let result = students;

    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (student) =>
          student.name.toLowerCase().includes(term) ||
          student.email.toLowerCase().includes(term) ||
          (student.rollNumber &&
            student.rollNumber.toLowerCase().includes(term))
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((student) => student.status === statusFilter);
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredStudents(result);
  }, [students, searchTerm, statusFilter, sortConfig]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      "Not Viewed": {
        bg: "bg-gray-100",
        text: "text-gray-800",
        icon: <Clock className="w-4 h-4 mr-1" />,
      },
      Viewed: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        icon: <Eye className="w-4 h-4 mr-1" />,
      },
      Completed: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: <CheckCircle className="w-4 h-4 mr-1" />,
      },
    };

    const config = statusConfig[status] || statusConfig["Not Viewed"];

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {config.icon}
        {status}
      </span>
    );
  };

  const getStatusCounts = () => {
    return students.reduce((counts, student) => {
      counts[student.status] = (counts[student.status] || 0) + 1;
      return counts;
    }, {});
  };

  const statusCounts = getStatusCounts();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <FileText className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Assignment Not Found
        </h2>
        <p className="text-gray-600 mb-6 max-w-md">
          The assignment you're looking for doesn't exist or may have been
          removed.
        </p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Assignments
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="group flex items-center text-gray-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Assignments
        </Button>
      </div>

      {/* Assignment Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="bg-indigo-50 rounded-xl p-4 flex items-center justify-center w-16 h-16">
            <BookOpen className="h-8 w-8 text-indigo-600" />
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {assignment.title}
                </h1>
                <p className="text-gray-600 mt-2">{assignment.description}</p>
              </div>

              <a
                href={assignment.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors h-fit"
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                View Assignment
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="flex items-center">
                <div className="bg-gray-100 rounded-lg p-3 mr-4">
                  <Users className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Class</p>
                  <p className="font-medium">
                    Grade {assignment.classroom.grade} -{" "}
                    {assignment.classroom.section}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="bg-gray-100 rounded-lg p-3 mr-4">
                  <BookOpen className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Subject</p>
                  <p className="font-medium">{assignment.subject.name}</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="bg-gray-100 rounded-lg p-3 mr-4">
                  <Calendar className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Assigned On</p>
                  <p className="font-medium">
                    {format(new Date(assignment.createdAt), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Submissions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Student Submissions
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {students.length} students in this class
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full md:w-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search by name, email, or roll number..."
                className="pl-10"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filter
              {showFilters ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Status</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStatusFilter("all")}
                >
                  All ({students.length})
                </Button>
                <Button
                  variant={
                    statusFilter === "Not Viewed" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => handleStatusFilter("Not Viewed")}
                >
                  Not Viewed ({statusCounts["Not Viewed"] || 0})
                </Button>
                <Button
                  variant={statusFilter === "Viewed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStatusFilter("Viewed")}
                >
                  Viewed ({statusCounts["Viewed"] || 0})
                </Button>
                <Button
                  variant={statusFilter === "Completed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStatusFilter("Completed")}
                >
                  Completed ({statusCounts["Completed"] || 0})
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Sort By</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSort("name")}
                >
                  Name{" "}
                  {sortConfig.key === "name" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSort("updatedAt")}
                >
                  Date{" "}
                  {sortConfig.key === "updatedAt" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Status Summary */}
        <div className="flex flex-wrap gap-3 mb-6">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div
              key={status}
              className="flex items-center bg-gray-50 rounded-lg px-3 py-2 text-sm"
            >
              <span className="font-medium mr-1">{count}</span>
              <span className="text-gray-500">{status}</span>
            </div>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    Student
                    {sortConfig.key === "name" && (
                      <span className="ml-1">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Roll No
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center">
                    Status
                    {sortConfig.key === "status" && (
                      <span className="ml-1">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("updatedAt")}
                >
                  <div className="flex items-center">
                    Last Updated
                    {sortConfig.key === "updatedAt" && (
                      <span className="ml-1">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submission
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr
                    key={student._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {student.name}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {student.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.rollNumber || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(student.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.updatedAt
                        ? format(new Date(student.updatedAt), "MMM dd, hh:mm a")
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.submission ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-green-600">
                            Submitted
                          </span>
                          <a
                            href={student.submission}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800"
                            title="Download submission"
                          >
                            {/* <Download className="h-4 w-4" /> */}
                          </a>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">
                          Not submitted
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center">
                    <div className="text-gray-500 py-4">
                      No matching students found
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden grid grid-cols-1 gap-4">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <div
                key={student._id}
                className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">
                      {student.name}
                    </div>
                    <div className="text-sm text-gray-500 truncate max-w-[200px]">
                      {student.email}
                    </div>
                    {student.rollNumber && (
                      <div className="text-sm text-gray-500 mt-1">
                        Roll: {student.rollNumber}
                      </div>
                    )}
                  </div>
                  {getStatusBadge(student.status)}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Last Updated</p>
                    <p className="text-sm">
                      {student.updatedAt
                        ? format(new Date(student.updatedAt), "MMM dd, hh:mm a")
                        : "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Submission</p>
                    <div>
                      {student.submission ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-green-600">
                            Submitted
                          </span>
                          <a
                            href={student.submission}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800"
                            title="Download submission"
                          >
                            {/* <Download className="h-4 w-4" /> */}
                          </a>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">
                          Not submitted
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                No students found
              </h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "No students in this class yet"}
              </p>
            </div>
          )}
        </div>

        {/* Show results count */}
        <div className="mt-4 text-sm text-gray-500">
          Showing {filteredStudents.length} of {students.length} students
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetails;
