import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

interface TopBarProps {
  title: string;
  description?: string;
  onCreateJob?: () => void;
  showCreateButton?: boolean;
}

export default function TopBar({ 
  title, 
  description, 
  onCreateJob, 
  showCreateButton = true 
}: TopBarProps) {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
          {description && (
            <p className="text-gray-600 dark:text-gray-300">{description}</p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          {showCreateButton && (
            <Button onClick={onCreateJob} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Post New Job
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
