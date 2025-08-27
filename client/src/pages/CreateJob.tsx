import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Briefcase, MapPin, Users, Calendar, DollarSign, GraduationCap, Building, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiService } from "@/lib/api";
import { useReferenceData } from "@/hooks/useReferencedData";
import { createJobSchema, type CreateJob, type Job, type Category, type Location, type Language, type PaginatedResponse } from "@/types";
import { useEffect, useCallback, useState } from "react";

export default function CreateJob() {
  const { toast } = useToast();
  const { selectedOrganization, organizations, refreshOrganizations } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  
  const isEditing = Boolean(id);
  const DRAFT_KEY = `job_draft_${isEditing ? id : 'new'}`;
  const [isDraftSaved, setIsDraftSaved] = useState(false);

  // Function to save draft to localStorage
  const saveDraft = useCallback((data: any) => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
      setIsDraftSaved(true);
      // Hide the indicator after 2 seconds
      setTimeout(() => setIsDraftSaved(false), 2000);
    } catch (error) {
      console.warn('Failed to save form draft:', error);
    }
  }, [DRAFT_KEY]);

  // Function to load draft from localStorage
  const loadDraft = useCallback(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn('Failed to load form draft:', error);
      return null;
    }
  }, [DRAFT_KEY]);

  // Function to clear draft
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (error) {
      console.warn('Failed to clear form draft:', error);
    }
  }, [DRAFT_KEY]);

  // Fetch job data if editing
  const { data: jobData } = useQuery({
    queryKey: ['/jobs/', id],
    queryFn: () => apiService.request<Job>(`/jobs/${id}/`),
    enabled: isEditing,
  });

  const job = jobData;

  // Load draft data or use defaults
  const getDraftOrDefaults = useCallback(() => {
    const draft = loadDraft();
    const defaults = {
      title: "",
      description: "",
      requirements: "",
      category: 1,
      organization: selectedOrganization?.id || 1,
      location: 1,
      job_type: "full_time",
      workplace_type: "on_site",
      min_education_level: "secondary",
      salary_from: 0,
      salary_to: 0,
      salary_payment_type: "monthly",
      currency: "TMT",
      required_languages: [],
      date_started: Math.floor(Date.now() / 1000),
      date_ended: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
      status: "open",
    };
    
    return draft ? { ...defaults, ...draft } : defaults;
  }, [loadDraft, selectedOrganization?.id]);

  const form = useForm<CreateJob>({
    resolver: zodResolver(createJobSchema),
    defaultValues: getDraftOrDefaults(),
  });

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
      const orgExists = organizations.some(org => org.id === selectedOrganization.id);
      if (!orgExists) {
        console.warn(`Selected organization ${selectedOrganization.id} not found in available organizations. Refreshing...`);
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
        requirements: job.requirements || "",
        category: typeof job.category === 'number' ? job.category : (typeof job.category === 'object' ? job.category.id : 1),
        organization: typeof job.organization === 'number' ? job.organization : (typeof job.organization === 'object' ? job.organization.id : selectedOrganization?.id || 1),
        location: typeof job.location === 'number' ? job.location : (typeof job.location === 'object' ? job.location.id : 1),
        job_type: job.job_type || "full_time",
        workplace_type: job.workplace_type || "on_site",
        min_education_level: job.min_education_level || undefined,
        salary_from: job.salary_from || undefined,
        salary_to: job.salary_to || undefined,
        salary_payment_type: job.salary_payment_type || "monthly",
        currency: job.currency || "TMT",
        required_languages: job.required_languages || [],
        date_started: job.date_started || Math.floor(Date.now() / 1000),
        date_ended: job.date_ended || Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
        status: job.status || "open",
      };
      form.reset(jobData);
      // Clear any draft when editing existing job
      clearDraft();
    }
  }, [job, form, selectedOrganization, clearDraft]);

  // Use shared reference data to avoid duplication with other components
  const { categories, locations } = useReferenceData();

  const { data: languagesData } = useQuery({
    queryKey: ['/languages/'],
    queryFn: () => apiService.request<PaginatedResponse<Language>>('/languages/'),
    staleTime: 15 * 60 * 1000, // Languages don't change often
  });

  const languages = languagesData?.results || [];

  const createMutation = useMutation({
    mutationFn: (data: CreateJob) => apiService.request<Job>('/jobs/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onMutate: async (data) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/jobs/'] });
      
      // Snapshot the previous job lists
      const previousJobsQueries = queryClient.getQueriesData({ queryKey: ['/jobs/'] });
      
      // Create optimistic job
      const tempId = Date.now();
      const optimisticJob = {
        id: tempId,
        title: data.title,
        description: data.description,
        organization: selectedOrganization,
        location: locations.find(l => l.id === data.location) || data.location,
        category: categories.find(c => c.id === data.category) || data.category,
        job_type: data.job_type,
        experience_level: data.experience_level,
        min_education_level: data.min_education_level,
        salary_from: data.salary_from,
        salary_to: data.salary_to,
        salary_payment_type: data.salary_payment_type,
        currency: data.currency,
        required_languages: data.required_languages,
        date_started: data.date_started,
        date_ended: data.date_ended,
        status: data.status || 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        applications_count: 0
      };
      
      // Optimistically add to all relevant job lists
      const updateJobLists = (old: any) => {
        if (!old?.results) return { results: [optimisticJob], count: 1 };
        return {
          ...old,
          results: [optimisticJob, ...old.results],
          count: old.count + 1
        };
      };
      
      queryClient.setQueriesData({ queryKey: ['/jobs/'] }, updateJobLists);
      
      // Immediately navigate to jobs page
      navigate('/jobs');
      
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
      let errorMessage = "Failed to create job posting";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && !error.status) {
        // Handle validation errors from the API (field-specific errors)
        const errors = Object.entries(error).map(([field, messages]) => {
          const fieldName = field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
          if (Array.isArray(messages)) {
            return `${fieldName}: ${messages.join(', ')}`;
          }
          return `${fieldName}: ${messages}`;
        }).join('\n');
        errorMessage = errors || errorMessage;
      }
      
      toast({
        title: "Validation Error",
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
              job.id === context.tempId ? data : job
            )
          };
        };
        
        queryClient.setQueriesData({ queryKey: ['/jobs/'] }, updateWithRealData);
      }
      
      queryClient.invalidateQueries({ queryKey: ['/jobs/'] });
      // Clear draft on successful submission
      clearDraft();
      toast({
        title: "Success",
        description: "Job posting created successfully",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateJob) => apiService.request<Job>(`/jobs/${job!.id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    onMutate: async (data) => {
      const jobId = job!.id;
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/jobs/'] });
      await queryClient.cancelQueries({ queryKey: ['/jobs/', jobId] });
      
      // Snapshot the previous values
      const previousJobsQueries = queryClient.getQueriesData({ queryKey: ['/jobs/'] });
      const previousJob = queryClient.getQueryData(['/jobs/', jobId]);
      
      // Create updated job data
      const updatedJob = {
        ...job,
        title: data.title,
        description: data.description,
        location: locations.find(l => l.id === data.location) || data.location,
        category: categories.find(c => c.id === data.category) || data.category,
        job_type: data.job_type,
        experience_level: data.experience_level,
        min_education_level: data.min_education_level,
        salary_from: data.salary_from,
        salary_to: data.salary_to,
        salary_payment_type: data.salary_payment_type,
        currency: data.currency,
        required_languages: data.required_languages,
        date_started: data.date_started,
        date_ended: data.date_ended,
        status: data.status,
        updated_at: new Date().toISOString()
      };
      
      // Update individual job
      queryClient.setQueryData(['/jobs/', jobId], updatedJob);
      
      // Update job in all job lists
      const updateJobInLists = (old: any) => {
        if (!old?.results) return old;
        return {
          ...old,
          results: old.results.map((j: any) => 
            j.id === jobId ? updatedJob : j
          )
        };
      };
      
      queryClient.setQueriesData({ queryKey: ['/jobs/'] }, updateJobInLists);
      
      // Immediately navigate to jobs page
      navigate('/jobs');
      
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
        queryClient.setQueryData(['/jobs/', context.jobId], context.previousJob);
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to update job posting",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/jobs/'] });
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
        title: "Error",
        description: "No organization selected. Please select an organization first.",
        variant: "destructive",
      });
      return;
    }

    // Check if organization is public
    if (selectedOrganization.is_public === false) {
      toast({
        title: "Organization Not Approved",
        description: "Your organization is currently under review. You cannot create job postings until it's approved by our moderators.",
        variant: "destructive",
      });
      return;
    }

    // Validate that the selected organization exists in the current organizations list
    const orgExists = organizations.some(org => org.id === selectedOrganization.id);
    if (!orgExists) {
      toast({
        title: "Error",
        description: "Selected organization is no longer available. Please refresh and select a valid organization.",
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
      requirements: data.requirements ? data.requirements.trim() : "",
      // Ensure min_education_level is not sent if empty
      min_education_level: data.min_education_level || undefined,
    };

    // Remove empty/undefined values that shouldn't be sent
    Object.keys(submitData).forEach(key => {
      if (submitData[key as keyof typeof submitData] === "" || submitData[key as keyof typeof submitData] === undefined) {
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

  // Prevent body scroll for this page
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-background h-screen overflow-hidden">
      {/* Header */}
      <div className="bg-card border-b flex-shrink-0">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/jobs')}
                className="mr-4 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Jobs
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-semibold">
                    {isEditing ? 'Edit Job Posting' : 'Create New Job Posting'}
                  </h1>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {isEditing ? 'Update your job posting details' : 'Fill in the details to create a new job opportunity'}
                  {!isEditing && (
                    <span className="block text-xs text-muted-foreground mt-1">
                      Your progress is automatically saved as you type
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Organization Approval Notice */}
          {selectedOrganization && selectedOrganization.is_public === false && (
            <Alert className="mb-6 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                <strong>Organization Under Review:</strong> Your organization "{selectedOrganization.official_name}" is currently being reviewed by our moderators. You won't be able to create job postings until the review is complete and your organization is approved.
              </AlertDescription>
            </Alert>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <Card className="shadow-sm">
                <CardHeader className="border-b bg-card">
                  <CardTitle className="flex items-center text-lg font-semibold">
                    <Briefcase className="h-5 w-5 mr-3 text-primary" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6 bg-card">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Job Title *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g. Senior Software Engineer"
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
                        <FormLabel className="text-sm font-medium">Job Description *</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Describe the role, responsibilities, and what makes this position exciting..."
                            className="h-[600px] mt-1"
                            maxLength={1024}
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-muted-foreground text-right">
                          {field.value?.length || 0}/1024 characters
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
                          <FormLabel className="text-sm font-medium">Category *</FormLabel>
                          <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories?.map((category) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-primary" />
                            Location *
                          </FormLabel>
                          <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select location" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {locations.map((location) => (
                                <SelectItem key={location.id} value={location.id.toString()}>
                                  {location.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="requirements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Requirements</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="List the required skills, experience, and qualifications..."
                            className="h-[600px] mt-1"
                            maxLength={1024}
                          />
                        </FormControl>
                        <div className="flex justify-between">
                          <FormDescription className="text-xs text-muted-foreground">
                            Optional: Detailed requirements for this position
                          </FormDescription>
                          <FormDescription className="text-xs text-muted-foreground">
                            {field.value?.length || 0}/1024 characters
                          </FormDescription>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Job Details */}
              <Card className="shadow-sm border border">
                <CardHeader className="border-b border bg-card">
                  <CardTitle className="flex items-center text-lg font-semibold text-foreground">
                    <Users className="h-5 w-5 mr-3 text-primary" />
                    Job Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6 bg-card">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="job_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground">Employment Type *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="full_time">Full Time</SelectItem>
                              <SelectItem value="part_time">Part Time</SelectItem>
                              <SelectItem value="contract">Contract</SelectItem>
                              <SelectItem value="internship">Internship</SelectItem>
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
                          <FormLabel className="text-sm font-medium text-foreground">Work Type *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="remote">Remote</SelectItem>
                              <SelectItem value="on_site">On Site</SelectItem>
                              <SelectItem value="hybrid">Hybrid</SelectItem>
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
                            <GraduationCap className="h-4 w-4 mr-1 text-primary" />
                            Minimum Education
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select minimum education (optional)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="secondary">Secondary</SelectItem>
                              <SelectItem value="undergraduate">Undergraduate</SelectItem>
                              <SelectItem value="master">Master</SelectItem>
                              <SelectItem value="doctorate">Doctorate</SelectItem>
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
                          <FormLabel className="text-sm font-medium text-foreground">Required Languages</FormLabel>
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
                                <SelectValue placeholder="Select languages" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {languages.map((language) => (
                                <SelectItem key={language.id} value={language.id.toString()}>
                                  {language.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {field.value && field.value.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {field.value.map((langId: number) => {
                                const lang = languages.find(l => l.id === langId);
                                return lang ? (
                                  <div key={langId} className="bg-primary text-white px-3 py-1 rounded-full text-sm flex items-center">
                                    {lang.name}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        field.onChange(field.value?.filter(id => id !== langId) || []);
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
                    <DollarSign className="h-5 w-5 mr-3 text-primary" />
                    Compensation & Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6 bg-card">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <FormField
                      control={form.control}
                      name="salary_from"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground">Minimum Salary *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              value={field.value ? field.value.toString() : ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || value === '0') {
                                  field.onChange(undefined);
                                } else {
                                  field.onChange(Number(value));
                                }
                              }}
                              placeholder="Enter minimum salary"
                              className="mt-1"
                              min="0"
                              step="100"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="salary_to"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground">Maximum Salary</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              value={field.value ? field.value.toString() : ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || value === '0') {
                                  field.onChange(undefined);
                                } else {
                                  field.onChange(Number(value));
                                }
                              }}
                              placeholder="Enter maximum salary (optional)"
                              className="mt-1"
                              min="0"
                              step="100"
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-muted-foreground">
                            Optional: Leave blank if not specified
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground">Currency</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="TMT">TMT (Turkmenistan Manat)</SelectItem>
                              <SelectItem value="USD">USD (US Dollar)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="salary_payment_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground">Payment Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="hourly">Hourly</SelectItem>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>


                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 pb-8">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate('/jobs')}
                  disabled={isLoading}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-primary hover:bg-blue-700 px-6"
                >
                  {isLoading ? 'Saving...' : isEditing ? 'Update Job Posting' : 'Create Job Posting'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}