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
import { useOrganizationMutations, useOrganizationById } from "@/hooks/useOrganizations";
import { apiService } from "@/lib/api";
import { Building2, Globe, MapPin, Upload, X } from "lucide-react";
import { z } from "zod";
import type { Organization } from "@/types";

const organizationUpdateSchema = z.object({
  official_name: z.string().min(1, "Organization name is required"),
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
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedOrganization } = useAuth();
  const { updateOrganization, uploadFile } = useOrganizationMutations();
  
  // Fetch organization details by ID
  const { 
    data: organizationDetails, 
    isLoading: isLoadingDetails,
    error: detailsError 
  } = useOrganizationById(selectedOrganization?.id);
  
  // Use detailed organization data or fallback to selectedOrganization
  const currentOrganization = organizationDetails || selectedOrganization;



  const form = useForm<OrganizationUpdate>({
    resolver: zodResolver(organizationUpdateSchema),
    defaultValues: {
      official_name: "",
      display_name: "",
      description: "",
      about_us: "",
      website: "",
      email: "",
      phone: "",
      logo: "",
    },
  });

  // Update form when currentOrganization changes
  useEffect(() => {
    if (currentOrganization) {
      form.reset({
        official_name: currentOrganization.official_name,
        display_name: currentOrganization.display_name || "",
        description: currentOrganization.description || "",
        about_us: currentOrganization.about_us || "",
        website: currentOrganization.website || "",
        location_id: typeof currentOrganization.location === 'object' ? currentOrganization.location?.id : undefined,
        category_id: typeof currentOrganization.category === 'object' ? currentOrganization.category?.id : undefined,
        email: currentOrganization.email || "",
        phone: currentOrganization.phone || "",
        logo: currentOrganization.logo || "",
      });
    }
  }, [currentOrganization, form]);



  const onSubmit = async (data: OrganizationUpdate) => {
    if (!currentOrganization) return;
    
    try {
      const updatedOrg = await updateOrganization.mutateAsync({ 
        id: currentOrganization.id, 
        data 
      });
      
      // Update the organization in the auth store
      const { updateSelectedOrganization } = useAuth.getState();
      updateSelectedOrganization(updatedOrg);
      
      toast({
        title: "Success",
        description: "Organization updated successfully",
      });
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update organization",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    if (currentOrganization) {
      form.reset({
        official_name: currentOrganization.official_name,
        display_name: currentOrganization.display_name || "",
        description: currentOrganization.description || "",
        about_us: currentOrganization.about_us || "",
        website: currentOrganization.website || "",
        location_id: typeof currentOrganization.location === 'object' ? currentOrganization.location?.id : undefined,
        category_id: typeof currentOrganization.category === 'object' ? currentOrganization.category?.id : undefined,
        email: currentOrganization.email || "",
        phone: currentOrganization.phone || "",
        logo: currentOrganization.logo || "",
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
    if (!logoFile || !currentOrganization) return;

    setIsUploading(true);
    try {
      // Upload file using shared hook
      const formData = new FormData();
      formData.append('file', logoFile);
      
      const uploadResult = await uploadFile.mutateAsync(formData);
      
      // Update organization with the new logo URL
      const updatedOrg = await updateOrganization.mutateAsync({
        id: currentOrganization.id,
        data: { logo: uploadResult.url }
      });

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
              {!currentOrganization || isLoadingDetails ? (
                <div className="text-center py-8">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No organization selected</p>
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
                          <AspectRatio ratio={1 / 1} className="overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border hover:border-primary/50 transition-colors relative group">
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
                            ) : currentOrganization?.logo ? (
                              <img 
                                src={currentOrganization.logo} 
                                alt={currentOrganization.official_name} 
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
                          <p className="text-xs text-muted-foreground">JPG, PNG up to 2MB<br />Recommended: 400x400px</p>
                        </div>
                      </div>

                      {/* Organization Details */}
                      <div className="md:col-span-3">
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField
                                control={form.control}
                                name="official_name"
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
                                        value={typeof currentOrganization?.category === 'object' ? currentOrganization?.category?.name || "" : ""}
                                        onChange={(e) => {
                                          // Keep the field's onChange to maintain form state
                                          field.onChange(typeof currentOrganization?.category === 'object' ? currentOrganization?.category?.id : undefined);
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
                                          value={typeof currentOrganization?.location === 'object' ? currentOrganization?.location?.name || "" : ""}
                                          onChange={(e) => {
                                            // Keep the field's onChange to maintain form state
                                            field.onChange(typeof currentOrganization?.location === 'object' ? currentOrganization?.location?.id : undefined);
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
                            <h3 className="text-lg font-medium text-foreground border-b border pb-2">Contact Information</h3>
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
                            <h3 className="text-lg font-medium text-foreground border-b border pb-2">About Organization</h3>
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

                    <div className="flex justify-end space-x-4 pt-6 border-t border">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={handleCancel}
                        disabled={updateOrganization.isPending}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={updateOrganization.isPending}
                      >
                        {updateOrganization.isPending ? 'Saving...' : 'Save Changes'}
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
