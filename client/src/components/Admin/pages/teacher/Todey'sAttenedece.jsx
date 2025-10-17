import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Calendar,
  User,
  Clock,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import GlobalLoader from "@/components/common/GlobalLoader";
import {
  callGetTodayTeacherAttendanceApi,
  callUpdateTeacherAttendanceApi,
} from "@/service/service";
import ButtonLoader from "@/components/common/ButtonLoadi";
import { useNavigate } from "react-router-dom";

const TodaysAttendance = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [originalData, setOriginalData] = useState([]);
  const [updating, setUpdating] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  // Get current academic year
  const getCurrentAcademicYear = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    if (currentMonth >= 6) {
      return `${currentYear}-${currentYear + 1}`;
    } else {
      return `${currentYear - 1}-${currentYear}`;
    }
  };

  const getAcademicYears = () => {
    const years = [];
    const startYear = 2000;
    const endYear = 2100;

    for (let year = startYear; year <= endYear; year++) {
      years.push(`${year}-${year + 1}`);
    }
    return years.reverse();
  };

  // Fetch today's attendance data
  const fetchTodayAttendance = async () => {
    try {
      setLoading(true);
      const response = await callGetTodayTeacherAttendanceApi();
      const data = response.result || [];

      // Add academic year to each record if not present
      const dataWithAcademicYear = data.map((item) => ({
        ...item,
        academicYear: item.academicYear || "", // <-- keep empty if not set
      }));

      setAttendanceData(dataWithAcademicYear);
      setFilteredData(dataWithAcademicYear);
      setOriginalData(dataWithAcademicYear.map((item) => ({ ...item })));
    } catch (err) {
      toast.error("Failed to fetch today's attendance.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  // Filter data based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = attendanceData.filter((item) =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(attendanceData);
    }
  }, [searchTerm, attendanceData]);

  const handleChange = (index, field, value) => {
    const updated = [...attendanceData];
    const actualIndex = attendanceData.findIndex(
      (item) => item._id === filteredData[index]._id
    );

    if (actualIndex !== -1) {
      updated[actualIndex][field] = value;

      // If status changes to "Absent" or "Day Off", clear times
      if (field === "status" && (value === "Absent" || value === "Day Off")) {
        updated[actualIndex].timeIn = "";
        updated[actualIndex].timeOut = "";
      }

      setAttendanceData(updated);

      const updatedFiltered = [...filteredData];
      updatedFiltered[index][field] = value;

      if (field === "status" && (value === "Absent" || value === "Day Off")) {
        updatedFiltered[index].timeIn = "";
        updatedFiltered[index].timeOut = "";
      }

      setFilteredData(updatedFiltered);
    }
  };

  const handleUpdate = async (index) => {
    const entry = filteredData[index];

    if (!entry._id) {
      toast.error("Missing attendance ID for update.");
      return;
    }

    // Validation: require times for Present or Late
    if (
      (entry.status === "Present" || entry.status === "Late") &&
      (!entry.timeIn || !entry.timeOut)
    ) {
      toast.error("Please enter Time In and Time Out before updating.");
      return;
    }

    try {
      setUpdating((prev) => ({ ...prev, [index]: true }));

      const updateData = {
        status: entry.status,
        timeIn: entry.timeIn,
        timeOut: entry.timeOut,
        reason: entry.reason,
        academicYear: entry.academicYear,
      };

      await callUpdateTeacherAttendanceApi(entry._id, updateData);
      toast.success(`${entry.name}'s attendance updated successfully.`);

      // Update originalData locally
      const updatedOriginalData = [...originalData];
      const origIndex = originalData.findIndex(
        (item) => item._id === entry._id
      );
      if (origIndex !== -1) updatedOriginalData[origIndex] = { ...entry };
      setOriginalData(updatedOriginalData);
    } catch (err) {
      toast.error("Update failed. Please try again.");
    } finally {
      setUpdating((prev) => ({ ...prev, [index]: false }));
    }
  };

  const hasChanges = (index, field, value) => {
    const updated = [...attendanceData];
    const actualIndex = attendanceData.findIndex(
      (item) => item._id === filteredData[index]._id
    );
    if (actualIndex !== -1) {
      updated[actualIndex][field] = value;
      setAttendanceData(updated);
      const updatedFiltered = [...filteredData];
      updatedFiltered[index][field] = value;
      setFilteredData(updatedFiltered);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Present":
        return "bg-green-100 text-green-800 border-green-200";
      case "Absent":
        return "bg-red-100 text-red-800 border-red-200";
      case "Late":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Day Off":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };
  const rowHasChanges = (index) => {
    const originalRow = originalData.find(
      (item) => item._id === filteredData[index]._id
    );
    if (!originalRow) return false;
    const keysToCheck = [
      "status",
      "timeIn",
      "timeOut",
      "reason",
      "academicYear",
    ];
    return keysToCheck.some(
      (key) => originalRow[key] !== filteredData[index][key]
    );
  };
  if (loading) return <GlobalLoader />;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-center sm:justify-start items-start sm:items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="gap-2 text-black flex-shrink-0"
        >
          <ArrowLeft className="h-4 w-4 text-black" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Teacher Attendance
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and update today's teacher attendance records
          </p>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search Teachers
              </label>
              <Input
                placeholder="Search by teacher name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white dark:bg-gray-800"
              />
            </div>

            {/* Stats */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Today's Summary
              </label>
              <div className="flex gap-4 text-sm">
                <span className="text-green-600 dark:text-green-400">
                  Present:{" "}
                  {
                    attendanceData.filter((item) => item.status === "Present")
                      .length
                  }
                </span>
                <span className="text-red-600 dark:text-red-400">
                  Absent:{" "}
                  {
                    attendanceData.filter((item) => item.status === "Absent")
                      .length
                  }
                </span>
                <span className="text-yellow-600 dark:text-yellow-400">
                  Late:{" "}
                  {
                    attendanceData.filter((item) => item.status === "Late")
                      .length
                  }
                </span>
                <span className="text-yellow-600 dark:text-yellow-400">
                  DayOff:{" "}
                  {
                    attendanceData.filter((item) => item.status === "Day Off")
                      .length
                  }
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Today's Attendance Records
          </CardTitle>
          <CardDescription>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm
                  ? "No teachers found"
                  : "No attendance records found"}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "No attendance data available for today"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Teacher
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Academic Year
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Time In
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Time Out
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Reason
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredData.map((item, index) => (
                    <tr
                      key={item._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {item.name}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Select
                          value={item.academicYear}
                          onValueChange={(value) =>
                            handleChange(index, "academicYear", value)
                          }
                        >
                          <SelectTrigger className="w-36 border-gray-300 dark:border-gray-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getAcademicYears().map((year) => (
                              <SelectItem key={year} value={year}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 px-4">
                        <Select
                          value={item.status}
                          onValueChange={(value) =>
                            handleChange(index, "status", value)
                          }
                        >
                          <SelectTrigger className="w-32 border-gray-300 dark:border-gray-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {/* <SelectItem value="Pending">Pending</SelectItem> */}
                            <SelectItem value="Present">Present</SelectItem>
                            <SelectItem value="Absent">Absent</SelectItem>
                            <SelectItem value="Late">Late</SelectItem>
                            <SelectItem value="Day Off">Day Off</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 px-4">
                        <Input
                          type="time"
                          value={item.timeIn || ""}
                          onChange={(e) =>
                            handleChange(index, "timeIn", e.target.value)
                          }
                          disabled={
                            item.status === "Day Off" ||
                            item.status === "Absent"
                          }
                          className="w-32 border-gray-300 dark:border-gray-700"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <Input
                          type="time"
                          value={item.timeOut || ""}
                          onChange={(e) =>
                            handleChange(index, "timeOut", e.target.value)
                          }
                          disabled={
                            item.status === "Day Off" ||
                            item.status === "Absent"
                          }
                          className="w-32 border-gray-300 dark:border-gray-700"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <Input
                          type="text"
                          placeholder="Reason for absence/late"
                          value={item.reason || ""}
                          onChange={(e) =>
                            handleChange(index, "reason", e.target.value)
                          }
                          disabled={item.status === "Day Off"}
                          className="min-w-48 border-gray-300 dark:border-gray-700"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          disabled={!rowHasChanges(index) || updating[index]}
                          onClick={() => handleUpdate(index)}
                          className="bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                        >
                          {updating[index] ? <ButtonLoader /> : "Update"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TodaysAttendance;
