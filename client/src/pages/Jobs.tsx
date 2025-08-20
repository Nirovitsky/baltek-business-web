import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TopBar from "@/components/layout/TopBar";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiService } from "@/lib/api";
import { Edit, Trash2, Search, Eye, Briefcase, MapPin, Users, DollarSign, Calendar, Building2 } from "lucide-react";
import type { Job, PaginatedResponse } from "@/types";

export default function Jobs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { selectedOrganization } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['/jobs/', selectedOrganization?.id, searchTerm, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      params.append('owned', 'true');
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      console.log('Fetching jobs with params:', params.toString(), 'for organization:', selectedOrganization?.id, 'statusFilter:', statusFilter);
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
    setLocation('/jobs/create');
  };

  const handleEditJob = (job: Job) => {
    setLocation(`/jobs/edit/${job.id}`);
  };

  const handleViewJob = (jobId: number) => {
    setLocation(`/jobs/${jobId}`);
  };

  const handleDeleteJob = (jobId: number) => {
    if (confirm('Are you sure you want to delete this job posting?')) {
      deleteJobMutation.mutate(jobId);
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'open':
        return 'bg-green-500/10 text-green-700 dark:text-green-300'; // Active - green color
      case 'closed':
      case 'archived':
        return 'bg-muted text-muted-foreground';   // Archived - grey color  
      case 'expired':
        return 'bg-red-500/10 text-red-700 dark:text-red-300';     // Expired - red color
      case 'draft':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-300';   // Draft - blue color
      default:
        return 'bg-muted text-muted-foreground';   // Default to grey for unknown status
    }
  };

  // Sort jobs by created_at in descending order (newest first)
  const jobs = data?.results ? 
    [...data.results].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) : 
    [];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar 
        title="Job Postings"
        description="Manage your job opportunities"
      />

      <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-4 w-28" />
                    </div>
                    
                    {/* Details */}
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                    
                    {/* Salary */}
                    <Skeleton className="h-4 w-40" />
                    
                    {/* Description */}
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No job postings found</h3>
              <p className="text-muted-foreground mb-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {jobs.map((job) => {
              // Extract location and organization data safely
              const location = typeof job.location === 'object' && job.location ? job.location : null;
              const organization = typeof job.organization === 'object' && job.organization ? job.organization : null;
              
              return (
                <Card 
                  key={job.id} 
                  className="group hover:shadow-lg transition-all duration-200 cursor-pointer border hover:border-primary/20"
                  onClick={() => handleViewJob(job.id)}
                >
                  <CardContent className="p-6">
                    {/* Header with title and applications count */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                          {job.title}
                        </h3>
                        {organization && 'official_name' in organization && (
                          <div className="flex items-center text-sm text-muted-foreground mb-2">
                            <Building2 className="w-4 h-4 mr-1" />
                            {organization.official_name}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="w-4 h-4 mr-1 text-primary" />
                        <span className="font-medium">{job.applications_count || 0} applications</span>
                      </div>
                    </div>

                    {/* Job details */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Briefcase className="w-4 h-4 mr-2 text-primary flex-shrink-0" />
                        <span>
                          {job.workplace_type === 'remote' ? 'Remote' : 
                           job.workplace_type === 'on_site' ? 'On Site' : 'Hybrid'} • {' '}
                          {job.job_type === 'full_time' ? 'Full Time' : 
                           job.job_type === 'part_time' ? 'Part Time' : 'Contract'}
                        </span>
                      </div>
                      {location && 'name' in location && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 mr-2 text-primary flex-shrink-0" />
                          <span>{location.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Salary information */}
                    {(job.salary_from || job.salary_to) && (
                      <div className="flex items-center text-sm mb-4">
                        {job.currency === 'USD' ? (
                          <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                        ) : (
                          <div className="w-4 h-4 mr-2 flex items-center justify-center text-green-600 font-semibold text-xs">₼</div>
                        )}
                        <span className="font-medium text-foreground">
                          {(() => {
                            const currency = job.currency || 'TMT';
                            const currencySymbol = currency === 'USD' ? '$' : currency === 'TMT' ? 'TMT' : currency;
                            
                            if (job.salary_from && job.salary_to) {
                              return `${currencySymbol} ${job.salary_from.toLocaleString()} - ${job.salary_to.toLocaleString()}`;
                            } else if (job.salary_from) {
                              return `${currencySymbol} ${job.salary_from.toLocaleString()}+`;
                            } else if (job.salary_to) {
                              return `Up to ${currencySymbol} ${job.salary_to.toLocaleString()}`;
                            }
                            return 'Salary not specified';
                          })()}
                          {job.salary_payment_type && (
                            <span className="text-muted-foreground ml-1">
                              / {job.salary_payment_type.replace('_', ' ')}
                            </span>
                          )}
                        </span>
                      </div>
                    )}

                    {/* Description preview */}
                    {job.description && (
                      <p className="text-foreground text-sm mb-4 line-clamp-2 leading-relaxed">
                        {job.description}
                      </p>
                    )}

                    {/* Footer with status and date */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center space-x-3">
                        <Badge 
                          variant="secondary" 
                          className={`${getStatusColor(job.status || 'open')} border`}
                        >
{(() => {
                            // Debug: log the actual status value from backend
                            console.log('Job status from backend:', job.status, 'for job:', job.id);
                            
                            const status = job.status?.toLowerCase();
                            
                            // Map backend status values to display labels
                            if (status === 'open') return 'Active';
                            if (status === 'closed' || status === 'archived') return 'Archived';
                            if (status === 'expired') return 'Expired';
                            if (status === 'draft') return 'Draft';
                            
                            // Show the raw status if it doesn't match known values
                            return job.status ? job.status.charAt(0).toUpperCase() + job.status.slice(1) : 'Active';
                          })()}
                        </Badge>
                      </div>
                      <div className="flex flex-col items-end text-xs text-muted-foreground space-y-1">
                        {job.date_started && (
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            <span>
                              Published: {job.date_started || 'No date'}
                            </span>
                          </div>
                        )}
                        {job.date_ended && (
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            <span>
                              Expires: {job.date_ended || 'No date'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

    </div>
  );
}
