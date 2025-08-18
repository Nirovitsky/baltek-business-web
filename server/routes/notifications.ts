import { Router } from "express";
import { z } from "zod";
import { 
  notificationSchema, 
  createNotificationSchema,
  notificationPreferencesSchema,
  updateNotificationPreferencesSchema
} from "@shared/schema";

const router = Router();

// Mock notification data - in real app this would come from database
const notifications = [
  {
    id: 1,
    type: "new_application",
    title: "New Application Received",
    message: "John Doe applied for Senior Developer position",
    read: false,
    created_at: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    updated_at: Math.floor(Date.now() / 1000) - 3600,
    user: 1,
    related_object_id: 123,
    related_object_type: "application" as const,
    action_url: "/applications/123"
  },
  {
    id: 2,
    type: "new_message",
    title: "New Message",
    message: "You have a new message from Sarah Wilson",
    read: false,
    created_at: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
    updated_at: Math.floor(Date.now() / 1000) - 7200,
    user: 1,
    related_object_id: 456,
    related_object_type: "message" as const,
    action_url: "/messages/456"
  },
  {
    id: 3,
    type: "job_published",
    title: "Job Published Successfully",
    message: "Your Frontend Developer job posting is now live",
    read: true,
    created_at: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
    updated_at: Math.floor(Date.now() / 1000) - 86400,
    user: 1,
    related_object_id: 789,
    related_object_type: "job" as const,
    action_url: "/jobs/789"
  }
];

// Mock notification preferences
let notificationPreferences = {
  id: 1,
  user: 1,
  email_notifications: true,
  push_notifications: true,
  new_applications: true,
  application_updates: true,
  new_messages: true,
  job_updates: true,
  interview_reminders: true,
  system_alerts: true,
  created_at: Math.floor(Date.now() / 1000) - 86400,
  updated_at: Math.floor(Date.now() / 1000) - 86400,
};

// GET /api/notifications/ - Get user notifications
router.get("/", (req, res) => {
  try {
    // In real app, filter by authenticated user
    const userNotifications = notifications.sort((a, b) => b.created_at - a.created_at);
    res.json(userNotifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// POST /api/notifications/:id/mark-read/ - Mark notification as read
router.post("/:id/mark-read", (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    const notification = notifications.find(n => n.id === notificationId);
    
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    
    notification.read = true;
    notification.updated_at = Math.floor(Date.now() / 1000);
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// POST /api/notifications/mark-all-read/ - Mark all notifications as read
router.post("/mark-all-read", (req, res) => {
  try {
    const currentTime = Math.floor(Date.now() / 1000);
    notifications.forEach(notification => {
      notification.read = true;
      notification.updated_at = currentTime;
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
});

// DELETE /api/notifications/:id/ - Delete notification
router.delete("/:id", (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    const index = notifications.findIndex(n => n.id === notificationId);
    
    if (index === -1) {
      return res.status(404).json({ error: "Notification not found" });
    }
    
    notifications.splice(index, 1);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

// GET /api/notification-preferences/ - Get user notification preferences
router.get("/notification-preferences", (req, res) => {
  try {
    res.json(notificationPreferences);
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    res.status(500).json({ error: "Failed to fetch notification preferences" });
  }
});

// PATCH /api/notification-preferences/ - Update notification preferences
router.patch("/notification-preferences", (req, res) => {
  try {
    const updateData = updateNotificationPreferencesSchema.parse(req.body);
    
    notificationPreferences = {
      ...notificationPreferences,
      ...updateData,
      updated_at: Math.floor(Date.now() / 1000),
    };
    
    res.json(notificationPreferences);
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update notification preferences" });
  }
});

// POST /api/notifications/ - Create new notification (for testing)
router.post("/", (req, res) => {
  try {
    const newNotificationData = createNotificationSchema.parse(req.body);
    
    const newNotification = {
      id: notifications.length + 1,
      ...newNotificationData,
      read: false,
      created_at: Math.floor(Date.now() / 1000),
      updated_at: Math.floor(Date.now() / 1000),
      user: 1, // In real app, get from authenticated user
    };
    
    notifications.unshift(newNotification as any); // Add to beginning for newest first
    res.status(201).json(newNotification);
  } catch (error) {
    console.error("Error creating notification:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create notification" });
  }
});

export default router;