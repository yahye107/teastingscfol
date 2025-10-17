import axios from "axios";

export const callloginUserApi = async (formData) => {
  const Response = await axios.post(
    "http://localhost:5000/api/auth/login",
    formData,
    { withCredentials: true }
  );
  return Response.data;
};
export const callAuthApi = async () => {
  const Response = await axios.get(
    "http://localhost:5000/api/auth/protected",
    { withCredentials: true } // Config as the second parameter
  );
  return Response.data;
};

export const calllogoutUserApi = async (formData) => {
  // Remove formData parameter
  const Response = await axios.post(
    "http://localhost:5000/api/auth/logout",
    {}, // Empty payload
    {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return Response.data;
};
export const callDeleteUserApi = async (id) => {
  const Response = await axios.delete(
    `http://localhost:5000/api/auth/users/${id}`,
    {
      withCredentials: true,
    }
  );
  return Response.data;
};
export const callGetUsersApi = async (search = "") => {
  const Response = await axios.get(`http://localhost:5000/api/auth/all`, {
    withCredentials: true,
  });
  return Response.data;
};
export const callUpdateUserStatusApi = async (userId, status) => {
  const response = await axios.post(
    `http://localhost:5000/api/auth/users/${userId}/status`,
    { status },
    {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};
//////////////////
export const callregisterParentssApi = async (formData) => {
  const Response = await axios.post(
    "http://localhost:5000/api/auth/Parents",
    formData,
    {
      withCredentials: true,
    }
  );
  return Response.data;
};
// Get all parents
export const callGetAllParentsApi = async () => {
  const response = await axios.get(
    "http://localhost:5000/api/auth/allparents",
    {
      withCredentials: true,
    }
  );
  return response.data;
};
// Delete a parent
export const callDeleteParentApi = async (parentId) => {
  const response = await axios.delete(
    `http://localhost:5000/api/auth/Parents/${parentId}`,
    { withCredentials: true }
  );
  return response.data;
};

export const callGetParentByIdApi = async (id) => {
  const response = await axios.get(
    `http://localhost:5000/api/auth/allparents/${id}`,
    { withCredentials: true }
  );
  return response.data;
};

// Update Parent
export const callUpdateParentApi = async (id, formData) => {
  const response = await axios.put(
    `http://localhost:5000/api/auth/Parents/${id}`,
    formData,
    { withCredentials: true }
  );
  return response.data;
};
// Get children for a specific parent
export const callGetParentChildrenApi = async (parentId) => {
  const response = await axios.get(
    `http://localhost:5000/api/auth/${parentId}/children`,
    {
      withCredentials: true,
    }
  );
  return response.data;
};
// Create a staff
export const callCreateStaffApi = async (formData) => {
  const response = await axios.post(
    "http://localhost:5000/api/auth/staff",
    formData,
    { withCredentials: true }
  );
  return response.data;
};

// Get all staff
export const callGetAllStaffApi = async () => {
  const response = await axios.get("http://localhost:5000/api/auth/staff", {
    withCredentials: true,
  });
  return response.data;
};

// Get a single staff by ID
export const callGetStaffByIdApi = async (id) => {
  const response = await axios.get(
    `http://localhost:5000/api/auth/staff/${id}`,
    { withCredentials: true }
  );
  return response.data;
};

// Update staff info
export const callUpdateStaffApi = async (id, formData) => {
  const response = await axios.put(
    `http://localhost:5000/api/auth/staff/${id}`,
    formData,
    { withCredentials: true }
  );
  return response.data;
};

// Delete staff
export const callDeleteStaffApi = async (id) => {
  const response = await axios.delete(
    `http://localhost:5000/api/auth/staff/${id}`,
    { withCredentials: true }
  );
  return response.data;
};
export const callregisterStudetsApi = async (formData) => {
  const Response = await axios.post(
    "http://localhost:5000/api/auth/student",
    formData,
    {
      withCredentials: true,
    }
  );
  return Response.data;
};
export const callGetAllClassesApi = async () => {
  const response = await axios.get(
    "http://localhost:5000/api/class/getallclassroom",
    {
      withCredentials: true,
    }
  );
  return response.data;
};
export const callUpdateStudentApi = async (studentId, formData) => {
  try {
    const response = await axios.put(
      `http://localhost:5000/api/auth/Upstudent/${studentId}`,
      formData,
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating student:", error);
    throw error;
  }
};

// Delete Student by ID
export const callDeleteStudentApi = async (studentId) => {
  try {
    const response = await axios.delete(
      `http://localhost:5000/api/auth/Destudent/${studentId}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting student:", error);
    throw error;
  }
};

// Get All Students
export const callGetAllStudentsApi = async () => {
  try {
    const response = await axios.get(
      "http://localhost:5000/api/auth/student/getAll",
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error getting all students:", error);
    throw error;
  }
};
export const callGetAllStudentsidbyApi = async (id) => {
  try {
    const response = await axios.get(
      `http://localhost:5000/api/auth/student/getAll/${id}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error getting all students:", error);
    throw error;
  }
};
export const makeStudentPayment = async (studentId, paymentData) => {
  const response = await axios.post(
    `http://localhost:5000/api/auth/payStudents${studentId}`,
    paymentData
  );
  return response.data;
};
////
export const callCreateTeacherApi = async (formData) => {
  const response = await axios.post(
    "http://localhost:5000/api/auth/teacher",
    formData,
    {
      withCredentials: true,
    }
  );
  return response.data;
};

// Get All Teachers
export const callGetAllTeachersApi = async () => {
  const response = await axios.get("http://localhost:5000/api/auth/teachers", {
    withCredentials: true,
  });
  return response.data;
};

// Get Single Teacher by ID
export const callGetTeacherByIdApi = async (teacherId) => {
  const response = await axios.get(
    `http://localhost:5000/api/auth/teacher/${teacherId}`,
    {
      withCredentials: true,
    }
  );
  return response.data;
};

// Update Teacher by ID
export const callUpdateTeacherApi = async (teacherId, formData) => {
  const response = await axios.put(
    `http://localhost:5000/api/auth/teacher/${teacherId}`,
    formData,
    {
      withCredentials: true,
    }
  );
  return response.data;
};

// Delete Teacher by ID
export const callDeleteTeacherApi = async (teacherId) => {
  const response = await axios.delete(
    `http://localhost:5000/api/auth/teacher/${teacherId}`,
    {
      withCredentials: true,
    }
  );
  return response.data;
};
// export const callCreateSubjectApi = async (formData) => {
//   const response = await axios.post(
//     "http://localhost:5000/api/auth/subjects",
//     formData,
//     {
//       withCredentials: true,
//     }
//   );
//   return response.data;
// };
export const callGetAllsubjectssApi = async () => {
  const response = await axios.get("http://localhost:5000/api/auth/subjects", {
    withCredentials: true,
  });
  return response.data;
};

/////////////////////////////
export const callCreateHallApi = async (formData) => {
  const response = await axios.post(
    "http://localhost:5000/api/auth/hall",
    formData
  );
  return response.data;
};

// Get all Halls
export const callGetAllHallsApi = async () => {
  const response = await axios.get("http://localhost:5000/api/auth/halls");
  return response.data;
};

// Get Hall by Hall Number
export const callGetHallByNumberApi = async (hallNumber) => {
  const response = await axios.get(
    `http://localhost:5000/api/auth/hall/${hallNumber}`
  );
  return response.data;
};

// Get Exam Classes in a Hall
export const callGetHallExamClassesApi = async (hallId) => {
  const response = await axios.get(
    `http://localhost:5000/api/auth/hall/exam-classes/${hallId}`
  );
  return response.data;
};
export const callUpdateHallApi = async (hallId, formData) => {
  const response = await axios.put(
    `http://localhost:5000/api/auth/hall/${hallId}`,
    formData
  );
  return response.data;
};

// ✅ Delete Hall
export const callDeleteHallApi = async (hallId) => {
  const response = await axios.delete(
    `http://localhost:5000/api/auth/hall/${hallId}`
  );
  return response.data;
};
////////////////////////////////////

// Create a Classroom
export const callCreateClassroomApi = async (formData) => {
  const response = await axios.post(
    "http://localhost:5000/api/class/classroom/create",
    formData,
    {
      withCredentials: true,
    }
  );
  return response.data;
};

// Get All Classrooms
export const callGetAllClassroomsApi = async () => {
  const response = await axios.get(
    "http://localhost:5000/api/class/getallclassroom",
    {
      withCredentials: true,
    }
  );
  return response.data;
};

// Get Classroom by Classroom ID
export const callupdateClassroomApi = async (classroomId, formData) => {
  const response = await axios.put(
    `http://localhost:5000/api/class/classroom/${classroomId}`,
    formData, // Data payload
    {
      // Config as 3rd argument
      withCredentials: true,
    }
  );
  return response.data;
};

// Get Classrooms by Grade
export const callGetClassroomsByGradeApi = async (grade) => {
  const response = await axios.get(
    `http://localhost:5000/api/class/classroom/grade/${grade}`,
    {
      withCredentials: true,
    }
  );
  return response.data;
};

// Get Specific Classroom by Grade and Section
export const callGetClassroomByGradeAndSectionApi = async (grade, section) => {
  const response = await axios.get(
    `http://localhost:5000/api/class/classroom/${grade}/${section}`,
    {
      withCredentials: true,
    }
  );
  return response.data;
};

// Get Students by Classroom ID
export const callGetStudentsByClassroomApi = async (classroomId) => {
  const response = await axios.get(
    `http://localhost:5000/api/class/getstudentsClass/${classroomId}`,
    {
      withCredentials: true,
    }
  );
  return response.data;
};
//
export const callDeleteClassroomApi = async (classroomId) => {
  try {
    const response = await axios.delete(
      `http://localhost:5000/api/class/classroom/${classroomId}`,
      {
        withCredentials: true,
      }
    );
    return response.data; // Return the response from the server
  } catch (error) {
    console.error(
      "Error deleting classroom:",
      error.response ? error.response.data : error.message
    );
    throw error; // Re-throw the error for further handling if needed
  }
};
//////////////////
export const callCreateSubjectApi = async (formData) => {
  const response = await axios.post(
    "http://localhost:5000/api/auth/subjects",
    formData,
    { withCredentials: true }
  );
  return response.data;
};

// Get All Subjects
// export const callGetAllSubjectsApi = async () => {
//   const response = await axios.get("http://localhost:5000/api/auth/subjects", {
//     withCredentials: true,
//   });
//   return response.data;
// };

// Get Subject by ID
export const callGetSubjectByIdApi = async (subjectId) => {
  const response = await axios.get(
    `http://localhost:5000/api/auth/subjects/${subjectId}`,
    { withCredentials: true }
  );
  return response.data;
};

// Update Subject
export const callUpdateSubjectApi = async (subjectId, formData) => {
  const response = await axios.put(
    `http://localhost:5000/api/auth/subjects/${subjectId}`,
    formData,
    { withCredentials: true }
  );
  return response.data;
};

// Delete Subject
export const callDeleteSubjectApi = async (subjectId) => {
  const response = await axios.delete(
    `http://localhost:5000/api/auth/subjects/${subjectId}`,
    { withCredentials: true }
  );
  return response.data;
};
// Assign Subjects to Teacher
// service.js - Fix the API call function
export const callAssignSubjectsToTeacherApi = async (data) => {
  try {
    const response = await axios.post(
      "http://localhost:5000/api/auth/subjects/addSubjects",
      data, // Send the entire data object
      {
        withCredentials: true,
        // headers: {
        //   "Content-Type": "application/json",
        // },
      }
    );
    return response;
  } catch (error) {
    console.error("API call error:", error);
    throw error;
  }
};
export const callRemoveSubjectsFromTeacherApi = async (data) => {
  try {
    const response = await axios.delete(
      "http://localhost:5000/api/auth/subjects/deleteSubjects",
      {
        data, // For DELETE requests with body
        withCredentials: true,
        // headers: {
        //   "Content-Type": "application/json",
        // },
      }
    );
    return response;
  } catch (error) {
    console.error("Remove subjects API call error:", error);
    throw error;
  }
};

/////////////
// Create or update a teacher's timetable
export const callCreateOrUpdateTimetableApi = async (formData) => {
  const response = await axios.post(
    "http://localhost:5000/api/class/timetable/create",
    formData,
    {
      withCredentials: true,
    }
  );
  return response.data;
};

// Get teacher's full weekly timetable
export const callGetTeacherWeeklyTimetableApi = async (teacherId) => {
  const response = await axios.get(
    `http://localhost:5000/api/class/timetable/teacher/${teacherId}`,
    {
      withCredentials: true,
    }
  );
  return response.data;
};

// Get teacher's today's timetable
export const callGetTeacherTodayTimetableApi = async (teacherId) => {
  const response = await axios.get(
    `http://localhost:5000/api/class/timetable/teacher/today/${teacherId}`,
    {
      withCredentials: true,
    }
  );
  return response.data;
};

// Get student's full weekly timetable
export const callGetStudentWeeklyTimetableApi = async (classId) => {
  const response = await axios.get(
    `http://localhost:5000/api/class/timetable/student/${classId}`,
    {
      withCredentials: true,
    }
  );
  return response.data;
};

// Get student's today's timetable
export const callGetStudentTodayTimetableApi = async (classId) => {
  const response = await axios.get(
    `http://localhost:5000/api/class/timetable/student/today/${classId}`,
    {
      withCredentials: true,
    }
  );
  return response.data;
};
// Update timetable API call
// Update API calls to match backend endpoints
export const callUpdateTimetableApi = async (timetableId, updates) => {
  const response = await axios.put(
    `http://localhost:5000/api/class/timetable/${timetableId}`,
    updates,
    { withCredentials: true }
  );
  return response.data;
};

export const callDeleteTimetableApi = async (teacherId, timetableId) => {
  const response = await axios.delete(
    `http://localhost:5000/api/class/timetable/${teacherId}/${timetableId}`,
    { withCredentials: true }
  );
  return response.data;
};

// Get all timetables
export const callGetAllTimetablesApi = async () => {
  const response = await axios.get(
    "http://localhost:5000/api/class/timetable",
    {
      withCredentials: true,
    }
  );
  return response.data;
};
export const callGetClassTodayTimetableApi = async (classId) => {
  const response = await axios.get(
    `http://localhost:5000/api/class/timetable/today/${classId}`,
    {
      withCredentials: true,
    }
  );
  return response.data;
};
export const callGetClassWeeklyTimetableApi = async (classId) => {
  const response = await axios.get(
    `http://localhost:5000/api/class/timetable/weekly/${classId}`,
    {
      withCredentials: true,
    }
  );
  return response.data;
};
// export const callDeleteEventApi = async (eventId) => {
//   try {
//     const response = await axios.delete(
//       `http://localhost:5000/api/event/Event`, // your route URL (adjust if needed)
//       {
//         data: { id: eventId }, // send eventId in the request body or adjust to your backend
//         withCredentials: true,
//       }
//     );
//     return response.data;
//   } catch (error) {
//     throw error.response?.data || error.message;
//   }
// };
export const callGetAllEventsAndAnnouncementsApi = async () => {
  const response = await axios.get(
    "http://localhost:5000/api/auth/alleventsAnnoncemnt",
    {
      withCredentials: true,
    }
  );
  return response.data;
};
/////////////////////////////////////
export const callCreateGeneralEventApi = async (formData) => {
  const response = await axios.post(
    "http://localhost:5000/api/auth/admin/create",
    formData,
    {
      withCredentials: true,
    }
  );
  return response.data;
};
export const callCreateGeneralAnouncementApi = async (formData) => {
  const response = await axios.post(
    "http://localhost:5000/api/auth/admin/Anouncementcreate",
    formData,
    {
      withCredentials: true,
    }
  );
  return response.data;
};
// ✅ Teacher creates class event
export const callCreateClassEventApi = async (formData) => {
  const response = await axios.post(
    "http://localhost:5000/api/auth/teacher/create",
    formData,
    {
      withCredentials: true,
    }
  );
  return response.data;
};

// ✅ Delete an event (by ID probably passed in formData or query)
export const callDeleteEventApi = async (eventId) => {
  const response = await axios.delete(
    `http://localhost:5000/api/auth/event/Event/${eventId}`, // id in URL param
    {
      withCredentials: true,
    }
  );
  return response.data;
};

// ✅ Get events based on user (role/class based logic in controller)
export const callGetEventsForUserApi = async () => {
  const response = await axios.get(
    "http://localhost:5000/api/auth/event/user",
    {
      withCredentials: true,
    }
  );
  return response.data;
};
export const callGetAnnouncementsForUserApi = async () => {
  const response = await axios.get(
    "http://localhost:5000/api/auth/event/announcements",
    {
      withCredentials: true,
    }
  );
  return response.data;
};
/////////////////////////
export const callMarkTeacherAttendanceApi = async (data) => {
  const response = await axios.post(
    `http://localhost:5000/api/auth/markTeacherAttendence`,
    data,
    { withCredentials: true }
  );
  return response.data;
};
export const callGetTodayTeacherAttendanceApi = async (data) => {
  const response = await axios.get(
    `http://localhost:5000/api/auth/TeacherAttendenceTodey`,
    { withCredentials: true }
  );
  return response.data;
};

// ✅ Update teacher attendance
export const callUpdateTeacherAttendanceApi = async (id, data) => {
  const response = await axios.put(
    `http://localhost:5000/api/auth/markTeacherAttendence/${id}`,
    data,
    { withCredentials: true }
  );
  return response.data;
};

// ✅ Get all teacher attendance
export const callGetAllTeacherAttendanceApi = async () => {
  const response = await axios.get(
    `http://localhost:5000/api/auth/getTeacherAttendence`,
    { withCredentials: true }
  );
  return response.data;
};

// ✅ Get attendance history for one teacher by ID
export const callGetTeacherAttendanceByIdApi = async (teacherId) => {
  const response = await axios.get(
    `http://localhost:5000/api/auth/teacher-attendance/${teacherId}`,
    { withCredentials: true }
  );
  return response.data;
};
///////////////

// ✅ Create new exam
export const callCreateExamApi = async (data) => {
  const response = await axios.post(
    `http://localhost:5000/api/class/EaxmTable/createExamtable`,
    data,
    { withCredentials: true }
  );
  return response.data;
};

// ✅ Update existing exam
export const callUpdateExamApi = async (id, data) => {
  const response = await axios.put(
    `http://localhost:5000/api/class/EaxmTable/update/${id}`,
    data,
    { withCredentials: true }
  );
  return response.data;
};

// ✅ Delete an exam
export const callDeleteExamApi = async (id) => {
  const response = await axios.delete(
    `http://localhost:5000/api/class/EaxmTable/delete/${id}`,
    { withCredentials: true }
  );
  return response.data;
};
export const callGetStudentHallApi = async (studentId) => {
  const response = await axios.get(
    `http://localhost:5000/api/class/EaxmTable/${studentId}`,
    { withCredentials: true }
  );
  return response.data;
};
export const callGetStudentsByHallApi = async (examId, hallId) => {
  const response = await axios.get(
    `http://localhost:5000/api/class/exams/${examId}/halls/${hallId}/students`,
    { withCredentials: true }
  );
  return response.data;
};
export const callGetStudentsByExamTitleAndHallApi = async (title, hallId) => {
  const encodedTitle = encodeURIComponent(title); // Make URL safe
  const response = await axios.get(
    `http://localhost:5000/api/class/exams/title/${encodedTitle}/hall/${hallId}`,
    { withCredentials: true }
  );
  return response.data;
};
export const callGetAllExamApi = async () => {
  const response = await axios.get(
    `http://localhost:5000/api/class/EaxmTable/all-exams`,
    { withCredentials: true }
  );
  return response.data;
};
// ✅ Get exam timetable for a class
export const callGetClassExamTableApi = async (classId) => {
  const response = await axios.get(
    `http://localhost:5000/api/class/EaxmTable/class/${classId}`,
    { withCredentials: true }
  );
  return response.data;
};

// ✅ Get exam timetable for a student
export const callGetStudentExamTableApi = async (studentId) => {
  const response = await axios.get(
    `http://localhost:5000/api/class/EaxmTable/student/${studentId}`,
    { withCredentials: true }
  );
  return response.data;
};
///////////////////////////
const API_URL = "http://localhost:5000/api";

// Teacher APIs
export const callMarkStudentAttendanceApi = async (userId, data) => {
  return axios.post(
    `http://localhost:5000/api/class/attendance/mark/${userId}`,
    data,
    {
      withCredentials: true,
    }
  );
};

export const callUpdateAttendanceApi = async (attendanceId, status) => {
  return axios.put(
    `http://localhost:5000/api/class/attendance/${attendanceId}`,
    { status },
    {
      withCredentials: true,
    }
  );
};

export const callGetDailySummaryApi = async (classId, date) => {
  return axios.get(`http://localhost:5000/api/class/attendance/daily-summary`, {
    params: { classId, date },
    withCredentials: true,
  });
};

// Student APIs
export const callGetStudentAttendanceApi = (
  studentId,
  startDate,
  endDate,
  academicYear
) => {
  return axios.get(
    `http://localhost:5000/api/class/attendance/student/${studentId}`,
    {
      params: { startDate, endDate, academicYear },
    }
  );
};
// In service.js
// In service.js - CORRECTED VERSION
export const callGetAttendanceByAcademicYearApi = async (
  studentId,
  academicYear
) => {
  return axios.get(
    `http://localhost:5000/api/class/attendance/by-academic-year/${studentId}?academicYear=${academicYear}`,
    {
      withCredentials: true,
    }
  );
};
export const callGetMonthlySummaryApi = async (studentId) => {
  return axios.get(
    `http://localhost:5000/api/class/attendance/monthly/${studentId}`,
    {
      withCredentials: true,
    }
  );
};

// service.js
export const callGetAttendanceRatesForClassApi = (classId, academicYear) => {
  return axios.get(
    `http://localhost:5000/api/class/attendance/rates/${classId}`,
    {
      params: { academicYear },
    }
  );
};

export const callGetAttendanceRatesBySubjectApi = (
  classId,
  subjectId,
  academicYear
) => {
  return axios.get(
    `http://localhost:5000/api/class/${classId}/subject/${subjectId}`,
    {
      params: { academicYear },
    }
  );
};

// ✅ Fetch logged-in student's attendance records
export const callGetSubjectAttendenceBystudentApi = () => {
  return axios.get("http://localhost:5000/api/class/student/subjects", {
    withCredentials: true, // needed if your auth uses cookies
  });
};
export const callGetLoggedInStudentAttendanceApi = () => {
  return axios.get("http://localhost:5000/api/class/student/myself", {
    withCredentials: true, // needed if your auth uses cookies
  });
};
export const callGetSummaryStudentAttendanceApi = () => {
  return axios.get("http://localhost:5000/api/class/student/summary", {
    withCredentials: true, // needed if your auth uses cookies
  });
};
export const callGetClassAttendanceReportApi = async (
  classId,
  fromDate,
  toDate
) => {
  return axios.get(
    `http://localhost:5000/api/class/attendance/reports/class/${classId}`,
    {
      params: { fromDate, toDate },
      withCredentials: true,
    }
  );
};

export const callBulkUpdateAttendanceApi = async (updates) => {
  return axios.put(
    `http://localhost:5000/api/class/attendance/bulk-update`,
    { updates },
    {
      withCredentials: true,
    }
  );
};

export const callGetAttendanceTrendsApi = async (classId, timeframe) => {
  return axios.get(
    `http://localhost:5000/api/class/attendance/trends/class/${classId}`,
    {
      params: { timeframe },
      withCredentials: true,
    }
  );
};

// Threshold check (typically used in background tasks)
export const callCheckAttendanceThresholdApi = async (studentId) => {
  return axios.post(
    `http://localhost:5000/api/class/attendance/attendance/threshold-check/${studentId}`,
    {
      withCredentials: true,
    }
  );
};

export const callSubmitResultsForClassSubjectApi = async (teacherId, data) => {
  try {
    const response = await axios.post(
      `http://localhost:5000/api/class/results/${teacherId}`,
      {
        classId: data.classId,
        subjectId: data.subjectId,
        academicYear: data.academicYear,
        results: data.results,
      },
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to submit results"
    );
  }
};

export const callUpdateResultForStudentApi = async (
  resultId,
  updatedResultData
) => {
  try {
    const response = await axios.put(
      `http://localhost:5000/api/class/results/${resultId}`,
      {
        // Send only required fields
        firstExam: updatedResultData.firstExam,
        midExam: updatedResultData.midExam,
        thirdExam: updatedResultData.thirdExam,
        finalExam: updatedResultData.finalExam,
        activities: updatedResultData.activities,
        updatedBy: updatedResultData.updatedBy,
      },
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.message;
    console.error("API call failed:", errorMessage);
    throw new Error(errorMessage);
  }
};
// In your service file
export const updateStudentResultApi = async (resultId, data) => {
  try {
    const response = await axios.put(
      `http://localhost:5000/api/class/update/${resultId}`,
      data,
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating result:", error);
    throw error.response?.data || error;
  }
};

export const callGetStudentResultsApi = async (studentId, academicYear) => {
  return axios.get(
    `http://localhost:5000/api/class/results/student/${studentId}`,
    {
      params: { academicYear }, // Send academicYear as query parameter
      withCredentials: true,
    }
  );
};
export const callGetRegisteredAcademicYearsApi = async () => {
  try {
    const response = await axios.get(
      "http://localhost:5000/api/class/results/academicyear",
      {
        withCredentials: true,
      }
    );
    return response.data.academicYears; // returns an array of years
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || "Failed to fetch academic years";
    console.error("Academic year fetch error:", errorMessage);
    throw new Error(errorMessage);
  }
};

export const callGetResultsByClassSubjectYearApi = async (
  classId,
  subjectId,
  academicYear
) => {
  try {
    const response = await axios.get(
      "http://localhost:5000/api/class/results",
      {
        params: {
          classId: classId.toString(), // Ensure string format
          subjectId: subjectId.toString(),
          academicYear,
        },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("API Error:", error.response?.data);
    throw new Error(error.response?.data?.message || "Failed to get results");
  }
};

// ✅ Bulk update results
// Update your bulk update API call
export const callBulkUpdateResultsApi = async (payload) => {
  try {
    const response = await axios.put(
      "http://localhost:5000/api/class/bulk",
      payload,
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    console.error("Bulk update error:", errorMessage);
    throw new Error(errorMessage);
  }
};
// service/service.js
export const callGetClassOverviewApi = async (classId, academicYear) => {
  const response = await axios.get(
    `http://localhost:5000/api/class/ResultMark/${classId}`,
    {
      params: { academicYear }, // Pass as query parameter
    }
  );
  return response.data;
};
////////////////
// export const callCreateAssignmentApi = async (userId, data) => {
//   try {
//     const response = await axios.post("http://localhost:5000/api/class/assignment/create", data);
//     return response.data;
//   } catch (error) {
//     console.error("Assignment creation failed:", error.message);
//     throw new Error("Failed to create assignment.");
//   }
// };
export const callCreateAssignmentApi = async (userId, data) => {
  return axios.post(
    `http://localhost:5000/api/class/assignments/create/${userId}`,
    data, // Remove teacherId from data
    {
      withCredentials: true,
    }
  );
};
// ✅ 4. Get all assignments for logged-in student
export const callGetStudentAssignments = async () => {
  try {
    const response = await axios.get(
      "http://localhost:5000/api/class/assignments/student",
      {
        withCredentials: true, // 🟢 VERY IMPORTANT: sends the session cookie
      }
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch student assignments:", error.message);
    throw new Error("Assignment fetch error");
  }
};

// ✅ 5. Get all student statuses for a specific assignment
export const callGetAssignmentStatus = async (assignmentId) => {
  try {
    const response = await axios.get(
      `http://localhost:5000/api/class/assignments/status/${assignmentId}`
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch assignment status:", error.message);
    throw new Error("Status fetch error");
  }
};

// ✅ 6. Mark an assignment as viewed
export const callMarkAssignmentViewed = async ({ studentId, assignmentId }) => {
  try {
    const response = await axios.post(
      "http://localhost:5000/api/class/assignments/viewed",
      { studentId, assignmentId },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Error marking viewed:", error.message);
    throw new Error("Viewing error");
  }
};

// frontend
export const callGetAssignmentDetails = async (assignmentId, search = "") => {
  const response = await axios.get(
    `http://localhost:5000/api/class/assignment/details/${assignmentId}?search=${search}`
  );
  return response.data;
};

// ✅ 7. Mark an assignment as completed
export const callMarkAssignmentCompleted = async ({
  studentId,
  assignmentId,
  submission = "Submitted",
}) => {
  try {
    const response = await axios.post(
      "http://localhost:5000/api/class/assignments/completed",
      {
        studentId,
        assignmentId,
        submission,
      },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Error marking completed:", error.message);
    throw new Error("Completion error");
  }
};

export const callGetTeacherAssignmentsApi = async (userId) => {
  return axios.get(
    `http://localhost:5000/api/class/assignments/teacher/${userId}`,
    {
      withCredentials: true,
    }
  );
};
//////////payment
export const callCreatePaymentApi = async (formData) => {
  const response = await axios.post(
    "http://localhost:5000/api/auth/payments/create",
    formData,
    {
      withCredentials: true,
    }
  );
  return response.data;
};
export const callGetAllPaymentsApi = async () => {
  const response = await axios.get(
    `http://localhost:5000/api/auth/payments/GetAll`,
    {
      withCredentials: true,
    }
  );
  return response.data;
};

export const callGetPaymentsByStudentIdApi = async (studentId) => {
  const response = await axios.get(
    `http://localhost:5000/api/auth/payments/student/${studentId}`,
    {
      withCredentials: true,
    }
  );
  return response.data;
};

export const callGetPaymentsByClassIdApi = async (classId) => {
  const response = await axios.get(
    `http://localhost:5000/api/auth/payments/class/${classId}`,
    {
      withCredentials: true,
    }
  );
  return response.data;
};
export const callUpdatePaymentApi = async (paymentId, updatedData) => {
  const response = await axios.put(
    `http://localhost:5000/api/auth/payments/update/${paymentId}`,
    updatedData,
    {
      withCredentials: true,
    }
  );
  return response.data;
};
export const callDeletePaymentApi = async (paymentId) => {
  const response = await axios.delete(
    `http://localhost:5000/api/auth/payments/delete/${paymentId}`,
    {
      withCredentials: true,
    }
  );
  return response.data;
};
