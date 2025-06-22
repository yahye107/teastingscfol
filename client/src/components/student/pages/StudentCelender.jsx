import React, { useState, useEffect, useCallback } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  addDays,
  setHours,
  setMinutes,
  isValid,
} from "date-fns";
import enUS from "date-fns/locale/en-US";
import {
  FiCalendar,
  FiClock,
  FiInfo,
  FiMapPin,
  FiUser,
  FiBook,
  FiBell,
} from "react-icons/fi";
import { motion } from "framer-motion";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  callGetEventsForUserApi,
  callGetAnnouncementsForUserApi,
  callGetStudentWeeklyTimetableApi,
} from "@/service/service";
import GlobalLoader from "@/components/common/GlobalLoader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useUser } from "@/useContaxt/UseContext";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const StudentCalendar = () => {
  const { user } = useUser();
  const [timetableData, setTimetableData] = useState([]);
  const [userEvents, setUserEvents] = useState([]);
  const [userAnnouncements, setUserAnnouncements] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (user?.studentProfile?.classId) {
          const timetable = await callGetStudentWeeklyTimetableApi(
            user.studentProfile.classId._id
          );
          setTimetableData(timetable);
        }

        const [events, announcements] = await Promise.all([
          callGetEventsForUserApi(),
          callGetAnnouncementsForUserApi(),
        ]);
        setUserEvents(events.events);
        setUserAnnouncements(announcements.announcements);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const generateEvents = useCallback(() => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const startOfWeekDate = startOfWeek(currentDate, { weekStartsOn: 1 });

    // Timetable Events
    const timetableEvents = timetableData
      .map((entry) => {
        try {
          const dayIndex = days.indexOf(entry.day);
          if (dayIndex === -1) return null;

          const eventDate = addDays(
            startOfWeekDate,
            dayIndex === 0 ? 6 : dayIndex - 1
          );

          const [startHours, startMinutes] = entry.startTime
            ?.split(":")
            ?.map(Number) || [0, 0];
          const [endHours, endMinutes] = entry.endTime
            ?.split(":")
            ?.map(Number) || [0, 0];

          return {
            title: `${entry.subjectName || "No Subject"} - ${
              entry.teacherName || "No Teacher"
            }`,
            start: setHours(setMinutes(eventDate, startMinutes), startHours),
            end: setHours(setMinutes(eventDate, endMinutes), endHours),
            resource: {
              type: "timetable",
              location: entry.hallNumber || "N/A",
              subject: entry.subjectName,
              teacher: entry.teacherName,
            },
          };
        } catch (error) {
          console.error("Error processing timetable entry:", entry, error);
          return null;
        }
      })
      .filter(Boolean);

    // Personal Events
    const personalEvents = userEvents
      .map((event) => {
        try {
          if (!event?.date || !event?.startTime || !event?.endTime) return null;

          const dateString =
            typeof event.date === "string"
              ? event.date
              : event.date?.toISOString?.() || "";
          const [datePart] = dateString.split("T");

          const start = parse(
            `${datePart} ${event.startTime}`,
            "yyyy-MM-dd HH:mm",
            new Date()
          );
          const end = parse(
            `${datePart} ${event.endTime}`,
            "yyyy-MM-dd HH:mm",
            new Date()
          );

          if (!isValid(start) || !isValid(end) || start >= end) return null;

          return {
            title: event.title || "Untitled Event",
            start,
            end,
            resource: {
              type: "personal",
              message: event.message || "",
              status: event.status || "unknown",
              className: event.classId?.name || "No Class",
            },
          };
        } catch (error) {
          console.error("Error processing personal event:", event, error);
          return null;
        }
      })
      .filter(Boolean);

    // Announcement Events
    const announcementEvents = userAnnouncements
      .map((announcement) => {
        try {
          const dateString =
            announcement.date instanceof Date
              ? format(announcement.date, "yyyy-MM-dd")
              : announcement.date.split("T")[0];

          const date = parse(dateString, "yyyy-MM-dd", new Date());
          if (!isValid(date)) return null;

          return {
            title: `📢 ${announcement.title}`,
            start: setHours(setMinutes(date, 0), 0),
            end: setHours(setMinutes(date, 59), 23),
            allDay: true,
            resource: {
              type: "announcement",
              message: announcement.message,
              author: announcement.createdBy?.name || "Administrator",
            },
          };
        } catch (error) {
          console.error("Error processing announcement:", announcement, error);
          return null;
        }
      })
      .filter(Boolean);

    return [...timetableEvents, ...personalEvents, ...announcementEvents];
  }, [timetableData, userEvents, userAnnouncements, currentDate]);

  const eventStyleGetter = (event) => {
    const baseStyle = {
      borderRadius: "6px",
      border: "none",
      color: "white",
      fontSize: "12px",
      padding: "4px 6px",
      margin: "2px 0",
      cursor: "pointer",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      minHeight: "40px",
      boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
      fontWeight: 500,
    };

    const typeStyles = {
      personal: {
        background: "linear-gradient(135deg, #3b82f6, #2563eb)",
      },
      announcement: {
        background: "linear-gradient(135deg, #10b981, #059669)",
      },
      timetable: {
        background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
      },
    };

    return {
      style: {
        ...baseStyle,
        ...typeStyles[event.resource.type],
      },
    };
  };

  const EventItem = ({ event }) => (
    <motion.div
      className="event-item w-full h-full p-1"
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="font-semibold truncate">{event.title}</div>
      {!event.allDay && (
        <div className="text-xs font-light opacity-90">
          {format(event.start, "h:mm a")}
        </div>
      )}
    </motion.div>
  );

  if (loading) return <GlobalLoader />;

  return (
    <div className="min-h-screen p-4 md:p-6 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg  dark:bg-slate-800">
          <Calendar
            localizer={localizer}
            events={generateEvents()}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "75vh", minHeight: "600px", minWidth: "800px" }}
            eventPropGetter={eventStyleGetter}
            views={["month", "week", "day", "agenda"]}
            defaultView="week"
            defaultDate={currentDate}
            onNavigate={setCurrentDate}
            components={{
              toolbar: (props) => (
                <div className="p-4 border-b dark:border-slate-700 bg-white dark:bg-slate-800">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <button
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
                        onClick={() => props.onNavigate("TODAY")}
                      >
                        Today
                      </button>
                      <div className="flex border border-gray-200 dark:border-slate-700 rounded-lg">
                        <button
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-l-lg transition-colors"
                          onClick={() => props.onNavigate("PREV")}
                        >
                          ←
                        </button>
                        <button
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-r-lg transition-colors"
                          onClick={() => props.onNavigate("NEXT")}
                        >
                          →
                        </button>
                      </div>
                    </div>

                    <h2 className="text-xl font-bold dark:text-white text-center md:text-left">
                      {props.label}
                    </h2>

                    <div className="flex items-center gap-3">
                      <select
                        className="px-3 py-2 border rounded-lg dark:bg-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        value={props.view}
                        onChange={(e) => props.onView(e.target.value)}
                      >
                        {["month", "week", "day", "agenda"].map((view) => (
                          <option key={view} value={view}>
                            {view.charAt(0).toUpperCase() + view.slice(1)}
                          </option>
                        ))}
                      </select>

                      <div className="hidden sm:flex items-center gap-3">
                        <div className="flex items-center">
                          <span className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></span>
                          <span className="text-xs text-gray-600 dark:text-gray-300">
                            Class
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                          <span className="text-xs text-gray-600 dark:text-gray-300">
                            Personal
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></span>
                          <span className="text-xs text-gray-600 dark:text-gray-300">
                            Announcement
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ),
              event: EventItem,
            }}
            onSelectEvent={setSelectedEvent}
          />
        </div>
      </div>

      {/* Event Details Modal */}
      <Dialog
        open={!!selectedEvent}
        onOpenChange={() => setSelectedEvent(null)}
      >
        <DialogContent className="rounded-lg max-w-md sm:max-w-lg p-0 overflow-hidden border-0">
          <div
            className={`h-2 w-full ${
              selectedEvent?.resource?.type === "personal"
                ? "bg-blue-500"
                : selectedEvent?.resource?.type === "announcement"
                ? "bg-emerald-500"
                : "bg-indigo-500"
            }`}
          ></div>

          <DialogHeader className="px-6 pt-5 pb-3">
            <DialogTitle className="text-xl font-bold flex items-start">
              <div
                className={`p-2 rounded-lg mr-3 ${
                  selectedEvent?.resource?.type === "personal"
                    ? "bg-blue-100 text-blue-600"
                    : selectedEvent?.resource?.type === "announcement"
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-indigo-100 text-indigo-600"
                }`}
              >
                {selectedEvent?.resource?.type === "announcement" ? (
                  <FiBell size={18} />
                ) : selectedEvent?.resource?.type === "personal" ? (
                  <FiInfo size={18} />
                ) : (
                  <FiBook size={18} />
                )}
              </div>
              <div>
                {selectedEvent?.title}
                <div className="text-sm font-normal text-gray-500 dark:text-gray-400 mt-1">
                  {selectedEvent?.start && format(selectedEvent.start, "PPPP")}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-4">
            {/* Timetable Details */}
            {selectedEvent?.resource?.type === "timetable" && (
              <div className="space-y-3">
                <DetailItem
                  icon={<FiBook className="text-indigo-500" />}
                  label="Subject"
                >
                  {selectedEvent.resource.subject || "N/A"}
                </DetailItem>

                <DetailItem
                  icon={<FiUser className="text-indigo-500" />}
                  label="Teacher"
                >
                  {selectedEvent.resource.teacher || "N/A"}
                </DetailItem>

                <DetailItem
                  icon={<FiMapPin className="text-indigo-500" />}
                  label="Location"
                >
                  {selectedEvent.resource.location || "N/A"}
                </DetailItem>
              </div>
            )}

            {/* Announcement Details */}
            {selectedEvent?.resource?.type === "announcement" && (
              <div className="space-y-3">
                <DetailItem
                  icon={<FiUser className="text-emerald-500" />}
                  label="Author"
                >
                  {selectedEvent.resource.author || "Administrator"}
                </DetailItem>

                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 mt-2">
                  <p className="text-gray-700 dark:text-gray-300">
                    {selectedEvent.resource.message || "No message provided"}
                  </p>
                </div>
              </div>
            )}

            {/* Personal Event Details */}
            {selectedEvent?.resource?.type === "personal" && (
              <div className="space-y-3">
                {selectedEvent?.resource?.message && (
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                    <p className="text-gray-700 dark:text-gray-300">
                      {selectedEvent.resource.message}
                    </p>
                  </div>
                )}

                <DetailItem
                  icon={<FiBook className="text-blue-500" />}
                  label="Class"
                >
                  {selectedEvent.resource.className || "N/A"}
                </DetailItem>

                {selectedEvent?.resource?.status && (
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 mt-2">
                    <FiInfo className="mr-2 w-4 h-4" />
                    {selectedEvent.resource.status}
                  </div>
                )}
              </div>
            )}

            {/* Time Information */}
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100 dark:border-slate-700">
              <DetailItem
                icon={<FiCalendar className="text-gray-500" />}
                label="Date"
              >
                {selectedEvent?.start &&
                  format(selectedEvent.start, "MMM d, yyyy")}
              </DetailItem>

              {!selectedEvent?.allDay ? (
                <DetailItem
                  icon={<FiClock className="text-gray-500" />}
                  label="Time"
                >
                  {selectedEvent?.start &&
                    format(selectedEvent.start, "h:mm a")}{" "}
                  - {selectedEvent?.end && format(selectedEvent.end, "h:mm a")}
                </DetailItem>
              ) : (
                <DetailItem
                  icon={<FiClock className="text-gray-500" />}
                  label="Time"
                >
                  All day
                </DetailItem>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Reusable detail component
const DetailItem = ({ icon, label, children }) => (
  <div className="flex items-start">
    <div className="mt-1 mr-3">{icon}</div>
    <div>
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
        {label}
      </div>
      <div className="font-medium dark:text-white">{children}</div>
    </div>
  </div>
);

export default StudentCalendar;
