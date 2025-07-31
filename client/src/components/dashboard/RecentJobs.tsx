import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code, TrendingUp, Palette } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { Job, PaginatedResponse } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

const jobIcons: Record<string, any> = {
  technology: Code,
  marketing: TrendingUp,
  design: Palette,
};

export default function RecentJobs() {
  const { selectedOrganization } = useAuth();
  
  const { data, isLoading } = useQuery({
    queryKey: ['/jobs/', selectedOrganization?.id],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedOrganization) params.append('organization', selectedOrganization.id.toString());
      params.append('limit', '3');
      
      console.log('Fetching recent jobs with params:', params.toString(), 'for organization:', selectedOrganization?.id);
      return apiService.request<PaginatedResponse<Job>>(`/jobs/?${params.toString()}`);
    },
    enabled: !!selectedOrganization,
  });

  if (isLoading) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Job Postings</h3>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start space-x-4 p-4 border border-gray-100 rounded-lg">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const jobs = data?.results || [];

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Job Postings</h3>
          <Button variant="ghost" size="sm">View All</Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {jobs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No job postings yet</p>
            <p className="text-sm text-gray-400 mt-2">Create your first job posting to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const IconComponent = jobIcons[job.category] || Code;
              const statusColor = job.status === 'open' ? 'bg-green-100 text-green-800' : 
                                job.status === 'archived' ? 'bg-gray-100 text-gray-800' : 
                                'bg-yellow-100 text-yellow-800';

              return (
                <div key={job.id} className="flex items-start space-x-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <IconComponent className="text-primary w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{job.title}</h4>
                    <p className="text-sm text-gray-500">
                      {job.workplace_type === 'remote' ? 'Remote' : 
                       job.workplace_type === 'on_site' ? 'On Site' : 'Hybrid'} • {' '}
                      {job.job_type === 'full_time' ? 'Full Time' : 
                       job.job_type === 'part_time' ? 'Part Time' : 'Contract'}
                    </p>
                    <div className="flex items-center mt-2 space-x-4">
                      <Badge variant="secondary" className={statusColor}>
                        {job.status ? job.status.charAt(0).toUpperCase() + job.status.slice(1) : 'Unknown'}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {job.applications_count || 0} applications
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    {job.salary_from && job.salary_to && (
                      <p className="text-sm font-medium text-gray-900">
                        ${job.salary_from.toLocaleString()} - ${job.salary_to.toLocaleString()}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {new Date(job.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
