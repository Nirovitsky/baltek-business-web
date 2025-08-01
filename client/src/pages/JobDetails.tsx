import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";
import { 
  ArrowLeft,
  Briefcase,
  MapPin,
  Users,
  DollarSign,
  GraduationCap,
  Edit,
  Archive,
  Calendar,
  Clock,
  Languages,
  Building2,
  Trash2
} from "lucide-react";
import type { Job } from "@shared/schema";

export default function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: job, isLoading, error } = useQuery({
    queryKey: ['/jobs/', id],
    queryFn: () => apiService.request<Job>(`/jobs/${id}/`),
    enabled: !!id,
  });

  // Extract location, category, and languages directly from job data (backend provides full objects)
  const location = typeof job?.location === 'object' && job.location ? job.location : null;
  const category = typeof job?.category === 'object' && job.category ? job.category : null;
  const languages = job?.required_languages || [];

  const archiveMutation = useMutation({
    mutationFn: () => apiService.request(`/jobs/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ status: job?.status === 'archived' ? 'open' : 'archived' }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/jobs/'] });
      queryClient.invalidateQueries({ queryKey: ['/jobs/', id] });
      toast({
        title: "Success",
        description: `Job ${job?.status === 'archived' ? 'unarchived' : 'archived'} successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update job status",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiService.request(`/jobs/${id}/`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/jobs/'] });
      toast({
        title: "Success",
        description: "Job deleted successfully",
      });
      setLocation('/jobs');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete job",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatSalary = (from?: number, to?: number, type?: string, currency?: string) => {
    if (!from && !to) return null;
    const currencySymbol = currency === 'USD' ? '$' : currency === 'TMT' ? 'TMT' : (currency || 'TMT');
    const typeLabel = type ? ` / ${type.replace('_', ' ')}` : '';
    if (from && to) {
      return `${currencySymbol} ${from.toLocaleString()} - ${currencySymbol} ${to.toLocaleString()}${typeLabel}`;
    }
    return `${currencySymbol} ${(from || to)?.toLocaleString()}${typeLabel}`;
  };

  const formatEducationLevel = (level?: string) => {
    if (!level) return null;
    return level.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Not specified';
      return date.toLocaleDateString();
    } catch {
      return 'Not specified';
    }
  };

  const getApplicationsCount = (job: Job) => {
    return job.applications_count || 0;
  };

  const formatJobType = (type?: string) => {
    if (!type) return 'Unknown';
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatWorkplaceType = (type?: string) => {
    if (!type) return 'Unknown';
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <div className="bg-white border-b border-gray-200 flex-shrink-0">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <div className="bg-white border-b border-gray-200 flex-shrink-0">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <h1 className="text-2xl font-semibold text-gray-900">Job Not Found</h1>
            <p className="text-sm text-gray-500 mt-1">The job posting you're looking for doesn't exist</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">The job posting has been removed or doesn't exist.</p>
            <Button onClick={() => setLocation('/jobs')} className="bg-[#1877F2] hover:bg-blue-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/jobs')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Button>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setLocation(`/jobs/edit/${job.id}`)}
                className="text-[#1877F2] border-[#1877F2] hover:bg-[#1877F2] hover:text-white"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => archiveMutation.mutate()}
                disabled={archiveMutation.isPending}
                className="text-gray-600 border-gray-300 hover:bg-gray-50"
              >
                <Archive className="h-4 w-4 mr-2" />
                {job.status === 'archived' ? 'Unarchive' : 'Archive'}
              </Button>
              <Button
                variant="outline"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
          
          {/* Job Information Card - First */}
          <Card className="shadow-sm border border-gray-200">
            <CardHeader className="border-b border-gray-200 bg-white">
              <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                <Users className="h-5 w-5 mr-3 text-[#1877F2]" />
                Job Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 bg-white space-y-8">
              
              {/* Organization */}
              {job.organization && typeof job.organization === 'object' && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Organization</span>
                  <p className="text-gray-900 mt-1 text-lg font-medium">{job.organization.official_name}</p>
                </div>
              )}
              
              {/* Compensation */}
              {(job.salary_from || job.salary_to) && (
                <div>
                  <h4 className="flex items-center text-base font-semibold text-gray-900 mb-4">
                    <DollarSign className="h-4 w-4 mr-2 text-[#1877F2]" />
                    Compensation
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {job.salary_from && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Minimum Salary</span>
                        <p className="text-gray-900 mt-1 text-lg font-semibold">
                          {(() => {
                            const currency = job.currency || 'TMT';
                            const currencySymbol = currency === 'USD' ? '$' : currency === 'TMT' ? 'TMT' : currency;
                            return `${currencySymbol} ${job.salary_from.toLocaleString()}`;
                          })()}
                        </p>
                      </div>
                    )}
                    {job.salary_to && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Maximum Salary</span>
                        <p className="text-gray-900 mt-1 text-lg font-semibold">
                          {(() => {
                            const currency = job.currency || 'TMT';
                            const currencySymbol = currency === 'USD' ? '$' : currency === 'TMT' ? 'TMT' : currency;
                            return `${currencySymbol} ${job.salary_to.toLocaleString()}`;
                          })()}
                        </p>
                      </div>
                    )}
                    {job.salary_payment_type && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Payment Type</span>
                        <p className="text-gray-900 mt-1 capitalize">
                          {job.salary_payment_type.replace('_', ' ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Job Details */}
              <div>
                <h4 className="flex items-center text-base font-semibold text-gray-900 mb-4">
                  <Briefcase className="h-4 w-4 mr-2 text-[#1877F2]" />
                  Job Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Employment Type</span>
                      <p className="text-gray-900 mt-1">{formatJobType(job.job_type)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Work Type</span>
                      <p className="text-gray-900 mt-1">{formatWorkplaceType(job.workplace_type)}</p>
                    </div>
                    {job.min_education_level && (
                      <div>
                        <span className="text-sm font-medium text-gray-700 flex items-center">
                          <GraduationCap className="h-4 w-4 mr-1 text-[#1877F2]" />
                          Minimum Education
                        </span>
                        <p className="text-gray-900 mt-1">{formatEducationLevel(job.min_education_level)}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    {category && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Category</span>
                        <p className="text-gray-900 mt-1">{category.name}</p>
                      </div>
                    )}
                    {location && (
                      <div>
                        <span className="text-sm font-medium text-gray-700 flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-[#1877F2]" />
                          Location
                        </span>
                        <p className="text-gray-900 mt-1">{location.name}</p>
                      </div>
                    )}
                    {languages.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-700 flex items-center">
                          <Languages className="h-4 w-4 mr-1 text-[#1877F2]" />
                          Required Languages
                        </span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {languages.map((lang: any, index: number) => (
                            <span key={index} className="bg-[#1877F2] text-white px-3 py-1 rounded-full text-sm">
                              {typeof lang === 'object' ? lang.name : lang}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Job Description - Second */}
          <Card className="shadow-sm border border-gray-200">
            <CardHeader className="border-b border-gray-200 bg-white">
              <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                <Briefcase className="h-5 w-5 mr-3 text-[#1877F2]" />
                Job Description
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 bg-white">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {job.description}
              </p>
              {job.requirements && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Requirements</h4>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {job.requirements}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}