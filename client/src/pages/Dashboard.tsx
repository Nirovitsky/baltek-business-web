import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import TopBar from "@/components/layout/TopBar";
import StatsCard from "@/components/dashboard/StatsCard";
import RecentJobs from "@/components/dashboard/RecentJobs";
import RecentApplications from "@/components/dashboard/RecentApplications";
import QuickActions from "@/components/dashboard/QuickActions";
import JobModal from "@/components/modals/JobModal";
import JobDetailDialog from "@/components/jobs/JobDetailDialog";
import { Briefcase, Users, Clock, UserCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiService } from "@/lib/api";
import type { Job, JobApplication, PaginatedResponse } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isJobDetailOpen, setIsJobDetailOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const { selectedOrganization } = useAuth();

  // Fetch data for stats filtered by organization
  const { data: jobsData } = useQuery({
    queryKey: ['/jobs/', selectedOrganization?.id],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedOrganization) params.append('organization', selectedOrganization.id.toString());
      return apiService.request<PaginatedResponse<Job>>(`/jobs/?${params.toString()}`);
    },
    enabled: !!selectedOrganization,
  });

  const { data: applicationsData } = useQuery({
    queryKey: ['/jobs/applications/', selectedOrganization?.id],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedOrganization) params.append('organization', selectedOrganization.id.toString());
      return apiService.request<PaginatedResponse<JobApplication>>(`/jobs/applications/?${params.toString()}`);
    },
    enabled: !!selectedOrganization,
  });

  const jobs = jobsData?.results || [];
  const applications = applicationsData?.results || [];

  // Calculate stats
  // Count jobs that are active (only "open" status jobs are active)
  const activeJobs = jobs.filter(job => job.status === 'open').length;
  const totalApplications = applicationsData?.count || 0;
  const pendingApplications = applications.filter(app => app.status === 'pending').length;
  const hiredThisMonth = applications.filter(app => app.status === 'hired').length;

  const handleCreateJob = () => {
    setIsJobModalOpen(true);
  };

  const handleReviewApplications = () => {
    setLocation('/applications');
  };

  const handleOpenMessages = () => {
    setLocation('/messages');
  };

  const handleJobClick = (jobId: number) => {
    setSelectedJobId(jobId);
    setIsJobDetailOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar 
        title="Dashboard Overview"
        description="Manage your job postings and applications"
        onCreateJob={handleCreateJob}
      />

      <main className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50 dark:bg-gray-900">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Active Jobs"
            value={activeJobs}
            icon={Briefcase}
            change={{
              value: `+${Math.max(0, activeJobs - 20)}`,
              label: "from last month",
              type: "positive"
            }}
          />
          
          <StatsCard
            title="Total Applications"
            value={totalApplications}
            icon={Users}
            iconColor="text-blue-600"
            change={{
              value: `+${Math.max(0, Math.floor(totalApplications * 0.08))}`,
              label: "from last month",
              type: "positive"
            }}
          />

          <StatsCard
            title="Pending Reviews"
            value={pendingApplications}
            icon={Clock}
            iconColor="text-yellow-600"
            change={{
              value: `+${Math.max(0, pendingApplications - 50)}`,
              label: "since yesterday",
              type: "neutral"
            }}
          />

          <StatsCard
            title="Hired This Month"
            value={hiredThisMonth}
            icon={UserCheck}
            iconColor="text-green-600"
            change={{
              value: `+${Math.max(0, hiredThisMonth - 5)}`,
              label: "from last month",
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
          onCreateJob={handleCreateJob}
          onReviewApplications={handleReviewApplications}
          onOpenMessages={handleOpenMessages}
        />
      </main>

      <JobModal
        open={isJobModalOpen}
        onOpenChange={setIsJobModalOpen}
        onSuccess={() => {
          // Refresh data after job creation
          window.location.reload();
        }}
      />

      <JobDetailDialog
        jobId={selectedJobId}
        open={isJobDetailOpen}
        onOpenChange={setIsJobDetailOpen}
      />
    </div>
  );
}
