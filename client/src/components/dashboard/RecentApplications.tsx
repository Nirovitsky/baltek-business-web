import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/lib/api";
import type { JobApplication, PaginatedResponse } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function RecentApplications() {
  const { data, isLoading } = useQuery({
    queryKey: ['/jobs/applications/'],
    queryFn: () => apiService.request<PaginatedResponse<JobApplication>>('/jobs/applications/?limit=4'),
  });

  if (isLoading) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Applications</h3>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border border-gray-100 rounded-lg">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const applications = data?.results || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'invited':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'hired':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Applications</h3>
          <Button variant="ghost" size="sm">View All</Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {applications.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No applications yet</p>
            <p className="text-sm text-gray-400 mt-2">Applications will appear here when candidates apply</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <div key={application.id} className="flex items-center space-x-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="text-gray-600 w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {application.owner?.first_name && application.owner?.last_name 
                      ? `${application.owner.first_name} ${application.owner.last_name}`
                      : `Candidate #${application.id}`}
                  </h4>
                  <p className="text-sm text-gray-500">
                    Applied for {application.job?.title || `Job #${application.job.id}`}
                  </p>
                  <p className="text-xs text-gray-400">
                    Applied {new Date(application.created).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className={getStatusColor(application.status)}>
                    {application.status ? application.status.charAt(0).toUpperCase() + application.status.slice(1) : 'Unknown'}
                  </Badge>
                  <ChevronRight className="text-gray-400 w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
