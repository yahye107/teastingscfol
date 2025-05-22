import { useEffect, useState } from "react";
import {
  callGetAllTeachersApi,
  callGetTeacherAttendanceByIdApi,
} from "@/service/service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search } from "lucide-react";
import { toast } from "sonner";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { Skeleton } from "@/components/ui/skeleton";
import GlobalLoader from "@/components/common/GlobalLoader";
import { useNavigate } from "react-router-dom";
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
const TeacherAttendanceHistory = () => {
  const [teachers, setTeachers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [attendance, setAttendance] = useState([]);
  const [filter, setFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await callGetAllTeachersApi();
        const sortedTeachers = res?.teachers || [];
        setTeachers(sortedTeachers);
      } catch (err) {
        toast.error("Failed to fetch teachers.");
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, []);
  const calculateAttendanceStats = () => {
    const stats = {
      present: 0,
      absent: 0,
      dayoff: 0,
      late: 0,
    };

    getFilteredAttendance().forEach((record) => {
      switch (record.status?.toLowerCase()) {
        case "present":
          stats.present++;
          break;
        case "absent":
          stats.absent++;
          break;
        case "day off":
          stats.dayoff++;
          break;
        case "late":
          stats.late++;
          break;
        default:
          break;
      }
    });

    return stats;
  };
  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.user?.fullName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      teacher.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchAttendance = async (teacherId) => {
    try {
      if (!teacherId) return;
      const res = await callGetTeacherAttendanceByIdApi(teacherId);
      setAttendance(res?.attendance || []);
    } catch (err) {
      toast.error("Failed to fetch attendance.");
      setAttendance([]);
    }
  };

  const getFilteredAttendance = () => {
    if (!selectedTeacherId) return [];

    const now = dayjs();

    return attendance.filter((a) => {
      const recordDate = dayjs(a.date);

      if (filter === "custom" && startDate && endDate) {
        const start = dayjs(startDate);
        const end = dayjs(endDate);
        return (
          recordDate.isSameOrAfter(start, "day") &&
          recordDate.isSameOrBefore(end, "day")
        );
      }

      switch (filter) {
        case "today":
          return recordDate.isSame(now, "day");
        case "weekly":
          return recordDate.isSame(now, "week");
        case "monthly":
          return recordDate.isSame(now, "month");
        case "yearly":
          return recordDate.isSame(now, "year");
        default:
          return true;
      }
    });
  };

  const calculateTotalHours = () => {
    return getFilteredAttendance()
      .reduce((total, a) => {
        if (a.status === "Present" || ("Late" && a.timeIn && a.timeOut)) {
          try {
            const date = dayjs(a.date).format("YYYY-MM-DD");

            let start = dayjs(`${date} ${a.timeIn}`, [
              "YYYY-MM-DD HH:mm",
              "YYYY-MM-DD HH:mm:ss",
              "YYYY-MM-DD hh:mm A",
            ]);
            let end = dayjs(`${date} ${a.timeOut}`, [
              "YYYY-MM-DD HH:mm",
              "YYYY-MM-DD HH:mm:ss",
              "YYYY-MM-DD hh:mm A",
            ]);

            if (end.isBefore(start)) {
              end = end.add(1, "day");
            }

            if (start.isValid() && end.isValid()) {
              const diff = end.diff(start, "minute");
              return total + diff / 60;
            }
          } catch {
            return total;
          }
        }
        return total;
      }, 0)
      .toFixed(2);
  };

  const selectedTeacher = teachers.find((t) => t._id === selectedTeacherId);

  if (loading) return <GlobalLoader />;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <Button
        variant="outline"
        onClick={() => navigate(-1)}
        className="gap-2 text-black"
      >
        <ArrowLeft className="h-4 w-4 text-black" />
        Back
      </Button>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Teacher Attendance History</h1>
        <div className="relative">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search teachers..."
            className="pl-10"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Teachers List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Teachers</CardTitle>
          </CardHeader>
          <CardContent className="p-2 space-y-2">
            {filteredTeachers.map((teacher) => (
              <Button
                key={teacher._id}
                variant={
                  selectedTeacherId === teacher._id ? "secondary" : "ghost"
                }
                onClick={() => {
                  setSelectedTeacherId(teacher._id);
                  fetchAttendance(teacher._id);
                }}
                className="w-full justify-start h-12 text-left px-3"
              >
                <div className="truncate">
                  <p className="font-medium">{teacher.user?.fullName}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {teacher.user?.email}
                  </p>
                </div>
              </Button>
            ))}
            {filteredTeachers.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No teachers found
              </p>
            )}
          </CardContent>
        </Card>

        {/* Attendance Details */}
        <div className="lg:col-span-2 space-y-4">
          {selectedTeacherId ? (
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <CardTitle>
                      {selectedTeacher?.user?.fullName}'s Attendance
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {selectedTeacher?.user?.email}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="p-2 border rounded-md bg-background"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="weekly">This Week</option>
                      <option value="monthly">This Month</option>
                      <option value="yearly">This Year</option>
                      <option value="custom">Custom</option>
                    </select>
                    {filter === "custom" && (
                      <>
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Filtered by: {filter}
                  </span>
                  <Badge variant="outline">
                    Total Hours: {calculateTotalHours()}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600">Presents</p>
                    <p className="text-2xl font-bold text-green-700">
                      {calculateAttendanceStats().present}
                    </p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-600">Absents</p>
                    <p className="text-2xl font-bold text-red-700">
                      {calculateAttendanceStats().absent}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600">Day Offs</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {calculateAttendanceStats().dayoff}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-600">Late Arrivals</p>
                    <p className="text-2xl font-bold text-yellow-700">
                      {calculateAttendanceStats().late}
                    </p>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time In</TableHead>
                      <TableHead>Time Out</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredAttendance().map((a, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {dayjs(a.date).format("MMM D, YYYY")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              a.status === "Present"
                                ? "default"
                                : a.status === "Absent"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {a.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{a.timeIn || "N/A"}</TableCell>
                        <TableCell>{a.timeOut || "N/A"}</TableCell>
                        <TableCell>{a.reason || "N/A"}</TableCell>
                      </TableRow>
                    ))}
                    {getFilteredAttendance().length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">
                          <p className="text-muted-foreground">
                            No attendance records found
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="h-48 flex items-center justify-center">
                <p className="text-muted-foreground">
                  Select a teacher to view attendance
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherAttendanceHistory;
