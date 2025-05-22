import React, { useEffect, useState } from "react";
import { callGetStudentResultsApi } from "@/service/service";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipLoader } from "react-spinners";
import { toast } from "sonner";

const MarkHIstroyTrack = () => {
  const [studentId, setStudentId] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // MarkHIstroyTrack.jsx
  useEffect(() => {
    const fetchResults = async () => {
      if (studentId && selectedYear) {
        setLoading(true);
        try {
          const { data } = await callGetStudentResultsApi(
            studentId,
            selectedYear
          );
          setResults(data.results || []);
        } catch (error) {
          toast.error("Failed to fetch student results");
        } finally {
          setLoading(false);
        }
      }
    };
    fetchResults();
  }, [studentId, selectedYear]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Input
          placeholder="Enter Student ID"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
        />
        <Select onValueChange={setSelectedYear} value={selectedYear}>
          <SelectTrigger>
            <SelectValue placeholder="Select Academic Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2023/2024">2023/2024</SelectItem>
            <SelectItem value="2024-2025">2024/2025</SelectItem>
            <SelectItem value="2025-2026">2025/2026</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center">
          <ClipLoader size={30} />
          <p>Loading results...</p>
        </div>
      ) : results.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Subject</th>
                <th className="p-3 text-left">Total Marks</th>
                <th className="p-3 text-left">Attendance</th>
                <th className="p-3 text-left">Average</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr
                  key={index}
                  className="border-t hover:bg-gray-50 even:bg-gray-50"
                >
                  <td className="p-3 font-medium">{result.subject}</td>
                  <td className="p-3">{result.total}</td>
                  <td className="p-3">{result.attendanceRate}%</td>
                  <td className="p-3">
                    {(result.total / 5).toFixed(1)}%{" "}
                    {/* Assuming 5 components */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center text-gray-500">
          {studentId && selectedYear
            ? "No results found for the selected academic year."
            : "Please enter a Student ID and select an Academic Year."}
        </div>
      )}
    </div>
  );
};

export default MarkHIstroyTrack;
