import { useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Check, CheckCheck, Trash2, ExternalLink } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";

export default function Notifications() {
  const [_, setLocation] = useLocation();
  const { 
    notifications, 
    isLoading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    isMarkingAsRead,
    isMarkingAllAsRead,
    isDeletingNotification
  } = useNotifications();

  const unreadNotifications = (notifications as any[])?.filter((n: any) => !n.read) || [];
  const readNotifications = (notifications as any[])?.filter((n: any) => n.read) || [];

  const getTypeColor = (type: string) => {
    switch (type) {
      case "new_application":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "new_message":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "job_published":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "system_alert":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "job_expired":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
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

  const handleNotificationAction = (notification: any) => {
    if (notification.action_url) {
      setLocation(notification.action_url);
    }
  };

  const NotificationItem = ({ notification, isUnread }: { notification: any; isUnread: boolean }) => (
    <div
      className={`p-4 border rounded-lg transition-colors ${
        isUnread 
          ? "bg-primary/5 border-primary/20 dark:bg-primary/10" 
          : "bg-card border-border hover:bg-accent/50"
      }`}
    >
      <div className="flex items-start justify-between space-x-3">
        <div className="flex items-start space-x-3 flex-1">
          <div className="text-lg">{getIcon(notification.type)}</div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-medium text-foreground text-sm">
                {notification.title}
              </h4>
              <Badge variant="secondary" className={`text-xs ${getTypeColor(notification.type)}`}>
                {notification.type.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            
            <p className="text-muted-foreground text-sm mb-2">
              {notification.message}
            </p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.created_at * 1000), { addSuffix: true })}
              </span>
              
              <div className="flex items-center space-x-2">
                {notification.action_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleNotificationAction(notification)}
                    className="h-7 px-2 text-xs text-primary hover:text-primary-foreground hover:bg-primary"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View
                  </Button>
                )}
                
                {isUnread && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAsRead(notification.id)}
                    disabled={isMarkingAsRead}
                    className="h-7 px-2 text-xs"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Mark Read
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteNotification(notification.id)}
                  disabled={isDeletingNotification}
                  className="h-7 px-2 text-xs text-destructive hover:text-destructive-foreground hover:bg-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar 
          title="Notifications"
          description="Stay updated with your latest notifications"
          showCreateButton={false}
        />
        <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Bell className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Loading notifications...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar 
        title="Notifications"
        description="Stay updated with your latest notifications"
        showCreateButton={false}
      />

      <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">All Notifications</h2>
              </div>
              {unreadNotifications.length > 0 && (
                <Badge variant="destructive" className="bg-red-500 text-white">
                  {unreadNotifications.length} unread
                </Badge>
              )}
            </div>
            
            {unreadNotifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                disabled={isMarkingAllAsRead}
                className="flex items-center space-x-2"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Mark All Read</span>
              </Button>
            )}
          </div>

          {/* Unread Notifications */}
          {unreadNotifications.length > 0 && (
            <Card className="shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center space-x-2">
                  <span>Unread Notifications</span>
                  <Badge variant="destructive" className="bg-red-500 text-white">
                    {unreadNotifications.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {unreadNotifications.map((notification) => (
                    <NotificationItem 
                      key={notification.id} 
                      notification={notification} 
                      isUnread={true}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Read Notifications */}
          {readNotifications.length > 0 && (
            <Card className="shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Read Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3 pr-4">
                    {readNotifications.map((notification) => (
                      <NotificationItem 
                        key={notification.id} 
                        notification={notification} 
                        isUnread={false}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {(!notifications || (notifications as any[]).length === 0) && !isLoading && (
            <Card className="shadow-md">
              <CardContent className="py-12">
                <div className="text-center">
                  <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No notifications yet</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    When you receive notifications for applications, messages, or job updates, they'll appear here.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}