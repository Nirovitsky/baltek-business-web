import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";
import { format } from "date-fns";
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
import type { Job } from "@/types";

export default function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

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
    onMutate: async () => {
      const newStatus = job?.status === 'archived' ? 'open' : 'archived';
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/jobs/', id] });
      await queryClient.cancelQueries({ queryKey: ['/jobs/'] });
      
      // Snapshot the previous values
      const previousJob = queryClient.getQueryData(['/jobs/', id]);
      
      // Optimistically update the individual job
      queryClient.setQueryData(['/jobs/', id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          status: newStatus,
          updated_at: new Date().toISOString()
        };
      });
      
      // Optimistically update the job in all job lists
      const updateJobInList = (old: any) => {
        if (!old?.results) return old;
        return {
          ...old,
          results: old.results.map((j: any) => 
            j.id === parseInt(id!) 
              ? { ...j, status: newStatus, updated_at: new Date().toISOString() }
              : j
          )
        };
      };
      
      // Update all possible job list queries
      queryClient.setQueriesData({ queryKey: ['/jobs/'] }, updateJobInList);
      
      return { previousJob, newStatus };
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousJob) {
        queryClient.setQueryData(['/jobs/', id], context.previousJob);
      }
      // Invalidate to refresh from server
      queryClient.invalidateQueries({ queryKey: ['/jobs/'] });
      toast({
        title: t("errors.jobUpdateError"),
        description: error.message || "Failed to update job status",
        variant: "destructive",
      });
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['/jobs/'] });
      queryClient.invalidateQueries({ queryKey: ['/jobs/', id] });
      toast({
        title: t("success.generic"),
        description: `Job ${context?.newStatus === 'archived' ? 'archived' : 'unarchived'} successfully`,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiService.request(`/jobs/${id}/`, {
      method: 'DELETE',
    }),
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/jobs/'] });
      
      // Snapshot the previous job lists
      const previousJobsQueries = queryClient.getQueriesData({ queryKey: ['/jobs/'] });
      
      // Optimistically remove the job from all job lists
      const updateJobLists = (old: any) => {
        if (!old?.results) return old;
        return {
          ...old,
          results: old.results.filter((j: any) => j.id !== parseInt(id!)),
          count: old.count - 1
        };
      };
      
      queryClient.setQueriesData({ queryKey: ['/jobs/'] }, updateJobLists);
      
      // Immediately navigate away since job will be deleted
      navigate('/jobs');
      
      return { previousJobsQueries };
    },
    onError: (error: any, variables, context) => {
      // Rollback on error - restore all job lists
      if (context?.previousJobsQueries) {
        context.previousJobsQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      // Navigate back if we already left
      if (window.location.pathname === '/jobs') {
        navigate(`/jobs/${id}`);
      }
      toast({
        title: t("errors.jobDeleteError"),
        description: error.message || "Failed to delete job",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/jobs/'] });
      toast({
        title: t("success.generic"),
        description: t("success.jobDeleted"),
      });
    },
  });

  const confirmDelete = () => {
    deleteMutation.mutate();
    setShowDeleteDialog(false);
  };

  const confirmEdit = () => {
    navigate(`/jobs/edit/${job.id}`);
    setShowEditDialog(false);
  };

  const confirmArchive = () => {
    archiveMutation.mutate();
    setShowArchiveDialog(false);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'archived':
        return 'bg-muted text-muted-foreground border';
      case 'expired':
        return 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
      default:
        return 'bg-muted text-muted-foreground border';
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

  const formatDate = (timestamp?: number | string) => {
    if (!timestamp) return 'Not specified';
    try {
      let date: Date;
      
      // Handle timestamp (number or string)
      if (typeof timestamp === 'number') {
        date = new Date(timestamp * 1000); // Convert from seconds to milliseconds
      } else if (typeof timestamp === 'string' && /^\d+$/.test(timestamp)) {
        date = new Date(parseInt(timestamp) * 1000);
      } else {
        // Fallback: try parsing as other date format
        date = new Date(timestamp as string);
      }
      
      if (isNaN(date.getTime())) return 'Not specified';
      return format(date, 'MMMM d, yyyy');
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
      <div className="flex-1 flex flex-col bg-background overflow-hidden">
        <div className="bg-card border-b border flex-shrink-0">
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
      <div className="flex-1 flex flex-col bg-background overflow-hidden">
        <div className="bg-card border-b border flex-shrink-0">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <h1 className="text-2xl font-semibold text-foreground">Job Not Found</h1>
            <p className="text-sm text-muted-foreground mt-1">The job posting you're looking for doesn't exist</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">The job posting has been removed or doesn't exist.</p>
            <Button onClick={() => navigate('/jobs')} className="bg-primary hover:bg-blue-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="bg-card border-b border flex-shrink-0">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/jobs')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Button>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(true)}
                className="text-primary border-primary hover:bg-primary hover:text-white"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowArchiveDialog(true)}
                disabled={archiveMutation.isPending}
                className="text-muted-foreground border hover:bg-background"
              >
                <Archive className="h-4 w-4 mr-2" />
                {job.status === 'archived' ? 'Unarchive' : 'Archive'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
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
          <Card className="shadow-sm border border">
            <CardHeader className="border-b border bg-card">
              <CardTitle className="flex items-center text-lg font-semibold text-foreground">
                <Users className="h-5 w-5 mr-3 text-primary" />
                Job Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 bg-card space-y-8">
              
              {/* Organization */}
              {job.organization && typeof job.organization === 'object' && (
                <div>
                  <span className="text-sm font-medium text-foreground">Organization</span>
                  <p className="text-foreground mt-1 text-lg font-medium">{job.organization.official_name}</p>
                </div>
              )}
              
              {/* Compensation */}
              {(job.payment_from || job.payment_to) && (
                <div>
                  <h4 className="flex items-center text-base font-semibold text-foreground mb-4">
                    <DollarSign className="h-4 w-4 mr-2 text-primary" />
                    Compensation
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {job.payment_from && (
                      <div>
                        <span className="text-sm font-medium text-foreground">Minimum Salary</span>
                        <p className="text-foreground mt-1 text-lg font-semibold">
                          {(() => {
                            const currency = job.currency || 'TMT';
                            const currencySymbol = currency === 'USD' ? '$' : currency === 'TMT' ? 'TMT' : currency;
                            return `${currencySymbol} ${job.payment_from.toLocaleString()}`;
                          })()}
                        </p>
                      </div>
                    )}
                    {job.payment_to && (
                      <div>
                        <span className="text-sm font-medium text-foreground">Maximum Salary</span>
                        <p className="text-foreground mt-1 text-lg font-semibold">
                          {(() => {
                            const currency = job.currency || 'TMT';
                            const currencySymbol = currency === 'USD' ? '$' : currency === 'TMT' ? 'TMT' : currency;
                            return `${currencySymbol} ${job.payment_to.toLocaleString()}`;
                          })()}
                        </p>
                      </div>
                    )}
                    {job.payment_frequency && (
                      <div>
                        <span className="text-sm font-medium text-foreground">Payment Type</span>
                        <p className="text-foreground mt-1 capitalize">
                          {job.payment_frequency.replace('_', ' ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Job Details */}
              <div>
                <h4 className="flex items-center text-base font-semibold text-foreground mb-4">
                  <Briefcase className="h-4 w-4 mr-2 text-primary" />
                  Job Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm font-medium text-foreground">Employment Type</span>
                      <p className="text-foreground mt-1">{formatJobType(job.job_type)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-foreground">Work Type</span>
                      <p className="text-foreground mt-1">{formatWorkplaceType(job.workplace_type)}</p>
                    </div>
                    {job.min_education_level && (
                      <div>
                        <span className="text-sm font-medium text-foreground flex items-center">
                          <GraduationCap className="h-4 w-4 mr-1 text-primary" />
                          Minimum Education
                        </span>
                        <p className="text-foreground mt-1">{formatEducationLevel(job.min_education_level)}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    {category && (
                      <div>
                        <span className="text-sm font-medium text-foreground">Category</span>
                        <p className="text-foreground mt-1">{category.name}</p>
                      </div>
                    )}
                    {location && (
                      <div>
                        <span className="text-sm font-medium text-foreground flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-primary" />
                          Location
                        </span>
                        <p className="text-foreground mt-1">{location.name}</p>
                      </div>
                    )}
                    {languages.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-foreground flex items-center">
                          <Languages className="h-4 w-4 mr-1 text-primary" />
                          Required Languages
                        </span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {languages.map((lang: any, index: number) => (
                            <span key={index} className="bg-primary text-white px-3 py-1 rounded-full text-sm">
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
          <Card className="shadow-sm border border">
            <CardHeader className="border-b border bg-card">
              <CardTitle className="flex items-center text-lg font-semibold text-foreground">
                <Briefcase className="h-5 w-5 mr-3 text-primary" />
                Job Description
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 bg-card">
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                {job.description}
              </p>
              {job.requirements && (
                <div className="mt-6">
                  <h4 className="font-medium text-foreground mb-3">Requirements</h4>
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                    {job.requirements}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this job posting? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Confirmation Dialog */}
      <AlertDialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Edit</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to edit this job posting. Any unsaved changes will be lost. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEdit}>
              Continue to Edit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm {job?.status === 'archived' ? 'Unarchive' : 'Archive'}</AlertDialogTitle>
            <AlertDialogDescription>
              {job?.status === 'archived' 
                ? 'Are you sure you want to unarchive this job posting? It will be visible to candidates again.'
                : 'Are you sure you want to archive this job posting? It will no longer be visible to candidates.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmArchive}>
              {job?.status === 'archived' ? 'Unarchive' : 'Archive'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}