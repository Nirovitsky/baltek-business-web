import { useEffect, useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Notification, NotificationPreferences } from "@/types";

// Check if browser supports notifications
const isNotificationSupported = () => {
  return "Notification" in window;
};

// Request permission for browser notifications
const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isNotificationSupported()) {
    return "denied";
  }
  
  if (Notification.permission === "default") {
    return await Notification.requestPermission();
  }
  
  return Notification.permission;
};

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    isNotificationSupported() ? Notification.permission : "denied"
  );
  const { toast } = useToast();

  // Since we're using local storage for notifications, create mock data
  const [localNotifications, setLocalNotifications] = useState<Notification[]>(() => {
    // Create some sample notifications for demo purposes
    return [
      {
        id: 1,
        type: "new_application",
        title: "New Job Application",
        message: "You have received a new application for Software Engineer position",
        read: false,
        is_read: false,
        action_url: "/applications",
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        type: "new_message",
        title: "New Message",
        message: "You have a new message from John Doe",
        read: false,
        is_read: false,
        action_url: "/messages",
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      }
    ];
  });

  // Use local storage for preferences since API endpoint doesn't exist
  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences>(() => {
    const saved = localStorage.getItem('notification_preferences');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fall back to defaults
      }
    }
    return {
      id: 1,
      user: 1,
      email_notifications: true,
      push_notifications: false,
      new_applications: true,
      application_updates: true,
      new_messages: true,
      job_updates: true,
      system_alerts: true,
    };
  });

  // Update notification preferences using local storage
  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: Partial<NotificationPreferences>) => {
      const updated = { ...localPreferences, ...data };
      localStorage.setItem('notification_preferences', JSON.stringify(updated));
      setLocalPreferences(updated);
      return updated;
    },
    onSuccess: () => {
      toast({
        title: "Notification preferences updated",
      });
    },
  });

  // Request browser notification permission
  const requestPermission = useCallback(async () => {
    const newPermission = await requestNotificationPermission();
    setPermission(newPermission);
    
    if (newPermission === "granted") {
      toast({
        title: "Browser notifications enabled",
        description: "You'll now receive push notifications for important updates.",
      });
      
      // Update preferences to enable push notifications
      updatePreferencesMutation.mutate({ push_notifications: true });
    } else if (newPermission === "denied") {
      toast({
        title: "Browser notifications blocked",
        description: "You can enable them in your browser settings.",
        variant: "destructive",
      });
    }
    
    return newPermission;
  }, [toast, updatePreferencesMutation]);

  // Show browser notification
  const showBrowserNotification = useCallback(
    (notification: Notification) => {
      if (
        permission !== "granted" ||
        !localPreferences?.push_notifications ||
        !isNotificationSupported()
      ) {
        return;
      }

      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: `notification-${notification.id}`,
        requireInteraction: false,
        silent: false,
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 5000);

      // Handle click
      browserNotification.onclick = () => {
        window.focus();
        if (notification.action_url) {
          window.location.href = notification.action_url;
        }
        browserNotification.close();
      };
    },
    [permission, localPreferences]
  );

  // Show toast notification
  const showToastNotification = useCallback(
    (notification: Notification) => {
      if (!localPreferences?.email_notifications) return;

      const getVariant = (type: string) => {
        switch (type) {
          case "system_alert":
            return "destructive" as const;
          case "job_expired":
            return "destructive" as const;
          default:
            return "default" as const;
        }
      };

      toast({
        title: notification.title,
        description: notification.message,
        variant: getVariant(notification.type),
      });
    },
    [localPreferences, toast]
  );

  // Process new notifications
  useEffect(() => {
    const unreadNotifications = localNotifications.filter((n: Notification) => !n.read);
    
    // Only show notifications for very recent ones (last 5 minutes)
    const recentNotifications = unreadNotifications.filter((n: Notification) => {
      try {
        // Handle both Unix timestamp and ISO string formats
        const notificationTime = typeof n.created_at === 'string' 
          ? new Date(n.created_at).getTime()
          : Number(n.created_at) * 1000;
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        return notificationTime > fiveMinutesAgo;
      } catch {
        return false; // Skip notifications with invalid dates
      }
    });

    recentNotifications.forEach((notification: Notification) => {
      showToastNotification(notification);
      showBrowserNotification(notification);
    });
  }, [localNotifications, showToastNotification, showBrowserNotification]);

  // Monitor permission changes
  useEffect(() => {
    const handlePermissionChange = () => {
      if (isNotificationSupported()) {
        setPermission(Notification.permission);
      }
    };

    // Check for permission changes periodically
    const interval = setInterval(handlePermissionChange, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const unreadCount = localNotifications.filter((n: Notification) => !n.read).length;

  // Mutations for notification actions using local storage
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      setLocalNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true, is_read: true } : n)
      );
      return Promise.resolve();
    },
    onSuccess: () => {
      // No need to invalidate since we're using local state
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      setLocalNotifications(prev => 
        prev.map(n => ({ ...n, read: true, is_read: true }))
      );
      return Promise.resolve();
    },
    onSuccess: () => {
      toast({
        title: "All notifications marked as read",
      });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      setLocalNotifications(prev => 
        prev.filter(n => n.id !== notificationId)
      );
      return Promise.resolve();
    },
    onSuccess: () => {
      // No need to invalidate since we're using local state
    },
  });

  return {
    notifications: localNotifications,
    preferences: localPreferences,
    permission,
    unreadCount,
    isSupported: isNotificationSupported(),
    isLoading: false,
    requestPermission,
    updatePreferences: updatePreferencesMutation.mutate,
    isUpdatingPreferences: updatePreferencesMutation.isPending,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeletingNotification: deleteNotificationMutation.isPending,
  };
}