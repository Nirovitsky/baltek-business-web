import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import TopBar from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Bell } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import StatsCard from "@/components/dashboard/StatsCard";
import RecentJobs from "@/components/dashboard/RecentJobs";
import RecentApplications from "@/components/dashboard/RecentApplications";
import QuickActions from "@/components/dashboard/QuickActions";
import JobDetailDialog from "@/components/jobs/JobDetailDialog";
import { Briefcase, Users, Clock, UserCheck, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiService } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Job, JobApplication, PaginatedResponse } from "@/types";

export default function Dashboard() {
  const navigate = useNavigate();
  const [isJobDetailOpen, setIsJobDetailOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const { selectedOrganization } = useAuth();
  const { unreadCount } = useNotifications(false);

  // Fetch data for stats filtered by organization
  const { data: jobsData } = useQuery({
    queryKey: ['/jobs/', selectedOrganization?.id],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedOrganization) {
        params.append('organization', selectedOrganization.id.toString());
      }
      return apiService.request<PaginatedResponse<Job>>(`/jobs/?${params.toString()}`);
    },
    enabled: !!selectedOrganization,
  });

  const { data: applicationsData } = useQuery({
    queryKey: ['/jobs/applications/', selectedOrganization?.id],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedOrganization) {
        params.append('organization', selectedOrganization.id.toString());
      }
      return apiService.request<PaginatedResponse<JobApplication>>(`/jobs/applications/?${params.toString()}`);
    },
    enabled: !!selectedOrganization,
  });

  const jobs = jobsData?.results || [];
  const applications = applicationsData?.results || [];

  // Calculate real stats from API data
  const activeJobs = jobs.filter(job => job.status === 'open').length;
  const totalApplications = applicationsData?.count || 0;
  const pendingApplications = applications.filter(app => app.status === 'in_review').length;
  const hiredThisMonth = applications.filter(app => app.status === 'hired').length;
  
  // Calculate changes (simplified calculation based on available data)
  const totalJobs = jobsData?.count || 0;
  const archivedJobs = jobs.filter(job => job.status === 'archived').length;
  const ongoingApplications = applications.filter(app => app.status === 'ongoing').length;



  const handleReviewApplications = () => {
    navigate('/applications');
  };

  const handleOpenMessages = () => {
    navigate('/chat');
  };

  const handleJobClick = (jobId: number) => {
    setSelectedJobId(jobId);
    setIsJobDetailOpen(true);
  };

  const handleCreateJob = () => {
    if (selectedOrganization?.is_public === false) {
      return;
    }
    navigate('/jobs/create');
  };

  return (
    <>
      <TopBar
        title="Dashboard Overview"
        description="Manage your job postings and applications"
        showCreateButton={true}
      />
      <div className="flex h-screen pt-16">
        <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="space-y-8">
        {/* Organization Approval Notice */}
        {selectedOrganization && selectedOrganization.is_public === false && (
          <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              <strong>Organization Under Review:</strong> Your organization "{selectedOrganization.official_name}" is currently being reviewed by our moderators. Once approved, you'll be able to post job openings and access all features.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Active Jobs"
            value={activeJobs}
            icon={Briefcase}
            change={{
              value: `${totalJobs} total`,
              label: `${archivedJobs} archived`,
              type: "neutral"
            }}
          />
          
          <StatsCard
            title="Total Applications"
            value={totalApplications}
            icon={Users}
            iconColor="text-primary"
            change={{
              value: `${pendingApplications} in review`,
              label: `${ongoingApplications} ongoing`,
              type: "positive"
            }}
          />

          <StatsCard
            title="Applications In Review"
            value={pendingApplications}
            icon={Clock}
            iconColor="text-yellow-600"
            change={{
              value: `${Math.round((pendingApplications / Math.max(totalApplications, 1)) * 100)}%`,
              label: "of total applications",
              type: "neutral"
            }}
          />

          <StatsCard
            title="Hired This Month"
            value={hiredThisMonth}
            icon={UserCheck}
            iconColor="text-green-600"
            change={{
              value: `${Math.round((hiredThisMonth / Math.max(totalApplications, 1)) * 100)}%`,
              label: "success rate",
              type: "positive"
            }}
          />
        </div>

        {/* Recent Jobs and Applications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RecentJobs onJobClick={handleJobClick} />
          <RecentApplications />
        </div>

          {/* Quick Actions */}
          <QuickActions
            onReviewApplications={handleReviewApplications}
            onOpenMessages={handleOpenMessages}
          />
        </div>
        </div>
      </div>

      {/* Job Detail Modal */}
      {selectedJobId && (
        <JobDetailDialog 
          jobId={selectedJobId}
          open={isJobDetailOpen}
          onOpenChange={setIsJobDetailOpen}
        />
      )}
    </>
  );
}
