import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Eye
} from "lucide-react";
import type { Job, Location, Category, Language } from "@shared/schema";

interface JobDetailDialogProps {
  jobId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (job: Job) => void;
  onDelete?: (jobId: number) => void;
}

export default function JobDetailDialog({ 
  jobId, 
  open, 
  onOpenChange, 
  onEdit, 
  onDelete 
}: JobDetailDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: job, isLoading } = useQuery({
    queryKey: ['/jobs/', jobId],
    queryFn: () => apiService.request<Job>(`/jobs/${jobId}/`),
    enabled: !!jobId && open,
  });

  const { data: location } = useQuery({
    queryKey: ['/locations/', job?.location],
    queryFn: () => apiService.request<Location>(`/locations/${job!.location}/`),
    enabled: !!job?.location,
  });

  const { data: category } = useQuery({
    queryKey: ['/categories/', job?.category],
    queryFn: () => apiService.request<Category>(`/categories/${job!.category}/`),
    enabled: !!job?.category,
  });

  const { data: languages } = useQuery({
    queryKey: ['/languages/', job?.required_languages],
    queryFn: async () => {
      if (!job?.required_languages?.length) return [];
      const languagePromises = job.required_languages.map(langId =>
        apiService.request<Language>(`/languages/${langId}/`)
      );
      return Promise.all(languagePromises);
    },
    enabled: !!job?.required_languages?.length,
  });

  const archiveMutation = useMutation({
    mutationFn: () => apiService.request(`/jobs/${jobId}/`, {
      method: 'PATCH',
      body: JSON.stringify({ status: job?.status === 'archived' ? 'open' : 'archived' }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/jobs/'] });
      queryClient.invalidateQueries({ queryKey: ['/jobs/', jobId] });
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

  const formatSalary = (from?: number, to?: number, type?: string) => {
    if (!from && !to) return null;
    const typeLabel = type ? ` / ${type.replace('_', ' ')}` : '';
    if (from && to) {
      return `$${from.toLocaleString()} - $${to.toLocaleString()}${typeLabel}`;
    }
    return `$${(from || to)?.toLocaleString()}${typeLabel}`;
  };

  const formatEducationLevel = (level?: string) => {
    if (!level) return null;
    return level.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
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

  if (!job && !isLoading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Job Details</span>
            {job && (
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit?.(job)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
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
                  onClick={() => onDelete?.(job.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

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
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h1>
              <div className="flex items-center space-x-4 mb-4">
                <Badge className={getStatusColor(job.status)}>
                  {job.status ? job.status.charAt(0).toUpperCase() + job.status.slice(1) : 'Unknown'}
                </Badge>
                <span className="text-sm text-gray-500 flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {job.applications_count || 0} applications
                </span>
                <span className="text-sm text-gray-500 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Posted {new Date(job.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
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
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Job Description</h3>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
              </div>
            </div>

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
                      {formatSalary(job.salary_from, job.salary_to, job.salary_payment_type)}
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
                      {languages.map((lang) => (
                        <Badge key={lang.id} variant="outline">
                          {lang.name}
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
                    <span className="text-sm text-gray-600">Created:</span>
                    <span className="text-sm font-medium">{new Date(job.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Last Updated:</span>
                    <span className="text-sm font-medium">{new Date(job.updated_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}