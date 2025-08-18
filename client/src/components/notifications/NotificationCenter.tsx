import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, X, ExternalLink, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Notification } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["/api/notifications/"],
    enabled: true,
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) =>
      apiRequest(`/api/notifications/${notificationId}/mark-read/`, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/"] });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: () =>
      apiRequest("/api/notifications/mark-all-read/", "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/"] });
      toast({
        title: "All notifications marked as read",
      });
    },
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: number) =>
      apiRequest(`/api/notifications/${notificationId}/`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/"] });
    },
  });

  const unreadCount = (notifications as Notification[]).filter((n: Notification) => !n.read).length;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
    
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_application":
        return "👤";
      case "application_status_update":
        return "📋";
      case "new_message":
        return "💬";
      case "job_published":
        return "📢";
      case "job_expired":
        return "⏰";
      case "interview_scheduled":
        return "📅";
      case "system_alert":
        return "⚠️";
      default:
        return "📬";
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    try {
      return formatDistanceToNow(new Date(timestamp * 1000), { addSuffix: true });
    } catch (error) {
      return "Recently";
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="notification-bell"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              data-testid="notification-count"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-80 max-h-96"
        data-testid="notification-dropdown"
      >
        <div className="flex items-center justify-between p-3">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              data-testid="mark-all-read"
            >
              <Check className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        
        <DropdownMenuSeparator />
        
        <ScrollArea className="max-h-80">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading notifications...
            </div>
          ) : (notifications as Notification[]).length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No notifications yet
            </div>
          ) : (
            (notifications as Notification[]).map((notification: Notification) => (
              <div
                key={notification.id}
                className={`relative group border-b last:border-b-0 ${
                  !notification.read ? "bg-accent/50" : ""
                }`}
              >
                <DropdownMenuItem
                  className="flex items-start p-3 cursor-pointer hover:bg-accent/80"
                  onClick={() => handleNotificationClick(notification)}
                  data-testid={`notification-${notification.id}`}
                >
                  <div className="flex-shrink-0 mr-3 mt-1">
                    <span className="text-lg">
                      {getNotificationIcon(notification.type)}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm line-clamp-1">
                          {notification.title}
                        </p>
                        <p className="text-muted-foreground text-xs mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-muted-foreground text-xs mt-2">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </div>
                      
                      {notification.action_url && (
                        <ExternalLink className="h-3 w-3 ml-2 mt-1 text-muted-foreground" />
                      )}
                    </div>
                    
                    {!notification.read && (
                      <div className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full"></div>
                    )}
                  </div>
                </DropdownMenuItem>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotificationMutation.mutate(notification.id);
                  }}
                  data-testid={`delete-notification-${notification.id}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </ScrollArea>
        
        {(notifications as Notification[]).length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-center justify-center"
              data-testid="view-all-notifications"
            >
              View all notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}