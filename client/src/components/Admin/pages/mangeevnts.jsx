import React, { useEffect, useState } from "react";
import {
  callGetAllEventsAndAnnouncementsApi,
  callDeleteEventApi,
} from "@/service/service";
import GlobalLoader from "@/components/common/GlobalLoader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ManageEvents = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [deleteId, setDeleteId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();
  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await callGetAllEventsAndAnnouncementsApi();
      setItems(data);
    } catch (err) {
      alert("Failed to load events and announcements");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const confirmDelete = (id) => {
    setDeleteId(id);
    setDialogOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      await callDeleteEventApi(deleteId);
      setItems((prev) => prev.filter((item) => item._id !== deleteId));
      setDialogOpen(false);
    } catch (err) {
      alert("Failed to delete item");
    }
  };

  const filteredItems = items.filter((item) => {
    if (filterType !== "all" && item.type !== filterType) return false;
    if (filterStatus !== "all" && item.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="p-4">
      <Button
        variant="outline"
        onClick={() => navigate(-1)}
        className="gap-2 text-black"
      >
        <ArrowLeft className="h-4 w-4 text-black" />
        Back
      </Button>
      <h1 className="text-2xl font-bold mb-4 text-center sm:text-left">
        Manage Events & Announcements
      </h1>

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center">
          <label className="mb-1 sm:mb-0 sm:mr-2 font-semibold">
            Filter by Type:
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All</option>
            <option value="event">Events</option>
            <option value="announcement">Announcements</option>
          </select>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center">
          <label className="mb-1 sm:mb-0 sm:mr-2 font-semibold">
            Filter by Status:
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="ended">Ended</option>
            <option value="announcement">Announcement</option>
          </select>
        </div>
      </div>

      {loading ? (
        <GlobalLoader />
      ) : filteredItems.length === 0 ? (
        <p>No events or announcements found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-200 rounded-md shadow-sm">
            <thead className="bg-gray-100 text-left text-gray-600">
              <tr>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Message</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Audience</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">createdBy</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item._id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{item.title}</td>
                  <td className="px-4 py-2">{item.message}</td>
                  <td className="px-4 py-2 capitalize">{item.type}</td>
                  <td className="px-4 py-2 capitalize">{item.status}</td>
                  <td className="px-4 py-2 capitalize">{item.audience}</td>
                  <td className="px-4 py-2">
                    {new Date(item.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    {item.createdBy?.name || item.createdBy?._id || "Unknown"}
                  </td>

                  <td className="px-4 py-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => confirmDelete(item._id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event or announcement? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirmed}>
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageEvents;
