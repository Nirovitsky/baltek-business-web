import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizationMutations, useOrganizationById, useOrganizations } from "@/hooks/useOrganizations";
import { 
  Building2, 
  MapPin, 
  Globe, 
  Mail, 
  Phone,
  FolderOpen,
  ExternalLink,
  Calendar,
  Briefcase,
  Edit3,
  Save,
  X,
  Upload,
  ArrowLeft
} from "lucide-react";
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

// Organization Suggestions Component
function OrganizationSuggestions({ currentOrgId }: { currentOrgId: number | undefined }) {
  const { organizations, isLoading } = useOrganizations();

  const suggestions = organizations?.filter((org: Organization) => 
    org.id !== currentOrgId
  ).slice(0, 8) || [];

  const getOrgInitials = (name?: string) => {
    if (!name) return 'ORG';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-white dark:bg-background rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden w-full">
      <div className="px-6 py-4 bg-gradient-to-r from-primary/5 to-blue-50 dark:from-primary/10 dark:to-blue-900/20 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-foreground dark:text-foreground flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Other Organizations
        </h3>
      </div>
      
      {isLoading ? (
        <div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="flex items-center gap-4 p-4">
                <Skeleton className="h-12 w-12 rounded-full ring-2 ring-gray-100" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-4" />
              </div>
              <hr className="border-gray-200 dark:border-gray-700" />
            </div>
          ))}
        </div>
      ) : (
        <div>
          {suggestions.map((org: Organization) => (
            <div key={org.id}>
              <div className="flex items-center gap-4 p-4 hover:bg-muted dark:hover:bg-gray-700/50 transition-all duration-200 cursor-pointer group">
                <Avatar className="h-12 w-12 ring-2 ring-gray-100 dark:ring-gray-600 group-hover:ring-primary/30 transition-all duration-200">
                  <AvatarImage src={org.logo} alt={org.display_name || org.official_name} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/20 text-primary text-sm font-bold border border-primary/20">
                    {getOrgInitials(org.display_name || org.official_name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground dark:text-foreground truncate group-hover:text-primary transition-colors text-sm">
                    {org.display_name || org.official_name}
                  </h4>
                  
                  <div className="flex items-center gap-1 mt-1">
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground dark:text-muted-foreground/60 font-medium">
                      {typeof org.category === 'object' ? org.category?.name : org.category || "Business Services"}
                    </span>
                  </div>
                  
                  {org.location && (
                    <div className="flex items-center gap-1 mt-2">
                      <MapPin className="h-3 w-3 text-muted-foreground/60" />
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground/60 truncate">
                        {typeof org.location === 'object' ? org.location.name : org.location}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary" />
                </div>
              </div>
              <hr className="border-gray-200 dark:border-gray-700" />
            </div>
          ))}
          
          {suggestions.length === 0 && (
            <div className="p-8 text-center">
              <div className="bg-muted dark:bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <Building2 className="h-8 w-8 text-muted-foreground/60" />
              </div>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground/60 font-medium mb-1">
                No other organizations available
              </p>
              <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                Check back later for more organizations
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Loading Skeleton
function OrganizationProfileSkeleton() {
  return (
    <div className="min-h-screen bg-muted dark:bg-gray-900">
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start gap-6">
                  <Skeleton className="h-20 w-20 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-4 w-48 mb-2" />
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Organization() {
  const [isEditing, setIsEditing] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
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
      }) as Organization;
      
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
      }) as Organization;

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

  // Get organization initials for avatar fallback
  const getOrgInitials = (name?: string) => {
    if (!name) return 'ORG';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoadingDetails) {
    return <OrganizationProfileSkeleton />;
  }

  if (detailsError || !currentOrganization) {
    return (
      <div className="min-h-screen bg-muted dark:bg-gray-900">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground dark:text-foreground mb-2">
                Organization Not Found
              </h1>
              <p className="text-muted-foreground dark:text-muted-foreground/60 mb-4">
                Please create an organization or select an existing one from the sidebar.
              </p>
              <Link href="/create-organization">
                <Button>
                  <Building2 className="h-4 w-4 mr-2" />
                  Create Organization
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-muted dark:bg-gray-900">
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Organization Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white dark:bg-background rounded-lg shadow-sm border dark:border-gray-700 p-6">
              <div className="flex items-start gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage 
                    src={logoPreview || currentOrganization?.logo} 
                    alt={currentOrganization?.display_name || currentOrganization?.official_name} 
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                    {getOrgInitials(currentOrganization?.display_name || currentOrganization?.official_name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h1 className="text-3xl font-bold text-foreground dark:text-foreground">
                        {currentOrganization?.display_name || currentOrganization?.official_name}
                      </h1>
                      {currentOrganization?.official_name && currentOrganization?.display_name && 
                       currentOrganization?.official_name !== currentOrganization?.display_name && (
                        <p className="text-lg text-muted-foreground dark:text-muted-foreground/60 mb-2">
                          {currentOrganization.official_name}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link href="/jobs">
                        <Button size="sm" variant="outline">
                          <Briefcase className="h-3 w-3 mr-1.5" />
                          View Jobs
                        </Button>
                      </Link>
                      <Button 
                        size="sm" 
                        onClick={() => setIsEditing(!isEditing)}
                        variant={isEditing ? "destructive" : "default"}
                      >
                        {isEditing ? (
                          <>
                            <X className="h-3 w-3 mr-1.5" />
                            Cancel
                          </>
                        ) : (
                          <>
                            <Edit3 className="h-3 w-3 mr-1.5" />
                            Edit
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground dark:text-muted-foreground/60">
                    {currentOrganization?.category && (
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        <span>{typeof currentOrganization.category === 'object' ? currentOrganization.category.name : currentOrganization.category}</span>
                      </div>
                    )}
                    
                    {(currentOrganization?.address || currentOrganization?.location) && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {currentOrganization.address || (typeof currentOrganization.location === 'object' ? currentOrganization.location.name : currentOrganization.location)}
                        </span>
                      </div>
                    )}
                    
                    {currentOrganization?.website && (
                      <div className="flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        <a 
                          href={currentOrganization.website.startsWith('http') ? currentOrganization.website : `https://${currentOrganization.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80"
                        >
                          {currentOrganization.website}
                        </a>
                      </div>
                    )}
                    
                    {currentOrganization?.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        <a href={`mailto:${currentOrganization.email}`} className="text-primary hover:text-primary/80">
                          {currentOrganization.email}
                        </a>
                      </div>
                    )}
                    
                    {currentOrganization?.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        <a href={`tel:${currentOrganization.phone}`} className="text-primary hover:text-primary/80">
                          {currentOrganization.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {isEditing ? (
              /* Edit Form */
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Logo Upload Section */}
                  <div className="bg-white dark:bg-background rounded-lg shadow-sm border dark:border-gray-700 p-6">
                    <h2 className="text-xl font-bold text-foreground dark:text-foreground mb-4 flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Organization Logo
                    </h2>
                    
                    <div className="flex items-center gap-6">
                      <Avatar className="h-24 w-24">
                        <AvatarImage 
                          src={logoPreview || currentOrganization?.logo} 
                          alt="Organization logo" 
                        />
                        <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                          {getOrgInitials(currentOrganization?.display_name || currentOrganization?.official_name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex flex-col gap-3">
                        {logoFile ? (
                          <>
                            <Button 
                              type="button" 
                              size="sm" 
                              onClick={handleLogoUpload}
                              disabled={isUploading}
                            >
                              {isUploading ? "Uploading..." : "Save Logo"}
                            </Button>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={removeLogo}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Remove
                            </Button>
                          </>
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
                              onClick={() => document.getElementById('logo-upload')?.click()}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Logo
                            </Button>
                          </>
                        )}
                        <p className="text-xs text-muted-foreground">JPG, PNG up to 2MB</p>
                      </div>
                    </div>
                  </div>

                  {/* Basic Information Edit */}
                  <div className="bg-white dark:bg-background rounded-lg shadow-sm border dark:border-gray-700 p-6">
                    <h2 className="text-xl font-bold text-foreground dark:text-foreground mb-4 flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Basic Information
                    </h2>
                    
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
                  </div>

                  {/* Contact Information Edit */}
                  <div className="bg-white dark:bg-background rounded-lg shadow-sm border dark:border-gray-700 p-6">
                    <h2 className="text-xl font-bold text-foreground dark:text-foreground mb-4 flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Contact Information
                    </h2>
                    
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Email</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="contact@yourcompany.com"
                                type="email"
                              />
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
                              <Input 
                                {...field} 
                                placeholder="+1 (555) 123-4567"
                              />
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
                  </div>

                  {/* About Section Edit */}
                  <div className="bg-white dark:bg-background rounded-lg shadow-sm border dark:border-gray-700 p-6">
                    <h2 className="text-xl font-bold text-foreground dark:text-foreground mb-4 flex items-center gap-2">
                      <FolderOpen className="h-5 w-5" />
                      About Organization
                    </h2>
                    
                    <div className="space-y-4">
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

                  <div className="flex justify-end space-x-4">
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
                      <Save className="h-4 w-4 mr-2" />
                      {updateOrganization.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <>
                {/* About Us Section */}
                <div className="bg-white dark:bg-background rounded-lg shadow-sm border dark:border-gray-700 p-6">
                  <h2 className="text-xl font-bold text-foreground dark:text-foreground mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    About Us
                  </h2>
                  
                  {(currentOrganization?.description || currentOrganization?.about_us) ? (
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                      <div className="whitespace-pre-wrap text-foreground dark:text-muted-foreground/60 leading-relaxed">
                        {currentOrganization?.description || currentOrganization?.about_us}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground dark:text-muted-foreground/60 italic">
                        No organization description available. Click Edit to add one!
                      </p>
                    </div>
                  )}
                </div>

                {/* Current Jobs Section */}
                <div className="bg-white dark:bg-background rounded-lg shadow-sm border dark:border-gray-700 p-6">
                  <h2 className="text-xl font-bold text-foreground dark:text-foreground mb-4 flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Current Job Openings
                  </h2>
                  
                  <div className="text-center py-8">
                    <p className="text-muted-foreground dark:text-muted-foreground/60 italic mb-4">
                      Job listings will appear here once posted.
                    </p>
                    <Link href="/create-job">
                      <Button>
                        <Briefcase className="h-4 w-4 mr-2" />
                        Post New Job
                      </Button>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Column - Suggested Organizations */}
          <div className="lg:col-span-1 lg:min-w-[400px]">
            <OrganizationSuggestions currentOrgId={currentOrganization?.id} />
          </div>
        </div>
      </div>
    </div>
  );
}