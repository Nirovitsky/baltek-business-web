import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from "@/components/ui/card";
import { Plus, ClipboardList, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useHoverPrefetch } from "@/hooks/usePrefetch";

interface QuickActionsProps {
  onReviewApplications?: () => void;
  onOpenMessages?: () => void;
}

export default function QuickActions({ 
  onReviewApplications, 
  onOpenMessages 
}: QuickActionsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selectedOrganization } = useAuth();
  const { prefetchRoute } = useHoverPrefetch();

  const handleCreateJob = () => {
    if (selectedOrganization?.is_public === false) {
      return; // Prevent navigation if organization is not public
    }
    navigate('/jobs/create');
  };
  const isOrgNotPublic = selectedOrganization?.is_public === false;
  
  const actions = [
    {
      title: t('navigation.createJob'),
      description: isOrgNotPublic ? t('dashboard.pendingApproval') : t('dashboard.postNewJobOpportunity'),
      icon: Plus,
      iconBg: isOrgNotPublic ? "bg-gray-100" : "bg-primary/10",
      iconColor: isOrgNotPublic ? "text-gray-400" : "text-primary",
      onClick: handleCreateJob,
      disabled: isOrgNotPublic,
    },
    {
      title: t('applications.title'),
      description: t('dashboard.checkApplicationsInReview'),
      icon: ClipboardList,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      onClick: onReviewApplications,
    },
    {
      title: t('chat.title'),
      description: t('dashboard.chatWithApplicants'),
      icon: MessageCircle,
      iconBg: "",
      iconColor: "text-primary",
      onClick: onOpenMessages,
    },
  ];

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-6">{t('dashboard.quickActions')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={action.onClick}
                onMouseEnter={() => {
                  if (!action.disabled) {
                    if (action.title === "Create Job Posting") {
                      prefetchRoute('/jobs');
                      prefetchRoute('/jobs/create'); // Also prefetch create form data
                    }
                    if (action.title === "Review Applications") prefetchRoute('/applications');
                    if (action.title === "Message Candidates") prefetchRoute('/chat');
                  }
                }}
                disabled={action.disabled}
                className={`flex items-center p-4 border-2 border-dashed rounded-lg transition-colors text-left ${
                  action.disabled 
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                    : 'border-muted-foreground/30 hover:border-primary hover:bg-primary/5'
                }`}
              >
                <div className={`w-12 h-12 ${action.iconBg} rounded-lg flex items-center justify-center mr-4`}>
                  <Icon className={`${action.iconColor} w-6 h-6`} />
                </div>
                <div>
                  <h4 className="font-medium">{action.title}</h4>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
