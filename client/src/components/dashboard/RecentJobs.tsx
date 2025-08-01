import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code, TrendingUp, Palette } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import type { Job, PaginatedResponse } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

const jobIcons: Record<string, any> = {
  technology: Code,
  marketing: TrendingUp,
  design: Palette,
};

interface RecentJobsProps {
  onJobClick?: (jobId: number) => void;
}

export default function RecentJobs({ onJobClick }: RecentJobsProps) {
  const { selectedOrganization } = useAuth();
  const [, setLocation] = useLocation();
  
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
      <Card className="shadow-sm border border">
        <CardHeader className="border-b border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Recent Job Postings</h3>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start space-x-4 p-4 border rounded-lg">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                  <div className="flex items-center">
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
    <Card className="shadow-sm border border">
      <CardHeader className="border-b border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Recent Job Postings</h3>
          <Button variant="ghost" size="sm" onClick={() => setLocation('/jobs')}>View All</Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {jobs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No job postings yet</p>
            <p className="text-sm text-gray-400 mt-2">Create your first job posting to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const categoryKey = typeof job.category === 'object' ? job.category.name : 'technology';
              const IconComponent = jobIcons[categoryKey] || Code;


              return (
                <div 
                  key={job.id} 
                  className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-background transition-colors cursor-pointer"
                  onClick={() => onJobClick?.(job.id)}
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{job.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {job.workplace_type === 'remote' ? 'Remote' : 
                       job.workplace_type === 'on_site' ? 'On Site' : 'Hybrid'} • {' '}
                      {job.job_type === 'full_time' ? 'Full Time' : 
                       job.job_type === 'part_time' ? 'Part Time' : 'Contract'}
                    </p>
                    <div className="flex items-center mt-2">
                      <span className="text-xs text-muted-foreground">
                        {job.applications_count || 0} applications
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    {job.salary_from && job.salary_to && (
                      <p className="text-sm font-medium text-foreground">
                        TMT {job.salary_from.toLocaleString()} - {job.salary_to.toLocaleString()}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {job.date_started || 'No date'}
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
