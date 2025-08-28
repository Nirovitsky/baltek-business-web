import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useHoverPrefetch } from "@/hooks/usePrefetch";
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from "@/components/ui/language-selector";
import { ThemeToggle } from "@/components/theme-toggle";

interface TopBarProps {
  showCreateButton?: boolean;
}

export default function TopBar({ 
  showCreateButton = true
}: TopBarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selectedOrganization } = useAuth();
  const { toast } = useToast();
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


  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 min-h-16">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="flex flex-1 items-center justify-end">
        <div className="flex items-center space-x-4">
          <LanguageSelector variant="compact" />
          <ThemeToggle />
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