const Event = require("../models/event");
const Student = require("../models/student");
// Admin creates general event
const createGeneralEvent = async (req, res) => {
  try {
    const { title, message, audience, date, startTime, endTime } = req.body;
    const userId = req.userInfo._id;

    if (!["student", "teacher", "parent", "staff", "all"].includes(audience)) {
      return res.status(400).json({ message: "Invalid audience type." });
    }

    if (!date || !startTime || !endTime) {
      return res
        .status(400)
        .json({ message: "Date, start time, and end time are required." });
    }

    const event = new Event({
      title,
      message,
      createdBy: userId,
      role: "admin",
      audience,
      date,
      startTime,
      endTime,
    });

    await event.save();
    res.status(201).json({ message: "Event created successfully.", event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const createGeneralAnouncement = async (req, res) => {
  try {
    const { title, message, audience, date } = req.body;
    const userId = req.userInfo._id;

    if (!["student", "teacher", "parent", "staff", "all"].includes(audience)) {
      return res.status(400).json({ message: "Invalid audience type." });
    }

    const event = new Event({
      title,
      message,
      createdBy: userId,
      role: "admin",
      date,
      audience,
    });

    await event.save();
    res.status(201).json({ message: "Event created successfully.", event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// Teacher creates class-only event
const createClassEvent = async (req, res) => {
  try {
    const { title, message, classId, date, startTime, endTime } = req.body;
    const userId = req.userInfo._id;

    if (!classId) {
      return res.status(400).json({ message: "Class ID is required." });
    }

    if (!date || !startTime || !endTime) {
      return res
        .status(400)
        .json({ message: "Date, start time, and end time are required." });
    }

    const event = new Event({
      title,
      message,
      createdBy: userId,
      role: "teacher",
      audience: "class",
      classId,
      date,
      startTime,
      endTime,
    });

    await event.save();
    res.status(201).json({ message: "Class event created.", event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get events based on user role
// Get events based on user role
const getEventsForUser = async (req, res) => {
  try {
    const user = req.userInfo;
    let query = { $or: [] };

    query.$or.push({ audience: "all" });
    query.$or.push({ audience: user.role });

    if (user.role === "student") {
      const student = await Student.findOne({ user: user._id });
      if (student?.classId) {
        query.$or.push({
          audience: "class",
          classId: student.classId,
        });
      }
    }
    if (user.role === "teacher") {
      query.$or.push({ createdBy: user._id });
    }

    query.startTime = { $exists: true };
    query.endTime = { $exists: true };
    let events = await Event.find(query)
      .sort({ createdAt: -1 })
      .select("title message date startTime endTime createdAt audience")
      .populate("classId", "name section")
      .populate("createdBy", "fullName username");

    // Determine status for each event
    const now = new Date();

    events = events.map((event) => {
      const eventDate = new Date(event.date); // Just the date

      // Extract hours and minutes from the startTime and endTime
      const [startHour, startMinute] = event.startTime?.split(":") || [0, 0];
      const [endHour, endMinute] = event.endTime?.split(":") || [0, 0];

      const start = new Date(eventDate);
      start.setHours(startHour, startMinute, 0, 0);

      const end = new Date(eventDate);
      end.setHours(endHour, endMinute, 0, 0);

      let status = "upcoming";
      if (now >= start && now <= end) {
        status = "ongoing";
      } else if (now > end) {
        status = "ended";
      }

      return {
        ...event.toObject(),
        status,
      };
    });

    res.status(200).json({ events, message: "Events fetched successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// DELETE event
const deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const userId = req.userInfo._id;
    const userRole = req.userInfo.role;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    // Only admin or the creator can delete the event
    if (
      userRole !== "admin" &&
      event.createdBy.toString() !== userId.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this event." });
    }

    await Event.findByIdAndDelete(eventId);
    res.status(200).json({ message: "Event deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const getAnnouncementsForUser = async (req, res) => {
  try {
    const user = req.userInfo;
    let query = { $or: [] };

    // Audience filtering same as getEventsForUser
    query.$or.push({ audience: "all" });
    query.$or.push({ audience: user.role });

    if (user.role === "student") {
      const student = await Student.findOne({ user: user._id });
      if (student?.classId) {
        query.$or.push({
          audience: "class",
          classId: student.classId,
        });
      }
    }

    // Announcements have no date/startTime/endTime

    query.startTime = { $exists: false };
    query.endTime = { $exists: false };

    const announcements = await Event.find(query)
      .sort({ createdAt: -1 })
      .select("title message createdAt audience date")
      .populate("createdBy", "fullName username");

    res.status(200).json({ message: "announcements found.", announcements });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// Get all events and announcements (admin-only)
const getAllEventsAndAnnouncements = async (req, res) => {
  try {
    // Optional: restrict to admin role
    if (req.userInfo.role !== "admin" && req.userInfo.role !== "superadmin") {
      return res.status(403).json({ message: "Unauthorized access." });
    }

    const allItems = await Event.find()
      .sort({ createdAt: -1 })
      .populate("classId", "name section")
      .populate("createdBy", "user");

    const now = new Date();

    const data = allItems.map((item) => {
      // If both startTime and endTime exist → it's an event
      const isEvent = item.startTime && item.endTime;

      let status = "announcement";

      if (isEvent) {
        const eventDate = new Date(item.date);
        const [startHour, startMinute] = item.startTime.split(":");
        const [endHour, endMinute] = item.endTime.split(":");

        const start = new Date(eventDate);
        start.setHours(startHour, startMinute, 0, 0);
        const end = new Date(eventDate);
        end.setHours(endHour, endMinute, 0, 0);

        if (now >= start && now <= end) status = "ongoing";
        else if (now > end) status = "ended";
        else status = "upcoming";
      }

      return {
        ...item.toObject(),
        type: isEvent ? "event" : "announcement",
        status,
      };
    });

    res.status(200).json({ data, message: "all event." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createGeneralEvent,
  deleteEvent,
  createClassEvent,
  getEventsForUser,
  createGeneralAnouncement,
  getAllEventsAndAnnouncements,
  getAnnouncementsForUser,
};
