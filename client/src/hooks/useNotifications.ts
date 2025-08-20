import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";
import type { Notification, NotificationPreferences, PaginatedResponse } from "@/types";

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

  // Fetch notifications from the actual API endpoint
  const { data: notificationsData, isLoading: notificationsLoading } = useQuery({
    queryKey: ['/notifications/'],
    queryFn: () => apiService.request<PaginatedResponse<Notification>>('/notifications/'),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
    refetchInterval: 2 * 60 * 1000, // Check every 2 minutes instead of 30 seconds
  });

  // Extract notifications from API response
  const notifications = (notificationsData as any)?.results || [];


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


  // Process new notifications for browser/toast alerts
  useEffect(() => {
    if (!Array.isArray(notifications)) return;

    const unreadNotifications = notifications.filter((n: Notification) => !n.read && !n.is_read);
    
    // Only show notifications for very recent ones (last 5 minutes)
    const recentNotifications = unreadNotifications.filter((n: Notification) => {
      try {
        const notificationTime = new Date(n.created_at).getTime();
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        return notificationTime > fiveMinutesAgo;
      } catch {
        return false;
      }
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

    const interval = setInterval(handlePermissionChange, 1000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n: Notification) => !n.read && !n.is_read).length;

  // Mutations for notification actions using the API
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return apiService.request(`/notifications/${notificationId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ is_read: true }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      // Invalidate notifications to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['/notifications/'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      // If there's a bulk mark all read endpoint, use it, otherwise mark individually
      const unreadNotifications = notifications.filter((n: Notification) => !n.read && !n.is_read);
      const promises = unreadNotifications.map((notification: Notification) => 
        apiService.request(`/notifications/${notification.id}/`, {
          method: 'PATCH',
          body: JSON.stringify({ is_read: true }),
          headers: { 'Content-Type': 'application/json' }
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/notifications/'] });
      toast({
        title: "All notifications marked as read",
      });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return apiService.request(`/notifications/${notificationId}/`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/notifications/'] });
    },
  });

  return {
    notifications,
    preferences: localPreferences,
    permission,
    unreadCount,
    isSupported: isNotificationSupported(),
    isLoading: notificationsLoading,
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