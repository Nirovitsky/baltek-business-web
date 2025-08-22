import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiService } from "@/lib/api";
import { createJobSchema, type CreateJob, type Job, type Category, type Location, type Language, type PaginatedResponse } from "@/types";

interface JobFormProps {
  job?: Job;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function JobForm({ job, onSuccess, onCancel }: JobFormProps) {
  const { toast } = useToast();
  const { selectedOrganization } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<CreateJob>({
    resolver: zodResolver(createJobSchema),
    defaultValues: {
      title: job?.title || "",
      description: job?.description || "",
      requirements: job?.requirements || "",
      category: typeof job?.category === 'number' ? job.category : (typeof job?.category === 'object' ? job.category.id : 1),
      organization: typeof job?.organization === 'number' ? job.organization : (typeof job?.organization === 'object' ? job.organization.id : selectedOrganization?.id || 1),
      location: typeof job?.location === 'number' ? job.location : (typeof job?.location === 'object' ? job.location.id : 1),
      job_type: job?.job_type || "full_time",
      workplace_type: job?.workplace_type || "remote",
      min_education_level: job?.min_education_level || "secondary",
      salary_from: job?.salary_from || 0,
      salary_to: job?.salary_to || 0,
      salary_payment_type: job?.salary_payment_type || "monthly",
      required_languages: job?.required_languages || [],
      date_started: job?.date_started || Math.floor(Date.now() / 1000),
      date_ended: job?.date_ended || Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
      status: job?.status || "open",
    },
  });

  // Fetch categories, locations, and languages for selects
  const { data: categories } = useQuery({
    queryKey: ['/categories/'],
    queryFn: () => apiService.request<Category[]>('/categories/'),
  });

  const { data: locationsData } = useQuery({
    queryKey: ['/locations/'],
    queryFn: () => apiService.request<PaginatedResponse<Location>>('/locations/'),
  });

  const { data: languagesData } = useQuery({
    queryKey: ['/languages/'],
    queryFn: () => apiService.request<PaginatedResponse<Language>>('/languages/'),
  });

  const locations = locationsData?.results || [];
  const languages = languagesData?.results || [];

  const createMutation = useMutation({
    mutationFn: (data: CreateJob) => apiService.request<Job>('/jobs/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/jobs/'] });
      queryClient.invalidateQueries({ queryKey: ['/jobs/', selectedOrganization?.id] });
      queryClient.refetchQueries({ queryKey: ['/jobs/'] });
      toast({
        title: "Success",
        description: "Job posting created successfully",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create job posting",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateJob) => apiService.request<Job>(`/jobs/${job!.id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/jobs/'] });
      queryClient.invalidateQueries({ queryKey: ['/jobs/', selectedOrganization?.id] });
      queryClient.invalidateQueries({ queryKey: ['/jobs/', job!.id] });
      queryClient.refetchQueries({ queryKey: ['/jobs/'] });
      toast({
        title: "Success",
        description: "Job posting updated successfully",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update job posting",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateJob) => {
    if (!selectedOrganization?.id) {
      toast({
        title: "Error",
        description: "No organization found. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    const formattedData = {
      ...data,
      organization: selectedOrganization.id,
      date_started: typeof data.date_started === 'number' ? data.date_started : Math.floor(Date.now() / 1000),
      date_ended: typeof data.date_ended === 'number' ? data.date_ended : Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
    };

    
    if (job) {
      updateMutation.mutate(formattedData);
    } else {
      createMutation.mutate(formattedData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Senior Software Engineer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger>
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
                <FormLabel>Location</FormLabel>
                <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger>
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

          <FormField
            control={form.control}
            name="job_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
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
                <FormLabel>Workplace Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
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

          <FormField
            control={form.control}
            name="min_education_level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Education Level</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="secondary">Secondary Education</SelectItem>
                    <SelectItem value="undergraduate">Undergraduate</SelectItem>
                    <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                    <SelectItem value="master">Master's Degree</SelectItem>
                    <SelectItem value="doctorate">Doctorate</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="salary_from"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Salary From</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="e.g. 1000"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(Number(e.target.value) || 0)}
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
                <FormLabel>Salary To</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="e.g. 2000"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="salary_payment_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
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

        <FormField
          control={form.control}
          name="required_languages"
          render={({ field }) => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Required Languages</FormLabel>
                <FormDescription>
                  Select the languages required for this position
                </FormDescription>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {languages.map((language) => (
                  <div key={language.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`language-${language.id}`}
                      checked={field.value?.includes(language.id) || false}
                      onCheckedChange={(checked) => {
                        const currentLanguages = field.value || [];
                        if (checked) {
                          field.onChange([...currentLanguages, language.id]);
                        } else {
                          field.onChange(currentLanguages.filter(id => id !== language.id));
                        }
                      }}
                    />
                    <label
                      htmlFor={`language-${language.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {language.name}
                    </label>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Description</FormLabel>
              <FormControl>
                <Textarea 
                  rows={8}
                  placeholder="Describe the job role and responsibilities..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requirements"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Requirements (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  rows={8}
                  placeholder="List specific requirements, skills, or qualifications..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4 pt-6 border-t border">
          <Button 
            type="button" 
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : job ? 'Update Job Posting' : 'Create Job Posting'}
          </Button>
        </div>
      </form>
    </Form>
  );
}