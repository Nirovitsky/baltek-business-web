import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Briefcase, MapPin, Users, Calendar, DollarSign, GraduationCap, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { createJobSchema, type CreateJob, type Job, type Category, type Location, type Language, type PaginatedResponse } from "@shared/schema";
import { useEffect } from "react";

export default function CreateJob() {
  const { toast } = useToast();
  const { selectedOrganization } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id?: string }>();
  
  const isEditing = Boolean(id);

  // Fetch job data if editing
  const { data: jobData } = useQuery({
    queryKey: ['/jobs/', id],
    queryFn: () => apiService.request<Job>(`/jobs/${id}/`),
    enabled: isEditing,
  });

  const job = jobData;

  const form = useForm<CreateJob>({
    resolver: zodResolver(createJobSchema),
    defaultValues: {
      title: "",
      description: "",
      requirements: "",
      category: 1,
      organization: selectedOrganization?.id || 1,
      location: 1,
      job_type: "full_time",
      workplace_type: "remote",
      min_education_level: "secondary",
      salary_from: 0,
      salary_to: 0,
      salary_payment_type: "monthly",
      required_languages: [],
      date_started: new Date().toLocaleDateString('en-GB').replace(/\//g, '.'),
      date_ended: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB').replace(/\//g, '.'),
      status: "open",
    },
  });

  // Update form values when job data is loaded
  useEffect(() => {
    if (job) {
      form.reset({
        title: job.title || "",
        description: job.description || "",
        requirements: job.requirements || "",
        category: job.category || 1,
        organization: job.organization || selectedOrganization?.id || 1,
        location: job.location || 1,
        job_type: job.job_type || "full_time",
        workplace_type: job.workplace_type || "remote",
        min_education_level: job.min_education_level || "secondary",
        salary_from: job.salary_from || 0,
        salary_to: job.salary_to || 0,
        salary_payment_type: job.salary_payment_type || "monthly",
        required_languages: job.required_languages || [],
        date_started: job.date_started || new Date().toLocaleDateString('en-GB').replace(/\//g, '.'),
        date_ended: job.date_ended || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB').replace(/\//g, '.'),
        status: job.status || "open",
      });
    }
  }, [job, form, selectedOrganization]);

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
      setLocation('/jobs');
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
      setLocation('/jobs');
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

    const submitData = {
      ...data,
      organization: selectedOrganization.id,
    };

    if (isEditing) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/jobs')}
              className="mr-4 hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Button>
            <div className="flex items-center">
              <div className="bg-[#1877F2] p-2 rounded-lg mr-4">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEditing ? 'Edit Job Posting' : 'Create New Job Posting'}
                </h1>
                <p className="text-gray-600">
                  {isEditing ? 'Update your job posting details' : 'Fill in the details to create a new job opportunity'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Information */}
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-[#1877F2] to-blue-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center text-xl">
                    <Briefcase className="h-5 w-5 mr-2" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Job Title *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g. Senior Software Engineer"
                            className="text-base py-3"
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
                        <FormLabel className="text-base font-semibold">Job Description *</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Describe the role, responsibilities, and what makes this position exciting..."
                            className="min-h-[120px] text-base"
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
                        <FormLabel className="text-base font-semibold">Requirements</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="List the required skills, experience, and qualifications..."
                            className="min-h-[100px] text-base"
                          />
                        </FormControl>
                        <FormDescription>
                          Optional: Detailed requirements for this position
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
                          <FormLabel className="text-base font-semibold">Category *</FormLabel>
                          <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger className="text-base py-3">
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
                          <FormLabel className="text-base font-semibold flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            Location *
                          </FormLabel>
                          <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger className="text-base py-3">
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
                </CardContent>
              </Card>

              {/* Job Details */}
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center text-xl">
                    <Users className="h-5 w-5 mr-2" />
                    Job Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="job_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Employment Type *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="text-base py-3">
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
                          <FormLabel className="text-base font-semibold">Work Type *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="text-base py-3">
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
                          <FormLabel className="text-base font-semibold flex items-center">
                            <GraduationCap className="h-4 w-4 mr-1" />
                            Minimum Education *
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="text-base py-3">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="secondary">Secondary Education</SelectItem>
                              <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                              <SelectItem value="master">Master's Degree</SelectItem>
                              <SelectItem value="phd">PhD</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Job Status *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="text-base py-3">
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
                  </div>

                  <div>
                    <FormField
                      control={form.control}
                      name="required_languages"
                      render={() => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Required Languages</FormLabel>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                            {languages.map((language) => (
                              <FormField
                                key={language.id}
                                control={form.control}
                                name="required_languages"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(language.id)}
                                        onCheckedChange={(checked) => {
                                          const currentValue = field.value || [];
                                          if (checked) {
                                            field.onChange([...currentValue, language.id]);
                                          } else {
                                            field.onChange(currentValue.filter((id) => id !== language.id));
                                          }
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal cursor-pointer">
                                      {language.name}
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Compensation & Dates */}
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center text-xl">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Compensation & Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="salary_from"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Minimum Salary</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              placeholder="0"
                              className="text-base py-3"
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
                          <FormLabel className="text-base font-semibold">Maximum Salary</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              placeholder="0"
                              className="text-base py-3"
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
                          <FormLabel className="text-base font-semibold">Payment Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="text-base py-3">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="date_started"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Start Date
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="DD.MM.YYYY"
                              className="text-base py-3"
                            />
                          </FormControl>
                          <FormDescription>
                            When this job posting goes live
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="date_ended"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            End Date
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="DD.MM.YYYY"
                              className="text-base py-3"
                            />
                          </FormControl>
                          <FormDescription>
                            When applications close
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <Card className="shadow-lg border-0">
                <CardContent className="p-6">
                  <div className="flex justify-end space-x-4">
                    <Button 
                      type="button" 
                      variant="outline"
                      size="lg"
                      onClick={() => setLocation('/jobs')}
                      disabled={isLoading}
                      className="px-8"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      size="lg"
                      className="bg-[#1877F2] hover:bg-blue-700 px-8"
                    >
                      {isLoading ? 'Saving...' : isEditing ? 'Update Job Posting' : 'Create Job Posting'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}