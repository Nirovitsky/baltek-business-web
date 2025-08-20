import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";
import type { Notification, NotificationPreferences, JobApplication, Message, PaginatedResponse } from "@/types";

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
  
  // Track processed items to avoid duplicate notifications
  const [processedApplications, setProcessedApplications] = useState<Set<number>>(new Set());
  const [processedMessages, setProcessedMessages] = useState<Set<number>>(new Set());

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

  // Use shared applications query with same key as Applications page to avoid duplication
  const { data: applications = [] } = useQuery({
    queryKey: ['/api/jobs/applications/'], // Use same key as Applications page
    enabled: localPreferences.new_applications,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
    refetchInterval: 2 * 60 * 1000, // Check every 2 minutes instead of 30 seconds
  });

  // Use shared messages query - only fetch for notifications, not duplicating Messages page queries
  const { data: messagesData } = useQuery({
    queryKey: ["/api/chat/messages/"], // Different key to avoid conflict with room-specific queries
    queryFn: () => apiService.request<PaginatedResponse<any>>('/chat/messages/'),
    enabled: localPreferences.new_messages,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
    refetchInterval: 2 * 60 * 1000, // Check every 2 minutes instead of 30 seconds
  });

  // Extract messages from paginated response
  const messages = (messagesData as any)?.results || [];

  // Generate notifications from real data
  const [generatedNotifications, setGeneratedNotifications] = useState<Notification[]>([]);

  // Process new applications and generate notifications
  useEffect(() => {
    if (!localPreferences.new_applications || !Array.isArray(applications)) return;

    const newApplications = (applications as any[]).filter((app: any) => {
      // Only show applications from the last 24 hours
      const applicationTime = new Date(app.date_created || app.created_at).getTime();
      const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
      
      return applicationTime > twentyFourHoursAgo && !processedApplications.has(app.id);
    });

    newApplications.forEach((app: any) => {
      const notification: Notification = {
        id: Date.now() + app.id, // Generate unique ID
        type: "new_application",
        title: "New Job Application",
        message: `New application received for ${app.job?.title || 'a job position'}`,
        read: false,
        is_read: false,
        action_url: `/applications`,
        created_at: app.date_created || app.created_at,
      };

      setGeneratedNotifications(prev => [notification, ...prev]);
      setProcessedApplications(prev => new Set([...Array.from(prev), app.id]));
    });
  }, [applications, localPreferences.new_applications, processedApplications]);

  // Process new messages and generate notifications
  useEffect(() => {
    if (!localPreferences.new_messages || !Array.isArray(messages)) return;

    const newMessages = (messages as any[]).filter((msg: any) => {
      // Only show messages from the last hour
      const messageTime = new Date(msg.date_created).getTime();
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      
      return messageTime > oneHourAgo && !processedMessages.has(msg.id);
    });

    newMessages.forEach((msg: any) => {
      const notification: Notification = {
        id: Date.now() + msg.id + 1000000, // Generate unique ID
        type: "new_message",
        title: "New Message",
        message: `New message from ${msg.owner?.first_name || 'a user'}`,
        read: false,
        is_read: false,
        action_url: `/messages?room=${msg.room}`,
        created_at: msg.date_created,
      };

      setGeneratedNotifications(prev => [notification, ...prev]);
      setProcessedMessages(prev => new Set([...Array.from(prev), msg.id]));
    });
  }, [messages, localPreferences.new_messages, processedMessages]);

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
    const unreadNotifications = generatedNotifications.filter((n: Notification) => !n.read);
    
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
  }, [generatedNotifications, showToastNotification, showBrowserNotification]);

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

  const unreadCount = generatedNotifications.filter((n: Notification) => !n.read).length;

  // Mutations for notification actions using local storage
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      setGeneratedNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true, is_read: true } : n)
      );
      return Promise.resolve();
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      setGeneratedNotifications(prev => 
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
      setGeneratedNotifications(prev => 
        prev.filter(n => n.id !== notificationId)
      );
      return Promise.resolve();
    },
  });

  return {
    notifications: generatedNotifications,
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