import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Notification, NotificationPreferences } from "@shared/schema";

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
  const queryClient = useQueryClient();

  // Fetch notification preferences
  const { data: preferences } = useQuery({
    queryKey: ["/api/notification-preferences/"],
    enabled: true,
  });

  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications/"],
    enabled: true,
  });

  // Update notification preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: (data: Partial<NotificationPreferences>) =>
      apiRequest("/api/notification-preferences/", "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-preferences/"] });
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
        !(preferences as NotificationPreferences)?.push_notifications ||
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
    [permission, preferences]
  );

  // Show toast notification
  const showToastNotification = useCallback(
    (notification: Notification) => {
      if (!(preferences as NotificationPreferences)?.email_notifications) return;

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
    [preferences, toast]
  );

  // Process new notifications
  useEffect(() => {
    const notificationList = notifications as Notification[];
    const unreadNotifications = notificationList.filter((n: Notification) => !n.read);
    
    // Only show notifications for very recent ones (last 5 minutes)
    const recentNotifications = unreadNotifications.filter((n: Notification) => {
      const notificationTime = n.created_at * 1000;
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      return notificationTime > fiveMinutesAgo;
    });

    recentNotifications.forEach((notification: Notification) => {
      showToastNotification(notification);
      showBrowserNotification(notification);
    });
  }, [notifications, showToastNotification, showBrowserNotification]);

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

  const unreadCount = (notifications as Notification[]).filter((n: Notification) => !n.read).length;

  // Mutations for notification actions
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return apiRequest(`/api/notifications/${notificationId}/mark-read/`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/notifications/mark-all-read/', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/'] });
      toast({
        title: "All notifications marked as read",
      });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return apiRequest(`/api/notifications/${notificationId}/`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/'] });
    },
  });

  return {
    notifications,
    preferences,
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