import { useNavigate } from "react-router-dom";
import { Plus, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { useHoverPrefetch } from "@/hooks/usePrefetch";
import { useTranslation } from 'react-i18next';

interface TopBarProps {
  title: string;
  description?: string;
  showCreateButton?: boolean;
  hideNotifications?: boolean;
}

export default function TopBar({ 
  title, 
  description, 
  showCreateButton = true,
  hideNotifications = false
}: TopBarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selectedOrganization } = useAuth();
  const { toast } = useToast();
  const { unreadCount } = useNotifications(false);
  const { prefetchRoute } = useHoverPrefetch();

  const handleCreateJob = () => {
    if (selectedOrganization?.is_public === false) {
      toast({
        title: t('messages.organizationNotApproved'),
        description: t('messages.organizationUnderReview'),
        variant: "destructive",
      });
      return;
    }
    navigate('/jobs/create');
  };

  const handleNotifications = () => {
    navigate('/notifications');
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 min-h-16">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="flex flex-1 items-center justify-between">
        <div className="min-h-12 flex flex-col justify-center">
          <h1 className="text-lg font-semibold text-foreground leading-tight">{title}</h1>
          <div className="min-h-5">
            {description && (
              <p className="text-sm text-muted-foreground leading-tight">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {!hideNotifications && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNotifications}
              onMouseEnter={() => prefetchRoute('/notifications')}
              className="relative"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full px-1"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </Button>
          )}
          {showCreateButton && (
            <Button 
              onClick={handleCreateJob} 
              onMouseEnter={() => {
                prefetchRoute('/jobs');
                prefetchRoute('/jobs/create');
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('jobs.createJob')}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}