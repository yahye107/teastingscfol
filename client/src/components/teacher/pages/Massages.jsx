import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  callGetAnnouncementsForUserApi,
  callDeleteEventApi,
  callGetEventsForUserApi,
} from "@/service/service";
import React, { useEffect, useState } from "react";
import {
  FiCalendar,
  FiClock,
  FiInfo,
  FiSpeaker,
  FiTrash2,
} from "react-icons/fi";
import { motion } from "framer-motion";

const Massages = () => {
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for AlertDialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsData, announcementsData] = await Promise.all([
          callGetEventsForUserApi(),
          callGetAnnouncementsForUserApi(),
        ]);
        setEvents(eventsData);
        setAnnouncements(announcementsData);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Open dialog & set event to delete
  const confirmDelete = (event) => {
    setEventToDelete(event);
    setIsDeleteDialogOpen(true);
  };

  // Handle actual deletion
  const handleDelete = async () => {
    if (!eventToDelete) return;
    try {
      await callDeleteEventApi(eventToDelete._id);
      setEvents((prevEvents) =>
        prevEvents.filter((e) => e._id !== eventToDelete._id)
      );
      setEventToDelete(null);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Failed to delete event:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  const statusStyles = {
    upcoming: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
    ongoing:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  };

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-10">
      {/* Events Section */}
      <div>
        <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          My Events
        </h2>
        {loading ? (
          <SkeletonLoader />
        ) : events.length === 0 ? (
          <EmptyState
            icon={FiCalendar}
            title="No upcoming events"
            message="Your scheduled events will appear here."
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {events.map((event) => (
              <motion.div
                key={event._id}
                whileHover={{ y: -2 }}
                className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-l-4 ${
                  event.classId
                    ? "border-blue-500 dark:border-blue-600"
                    : "border-gray-200 dark:border-gray-700"
                } relative transition-all duration-200 hover:shadow-md`}
              >
                {/* Class Badge */}
                {event.classId && (
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-900 text-blue-900 dark:text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm flex items-center gap-1 max-w-[140px] truncate">
                    <FiInfo className="w-3 h-3" />
                    <span>{event.classId.name}</span>
                  </div>
                )}

                {/* Delete Button */}
                {event.classId && (
                  <button
                    onClick={() => confirmDelete(event)}
                    className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                    title="Delete Event"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                )}

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mt-4 gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 truncate">
                      {event.title}
                      {event.classId && (
                        <span className="ml-2 text-sm text-blue-600 dark:text-blue-400">
                          (Class Event)
                        </span>
                      )}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 truncate">
                      {event.message}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center mb-2 px-3 py-1 rounded-full text-sm font-medium ${
                      statusStyles[event.status]
                    }`}
                  >
                    <FiInfo className="mr-2 w-4 h-4" />
                    {event.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center">
                    <FiCalendar className="mr-2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center">
                    <FiClock className="mr-2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <span>
                      {event.startTime} - {event.endTime}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Announcements Section */}
      <div>
        <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          Announcements
        </h2>
        {loading ? (
          <SkeletonLoader />
        ) : announcements.length === 0 ? (
          <EmptyState
            icon={FiSpeaker}
            title="No announcements"
            message="Your announcements will show up here."
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {announcements.map((announcement) => (
              <motion.div
                key={announcement._id}
                whileHover={{ y: -2 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-md"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 truncate">
                  {announcement.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm truncate">
                  {announcement.message}
                </p>
                <div className="flex items-center mt-3 text-sm text-gray-500 dark:text-gray-400">
                  <FiCalendar className="mr-2 w-5 h-5" />
                  {new Date(announcement.date).toLocaleDateString()}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* AlertDialog for Delete Confirmation */}

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <button
              onClick={handleDelete}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
            >
              Delete
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const SkeletonLoader = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <div
        key={i}
        className="animate-pulse bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
      </div>
    ))}
  </div>
);

const EmptyState = ({ icon: Icon, title, message }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-12"
  >
    <div className="mx-auto max-w-md">
      <Icon className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  </motion.div>
);

export default Massages;
