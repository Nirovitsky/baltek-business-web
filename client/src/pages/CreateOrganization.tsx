import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Redirect } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiService } from "@/lib/api";
import { Building2 } from "lucide-react";
import { z } from "zod";
import type { Organization, Category, Location, PaginatedResponse } from "@shared/schema";

const createOrganizationSchema = z.object({
  official_name: z.string().min(1, "Organization name is required"),
  display_name: z.string().optional(),
  description: z.string().optional(),
  about_us: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  category_id: z.number().min(1, "Category is required"),
  location_id: z.number().min(1, "Location is required"),
});

type CreateOrganizationData = z.infer<typeof createOrganizationSchema>;

export default function CreateOrganization() {
  const { toast } = useToast();
  const { selectedOrganization, fetchOrganizations } = useAuth();

  // Fetch categories for dropdown
  const { data: categories } = useQuery({
    queryKey: ['/categories/'],
    queryFn: () => apiService.request<Category[]>('/categories/'),
  });

  // Fetch locations for dropdown
  const { data: locationsData } = useQuery({
    queryKey: ['/locations/'],
    queryFn: () => apiService.request<PaginatedResponse<Location>>('/locations/'),
  });

  const locations = locationsData?.results || [];

  const form = useForm<CreateOrganizationData>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      official_name: "",
      display_name: "",
      description: "",
      about_us: "",
      website: "",
      email: "",
      phone: "",
      category_id: undefined,
      location_id: undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateOrganizationData) => {
      // Map the form data to match API expectations
      const { category_id, location_id, ...rest } = data;
      const apiData = {
        ...rest,
        category: category_id,
        location: location_id,
      };
      
      console.log('Sending organization data:', apiData);
      
      return apiService.request<Organization>('/organizations/', {
        method: 'POST',
        body: JSON.stringify(apiData),
      });
    },
    onSuccess: async () => {
      toast({
        title: "Success",
        description: "Organization created successfully! Welcome to baltek business.",
      });
      // Refresh organizations to get the new one
      await fetchOrganizations();
    },
    onError: (error: any) => {
      console.error('Organization creation error:', error);
      const errorMessage = error.message || error.detail || "Failed to create organization";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // If user already has an organization, redirect to dashboard
  if (selectedOrganization) {
    return <Redirect to="/" />;
  }

  const onSubmit = (data: CreateOrganizationData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="auth-page min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Create Your Organization</CardTitle>
          <CardDescription>
            Let's set up your organization profile to get started with baltek business
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="official_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name*</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter organization name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="display_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter display name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Brief description of your organization"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="about_us"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>About Us</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Tell us more about your organization"
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category*</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(Number(value))} 
                        value={field.value?.toString()}
                      >
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
                  name="location_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location*</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(Number(value))} 
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locations?.map((location) => (
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://example.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="contact@example.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter phone number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create Organization"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}