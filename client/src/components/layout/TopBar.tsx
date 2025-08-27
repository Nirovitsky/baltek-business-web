import { useNavigate } from "react-router-dom";
import { Plus, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";

interface TopBarProps {
  title: string;
  description?: string;
  showCreateButton?: boolean;
}

export default function TopBar({ 
  title, 
  description, 
  showCreateButton = true 
}: TopBarProps) {
  const navigate = useNavigate();
  const { selectedOrganization } = useAuth();
  const { toast } = useToast();
  const { unreadCount } = useNotifications(false);

  const handleCreateJob = () => {
    if (selectedOrganization?.is_public === false) {
      toast({
        title: "Organization Not Approved",
        description: "Your organization is currently under review. You cannot create job postings until it's approved by our moderators.",
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
    <header className="bg-background border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNotifications}
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
          <Button 
            onClick={handleCreateJob} 
            disabled={selectedOrganization?.is_public === false}
            className={`${
              selectedOrganization?.is_public === false 
                ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed opacity-60' 
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
