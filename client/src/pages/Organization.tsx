import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import TopBar from "@/components/layout/TopBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { AspectRatio } from "@/components/ui/aspect-ratio";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiService } from "@/lib/api";
import { Building2, Globe, MapPin, Upload, X } from "lucide-react";
import { z } from "zod";
import type { Organization } from "@shared/schema";

const organizationUpdateSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  display_name: z.string().optional(),
  description: z.string().optional(),
  about_us: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  location_id: z.number().optional(),
  category_id: z.number().optional(),

  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  logo: z.string().optional(),
});

type OrganizationUpdate = z.infer<typeof organizationUpdateSchema>;

export default function Organization() {
  const [isEditing, setIsEditing] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedOrganization, fetchOrganizations } = useAuth();

  // Ensure we have the latest organization data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await fetchOrganizations();
      } catch (error) {
        console.error('Failed to fetch organization data:', error);
        toast({
          title: "Error",
          description: "Failed to load organization data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [fetchOrganizations, toast]);

  const form = useForm<OrganizationUpdate>({
    resolver: zodResolver(organizationUpdateSchema),
    defaultValues: {
      name: "",
      display_name: "",
      description: "",
      about_us: "",
      website: "",
      email: "",
      phone: "",
      logo: "",
    },
  });

  // Update form when selectedOrganization changes
  useEffect(() => {
    if (selectedOrganization) {
      form.reset({
        name: selectedOrganization.name,
        display_name: selectedOrganization.display_name || "",
        description: selectedOrganization.description || "",
        about_us: selectedOrganization.about_us || "",
        website: selectedOrganization.website || "",
        location_id: selectedOrganization.location?.id,
        category_id: selectedOrganization.category?.id,
        email: selectedOrganization.email || "",
        phone: selectedOrganization.phone || "",
        logo: selectedOrganization.logo || "",
      });
    }
  }, [selectedOrganization, form]);

  const updateMutation = useMutation({
    mutationFn: (data: OrganizationUpdate) => {
      if (!selectedOrganization) {
        throw new Error('No organization selected');
      }
      return apiService.request<Organization>(`/organizations/${selectedOrganization.id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (updatedOrg) => {
      // Update the organization in the auth store
      const { updateSelectedOrganization } = useAuth.getState();
      updateSelectedOrganization(updatedOrg);
      toast({
        title: "Success",
        description: "Organization updated successfully",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update organization",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OrganizationUpdate) => {
    updateMutation.mutate(data);
  };

  const handleCancel = () => {
    if (selectedOrganization) {
      form.reset({
        name: selectedOrganization.name,
        display_name: selectedOrganization.display_name || "",
        description: selectedOrganization.description || "",
        about_us: selectedOrganization.about_us || "",
        website: selectedOrganization.website || "",
        location_id: selectedOrganization.location?.id,
        category_id: selectedOrganization.category?.id,
        email: selectedOrganization.email || "",
        phone: selectedOrganization.phone || "",
        logo: selectedOrganization.logo || "",
      });
    }
    setLogoFile(null);
    setLogoPreview("");
    setIsEditing(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPG or PNG image",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 2MB",
        variant: "destructive",
      });
      return;
    }

    setLogoFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = async () => {
    if (!logoFile || !selectedOrganization) return;

    setIsUploading(true);
    try {
      // First upload the file to get the URL
      const formData = new FormData();
      formData.append('path', logoFile);

      const uploadResponse = await fetch('/api/files/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.path?.[0] || errorData.detail || 'Failed to upload file');
      }

      const uploadResult = await uploadResponse.json();
      
      // Update organization with the new logo URL using FormData
      const logoFormData = new FormData();
      logoFormData.append('logo', uploadResult.path);
      
      const response = await fetch(`/api/organizations/${selectedOrganization.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: logoFormData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.logo?.[0] || errorData.detail || 'Failed to update organization logo');
      }

      const updatedOrg = await response.json();

      // Update form and auth state
      form.setValue('logo', updatedOrg.logo || '');
      const { updateSelectedOrganization } = useAuth.getState();
      updateSelectedOrganization(updatedOrg);

      setLogoFile(null);
      setLogoPreview("");
      
      toast({
        title: "Success",
        description: "Logo uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload logo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview("");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar 
        title="Organization"
        description="Manage your organization profile"
        showCreateButton={false}
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Organization Profile Card */}
          <Card>
            <CardHeader className="pb-4">
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                </div>
              ) : !selectedOrganization ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No organization found</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Create an organization to manage your business profile
                  </p>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      {/* Logo Upload Section */}
                      <div className="md:col-span-1">
                        <FormLabel className="block mb-3 text-sm font-medium">Organization Logo</FormLabel>
                        <div className="w-full mb-4">
                          <AspectRatio ratio={1 / 1} className="overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-200 hover:border-primary/50 transition-colors relative group">
                            {logoPreview ? (
                              <>
                                <img 
                                  src={logoPreview} 
                                  alt="Logo preview" 
                                  className="object-cover w-full h-full rounded-xl"
                                />
                                <button
                                  type="button"
                                  onClick={removeLogo}
                                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </>
                            ) : selectedOrganization?.logo ? (
                              <img 
                                src={selectedOrganization.logo} 
                                alt={selectedOrganization.name} 
                                className="object-cover w-full h-full rounded-xl"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full w-full text-gray-400">
                                <Building2 className="h-16 w-16 mb-2" />
                                <span className="text-xs text-center px-2">No logo uploaded</span>
                              </div>
                            )}
                          </AspectRatio>
                        </div>
                        <div className="text-center space-y-2">
                          {logoFile ? (
                            <Button 
                              type="button" 
                              size="sm" 
                              className="w-full"
                              onClick={handleLogoUpload}
                              disabled={isUploading}
                            >
                              {isUploading ? "Uploading..." : "Save Logo"}
                            </Button>
                          ) : (
                            <>
                              <input
                                type="file"
                                accept="image/jpeg,image/jpg,image/png"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="logo-upload"
                              />
                              <Button 
                                variant="outline" 
                                type="button" 
                                size="sm" 
                                className="w-full"
                                onClick={() => document.getElementById('logo-upload')?.click()}
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Logo
                              </Button>
                            </>
                          )}
                          <p className="text-xs text-gray-500">JPG, PNG up to 2MB<br />Recommended: 400x400px</p>
                        </div>
                      </div>

                      {/* Organization Details */}
                      <div className="md:col-span-3">
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Organization Name*</FormLabel>
                                    <FormControl>
                                      <Input 
                                        {...field} 
                                        placeholder="Enter organization name"
                                      />
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
                                      <Input 
                                        {...field} 
                                        placeholder="Display name (optional)"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField
                                control={form.control}
                                name="category_id"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <FormControl>
                                      <Input 
                                        {...field}
                                        type="text"
                                        value={selectedOrganization?.category?.name || ""}
                                        onChange={(e) => {
                                          // Keep the field's onChange to maintain form state
                                          field.onChange(selectedOrganization?.category?.id);
                                        }}
                                        placeholder="Organization category"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="location_id"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Location</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <Input 
                                          {...field}
                                          type="text"
                                          value={selectedOrganization?.location?.name || ""}
                                          onChange={(e) => {
                                            // Keep the field's onChange to maintain form state
                                            field.onChange(selectedOrganization?.location?.id);
                                          }}

                                          placeholder="Location"
                                          className="pl-10"
                                        />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                          {/* Contact Information Section */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Contact Information</h3>
                            <FormField
                              control={form.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Business Email</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Input 
                                        {...field} 
                                        placeholder="contact@yourcompany.com"
                                        type="email"
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Business Phone</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Input 
                                        {...field} 
                                        placeholder="+1 (555) 123-4567"
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="website"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Website</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                      <Input 
                                        {...field} 
                                        placeholder="https://www.example.com"
                                        className="pl-10"
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* About Section */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">About Organization</h3>
                            <FormField
                              control={form.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Short Description</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      {...field} 
                                      placeholder="A brief description of your organization"
                                      rows={2}
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
                                      placeholder="Detailed information about your organization, history, mission, values, etc."
                                      rows={6}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={handleCancel}
                        disabled={updateMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>


        </div>
      </main>
    </div>
  );
}
