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
import React, { useEffect, useState, useMemo } from "react";
import {
  FiCalendar,
  FiClock,
  FiInfo,
  FiSpeaker,
  FiTrash2,
  FiSearch,
  FiX,
  FiFilter,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Massages = () => {
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for AlertDialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  // Search and filter states
  const [eventSearch, setEventSearch] = useState("");
  const [announcementSearch, setAnnouncementSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsData, announcementsData] = await Promise.all([
          callGetEventsForUserApi(),
          callGetAnnouncementsForUserApi(),
        ]);
        setEvents(eventsData.events || []);
        setAnnouncements(announcementsData.announcements || []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setEvents([]);
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        event.title?.toLowerCase().includes(eventSearch.toLowerCase()) ||
        event.message?.toLowerCase().includes(eventSearch.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || event.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [events, eventSearch, statusFilter]);

  // Filtered announcements
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((announcement) => {
      return (
        announcement.title
          ?.toLowerCase()
          .includes(announcementSearch.toLowerCase()) ||
        announcement.message
          ?.toLowerCase()
          .includes(announcementSearch.toLowerCase())
      );
    });
  }, [announcements, announcementSearch]);

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
    upcoming: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    ongoing: "bg-green-500/10 text-green-600 dark:text-green-400",
    ended: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  };

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-10">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Events & Announcements
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Manage your schedule and stay updated with the latest information
        </p>
      </div>

      {/* Events Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Events
          </h2>

          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search events..."
                className="pl-10 pr-8"
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
              />
              {eventSearch && (
                <button
                  onClick={() => setEventSearch("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FiX />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-2"
              >
                <FiFilter className="w-4 h-4" />
                Filter
              </Button>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date Range
                  </label>
                  <div className="flex gap-2">
                    <Input type="date" className="flex-1" />
                    <Input type="date" className="flex-1" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Event Type
                  </label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="class">Class events</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button variant="secondary" className="w-full">
                    Apply Filters
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <SkeletonLoader />
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            icon={FiCalendar}
            title={
              events.length === 0 ? "No upcoming events" : "No matching events"
            }
            message={
              events.length === 0
                ? "Your scheduled events will appear here."
                : "Try adjusting your search or filter criteria."
            }
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            {filteredEvents.map((event) => (
              <motion.div
                key={event._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -5 }}
                className={`bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 relative transition-all duration-200 hover:shadow-md group`}
              >
                {/* Class Badge */}
                {event.classId && (
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm flex items-center gap-1 max-w-[140px] truncate">
                    <FiInfo className="w-3 h-3" />
                    <span>{event.classId.name}</span>
                  </div>
                )}

                {/* Delete Button */}
                {event.classId && (
                  <button
                    onClick={() => confirmDelete(event)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Event"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                )}

                <div className="mt-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {event.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
                        {event.message}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        statusStyles[event.status]
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <FiCalendar className="mr-2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center">
                      <FiClock className="mr-2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span>
                        {event.startTime} - {event.endTime}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Announcements Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Announcements
          </h2>

          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search announcements..."
              className="pl-10 pr-8"
              value={announcementSearch}
              onChange={(e) => setAnnouncementSearch(e.target.value)}
            />
            {announcementSearch && (
              <button
                onClick={() => setAnnouncementSearch("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FiX />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <SkeletonLoader />
        ) : filteredAnnouncements.length === 0 ? (
          <EmptyState
            icon={FiSpeaker}
            title={
              announcements.length === 0
                ? "No announcements"
                : "No matching announcements"
            }
            message={
              announcements.length === 0
                ? "Your announcements will show up here."
                : "Try adjusting your search criteria."
            }
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {filteredAnnouncements.map((announcement) => (
              <motion.div
                key={announcement._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {announcement.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
                      {announcement.message}
                    </p>
                  </div>
                </div>
                <div className="flex items-center mt-3 text-sm text-gray-500 dark:text-gray-400">
                  <FiCalendar className="mr-2 w-4 h-4" />
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
            <Button variant="destructive" onClick={handleDelete}>
              Delete Event
            </Button>
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
    className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl"
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
