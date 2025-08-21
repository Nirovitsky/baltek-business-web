import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, MapPin, MessageCircle, FileText, Calendar, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/lib/api";
import type { JobApplication } from "@/types";

interface ApplicationDetailsModalProps {
  application: JobApplication | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ApplicationDetailsModal({ 
  application, 
  isOpen, 
  onClose 
}: ApplicationDetailsModalProps) {
  const navigate = useNavigate();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: detailedApplication, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['/jobs/applications/', application?.id, 'details'],
    queryFn: () => apiService.request<JobApplication>(`/jobs/applications/${application?.id}/`),
    enabled: !!application?.id && isOpen,
  });

  if (!application) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-primary/10 text-primary';
      case 'invited':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'hired':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'expired':
        return 'bg-muted text-foreground';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const handleSendMessage = () => {
    navigate(`/profile/${application.owner?.id}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <Avatar className="w-12 h-12">
              <AvatarImage 
                src={application.owner?.avatar} 
                alt={application.owner?.first_name && application.owner?.last_name 
                  ? `${application.owner.first_name} ${application.owner.last_name}`
                  : 'Candidate'} 
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                {application.owner?.first_name && application.owner?.last_name ? (
                  `${application.owner.first_name[0]}${application.owner.last_name[0]}`
                ) : (
                  'C'
                )}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {application.owner?.first_name && application.owner?.last_name 
                  ? `${application.owner.first_name} ${application.owner.last_name}`
                  : `Candidate #${application.id}`}
              </h2>
              <p className="text-sm text-muted-foreground">
                Application for {application.job?.title || `Job #${application.job}`}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoadingDetails ? (
          <div className="space-y-4 mt-6">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <div className="space-y-6 mt-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Contact Information</h3>
                <div className="space-y-2">
                  {detailedApplication?.owner?.profession && (
                    <div className="flex items-center space-x-2">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{detailedApplication.owner.profession}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{application.job?.location?.name || 'Location not specified'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Application Status</h3>
                <div className="space-y-2">
                  <Badge variant="secondary" className={`${getStatusColor(application.status)} text-sm`}>
                    {application.status ? application.status.charAt(0).toUpperCase() + application.status.slice(1) : 'Unknown'}
                  </Badge>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Applied on {formatDate(application.date_applied || application.created_at || '')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cover Letter */}
            {detailedApplication?.cover_letter && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Cover Letter</span>
                </h3>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{detailedApplication.cover_letter}</p>
                </div>
              </div>
            )}

            {/* Resume */}
            {detailedApplication?.resume && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Resume</span>
                </h3>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(detailedApplication.resume, '_blank')}
                  >
                    View Resume
                  </Button>
                  <span className="text-sm text-muted-foreground">PDF Document</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center space-x-3 pt-4 border-t">
              <Button onClick={handleSendMessage} className="flex items-center space-x-2">
                <MessageCircle className="w-4 h-4" />
                <span>Send Message</span>
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  navigate(`/profile/${application.owner?.id}`);
                  onClose();
                }}
              >
                View Profile
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}