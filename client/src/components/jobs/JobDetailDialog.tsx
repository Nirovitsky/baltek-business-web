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
import type { Job, Location, Category, Language } from "@/types";
import { format } from "date-fns";
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: job, isLoading } = useQuery({
    queryKey: ['/jobs/', jobId],
    queryFn: () => apiService.request<Job>(`/jobs/${jobId}/`),
    enabled: !!jobId && open,
  });

  // Extract location, category, and languages directly from job data (backend provides full objects)
  const location = typeof job?.location === 'object' && job.location ? job.location : null;
  const category = typeof job?.category === 'object' && job.category ? job.category : null;
  const languages = Array.isArray(job?.required_languages) ? job.required_languages : [];

  const formatSalary = (from?: number, to?: number, type?: string, currency?: string) => {
    if (!from && !to) return null;
    const currencySymbol = currency === 'USD' ? '$' : currency === 'TMT' ? 'TMT' : (currency || 'TMT');
    const typeLabel = type ? ` ${t(`statuses.salaryTypes.${type}`, type.replace('_', ' '))}` : '';
    if (from && to) {
      return `${currencySymbol} ${from.toLocaleString()} - ${currencySymbol} ${to.toLocaleString()}${typeLabel}`;
    }
    return `${currencySymbol} ${(from || to)?.toLocaleString()}${typeLabel}`;
  };

  const formatEducationLevel = (level?: string) => {
    if (!level) return null;
    return t(`statuses.educationLevels.${level}`, level.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '));
  };

  const formatJobType = (type?: string) => {
    if (!type) return t('modals.notSpecified');
    return t(`statuses.jobTypes.${type}`, type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '));
  };

  const formatWorkplaceType = (type?: string) => {
    if (!type) return t('modals.notSpecified');
    return t(`statuses.workplaceTypes.${type}`, type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '));
  };

  const formatDate = (timestamp?: string) => {
    if (!timestamp) return t('modals.notSpecified');
    try {
      let date: Date;
      
      if (/^\d+$/.test(timestamp)) {
        date = new Date(parseInt(timestamp) * 1000);
      } else {
        date = new Date(timestamp);
      }
      
      if (isNaN(date.getTime())) return t('modals.notSpecified');
      return format(date, 'MMMM d, yyyy');
    } catch {
      return t('modals.notSpecified');
    }
  };

  const archiveMutation = useMutation({
    mutationFn: () => apiService.request(`/jobs/${jobId}/`, {
      method: 'PATCH',
      body: JSON.stringify({ status: job?.status === 'archived' ? 'open' : 'archived' }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/jobs/'] });
      queryClient.invalidateQueries({ queryKey: ['/jobs/', jobId] });
      toast({
        title: t('modals.success'),
        description: job?.status === 'archived' ? t('modals.jobUnarchived') : t('modals.jobArchived'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('modals.error'),
        description: error.message || t('modals.failedToUpdateJobStatus'),
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'archived':
        return 'bg-muted text-foreground border';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-muted text-foreground border';
    }
  };

  if (!job && !isLoading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle>{t('modals.jobDetails')}</DialogTitle>
          {job && (
            <div className="flex items-center space-x-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit?.(job)}
              >
                <Edit className="w-4 h-4 mr-2" />
                {t('common.edit')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => archiveMutation.mutate()}
                disabled={archiveMutation.isPending}
              >
                <Archive className="w-4 h-4 mr-2" />
                {job.status === 'archived' ? t('modals.unarchive') : t('modals.archive')}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete?.(job.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t('common.delete')}
              </Button>
            </div>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ) : job ? (
          <div className="space-y-6">
            {/* Header with title and badges */}
            <div>
              <h2 className="text-2xl font-bold mb-2">{job.title}</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className={getStatusColor(job.status)}>
                  {job.status ? t(`statuses.jobStatuses.${job.status}`, job.status.charAt(0).toUpperCase() + job.status.slice(1)) : t('modals.unknown')}
                </Badge>
                <Badge variant="outline">
                  <Building className="w-3 h-3 mr-1" />
                  {formatJobType(job.job_type)}
                </Badge>
                <Badge variant="outline">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatWorkplaceType(job.workplace_type)}
                </Badge>
                <Badge variant="outline">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(job.date_started?.toString())}
                </Badge>
                <Badge variant="outline">
                  <Users className="w-3 h-3 mr-1" />
                  {job.applications_count || 0} {t('modals.applications')}
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
              <h3 className="text-lg font-semibold mb-3">{t('modals.jobDescription')}</h3>
              <div className="prose prose-sm max-w-none">
                <p className="text-foreground whitespace-pre-wrap">{job.description}</p>
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
                      {t('modals.compensation')}
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
                      {t('modals.educationRequired')}
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
                      {t('modals.requiredLanguages')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {languages.map((lang, index) => (
                        <Badge key={index} variant="outline">
                          {typeof lang === 'object' && lang && 'name' in lang ? (lang as any).name : `Language ${lang}`}
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
                    {t('modals.jobDetails')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('modals.jobType')}</span>
                    <span className="text-sm font-medium">{formatJobType(job.job_type)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('modals.workplace')}</span>
                    <span className="text-sm font-medium">{formatWorkplaceType(job.workplace_type)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('modals.startDate')}</span>
                    <span className="text-sm font-medium">{formatDate(job.date_started?.toString())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('modals.endDate')}</span>
                    <span className="text-sm font-medium">{formatDate(job.date_ended?.toString())}</span>
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