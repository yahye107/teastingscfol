import React, { useEffect, useState } from "react";
import {
  callGetAllClassesApi,
  callGetResultsByClassSubjectYearApi,
  callUpdateResultForStudentApi,
  callGetAttendanceRatesBySubjectApi,
  callBulkUpdateResultsApi,
  callGetRegisteredAcademicYearsApi,
  callGetAllsubjectssApi,
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

const UpdateGrade = () => {
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
  const { control, handleSubmit, register, setValue, getValues } = useForm({
    resolver: zodResolver(updateSchema),
    defaultValues: { results: [] },
  });

  const { fields } = useFieldArray({ control, name: "results" });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [classesRes, subjectsRes, yearsRes] = await Promise.all([
          callGetAllClassesApi(),
          callGetAllsubjectssApi(),
          callGetRegisteredAcademicYearsApi(),
        ]);

        console.log("Academic years from API:", yearsRes);
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
  console.log("academicYears", academicYears);
  const loadResults = async () => {
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

        // Correctly match attendance to student AND academic year
        const formattedResults = studentResults.map((student) => {
          const studentId = student.studentId?.toString();

          // Find attendance for this specific student and year
          const attendanceRecord = attendanceData.find(
            (item) =>
              item.studentId?.toString() === studentId &&
              item.academicYear === selectedYear
          );

          const attendanceValue = attendanceRecord
            ? parseFloat(attendanceRecord.attendanceRate) || 0
            : 0;

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
    }
  };

  useEffect(() => {
    loadResults();
  }, [selectedClass, selectedSubject, selectedYear]);

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
      await loadResults();
    } catch (error) {
      toast.error(
        `Update failed: ${error.response?.data?.message || error.message}`
      );
    }
  };

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
        // Clamp and sanitize scores 0-100
        const clampScore = (value) => {
          const sanitizedValue = String(value).replace(",", ".");
          const num = Number(sanitizedValue);
          if (isNaN(num)) return 0;
          return Math.min(100, Math.max(0, num));
        };

        return {
          resultId: fields[index]?._id, // Use _id from react-hook-form fields as resultId
          updatedBy: user._id,
          firstExam: clampScore(result.firstExam),
          midExam: clampScore(result.midExam),
          thirdExam: clampScore(result.thirdExam),
          finalExam: clampScore(result.finalExam),
          activities: clampScore(result.activities),
        };
      });

      // Validate updates array, ensure no missing resultId etc
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

      // Prepare payload for backend
      const payload = { updates };

      // console.log("Sending bulk update payload:", payload);

      await callBulkUpdateResultsApi(payload);
      toast.success("Bulk update successful");
      await loadResults(); // Reload fresh data after update
    } catch (error) {
      toast.error(`Bulk update failed: ${error.message}`);
    }
  };
  const filteredFields = fields.filter((field) =>
    field.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      {fields.length > 0 && (
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Search student by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md"
          />
        </div>
      )}
      {resultsLoading ? (
        <div className="text-center mt-8">
          <ClipLoader size={30} className="mb-2" />
          <p>Loading student results...</p>
        </div>
      ) : fields.length > 0 ? (
        <form onSubmit={handleSubmit(handleBulkUpdate)}>
          <div className="overflow-x-auto rounded-lg border shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left min-w-[200px]">Student Name</th>
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
                    <td className="p-3 font-medium">{field.fullName}</td>
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
                        {/* // Modify your Input component with better number
                        handling */}
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
                            e.target.value = clamped.toFixed(1); // Force 1 decimal place
                            setValue(`results.${index}.${exam}`, clamped);
                          }}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Allow empty input during typing
                            if (value === "") {
                              setValue(`results.${index}.${exam}`, 0);
                              return;
                            }
                            const parsed = parseFloat(value.replace(/,/g, "."));
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
                          // console.log("Clicked:", field._id, index);
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
      )}
    </div>
  );
};

export default UpdateGrade;
