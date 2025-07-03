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
import { FiCalendar, FiClock, FiInfo } from "react-icons/fi";
import { motion } from "framer-motion";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  callGetTeacherWeeklyTimetableApi,
  callGetEventsForUserApi,
  callGetAnnouncementsForUserApi,
} from "@/service/service";
import { useUser } from "@/useContaxt/UseContext";
import GlobalLoader from "@/components/common/GlobalLoader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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

const TeacherCalendar = () => {
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
        if (user?.teacherProfile?._id) {
          const timetable = await callGetTeacherWeeklyTimetableApi(
            user.teacherProfile._id
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
            title: `${entry.subject?.name || "No Subject"} - ${
              entry.class?.name || "No Class"
            }`,
            start: setHours(setMinutes(eventDate, startMinutes), startHours),
            end: setHours(setMinutes(eventDate, endMinutes), endHours),
            resource: {
              type: "timetable",
              location: entry.hall?.hallNumber || "N/A",
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
    // In the announcementEvents mapping, modify the date parsing:
    const announcementEvents = userAnnouncements
      .map((announcement) => {
        try {
          // Handle both Date objects and string formats
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
              author: announcement.createdBy?.name || "Administrator", // Fix author field
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

  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor:
        event.resource.type === "personal"
          ? "#3b82f6"
          : event.resource.type === "announcement"
          ? "#10b981"
          : "#4f46e5",
      borderRadius: "8px",
      border: "none",
      color: "white",
      fontSize: "14px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      padding: "4px 8px",
    },
  });

  if (loading) return <GlobalLoader />;

  return (
    <div className="h-screen p-6 bg-slate-50 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <div className="w-[900px] sm:w-full max-w-6xl mx-auto bg-white rounded-xl shadow-lg dark:bg-slate-800">
          <Calendar
            localizer={localizer}
            events={generateEvents()}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 700, padding: 20 }}
            eventPropGetter={eventStyleGetter}
            views={["month", "week", "day", "agenda"]}
            defaultView="week"
            defaultDate={currentDate}
            onNavigate={setCurrentDate}
            components={{
              toolbar: (props) => (
                <div className="p-4 border-b dark:border-slate-700">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div className="space-x-2">
                      <button
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        onClick={() => props.onNavigate("TODAY")}
                      >
                        Today
                      </button>
                      <button
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                        onClick={() => props.onNavigate("PREV")}
                      >
                        ←
                      </button>
                      <button
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                        onClick={() => props.onNavigate("NEXT")}
                      >
                        →
                      </button>
                    </div>
                    <span className="text-lg font-semibold dark:text-white">
                      {props.label}
                    </span>
                    <select
                      className="px-4 py-2 border rounded-lg dark:bg-slate-800 dark:text-white"
                      value={props.view}
                      onChange={(e) => props.onView(e.target.value)}
                    >
                      {["month", "week", "day", "agenda"].map((view) => (
                        <option key={view} value={view}>
                          {view.charAt(0).toUpperCase() + view.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ),
              event: ({ event }) => (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="cursor-pointer p-1"
                >
                  <div className="truncate">{event.title}</div>
                </motion.div>
              ),
            }}
            onSelectEvent={setSelectedEvent}
          />
        </div>
      </div>

      <Dialog
        open={!!selectedEvent}
        onOpenChange={() => setSelectedEvent(null)}
      >
        <DialogContent className="rounded-lg sm:max-w-md max-w-[calc(100vw-2rem)] mr-auto ml-4 sm:mx-auto sm:mt-20 mt-4">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {selectedEvent?.title}
            </DialogTitle>
            <DialogDescription>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4 mt-4"
              >
                {selectedEvent?.resource?.type === "announcement" ? (
                  <>
                    <p className="text-gray-600 dark:text-gray-300 text-lg">
                      {selectedEvent.resource.message}
                    </p>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <FiInfo className="w-5 h-5" />
                      <span>Posted by: {selectedEvent.resource.author}</span>
                    </div>
                  </>
                ) : (
                  <>
                    {selectedEvent?.resource?.message && (
                      <p className="text-gray-600 dark:text-gray-300">
                        {selectedEvent.resource.message}
                      </p>
                    )}
                    {selectedEvent?.resource?.location && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <FiInfo className="w-5 h-5" />
                        <span>Location: {selectedEvent.resource.location}</span>
                      </div>
                    )}
                  </>
                )}

                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <FiCalendar className="w-5 h-5" />
                  <span>
                    {selectedEvent?.start && format(selectedEvent.start, "PPP")}
                  </span>
                </div>

                {selectedEvent?.resource?.type === "personal" && (
                  <p>
                    <FiInfo className="inline-block mr-1" />{" "}
                    <strong>Class:</strong> {selectedEvent.resource.className}
                  </p>
                )}

                {selectedEvent?.resource?.type !== "announcement" && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <FiClock className="w-5 h-5" />
                    <span>
                      {selectedEvent?.start && format(selectedEvent.start, "p")}{" "}
                      - {selectedEvent?.end && format(selectedEvent.end, "p")}
                    </span>
                  </div>
                )}

                {selectedEvent?.resource?.status && (
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                    <FiInfo className="mr-2 w-4 h-4" />
                    {selectedEvent.resource.status}
                  </div>
                )}
              </motion.div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherCalendar;
