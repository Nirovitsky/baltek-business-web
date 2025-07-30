import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TopBar from "@/components/layout/TopBar";
import JobModal from "@/components/modals/JobModal";
import JobDetailDialog from "@/components/jobs/JobDetailDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiService } from "@/lib/api";
import { Edit, Trash2, Search, Eye, Briefcase } from "lucide-react";
import type { Job, PaginatedResponse } from "@shared/schema";

export default function Jobs() {
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isJobDetailOpen, setIsJobDetailOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | undefined>();
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { toast } = useToast();
  const { selectedOrganization } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['/jobs/', selectedOrganization?.id, searchTerm, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedOrganization) params.append('organization', selectedOrganization.id.toString());
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      return apiService.request<PaginatedResponse<Job>>(`/jobs/?${params.toString()}`);
    },
    enabled: !!selectedOrganization,
  });

  const deleteJobMutation = useMutation({
    mutationFn: (jobId: number) => apiService.request(`/jobs/${jobId}/`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/jobs/'] });
      toast({
        title: "Success",
        description: "Job posting deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to delete job posting",
        variant: "destructive",
      });
    },
  });

  const handleCreateJob = () => {
    setSelectedJob(undefined);
    setIsJobModalOpen(true);
  };

  const handleEditJob = (job: Job) => {
    setSelectedJob(job);
    setIsJobModalOpen(true);
    setIsJobDetailOpen(false);
  };

  const handleViewJob = (jobId: number) => {
    setSelectedJobId(jobId);
    setIsJobDetailOpen(true);
  };

  const handleDeleteJob = (jobId: number) => {
    if (confirm('Are you sure you want to delete this job posting?')) {
      deleteJobMutation.mutate(jobId);
      setIsJobDetailOpen(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const jobs = data?.results || [];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar 
        title="Job Postings"
        description="Manage your job opportunities"
        onCreateJob={handleCreateJob}
      />

      <main className="flex-1 overflow-y-auto p-6">
        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Jobs List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-6 w-64" />
                      <Skeleton className="h-4 w-48" />
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No job postings found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? "Try adjusting your search or filters"
                  : "Create your first job posting to get started"
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={handleCreateJob}>
                  Create Job Posting
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card 
                key={job.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleViewJob(job.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {job.title}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {job.workplace_type === 'remote' ? 'Remote' : 
                             job.workplace_type === 'on_site' ? 'On Site' : 'Hybrid'} • {' '}
                            {job.job_type === 'full_time' ? 'Full Time' : 
                             job.job_type === 'part_time' ? 'Part Time' : 'Contract'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditJob(job)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteJob(job.id)}
                            disabled={deleteJobMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                        {job.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Badge variant="secondary" className={getStatusColor(job.status)}>
                            {job.status ? job.status.charAt(0).toUpperCase() + job.status.slice(1) : 'Unknown'}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {job.applications_count || 0} applications
                          </span>
                          {job.salary_from && job.salary_to && (
                            <span className="text-sm font-medium text-gray-900">
                              ${job.salary_from.toLocaleString()} - ${job.salary_to.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          Created {new Date(job.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <JobModal
        open={isJobModalOpen}
        onOpenChange={setIsJobModalOpen}
        job={selectedJob}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['/jobs/'] });
        }}
      />

      <JobDetailDialog
        jobId={selectedJobId}
        open={isJobDetailOpen}
        onOpenChange={setIsJobDetailOpen}
        onEdit={handleEditJob}
        onDelete={handleDeleteJob}
      />
    </div>
  );
}
