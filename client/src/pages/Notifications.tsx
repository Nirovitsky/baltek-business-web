import { useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bell, 
  Check, 
  CheckCheck, 
  ExternalLink, 
  Users, 
  MessageCircle, 
  Megaphone, 
  AlertTriangle, 
  Clock,
  Mail,
  Archive,
  Filter,
  Search
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function Notifications() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const { 
    notifications, 
    isLoading, 
    markAsRead, 
    markAllAsRead,
    isMarkingAsRead,
    isMarkingAllAsRead
  } = useNotifications(true); // Enable notifications fetching on notifications page

  const unreadNotifications = (notifications as any[])?.filter((n: any) => !n.is_read) || [];
  const readNotifications = (notifications as any[])?.filter((n: any) => n.is_read) || [];
  
  const filteredNotifications = filter === 'unread' 
    ? unreadNotifications 
    : filter === 'read' 
      ? readNotifications 
      : [...unreadNotifications, ...readNotifications];

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
        return <Users className="h-4 w-4" />;
      case "new_message":
        return <MessageCircle className="h-4 w-4" />;
      case "job_published":
        return <Megaphone className="h-4 w-4" />;
      case "system_alert":
        return <AlertTriangle className="h-4 w-4" />;
      case "job_expired":
        return <Clock className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const handleNotificationAction = (notification: any) => {
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const NotificationItem = ({ notification, isUnread }: { notification: any; isUnread: boolean }) => (
    <div
      className={`group relative p-6 border rounded-xl transition-all duration-300 hover:shadow-md ${
        isUnread 
          ? "bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-primary/30 shadow-sm" 
          : "bg-card border-border hover:bg-accent/30"
      }`}
    >
      {isUnread && (
        <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary to-primary/60 rounded-l-xl" />
      )}
      
      <div className="flex items-start space-x-4">
        <div className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
          isUnread 
            ? "bg-gradient-to-br from-primary/20 to-primary/10 text-primary border-2 border-primary/30" 
            : "bg-gradient-to-br from-muted to-muted/50 text-muted-foreground border-2 border-muted-foreground/20"
        }`}>
          {getIcon(notification.type || 'default')}
        </div>
        
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-3">
                <h3 className={`font-semibold transition-colors ${
                  isUnread ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {notification.title}
                </h3>
                <Badge 
                  variant="secondary" 
                  className={`text-xs font-medium px-2 py-1 ${getTypeColor(notification.type || 'default')}`}
                >
                  {(notification.type || 'notification').replace('_', ' ')}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                {notification.body || notification.message || ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {(() => {
                  try {
                    const date = new Date(notification.created_at);
                    if (isNaN(date.getTime())) {
                      return 'Recently';
                    }
                    return formatDistanceToNow(date, { addSuffix: true });
                  } catch {
                    return 'Recently';
                  }
                })()}
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
              {notification.action_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNotificationAction(notification)}
                  className="h-8 px-3 text-xs font-medium text-primary hover:text-primary-foreground hover:bg-primary/90 transition-all duration-200"
                >
                  <ExternalLink className="h-3 w-3 mr-1.5" />
                  View Details
                </Button>
              )}
              
              {isUnread && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAsRead(notification.id)}
                  disabled={isMarkingAsRead}
                  className="h-8 px-3 text-xs font-medium hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-all duration-200"
                >
                  <Check className="h-3 w-3 mr-1.5" />
                  Mark Read
                </Button>
              )}
              
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
          showCreateButton={true}
          hideNotifications={false}
        />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="max-w-5xl mx-auto w-full space-y-6">
            {/* Loading Header */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-primary/10 animate-pulse">
                  <Bell className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <div className="h-6 bg-muted rounded w-48 animate-pulse" />
                  <div className="h-4 bg-muted/60 rounded w-64 animate-pulse" />
                </div>
              </div>
              
              <div className="flex items-center space-x-1 bg-muted/50 p-1 rounded-lg w-fit">
                {['All', 'Unread', 'Read'].map((tab, i) => (
                  <div key={tab} className="h-8 px-4 bg-muted/60 rounded animate-pulse" />
                ))}
              </div>
            </div>

            {/* Loading Notifications */}
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 border rounded-xl bg-card animate-pulse">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-full bg-muted" />
                    <div className="flex-1 space-y-3">
                      <div className="space-y-2">
                        <div className="h-5 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted/60 rounded w-full" />
                      </div>
                      <div className="flex justify-between">
                        <div className="h-3 bg-muted/40 rounded w-24" />
                        <div className="flex space-x-2">
                          <div className="h-6 bg-muted/60 rounded w-16" />
                          <div className="h-6 bg-muted/40 rounded w-20" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar 
        title="Notifications" 
        description="Stay updated with your latest notifications"
        showCreateButton={true}
        hideNotifications={false}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="max-w-5xl mx-auto w-full space-y-6">
          {/* Header with Mark All Read */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bell className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
                  <p className="text-sm text-muted-foreground">Stay updated with your latest activity</p>
                </div>
              </div>
            </div>
            
            {unreadNotifications.length > 0 && (
              <Button
                onClick={() => markAllAsRead()}
                disabled={isMarkingAllAsRead}
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md transition-all duration-300"
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                Mark All Read
                <Badge variant="secondary" className="ml-2 bg-white/20 text-white">
                  {unreadNotifications.length}
                </Badge>
              </Button>
            )}
          </div>
          
          {/* Filter Tabs */}
          <div className="flex items-center space-x-1 bg-muted/50 p-1 rounded-lg w-fit">
            <Button
              variant={filter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
              className="transition-all duration-200"
            >
              <Mail className="w-4 h-4 mr-1.5" />
              All
              <Badge variant="secondary" className="ml-1.5">
                {(notifications as any[])?.length || 0}
              </Badge>
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('unread')}
              className="transition-all duration-200"
            >
              <Bell className="w-4 h-4 mr-1.5" />
              Unread
              {unreadNotifications.length > 0 && (
                <Badge variant="destructive" className="ml-1.5">
                  {unreadNotifications.length}
                </Badge>
              )}
            </Button>
            <Button
              variant={filter === 'read' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('read')}
              className="transition-all duration-200"
            >
              <Archive className="w-4 h-4 mr-1.5" />
              Read
              <Badge variant="secondary" className="ml-1.5">
                {readNotifications.length}
              </Badge>
            </Button>
          </div>

          {/* Notifications List */}
          {filteredNotifications.length > 0 ? (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="animate-in slide-in-from-bottom-2 duration-300"
                >
                  <NotificationItem 
                    notification={notification} 
                    isUnread={!notification.is_read}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="space-y-4">
                <div className="p-4 rounded-full bg-muted/30 w-16 h-16 mx-auto flex items-center justify-center">
                  {filter === 'unread' ? (
                    <Bell className="w-8 h-8 text-muted-foreground" />
                  ) : filter === 'read' ? (
                    <Archive className="w-8 h-8 text-muted-foreground" />
                  ) : (
                    <Mail className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">
                    {filter === 'unread' ? 'No unread notifications' : 
                     filter === 'read' ? 'No read notifications' : 
                     'No notifications'}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {filter === 'unread' ? 'You\'re all caught up! New notifications will appear here.' :
                     filter === 'read' ? 'Mark notifications as read to see them here.' :
                     'When you receive notifications for applications, messages, or job updates, they\'ll appear here.'}
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}