import React, { useState, useEffect } from "react";
import { Bell, Check, X, ExternalLink } from "lucide-react";
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
import { useNotifications } from "@/hooks/useNotifications";
import type { Notification } from "@/types";
import { formatDistanceToNow } from "date-fns";

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);

  // Use the notifications hook for all data and actions
  const { 
    notifications, 
    isLoading, 
    markAsRead, 
    markAllAsRead,
    isMarkingAsRead,
    isMarkingAllAsRead
  } = useNotifications();

  const unreadCount = (notifications as Notification[]).filter((n: Notification) => !n.is_read).length;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
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
              onClick={() => markAllAsRead()}
              disabled={isMarkingAllAsRead}
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
                  !notification.is_read ? "bg-accent/50" : ""
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
                          {notification.body || notification.message || ''}
                        </p>
                        <p className="text-muted-foreground text-xs mt-2">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      
                      {notification.action_url && (
                        <ExternalLink className="h-3 w-3 ml-2 mt-1 text-muted-foreground" />
                      )}
                    </div>
                    
                    {!notification.is_read && (
                      <div className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full"></div>
                    )}
                  </div>
                </DropdownMenuItem>
                
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