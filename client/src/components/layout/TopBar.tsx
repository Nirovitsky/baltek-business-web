import { useLocation } from "wouter";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

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
  const [, setLocation] = useLocation();

  const handleCreateJob = () => {
    setLocation('/jobs/create');
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
          {showCreateButton && (
            <Button onClick={handleCreateJob} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Post New Job
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
