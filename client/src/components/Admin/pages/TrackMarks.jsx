import React, { useEffect, useState } from "react";
import {
  callGetAllClassesApi,
  callGetResultsByClassSubjectYearApi,
  callGetStudentResultsApi,
  callGetClassOverviewApi,
  callUpdateResultForStudentApi,
  callGetAttendanceRatesBySubjectApi,
  callBulkUpdateResultsApi,
  callGetAllsubjectssApi,
  callGetRegisteredAcademicYearsApi,
} from "@/service/service";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ClipLoader } from "react-spinners";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/useContaxt/UseContext";
import GlobalLoader from "@/components/common/GlobalLoader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import SearchableSelect from "@/components/common/SearchableSelect";

const updateSchema = z.object({
  results: z.array(
    z.object({
      _id: z.string().optional(),
      studentId: z.string(),
      firstExam: z.number().min(0).max(100),
      midExam: z.number().min(0).max(100),
      thirdExam: z.number().min(0).max(100),
      finalExam: z.number().min(0).max(100),
      activities: z.number().min(0).max(100),
      attendanceRate: z.number().min(0).max(100),
    })
  ),
});

const TrackMarks = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useUser();

  // States for student details modal
  const [showStudentDetailsModal, setShowStudentDetailsModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedStudentName, setSelectedStudentName] = useState("");
  const [studentSubjectDetails, setStudentSubjectDetails] = useState([]);
  const [studentDetailsLoading, setStudentDetailsLoading] = useState(false);
  const [overallTotalMarks, setOverallTotalMarks] = useState("0.0");
  const [overallAverage, setOverallAverage] = useState("0.0");
  const [overallSubjectCount, setOverallSubjectCount] = useState(0);

  // New states for Class Overview
  const [viewMode, setViewMode] = useState("subject");
  const [classOverviewData, setClassOverviewData] = useState([]);
  const [classOverviewLoading, setClassOverviewLoading] = useState(false);

  const { control, handleSubmit, register, setValue, getValues } = useForm({
    resolver: zodResolver(updateSchema),
    defaultValues: { results: [] },
  });

  const { fields } = useFieldArray({ control, name: "results" });

  // Function to export data to CSV
  const exportToCsv = (filename, rows) => {
    const csvContent = rows.map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleExport = () => {
    let headers = [];
    let dataRows = [];
    let filename = "";

    if (viewMode === "subject") {
      if (filteredFields.length === 0) {
        toast.info("No data to export for Subject-wise Marks.");
        return;
      }
      filename = "subject_wise_marks.csv";
      headers = [
        "Student Name",
        "Attendance (%)",
        "First Exam",
        "Mid Exam",
        "Third Exam",
        "Final Exam",
        "Activities",
        "Total",
      ];
      dataRows = filteredFields.map((field) => [
        `"${field.fullName}"`,
        field.attendanceRate.toFixed(1),
        field.firstExam.toFixed(1),
        field.midExam.toFixed(1),
        field.thirdExam.toFixed(1),
        field.finalExam.toFixed(1),
        field.activities.toFixed(1),
        (
          field.firstExam +
          field.midExam +
          field.thirdExam +
          field.finalExam +
          field.activities
        ).toFixed(1),
      ]);
    } else if (viewMode === "classOverview") {
      if (filteredClassOverviewData.length === 0) {
        toast.info("No data to export for Class Overview.");
        return;
      }
      filename = "class_overview.csv";
      headers = [
        "Student Name",
        "Total Marks",
        "Subjects Count",
        "Average Per Subject",
      ];
      dataRows = filteredClassOverviewData.map((student) => [
        `"${student.fullName}"`,
        student.totalMarks,
        student.subjectsCount,
        (parseFloat(student.totalMarks) / student.subjectsCount).toFixed(2),
      ]);
    } else {
      toast.error("Please select a view mode to export data.");
      return;
    }

    exportToCsv(filename, [headers, ...dataRows]);
    toast.success("Data exported successfully!");
  };

  // Fetch initial data (classes, subjects, and academic years)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [classesRes, subjectsRes, yearsRes] = await Promise.all([
          callGetAllClassesApi(),
          callGetAllsubjectssApi(),
          callGetRegisteredAcademicYearsApi(),
        ]);
        setClasses(classesRes.classrooms);
        setSubjects(subjectsRes.subjects);
        setAcademicYears(yearsRes || []);
      } catch (error) {
        toast.error("Failed to load initial data");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Load results for the selected class, subject, and year (Subject-wise view)
  const loadSubjectResults = async () => {
    if (selectedClass && selectedSubject && selectedYear) {
      setResultsLoading(true);
      try {
        const [resultsRes, attendanceRes] = await Promise.all([
          callGetResultsByClassSubjectYearApi(
            selectedClass,
            selectedSubject,
            selectedYear
          ),
          callGetAttendanceRatesBySubjectApi(
            selectedClass,
            selectedSubject,
            selectedYear
          ),
        ]);

        const studentResults = resultsRes?.students || [];
        const attendanceData = attendanceRes?.data || [];

        // Create a map of attendance by student ID
        const attendanceMap = new Map(
          attendanceData.map((item) => [
            item.studentId?.toString(),
            item.attendanceRate || "0",
          ])
        );

        const formattedResults = studentResults.map((student) => {
          const studentId = student.studentId?.toString();
          const rawAttendance = attendanceMap.get(studentId);
          const attendanceValue = parseFloat(rawAttendance) || 0;

          return {
            _id: student._id?.toString(),
            studentId,
            fullName: student.fullName || "Unknown Student",
            firstExam: Number(student.firstExam) || 0,
            midExam: Number(student.midExam) || 0,
            thirdExam: Number(student.thirdExam) || 0,
            finalExam: Number(student.finalExam) || 0,
            activities: Number(student.activities) || 0,
            attendanceRate: attendanceValue,
          };
        });

        setValue("results", formattedResults);
      } catch (error) {
        toast.error(`Failed to load results: ${error.message}`);
      } finally {
        setResultsLoading(false);
      }
    } else {
      setValue("results", []);
    }
  };

  // Load Class Overview data
  const loadClassOverview = async () => {
    if (selectedClass && selectedYear) {
      setClassOverviewLoading(true);
      try {
        const response = await callGetClassOverviewApi(
          selectedClass,
          selectedYear // Now correctly passing the selected academic year
        );
        setClassOverviewData(response.students || []);
      } catch (error) {
        toast.error(`Failed to load class overview: ${error.message}`);
        setClassOverviewData([]);
      } finally {
        setClassOverviewLoading(false);
      }
    } else {
      setClassOverviewData([]);
    }
  };

  // Effect to load data based on view mode
  useEffect(() => {
    if (viewMode === "subject") {
      loadSubjectResults();
    } else if (viewMode === "classOverview") {
      loadClassOverview();
    }
  }, [selectedClass, selectedSubject, selectedYear, viewMode]);

  // Function to handle individual student result update
  const handleIndividualUpdate = async (resultId, index) => {
    if (!user?._id) {
      toast.error("User not authenticated");
      return;
    }
    if (!resultId) {
      toast.error("Missing result ID - cannot update");
      return;
    }

    try {
      const formData = getValues(`results.${index}`);
      await callUpdateResultForStudentApi(resultId, {
        ...formData,
        updatedBy: user._id,
      });
      toast.success("Student record updated");
      await loadSubjectResults();
    } catch (error) {
      toast.error(
        `Update failed: ${error.response?.data?.message || error.message}`
      );
    }
  };

  // Function to handle bulk update of student results
  const handleBulkUpdate = async (data) => {
    if (!user?._id) {
      toast.error("User not authenticated");
      return;
    }

    if (!selectedClass || !selectedSubject || !selectedYear) {
      toast.error("Please select Class, Subject, and Academic Year");
      return;
    }

    try {
      const updates = data.results.map((result, index) => {
        const clampScore = (value) => {
          const sanitizedValue = String(value).replace(",", ".");
          const num = Number(sanitizedValue);
          if (isNaN(num)) return 0;
          return Math.min(100, Math.max(0, num));
        };

        return {
          resultId: fields[index]?._id,
          updatedBy: user._id,
          firstExam: clampScore(result.firstExam),
          midExam: clampScore(result.midExam),
          thirdExam: clampScore(result.thirdExam),
          finalExam: clampScore(result.finalExam),
          activities: clampScore(result.activities),
        };
      });

      const invalidUpdate = updates.find(
        (u) =>
          !u.resultId ||
          [u.firstExam, u.midExam, u.thirdExam, u.finalExam, u.activities].some(
            (score) => isNaN(score) || score < 0 || score > 100
          )
      );
      if (invalidUpdate) {
        toast.error("One or more updates have invalid or missing data.");
        return;
      }

      const payload = { updates };

      await callBulkUpdateResultsApi(payload);
      toast.success("Bulk update successful");
      await loadSubjectResults();
    } catch (error) {
      toast.error(`Bulk update failed: ${error.message}`);
    }
  };

  // Filtered fields for search functionality (for subject-wise view)
  const filteredFields = fields.filter((field) =>
    field.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtered class overview data for search functionality
  const filteredClassOverviewData = classOverviewData.filter((student) =>
    student.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Function to open student details modal
  const handleStudentClick = async (studentId, fullName) => {
    if (!selectedYear) {
      toast.error("Please select an Academic Year first.");
      return;
    }
    setSelectedStudentId(studentId);
    setSelectedStudentName(fullName);
    setShowStudentDetailsModal(true);
  };

  // Effect to fetch student's subject details when modal opens
  useEffect(() => {
    const fetchStudentDetails = async () => {
      if (showStudentDetailsModal && selectedStudentId && selectedYear) {
        setStudentDetailsLoading(true);
        try {
          const response = await callGetStudentResultsApi(
            selectedStudentId,
            selectedYear
          );
          const studentResults = response?.data?.results || [];

          // Group results by subject and aggregate scores
          const subjectMap = studentResults.reduce((acc, result) => {
            const subjectName = result.subject || "Unknown Subject";
            if (!acc[subjectName]) {
              acc[subjectName] = {
                firstExam: 0,
                midExam: 0,
                thirdExam: 0,
                finalExam: 0,
                activities: 0,
                count: 0,
              };
            }

            acc[subjectName].firstExam += Number(result.firstExam || 0);
            acc[subjectName].midExam += Number(result.midExam || 0);
            acc[subjectName].thirdExam += Number(result.thirdExam || 0);
            acc[subjectName].finalExam += Number(result.finalExam || 0);
            acc[subjectName].activities += Number(result.activities || 0);
            acc[subjectName].count += 1;

            return acc;
          }, {});

          // Convert to array format and calculate totals
          const formattedDetails = Object.entries(subjectMap).map(
            ([subjectName, scores]) => {
              const total =
                scores.firstExam +
                scores.midExam +
                scores.thirdExam +
                scores.finalExam +
                scores.activities;
              const average = total / 5;

              return {
                subjectName,
                firstExam: scores.firstExam,
                midExam: scores.midExam,
                thirdExam: scores.thirdExam,
                finalExam: scores.finalExam,
                activities: scores.activities,
                totalMarks: total.toFixed(1),
                averageMarks: average.toFixed(1),
              };
            }
          );

          setStudentSubjectDetails(formattedDetails);

          // Calculate overall totals and averages for the modal
          const totalOverallMarks = formattedDetails.reduce(
            (sum, subject) => sum + parseFloat(subject.totalMarks),
            0
          );
          const totalOverallAverage =
            formattedDetails.reduce(
              (sum, subject) => sum + parseFloat(subject.averageMarks),
              0
            ) / formattedDetails.length;
          const totalSubjectCount = formattedDetails.length;

          setOverallTotalMarks(totalOverallMarks.toFixed(1));
          setOverallAverage(totalOverallAverage.toFixed(2));
          setOverallSubjectCount(totalSubjectCount);
        } catch (error) {
          toast.error(`Failed to load student details: ${error.message}`);
          setStudentSubjectDetails([]);
          setOverallTotalMarks("0.0");
          setOverallAverage("0.0");
          setOverallSubjectCount(0);
        } finally {
          setStudentDetailsLoading(false);
        }
      }
    };
    fetchStudentDetails();
  }, [showStudentDetailsModal, selectedStudentId, selectedYear]);

  if (loading) return <GlobalLoader />;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Class Selector */}
        <SearchableSelect
          options={classes}
          value={selectedClass}
          onChange={setSelectedClass}
          placeholder="Select Class"
        />

        <SearchableSelect
          options={subjects}
          value={selectedSubject}
          onChange={setSelectedSubject}
          placeholder="Select Subject"
          isDisabled={!selectedClass}
        />

        {/* Year Selector */}
        <SearchableSelect
          options={academicYears.map((year) => ({ label: year, value: year }))}
          value={selectedYear}
          onChange={setSelectedYear}
          placeholder="Academic Year"
        />
      </div>

      <div className="flex justify-start gap-4 mb-4">
        <Button
          onClick={() => setViewMode("subject")}
          variant={viewMode === "subject" ? "default" : "outline"}
        >
          Subject-wise Marks
        </Button>
        <Button
          onClick={() => {
            if (!selectedClass || !selectedYear) {
              toast.info(
                "Please select a Class and Academic Year for Class Overview."
              );
              return;
            }
            setSelectedSubject("");
            setViewMode("classOverview");
          }}
          variant={viewMode === "classOverview" ? "default" : "outline"}
        >
          Class Overview
        </Button>
        <Button
          onClick={handleExport}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          Export to Excel (CSV)
        </Button>
      </div>

      {(viewMode === "subject" && fields.length > 0) ||
      (viewMode === "classOverview" && classOverviewData.length > 0) ? (
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Search student by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md"
          />
        </div>
      ) : null}

      {viewMode === "subject" &&
        (resultsLoading ? (
          <div className="text-center mt-8">
            <ClipLoader size={30} className="mb-2" />
            <p>Loading student results...</p>
          </div>
        ) : filteredFields.length > 0 ? (
          <form onSubmit={handleSubmit(handleBulkUpdate)}>
            <div className="overflow-x-auto rounded-lg border shadow-sm">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left min-w-[200px]">
                      Student Name
                    </th>
                    <th className="p-3 min-w-[120px]">Attendance (%)</th>
                    <th className="p-3 min-w-[120px]">First Exam</th>
                    <th className="p-3 min-w-[120px]">Mid Exam</th>
                    <th className="p-3 min-w-[120px]">Third Exam</th>
                    <th className="p-3 min-w-[120px]">Final Exam</th>
                    <th className="p-3 min-w-[120px]">Activities</th>
                    <th className="p-3 min-w-[120px]">Total</th>
                    <th className="p-3 min-w-[150px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFields.map((field, index) => (
                    <tr
                      key={field.id}
                      className="border-t hover:bg-gray-50 even:bg-gray-50"
                    >
                      <td className="p-3 font-medium">
                        <button
                          type="button"
                          onClick={() =>
                            handleStudentClick(field.studentId, field.fullName)
                          }
                          className="text-blue-600 hover:underline cursor-pointer"
                        >
                          {field.fullName}
                        </button>
                      </td>

                      <td className="p-3 text-center">
                        {field.attendanceRate.toFixed(1)}%
                      </td>
                      {[
                        "firstExam",
                        "midExam",
                        "thirdExam",
                        "finalExam",
                        "activities",
                      ].map((exam) => (
                        <td key={exam} className="p-3">
                          <Input
                            type="number"
                            {...register(`results.${index}.${exam}`, {
                              valueAsNumber: true,
                              validate: (value) => {
                                const num = Number(value);
                                return !isNaN(num) && num >= 0 && num <= 100;
                              },
                            })}
                            onBlur={(e) => {
                              let value = parseFloat(
                                e.target.value.replace(/,/g, ".")
                              );
                              if (isNaN(value)) value = 0;
                              const clamped = Math.min(100, Math.max(0, value));
                              e.target.value = clamped.toFixed(1);
                              setValue(`results.${index}.${exam}`, clamped);
                            }}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "") {
                                setValue(`results.${index}.${exam}`, 0);
                                return;
                              }
                              const parsed = parseFloat(
                                value.replace(/,/g, ".")
                              );
                              if (!isNaN(parsed)) {
                                const clamped = Math.min(
                                  100,
                                  Math.max(0, parsed)
                                );
                                e.target.value = clamped.toString();
                                setValue(`results.${index}.${exam}`, clamped);
                              }
                            }}
                            defaultValue={field[exam].toFixed(1)}
                            min={0}
                            max={100}
                            step="0.1"
                          />
                        </td>
                      ))}
                      <td className="p-3 text-center font-semibold">
                        {(
                          field.firstExam +
                          field.midExam +
                          field.thirdExam +
                          field.finalExam +
                          field.activities
                        ).toFixed(1)}
                      </td>

                      <td className="p-3">
                        <Button
                          type="button"
                          onClick={() => {
                            handleIndividualUpdate(field._id, index);
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2"
                        >
                          Save
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
              >
                Save All Changes
              </Button>
            </div>
          </form>
        ) : (
          <div className="text-center mt-8 text-gray-500">
            No students found for selected criteria
          </div>
        ))}

      {viewMode === "classOverview" &&
        (classOverviewLoading ? (
          <div className="text-center mt-8">
            <ClipLoader size={30} className="mb-2" />
            <p>Loading class overview...</p>
          </div>
        ) : filteredClassOverviewData.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left min-w-[200px]">Student Name</th>
                  <th className="p-3 text-center min-w-[120px]">Total Marks</th>
                  <th className="p-3 text-center min-w-[120px]">
                    Subjects Count
                  </th>
                  <th className="p-3 text-center min-w-[120px]">
                    Average Per Subject
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredClassOverviewData.map((student, index) => (
                  <tr
                    key={student.studentId}
                    className="border-t hover:bg-gray-50 even:bg-gray-50"
                  >
                    <td className="p-3 font-medium">
                      <button
                        type="button"
                        onClick={() =>
                          handleStudentClick(
                            student.studentId,
                            student.fullName
                          )
                        }
                        className="text-blue-600 hover:underline cursor-pointer"
                      >
                        {student.fullName}
                      </button>
                    </td>
                    <td className="p-3 text-center font-semibold">
                      {parseFloat(student.totalMarks).toFixed(1)}
                    </td>
                    <td className="p-3 text-center">{student.subjectsCount}</td>
                    <td className="p-3 text-center font-semibold">
                      {student.subjectsCount > 0
                        ? (
                            parseFloat(student.totalMarks) /
                            student.subjectsCount
                          ).toFixed(2)
                        : "0.00"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center mt-8 text-gray-500">
            No class overview data found for selected criteria.
          </div>
        ))}

      {/* Student Details Modal */}
      <Dialog
        open={showStudentDetailsModal}
        onOpenChange={setShowStudentDetailsModal}
      >
        <DialogContent className="w-[95vw] max-h-[90vh] overflow-y-auto sm:max-w-xl md:max-w-2xl lg:max-w-4xl p-6 rounded-2xl shadow-xl border border-muted bg-background">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mb-1">
              📝 Results for {selectedStudentName} ({selectedYear})
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Detailed academic performance in each subject for the selected
              year.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm text-muted-foreground">
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs font-medium">Total Marks</p>
              <p className="text-lg font-bold text-foreground">
                {overallTotalMarks}
              </p>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs font-medium">Average</p>
              <p className="text-lg font-bold text-foreground">
                {overallSubjectCount > 0
                  ? (
                      parseFloat(overallTotalMarks) / overallSubjectCount
                    ).toFixed(2)
                  : "0"}
              </p>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs font-medium">Subjects</p>
              <p className="text-lg font-bold text-foreground">
                {overallSubjectCount}
              </p>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs font-medium">Grade</p>
              <p className="text-lg font-bold text-foreground">
                {overallSubjectCount > 0
                  ? (() => {
                      const avg =
                        parseFloat(overallTotalMarks) / overallSubjectCount;
                      if (avg >= 90) return "A";
                      if (avg >= 80) return "B";
                      if (avg >= 70) return "C";
                      if (avg >= 60) return "D";
                      return "F";
                    })()
                  : "N/A"}
              </p>
            </div>
          </div>

          {studentDetailsLoading ? (
            <div className="text-center py-10">
              <ClipLoader size={35} className="mb-3" />
              <p className="text-sm text-muted-foreground">
                Loading student's subject details...
              </p>
            </div>
          ) : studentSubjectDetails.length > 0 ? (
            <div className="overflow-x-auto mt-6 rounded-lg border border-border shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 text-muted-foreground">
                  <tr>
                    <th className="p-3 text-left">Subject</th>
                    <th className="p-3 text-center">First</th>
                    <th className="p-3 text-center">Mid</th>
                    <th className="p-3 text-center">Third</th>
                    <th className="p-3 text-center">Final</th>
                    <th className="p-3 text-center">Activities</th>
                    <th className="p-3 text-center">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {studentSubjectDetails.map((detail, idx) => (
                    <tr
                      key={idx}
                      className="border-t hover:bg-muted/20 even:bg-muted/10"
                    >
                      <td className="p-3 font-medium text-foreground">
                        {detail.subjectName}
                      </td>
                      <td className="p-3 text-center">
                        {detail.firstExam?.toFixed(1) || "0.0"}
                      </td>
                      <td className="p-3 text-center">
                        {detail.midExam?.toFixed(1) || "0.0"}
                      </td>
                      <td className="p-3 text-center">
                        {detail.thirdExam?.toFixed(1) || "0.0"}
                      </td>
                      <td className="p-3 text-center">
                        {detail.finalExam?.toFixed(1) || "0.0"}
                      </td>
                      <td className="p-3 text-center">
                        {detail.activities?.toFixed(1) || "0.0"}
                      </td>
                      <td className="p-3 text-center font-semibold text-foreground">
                        {detail.totalMarks}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-sm text-muted-foreground">
              No subject results found for{" "}
              <span className="font-medium">{selectedStudentName}</span> in{" "}
              <span className="font-medium">{selectedYear}</span>.
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button
              variant="secondary"
              onClick={() => setShowStudentDetailsModal(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrackMarks;
