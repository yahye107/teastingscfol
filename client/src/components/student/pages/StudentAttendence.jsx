import React, { useState, useEffect, useMemo } from 'react';
import { 
  callGetSummaryStudentAttendanceApi,
  callGetLoggedInStudentAttendanceApi,
  callGetSubjectAttendenceBystudentApi
} from "@/service/service";
import { ClipLoader } from 'react-spinners';
import { 
  format, 
  parseISO, 
  isToday, 
  isThisWeek, 
  startOfWeek, 
  endOfWeek
} from 'date-fns';
import GlobalLoader from "@/components/common/GlobalLoader";

const StudentAttendancePage = () => {
  const [attendance, setAttendance] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filters, setFilters] = useState({
    subject: 'all',
    academicYear: 'all',
    month: 'all',
    year: 'all'
  });
  const [loading, setLoading] = useState({
    initial: true,
    attendance: true,
    subjects: true
  });
  const [academicYears, setAcademicYears] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState('today'); // 'today', 'week', 'allTime'
  const [error, setError] = useState(null);

  // Status colors for UI
  const statusColors = {
    Present: 'bg-green-100 text-green-800',
    Absent: 'bg-red-100 text-red-800',
    Late: 'bg-yellow-100 text-yellow-800',
    Excused: 'bg-blue-100 text-blue-800'
  };

  // Months for filter
  const months = [
    { value: 'all', label: 'All Months' },
    { value: '0', label: 'January' },
    { value: '1', label: 'February' },
    { value: '2', label: 'March' },
    { value: '3', label: 'April' },
    { value: '4', label: 'May' },
    { value: '5', label: 'June' },
    { value: '6', label: 'July' },
    { value: '7', label: 'August' },
    { value: '8', label: 'September' },
    { value: '9', label: 'October' },
    { value: '10', label: 'November' },
    { value: '11', label: 'December' }
  ];

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Set timeout to handle slow API responses
        const timeout = setTimeout(() => {
          if (loading.initial) {
            setError("Taking longer than expected. Please check your internet connection.");
          }
        }, 10000); // 10 seconds timeout

        // Fetch subjects
        const subjectsRes = await callGetSubjectAttendenceBystudentApi();
        setSubjects(subjectsRes.data.subjects || []);
        setLoading(prev => ({ ...prev, subjects: false }));

        // Fetch attendance
        const attendanceRes = await callGetLoggedInStudentAttendanceApi();
        setAttendance(attendanceRes.data.records || []);
        setLoading(prev => ({ ...prev, attendance: false }));

        // Extract unique academic years
        const years = [...new Set(attendanceRes.data.records.map(item => item.academicYear))];
        setAcademicYears(years);
        
        clearTimeout(timeout);
        setLoading(prev => ({ ...prev, initial: false }));
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load data. Please try again later.");
        setLoading({ initial: false, attendance: false, subjects: false });
      }
    };

    fetchData();
  }, []);

  // Get today's attendance
  const todaysAttendance = useMemo(() => {
    return attendance.filter(record => {
      const recordDate = parseISO(record.date);
      return isToday(recordDate);
    });
  }, [attendance]);

  // Get this week's attendance
  const weekAttendance = useMemo(() => {
    return attendance.filter(record => {
      const recordDate = parseISO(record.date);
      return isThisWeek(recordDate, { weekStartsOn: 1 });
    });
  }, [attendance]);

  // Calculate summary for a given set of records
  const calculateSummary = (records) => {
    const summary = {
      Present: 0,
      Absent: 0,
      Late: 0,
      Excused: 0,
      total: records.length
    };
    
    records.forEach(record => {
      if (summary.hasOwnProperty(record.status)) {
        summary[record.status]++;
      }
    });
    
    return summary;
  };

  // Get summary for active view
  const activeSummary = useMemo(() => {
    switch(activeView) {
      case 'today': 
        return calculateSummary(todaysAttendance);
      case 'week': 
        return calculateSummary(weekAttendance);
      case 'allTime': 
        return calculateSummary(attendance);
      default:
        return calculateSummary(attendance);
    }
  }, [activeView, todaysAttendance, weekAttendance, attendance]);

  // Get unique years from attendance records
  const availableYears = useMemo(() => {
    const years = new Set();
    attendance.forEach(record => {
      const year = parseISO(record.date).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [attendance]);

  // Apply filters to attendance records
  const filteredAttendance = useMemo(() => {
    let result = attendance;
    
    // Apply subject filter
    if (filters.subject !== 'all') {
      result = result.filter(record => record.subject === filters.subject);
    }
    
    // Apply academic year filter
    if (filters.academicYear !== 'all') {
      result = result.filter(record => record.academicYear === filters.academicYear);
    }
    
    // Apply month filter
    if (filters.month !== 'all') {
      result = result.filter(record => {
        const recordDate = parseISO(record.date);
        return recordDate.getMonth() === parseInt(filters.month);
      });
    }
    
    // Apply year filter
    if (filters.year !== 'all') {
      result = result.filter(record => {
        const recordDate = parseISO(record.date);
        return recordDate.getFullYear() === parseInt(filters.year);
      });
    }
    
    // Apply search term
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(record => {
        return (
          record.subject.toLowerCase().includes(lowerSearch) ||
          record.status.toLowerCase().includes(lowerSearch) ||
          record.markedBy.toLowerCase().includes(lowerSearch) ||
          record.academicYear.toLowerCase().includes(lowerSearch) ||
          format(parseISO(record.date), 'MMM dd, yyyy').toLowerCase().includes(lowerSearch)
        );
      });
    }
    
    return result;
  }, [attendance, filters, searchTerm]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Format date for display
  const formatDate = (dateString) => {
    return format(parseISO(dateString), 'MMM dd, yyyy');
  };

  // Format date for time display
  const formatTime = (dateString) => {
    return format(parseISO(dateString), 'hh:mm a');
  };

  // Render records for current view
  const renderRecords = () => {
    if (loading.attendance) {
      return (
        <div className="flex justify-center py-12">
          <ClipLoader size={40} color="#3B82F6" />
          <p className="ml-3 text-gray-600">Loading attendance records...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12 text-red-500">
          <p className="mb-2">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      );
    }

    switch(activeView) {
      case 'today':
        if (todaysAttendance.length === 0) {
          return <div className="text-center py-12 text-gray-500">No attendance records for today</div>;
        }
        
        return todaysAttendance.map(record => (
          <div 
            key={record._id} 
            className={`p-4 rounded-lg ${statusColors[record.status]} mb-3`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg">{record.subject}</h3>
                <p className="text-sm">{formatTime(record.date)}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${statusColors[record.status]}`}>
                {record.status}
              </span>
            </div>
            <p className="mt-2 text-sm">Marked by: {record.markedBy}</p>
          </div>
        ));
        
      case 'week':
        if (weekAttendance.length === 0) {
          return <div className="text-center py-12 text-gray-500">No attendance records for this week</div>;
        }
        
        // Group records by day
        const groupedByDay = weekAttendance.reduce((acc, record) => {
          const dateStr = format(parseISO(record.date), 'yyyy-MM-dd');
          if (!acc[dateStr]) {
            acc[dateStr] = [];
          }
          acc[dateStr].push(record);
          return acc;
        }, {});
        
        return Object.entries(groupedByDay).map(([date, records]) => (
          <div key={date} className="mb-6">
            <h3 className="font-bold text-lg mb-3">
              {format(parseISO(date), 'EEEE, MMMM d')}
            </h3>
            {records.map(record => (
              <div 
                key={record._id} 
                className={`p-4 rounded-lg ${statusColors[record.status]} mb-3`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{record.subject}</h4>
                    <p className="text-sm">{formatTime(record.date)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${statusColors[record.status]}`}>
                    {record.status}
                  </span>
                </div>
                <p className="mt-2 text-sm">Marked by: {record.markedBy}</p>
              </div>
            ))}
          </div>
        ));
        
      case 'allTime':
        return (
          <>
            {/* Filters Section */}
            <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <select
                    name="subject"
                    value={filters.subject}
                    onChange={handleFilterChange}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={loading.subjects}
                  >
                    <option value="all">All Subjects</option>
                    {subjects.map(subject => (
                      <option key={subject._id} value={subject.name}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Academic Year
                  </label>
                  <select
                    name="academicYear"
                    value={filters.academicYear}
                    onChange={handleFilterChange}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Years</option>
                    {academicYears.map(year => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Month
                  </label>
                  <select
                    name="month"
                    value={filters.month}
                    onChange={handleFilterChange}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {months.map(month => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year
                  </label>
                  <select
                    name="year"
                    value={filters.year}
                    onChange={handleFilterChange}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Years</option>
                    {availableYears.map(year => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div> */}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setFilters({ 
                    subject: 'all', 
                    academicYear: 'all',
                    month: 'all',
                    year: 'all'
                  })}
                  className="py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Attendance Records */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-5 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-xl font-semibold">Attendance History</h2>
                <div className="w-full md:w-64">
                  <input
                    type="text"
                    placeholder="Search Date, Subject, Status, Marked By, Academic Year..."
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              {filteredAttendance.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marked By</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Year</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredAttendance.map(record => (
                        <tr key={record._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            {formatDate(record.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {record.subject}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-full text-sm ${statusColors[record.status]}`}>
                              {record.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {formatTime(record.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {record.markedBy}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {record.academicYear}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No attendance records found
                </div>
              )}
            </div>
          </>
        );
    }
  };

  if (loading.initial) {
    return <GlobalLoader />;
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <h2 className="text-xl text-red-600 mb-4">{error}</h2>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Attendance</h1>
        <p className="text-gray-600 mt-2">
          Track your class attendance records and statistics
        </p>
      </div>

      {/* View Selector */}
      <div className="flex mb-6 border-b">
        <button
          className={`py-3 px-6 font-medium text-sm ${
            activeView === 'today' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveView('today')}
        >
          Today
        </button>
        <button
          className={`py-3 px-6 font-medium text-sm ${
            activeView === 'week' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveView('week')}
        >
          This Week
        </button>
        <button
          className={`py-3 px-6 font-medium text-sm ${
            activeView === 'allTime' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveView('allTime')}
        >
          All Time
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {Object.entries(activeSummary).map(([status, count]) => (
          <div 
            key={status}
            className={`p-4 rounded-xl shadow-sm text-center ${
              status === 'total' 
                ? 'bg-gray-50 border' 
                : statusColors[status]
            }`}
          >
            <div className="text-2xl font-bold">{count}</div>
            <div className="text-md mt-1">
              {status === 'total' ? 'Total Records' : status}
            </div>
          </div>
        ))}
      </div>

      {/* Records Section */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-xl font-semibold mb-4">
          {activeView === 'today' && "Today's Attendance"}
          {activeView === 'week' && "This Week's Attendance"}
          {activeView === 'allTime' && "All Attendance Records"}
        </h2>
        
        {renderRecords()}
      </div>
    </div>
  );
};

export default StudentAttendancePage;