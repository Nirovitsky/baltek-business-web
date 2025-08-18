import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Notification } from "@/types";

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
  onAction?: () => void;
}

export function NotificationToast({ notification, onClose, onAction }: NotificationToastProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "new_application":
        return "bg-blue-600";
      case "new_message":
        return "bg-green-600";
      case "job_published":
        return "bg-purple-600";
      case "system_alert":
        return "bg-red-600";
      case "job_expired":
        return "bg-orange-600";
      default:
        return "bg-gray-600";
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "new_application":
        return "👤";
      case "new_message":
        return "💬";
      case "job_published":
        return "📢";
      case "system_alert":
        return "⚠️";
      case "job_expired":
        return "⏰";
      default:
        return "📬";
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 w-80 animate-in slide-in-from-right-full duration-300">
      <div className="bg-white dark:bg-gray-800 border border-border rounded-lg shadow-lg overflow-hidden">
        <div className={`h-1 ${getTypeColor(notification.type)}`}></div>
        
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="text-lg">{getIcon(notification.type)}</div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground text-sm">
                  {notification.title}
                </h4>
                <p className="text-muted-foreground text-xs mt-1 line-clamp-2">
                  {notification.message}
                </p>
                
                {notification.action_url && onAction && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onAction}
                    className="mt-2 h-7 px-2 text-xs text-primary hover:text-primary-foreground hover:bg-primary"
                  >
                    View Details
                  </Button>
                )}
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}