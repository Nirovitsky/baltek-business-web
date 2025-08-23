import { useNavigate } from "react-router-dom";
import { Plus, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useGlobalMessageNotifications } from "@/hooks/useGlobalMessageNotifications";

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
  const { unreadCount } = useGlobalMessageNotifications();

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
          {/* Message notification indicator */}
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/chat')}
              className="relative p-2 hover:bg-blue-50 dark:hover:bg-blue-950"
              title={`${unreadCount} unread message${unreadCount === 1 ? '' : 's'}`}
            >
              <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            </Button>
          )}
          <ThemeToggle />
          <Button 
            onClick={handleCreateJob} 
            disabled={selectedOrganization?.is_public === false}
            className={`${
              selectedOrganization?.is_public === false 
                ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed opacity-60' 
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            <Plus className="w-4 h-4 mr-2" />
            Post New Job
          </Button>
        </div>
      </div>
    </header>
  );
}
