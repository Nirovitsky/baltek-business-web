import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, ClipboardList, MessageCircle } from "lucide-react";

interface QuickActionsProps {
  onReviewApplications?: () => void;
  onOpenMessages?: () => void;
}

export default function QuickActions({ 
  onReviewApplications, 
  onOpenMessages 
}: QuickActionsProps) {
  const [, setLocation] = useLocation();

  const handleCreateJob = () => {
    setLocation('/jobs/create');
  };
  const actions = [
    {
      title: "Create Job Posting",
      description: "Post a new job opportunity",
      icon: Plus,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      onClick: handleCreateJob,
    },
    {
      title: "Review Applications",
      description: "Check pending applications",
      icon: ClipboardList,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      onClick: onReviewApplications,
    },
    {
      title: "Message Candidates",
      description: "Chat with applicants",
      icon: MessageCircle,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      onClick: onOpenMessages,
    },
  ];

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={action.onClick}
                className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left"
              >
                <div className={`w-12 h-12 ${action.iconBg} rounded-lg flex items-center justify-center mr-4`}>
                  <Icon className={`${action.iconColor} w-6 h-6`} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{action.title}</h4>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
