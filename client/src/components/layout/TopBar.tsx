import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
