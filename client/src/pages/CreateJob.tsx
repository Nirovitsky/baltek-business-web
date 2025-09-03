import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Users,
  Calendar,
  DollarSign,
  GraduationCap,
  Building,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableLocation } from "@/components/ui/searchable-location";
import { SearchableCategory } from "@/components/ui/searchable-category";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePrefetch } from "@/hooks/usePrefetch";
import { apiService } from "@/lib/api";
import { useReferenceData } from "@/hooks/useReferencedData";
import {
  createJobSchema,
  type CreateJob,
  type Job,
  type Category,
  type Location,
  type Language,
  type PaginatedResponse,
} from "@/types";
import { useEffect, useCallback, useState } from "react";

export default function CreateJob() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { selectedOrganization, organizations, refreshOrganizations } =
    useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  // Use prefetch hook to ensure form data is ready
  const { prefetchFormData } = usePrefetch();

  const isEditing = Boolean(id);
  const DRAFT_KEY = `job_draft_${isEditing ? id : "new"}`;
  const [isDraftSaved, setIsDraftSaved] = useState(false);

  // Function to save draft to localStorage
  const saveDraft = useCallback(
    (data: any) => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
        setIsDraftSaved(true);
        // Hide the indicator after 2 seconds
        setTimeout(() => setIsDraftSaved(false), 2000);
      } catch (error) {
        console.warn("Failed to save form draft:", error);
      }
    },
    [DRAFT_KEY],
  );

  // Function to load draft from localStorage
  const loadDraft = useCallback(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn("Failed to load form draft:", error);
      return null;
    }
  }, [DRAFT_KEY]);

  // Function to clear draft
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (error) {
      console.warn("Failed to clear form draft:", error);
    }
  }, [DRAFT_KEY]);

  // Fetch job data if editing
  const { data: jobData } = useQuery({
    queryKey: ["/jobs/", id],
    queryFn: () => apiService.request<Job>(`/jobs/${id}/`),
    enabled: isEditing,
  });

  const job = jobData;

  // Get reference data (locations and categories)
  const { categories, locations } = useReferenceData();

  // Load draft data or use defaults
  const getDraftOrDefaults = useCallback(() => {
    const draft = loadDraft();
    const defaults = {
      title: "",
      description: "",
      category: 1,
      organization: selectedOrganization?.id || 1,
      location: locations.length > 0 ? locations[0].id : undefined,
      job_type: "full_time",
      workplace_type: "on_site",
      min_education_level: "secondary",
      payment_from: 0,
      payment_to: 0,
      payment_frequency: "monthly",
      currency: "TMT",
      required_languages: [],
      date_started: Math.floor(Date.now() / 1000),
      date_ended: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
      status: "open",
    };

    return draft ? { ...defaults, ...draft } : defaults;
  }, [loadDraft, selectedOrganization?.id, locations]);

  const form = useForm<CreateJob>({
    resolver: zodResolver(createJobSchema),
    defaultValues: getDraftOrDefaults(),
  });

  // Update the location field when locations data becomes available
  useEffect(() => {
    if (locations.length > 0 && !form.getValues("location") && !isEditing) {
      form.setValue("location", locations[0].id);
    }
  }, [locations, form, isEditing]);

  // Auto-save form data as user types (debounced)
  useEffect(() => {
    const subscription = form.watch((data) => {
      // Don't save draft if we're editing an existing job (already has data)
      if (!isEditing) {
        const timeoutId = setTimeout(() => {
          saveDraft(data);
        }, 1000); // Save after 1 second of inactivity

        return () => clearTimeout(timeoutId);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, saveDraft, isEditing]);

  // Check if selected organization is valid and refresh if needed
  useEffect(() => {
    if (selectedOrganization && organizations.length > 0) {
      const orgExists = organizations.some(
        (org) => org.id === selectedOrganization.id,
      );
      if (!orgExists) {
        console.warn(
          `Selected organization ${selectedOrganization.id} not found in available organizations. Refreshing...`,
        );
        refreshOrganizations();
      }
    }
  }, [selectedOrganization, organizations, refreshOrganizations]);

  // Update form values when job data is loaded (editing mode)
  useEffect(() => {
    if (job) {
      const jobData = {
        title: job.title || "",
        description: job.description || "",
        category:
          typeof job.category === "number"
            ? job.category
            : typeof job.category === "object"
              ? job.category.id
              : 1,
        organization:
          typeof job.organization === "number"
            ? job.organization
            : typeof job.organization === "object"
              ? job.organization.id
              : selectedOrganization?.id || 1,
        location:
          typeof job.location === "number"
            ? job.location
            : typeof job.location === "object"
              ? job.location.id
              : 1,
        job_type: job.job_type || "full_time",
        workplace_type: job.workplace_type || "on_site",
        min_education_level: job.min_education_level || undefined,
        payment_from: job.payment_from || undefined,
        payment_to: job.payment_to || undefined,
        payment_frequency: job.payment_frequency || "monthly",
        currency: job.currency || "TMT",
        required_languages: job.required_languages || [],
        date_started: job.date_started || Math.floor(Date.now() / 1000),
        date_ended:
          job.date_ended ||
          Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
        status: job.status || "open",
      };
      form.reset(jobData);
      // Clear any draft when editing existing job
      clearDraft();
    }
  }, [job, form, selectedOrganization, clearDraft]);


  const { data: languagesData } = useQuery({
    queryKey: ["/languages/"],
    queryFn: () =>
      apiService.request<PaginatedResponse<Language>>("/languages/"),
    staleTime: 15 * 60 * 1000, // Languages don't change often
  });

  const languages = languagesData?.results || [];

  const createMutation = useMutation({
    mutationFn: (data: CreateJob) =>
      apiService.request<Job>("/jobs/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onMutate: async (data) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/jobs/"] });

      // Snapshot the previous job lists
      const previousJobsQueries = queryClient.getQueriesData({
        queryKey: ["/jobs/"],
      });

      // Create optimistic job
      const tempId = Date.now();
      const optimisticJob = {
        id: tempId,
        title: data.title,
        description: data.description,
        organization: selectedOrganization,
        location:
          locations.find((l) => l.id === data.location) || data.location,
        category:
          categories.find((c) => c.id === data.category) || data.category,
        job_type: data.job_type,
        experience_level: data.experience_level,
        min_education_level: data.min_education_level,
        payment_from: data.payment_from,
        payment_to: data.payment_to,
        payment_frequency: data.payment_frequency,
        currency: data.currency,
        required_languages: data.required_languages,
        date_started: data.date_started,
        date_ended: data.date_ended,
        status: data.status || "open",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        applications_count: 0,
      };

      // Optimistically add to all relevant job lists
      const updateJobLists = (old: any) => {
        if (!old?.results) return { results: [optimisticJob], count: 1 };
        return {
          ...old,
          results: [optimisticJob, ...old.results],
          count: old.count + 1,
        };
      };

      queryClient.setQueriesData({ queryKey: ["/jobs/"] }, updateJobLists);

      // Immediately navigate to jobs page
      navigate("/jobs");

      return { previousJobsQueries, tempId };
    },
    onError: (error: any, data, context) => {
      // Rollback on error - restore all job lists
      if (context?.previousJobsQueries) {
        context.previousJobsQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      console.error("Job creation error:", error);
      let errorMessage = t("messages.failedToCreateJob");

      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === "object" && error !== null && !error.status) {
        // Handle validation errors from the API (field-specific errors)
        const errors = Object.entries(error)
          .map(([field, messages]) => {
            const fieldName = field
              .replace("_", " ")
              .replace(/\b\w/g, (l) => l.toUpperCase());
            if (Array.isArray(messages)) {
              return `${fieldName}: ${messages.join(", ")}`;
            }
            return `${fieldName}: ${messages}`;
          })
          .join("\n");
        errorMessage = errors || errorMessage;
      }

      toast({
        title: t("messages.validationError"),
        description: errorMessage,
        variant: "destructive",
      });
    },
    onSuccess: (data, variables, context) => {
      // Replace optimistic job with real data
      if (context?.tempId && data) {
        const updateWithRealData = (old: any) => {
          if (!old?.results) return old;
          return {
            ...old,
            results: old.results.map((job: any) =>
              job.id === context.tempId ? data : job,
            ),
          };
        };

        queryClient.setQueriesData(
          { queryKey: ["/jobs/"] },
          updateWithRealData,
        );
      }

      queryClient.invalidateQueries({ queryKey: ["/jobs/"] });
      // Clear draft on successful submission
      clearDraft();
      toast({
        title: t("common.success"),
        description: t("messages.jobCreatedSuccess"),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateJob) =>
      apiService.request<Job>(`/jobs/${job!.id}/`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onMutate: async (data) => {
      const jobId = job!.id;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/jobs/"] });
      await queryClient.cancelQueries({ queryKey: ["/jobs/", jobId] });

      // Snapshot the previous values
      const previousJobsQueries = queryClient.getQueriesData({
        queryKey: ["/jobs/"],
      });
      const previousJob = queryClient.getQueryData(["/jobs/", jobId]);

      // Create updated job data
      const updatedJob = {
        ...job,
        title: data.title,
        description: data.description,
        location:
          locations.find((l) => l.id === data.location) || data.location,
        category:
          categories.find((c) => c.id === data.category) || data.category,
        job_type: data.job_type,
        experience_level: data.experience_level,
        min_education_level: data.min_education_level,
        payment_from: data.payment_from,
        payment_to: data.payment_to,
        payment_frequency: data.payment_frequency,
        currency: data.currency,
        required_languages: data.required_languages,
        date_started: data.date_started,
        date_ended: data.date_ended,
        status: data.status,
        updated_at: new Date().toISOString(),
      };

      // Update individual job
      queryClient.setQueryData(["/jobs/", jobId], updatedJob);

      // Update job in all job lists
      const updateJobInLists = (old: any) => {
        if (!old?.results) return old;
        return {
          ...old,
          results: old.results.map((j: any) =>
            j.id === jobId ? updatedJob : j,
          ),
        };
      };

      queryClient.setQueriesData({ queryKey: ["/jobs/"] }, updateJobInLists);

      // Immediately navigate to jobs page
      navigate("/jobs");

      return { previousJobsQueries, previousJob, jobId };
    },
    onError: (error: any, data, context) => {
      // Rollback on error
      if (context?.previousJobsQueries) {
        context.previousJobsQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousJob && context?.jobId) {
        queryClient.setQueryData(
          ["/jobs/", context.jobId],
          context.previousJob,
        );
      }

      toast({
        title: t("common.error"),
        description: error.message || t("messages.failedToUpdateJob"),
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/jobs/"] });
      // Clear draft on successful submission
      clearDraft();
      toast({
        title: "Success",
        description: "Job posting updated successfully",
      });
    },
  });

  const onSubmit = (data: CreateJob) => {
    console.log("Selected organization:", selectedOrganization);
    console.log("Available organizations:", organizations);
    console.log("Form data received:", data);

    if (!selectedOrganization?.id) {
      toast({
        title: t("common.error"),
        description:
          "No organization selected. Please select an organization first.",
        variant: "destructive",
      });
      return;
    }

    // Check if organization is public
    if (selectedOrganization.is_public === false) {
      toast({
        title: "Organization Not Approved",
        description:
          "Your organization is currently under review. You cannot create job postings until it's approved by our moderators.",
        variant: "destructive",
      });
      return;
    }

    // Validate that the selected organization exists in the current organizations list
    const orgExists = organizations.some(
      (org) => org.id === selectedOrganization.id,
    );
    if (!orgExists) {
      toast({
        title: t("common.error"),
        description:
          "Selected organization is no longer available. Please refresh and select a valid organization.",
        variant: "destructive",
      });
      // Refresh organizations to get the latest data
      refreshOrganizations();
      return;
    }

    // Clean the data to ensure proper formatting
    const submitData = {
      ...data,
      organization: selectedOrganization.id,
      description: data.description.trim(),
      // Ensure min_education_level is not sent if empty
      min_education_level: data.min_education_level || undefined,
    };

    // Remove empty/undefined values that shouldn't be sent
    Object.keys(submitData).forEach((key) => {
      if (
        submitData[key as keyof typeof submitData] === "" ||
        submitData[key as keyof typeof submitData] === undefined
      ) {
        delete submitData[key as keyof typeof submitData];
      }
    });

    console.log("Final submit data:", submitData);
    console.log("Organization ID being sent:", submitData.organization);

    if (isEditing) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex flex-col h-full min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b flex-shrink-0">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/jobs")}
                className="mr-4 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('jobs.backToJobs')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Organization Approval Notice */}
          {selectedOrganization && selectedOrganization.is_public === false && (
            <Alert className="mb-6 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                <strong>{t('jobs.organizationUnderReviewTitle')}:</strong> {t('jobs.organizationUnderReviewDesc', { name: selectedOrganization.official_name })}
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <Card className="shadow-sm">
                <CardHeader className="border-b bg-card">
                  <CardTitle className="flex items-center text-lg font-semibold">
                    {t('jobs.basicInformation')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6 bg-card">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          {t('jobs.jobTitle')} <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t('placeholders.enterJobTitle')}
                            className="mt-1"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          {t('jobs.jobDescription')} <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder={t('placeholders.describeRole')}
                            className="h-[300px] mt-1"
                            maxLength={1024}
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-muted-foreground text-right">
                          {field.value?.length || 0}/1024 {t('jobs.characters')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            {t('jobs.category')} <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <SearchableCategory
                              value={
                                typeof field.value === "number"
                                  ? field.value
                                  : undefined
                              }
                              onValueChange={field.onChange}
                              placeholder={t('placeholders.searchCategory')}
                              className="mt-1"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            {t('jobs.location')} <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <SearchableLocation
                              value={
                                typeof field.value === "number"
                                  ? field.value
                                  : undefined
                              }
                              onValueChange={field.onChange}
                              placeholder={t('placeholders.searchLocation')}
                              className="mt-1"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                </CardContent>
              </Card>

              {/* Job Details */}
              <Card className="shadow-sm border border">
                <CardHeader className="border-b border bg-card">
                  <CardTitle className="flex items-center text-lg font-semibold text-foreground">
                    {t('jobs.jobDetails')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6 bg-card">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="job_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground">
                            {t('jobs.employmentType')} *
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="full_time">
                                {t('jobs.fullTime')}
                              </SelectItem>
                              <SelectItem value="part_time">
                                {t('jobs.partTime')}
                              </SelectItem>
                              <SelectItem value="contract">{t('jobs.contract')}</SelectItem>
                              <SelectItem value="internship">
                                {t('jobs.internship')}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="workplace_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground">
                            {t('jobs.workType')} *
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="remote">{t('jobs.remote')}</SelectItem>
                              <SelectItem value="on_site">{t('jobs.onSite')}</SelectItem>
                              <SelectItem value="hybrid">{t('jobs.hybrid')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="min_education_level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground flex items-center">
                            {t('jobs.minimumEducation')}
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder={t('placeholders.selectMinEducation')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="secondary">
                                {t('jobs.secondary')}
                              </SelectItem>
                              <SelectItem value="undergraduate">
                                {t('jobs.undergraduate')}
                              </SelectItem>
                              <SelectItem value="master">{t('jobs.master')}</SelectItem>
                              <SelectItem value="doctorate">
                                {t('jobs.doctorate')}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="required_languages"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground">
                            {t('jobs.requiredLanguages')}
                          </FormLabel>
                          <Select
                            onValueChange={(value) => {
                              const currentValue = field.value || [];
                              const languageId = Number(value);
                              if (!currentValue.includes(languageId)) {
                                field.onChange([...currentValue, languageId]);
                              }
                            }}
                          >
                            <FormControl>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder={t('jobs.selectLanguagesPlaceholder')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {languages.map((language) => (
                                <SelectItem
                                  key={language.id}
                                  value={language.id.toString()}
                                >
                                  {language.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {field.value && field.value.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {field.value.map((langId: number) => {
                                const lang = languages.find(
                                  (l) => l.id === langId,
                                );
                                return lang ? (
                                  <div
                                    key={langId}
                                    className="bg-primary text-white px-3 py-1 rounded-full text-sm flex items-center"
                                  >
                                    {lang.name}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        field.onChange(
                                          field.value?.filter(
                                            (id) => id !== langId,
                                          ) || [],
                                        );
                                      }}
                                      className="ml-2 text-white hover:text-gray-200"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ) : null;
                              })}
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Compensation & Timeline */}
              <Card className="shadow-sm border border">
                <CardHeader className="border-b border bg-card">
                  <CardTitle className="flex items-center text-lg font-semibold text-foreground">
                    {t('jobs.compensationTimeline')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6 bg-card">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-foreground">
                        {t('jobs.salaryRange')} <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-3 items-center">
                        <FormField
                          control={form.control}
                          name="payment_from"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  type="number"
                                  value={field.value ? field.value.toString() : ""}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === "" || value === "0") {
                                      field.onChange(undefined);
                                    } else {
                                      field.onChange(Number(value));
                                    }
                                  }}
                                  placeholder={t('jobs.minSalary')}
                                  min="0"
                                  step="100"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <span className="text-muted-foreground text-sm">{t('jobs.to')}</span>
                        <FormField
                          control={form.control}
                          name="payment_to"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  type="number"
                                  value={field.value ? field.value.toString() : ""}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === "" || value === "0") {
                                      field.onChange(undefined);
                                    } else {
                                      field.onChange(Number(value));
                                    }
                                  }}
                                  placeholder={t('jobs.maxSalary')}
                                  min="0"
                                  step="100"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground">
                            Currency
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="TMT">
                                TMT (Turkmenistan Manat)
                              </SelectItem>
                              <SelectItem value="USD">
                                USD (US Dollar)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="payment_frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground">
                            {t('jobs.paymentType')}
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="hourly">{t('jobs.hourly')}</SelectItem>
                              <SelectItem value="daily">{t('jobs.daily')}</SelectItem>
                              <SelectItem value="weekly">{t('jobs.weekly')}</SelectItem>
                              <SelectItem value="monthly">{t('jobs.monthly')}</SelectItem>
                              <SelectItem value="yearly">{t('jobs.yearly')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 pb-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/jobs")}
                  disabled={isLoading}
                  className="px-6"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-primary hover:bg-blue-700 px-6"
                >
                  {isLoading
                    ? t('jobs.saving')
                    : isEditing
                      ? t('jobs.updateJobPosting')
                      : t('jobs.createJobPosting')}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
