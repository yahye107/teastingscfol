import React, { useEffect, useState } from "react";
import {
  callGetAnnouncementsForUserApi,
  callGetEventsForUserApi,
} from "@/service/service";
import { useUser } from "@/useContaxt/UseContext";
import GlobalLoader from "@/components/common/GlobalLoader";
import { FiSearch, FiCalendar, FiClock, FiUser } from "react-icons/fi";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

const PrantsMss = () => {
  const { user } = useUser();
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const [eventsRes, announcementsRes] = await Promise.all([
          callGetEventsForUserApi(),
          callGetAnnouncementsForUserApi(),
        ]);
        setEvents(eventsRes?.events || []);
        setAnnouncements(announcementsRes?.announcements || []);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, []);

  const filterItems = (items) => {
    if (!searchTerm) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        (item.title && item.title.toLowerCase().includes(term)) ||
        (item.message && item.message.toLowerCase().includes(term)) ||
        (item.createdAt &&
          new Date(item.createdAt)
            .toLocaleString()
            .toLowerCase()
            .includes(term)) ||
        (item.date &&
          new Date(item.date)
            .toLocaleDateString()
            .toLowerCase()
            .includes(term)) ||
        (item.startTime && item.startTime.toLowerCase().includes(term)) ||
        (item.createdBy?.fullName &&
          item.createdBy.fullName.toLowerCase().includes(term)) ||
        (item.createdBy?.username &&
          item.createdBy.username.toLowerCase().includes(term))
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "ongoing":
        return (
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
            Ongoing
          </span>
        );
      case "ended":
        return (
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
            Ended
          </span>
        );
      default:
        return (
          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
            Upcoming
          </span>
        );
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredEvents = filterItems(events);
  const filteredAnnouncements = filterItems(announcements);

  if (loading) return <GlobalLoader />;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* Search Bar and Tabs */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative w-full md:w-96">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, date, or creator..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", "events", "announcements"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Announcements */}
      {(activeTab === "all" || activeTab === "announcements") && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">📢 Announcements</h2>
          {filteredAnnouncements.length === 0 ? (
            <p className="text-gray-500">No announcements found</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAnnouncements.map((item) => (
                <div
                  key={item._id}
                  onClick={() => setSelectedItem(item)}
                  className="cursor-pointer border rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow p-4"
                >
                  <h3 className="font-bold text-lg text-gray-800 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 line-clamp-2 mb-3">
                    {item.message}
                  </p>
                  <div className="text-sm text-gray-500 flex justify-between items-center">
                    <span>
                      <FiUser className="inline mr-1" />{" "}
                      {item.createdBy?.fullName || item.createdBy?.username}
                    </span>
                    <span>
                      <FiCalendar className="inline mr-1" />{" "}
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Events */}
      {(activeTab === "all" || activeTab === "events") && (
        <section>
          <h2 className="text-xl font-semibold mb-4">📅 Events</h2>
          {filteredEvents.length === 0 ? (
            <p className="text-gray-500">No events found</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvents.map((item) => (
                <div
                  key={item._id}
                  onClick={() => setSelectedItem(item)}
                  className="cursor-pointer border rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow p-4"
                >
                  <h3 className="font-bold text-lg text-gray-800 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 line-clamp-2 mb-3">
                    {item.message}
                  </p>
                  <div className="text-sm text-gray-500 grid grid-cols-2 gap-2">
                    <span>
                      <FiCalendar className="inline mr-1" />{" "}
                      {formatDate(item.date)}
                    </span>
                    <span>
                      <FiClock className="inline mr-1" /> {item.startTime} -{" "}
                      {item.endTime}
                    </span>
                    <span>
                      <FiUser className="inline mr-1" />{" "}
                      {item.createdBy?.fullName}
                    </span>
                    <span>{getStatusBadge(item.status)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* AlertDialog for full content */}
      <AlertDialog
        open={!!selectedItem}
        onOpenChange={() => setSelectedItem(null)}
      >
        <AlertDialogContent className="max-w-xl">
          {selectedItem && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{selectedItem.title}</AlertDialogTitle>
                <AlertDialogDescription className="whitespace-pre-line text-sm text-muted-foreground">
                  {selectedItem.message}
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="mt-4 space-y-2 text-sm text-gray-600">
                {selectedItem.date && (
                  <p>
                    <FiCalendar className="inline mr-1" />{" "}
                    {formatDate(selectedItem.date)}
                  </p>
                )}
                {selectedItem.startTime && (
                  <p>
                    <FiClock className="inline mr-1" /> {selectedItem.startTime}{" "}
                    - {selectedItem.endTime}
                  </p>
                )}
                {selectedItem.createdBy?.fullName && (
                  <p>
                    <FiUser className="inline mr-1" />{" "}
                    {selectedItem.createdBy.fullName}
                  </p>
                )}
                {selectedItem.createdAt && (
                  <p>
                    Posted on:{" "}
                    {new Date(selectedItem.createdAt).toLocaleString()}
                  </p>
                )}
                {selectedItem.status && <p>Status: {selectedItem.status}</p>}
              </div>

              <AlertDialogFooter>
                <Button onClick={() => setSelectedItem(null)}>Close</Button>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PrantsMss;
