import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";
import { 
  Edit, 
  Trash2, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Users, 
  Clock,
  Building,
  GraduationCap,
  Languages,
  Archive,
  Eye,
  ArrowLeft
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
    const currencySymbol = currency || '$';
    const typeLabel = type ? ` / ${type.replace('_', ' ')}` : '';
    if (from && to) {
      return `${currencySymbol}${from.toLocaleString()} - ${currencySymbol}${to.toLocaleString()}${typeLabel}`;
    }
    return `${currencySymbol}${(from || to)?.toLocaleString()}${typeLabel}`;
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

  const deleteMutation = useMutation({
    mutationFn: () => apiService.request(`/jobs/${id}/`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job posting deleted successfully",
      });
      setLocation('/jobs');
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to delete job posting",
        variant: "destructive",
      });
    },
  });

  const handleEdit = () => {
    setLocation(`/jobs?edit=${id}`);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this job posting?')) {
      deleteMutation.mutate();
    }
  };

  if (error) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/jobs')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
          <Card>
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Job not found</h3>
              <p className="text-gray-500 mb-6">The job posting you're looking for doesn't exist or has been removed.</p>
              <Button onClick={() => setLocation('/jobs')}>
                Back to Jobs
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-6">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/jobs')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Jobs
        </Button>

        {isLoading ? (
          <div className="space-y-6">
            <div>
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-6 w-1/2 mb-4" />
              <div className="flex space-x-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
            <div className="flex space-x-2 mb-6">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-20" />
            </div>
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        ) : job ? (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
              <div className="flex items-center space-x-4 mb-4">
                <Badge className={getStatusColor(job.status)}>
                  {job.status ? job.status.charAt(0).toUpperCase() + job.status.slice(1) : 'Open'}
                </Badge>
                <span className="text-sm text-gray-500 flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {getApplicationsCount(job)} applications
                </span>
                <span className="text-sm text-gray-500 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Posted {formatDate(job.date_started)}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge variant="secondary">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatJobType(job.job_type)}
                </Badge>
                <Badge variant="secondary">
                  <Building className="w-3 h-3 mr-1" />
                  {formatWorkplaceType(job.workplace_type)}
                </Badge>
                {location && (
                  <Badge variant="secondary">
                    <MapPin className="w-3 h-3 mr-1" />
                    {location.name}
                  </Badge>
                )}
                {category && (
                  <Badge variant="secondary">
                    {category.name}
                  </Badge>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 mb-6">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleEdit}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Job
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => archiveMutation.mutate()}
                  disabled={archiveMutation.isPending}
                >
                  <Archive className="w-4 h-4 mr-2" />
                  {job.status === 'archived' ? 'Unarchive' : 'Archive'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Job Description</h3>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
              </div>
            </div>

            {job.requirements && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-3">Requirements</h3>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{job.requirements}</p>
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Job Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Compensation */}
              {(job.salary_from || job.salary_to) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Compensation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold">
                      {formatSalary(job.salary_from, job.salary_to, job.salary_payment_type, job.currency)}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Education Requirements */}
              {job.min_education_level && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <GraduationCap className="w-4 h-4 mr-2" />
                      Education Required
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold">
                      {formatEducationLevel(job.min_education_level)}
                    </p>
                  </CardContent>
                </Card>

              )}

              {/* Languages */}
              {languages && languages.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Languages className="w-4 h-4 mr-2" />
                      Required Languages
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {languages.map((lang, index) => (
                        <Badge key={typeof lang === 'object' ? lang.id : index} variant="outline">
                          {typeof lang === 'object' ? lang.name : `Language ${lang}`}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Job Details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Eye className="w-4 h-4 mr-2" />
                    Job Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Job Type:</span>
                    <span className="text-sm font-medium">{formatJobType(job.job_type)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Workplace:</span>
                    <span className="text-sm font-medium">{formatWorkplaceType(job.workplace_type)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Start Date:</span>
                    <span className="text-sm font-medium">{formatDate(job.date_started)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">End Date:</span>
                    <span className="text-sm font-medium">{formatDate(job.date_ended)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}