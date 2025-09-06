import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizationMutations } from "@/hooks/useOrganizations";
import { Building2, Globe, Upload, X, Save, Plus, Trash2, Calendar } from "lucide-react";
import { SearchableLocation } from "@/components/ui/searchable-location";
import { SearchableCategory } from "@/components/ui/searchable-category";
import type { Organization, Project } from "@/types";

// Note: We'll create these schemas inside the component to have access to translations
const createSchemas = (t: any) => ({
  projectSchema: z.object({
    id: z.number().optional(),
    organization: z.number().optional(),
    title: z.string().min(1, t("editOrganization.projectTitleRequired")),
    description: z.string().optional(),
    link: z.string().optional(),
    date_started: z.string().optional(),
    date_finished: z.string().optional(),
  }),
  organizationUpdateSchema: z.object({
    official_name: z.string().min(1, t("editOrganization.organizationNameRequired")),
    display_name: z.string().optional(),
    category: z.number().optional(),
    logo: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    website: z.string().url().optional().or(z.literal("")),
    about_us: z.string().optional(),
    location: z.number().optional(),
    projects: z.array(z.any()).optional(),
  })
});

type OrganizationUpdate = {
  official_name: string;
  display_name?: string;
  category?: number;
  logo?: string;
  phone?: string;
  email?: string;
  website?: string;
  about_us?: string;
  location?: number;
  projects?: any[];
};

interface EditOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization;
}

export default function EditOrganizationModal({ 
  open, 
  onOpenChange, 
  organization 
}: EditOrganizationModalProps) {
  const { t } = useTranslation();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [newLogoUrl, setNewLogoUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { updateOrganization, uploadFile } = useOrganizationMutations();

  // Create schemas with translations
  const { organizationUpdateSchema } = createSchemas(t);

  const form = useForm<OrganizationUpdate>({
    resolver: zodResolver(organizationUpdateSchema),
    defaultValues: {
      official_name: "",
      display_name: "",
      category: undefined,
      logo: "",
      phone: "",
      email: "",
      website: "",
      about_us: "",
      location: undefined,
      projects: [],
    },
  });

  // Update form when organization changes
  useEffect(() => {
    if (organization) {
      const initialProjects = organization.projects || [];
      setProjects(initialProjects);
      setNewLogoUrl(null); // Reset new logo URL when switching organizations
      
      form.reset({
        official_name: organization.official_name,
        display_name: organization.display_name || "",
        category: typeof organization.category === 'number' ? organization.category : 
                 typeof organization.category === 'object' ? organization.category?.id : undefined,
        logo: organization.logo || "",
        phone: organization.phone || "",
        email: organization.email || "",
        website: organization.website || "",
        about_us: organization.about_us || "",
        location: typeof organization.location === 'number' ? organization.location : 
                 typeof organization.location === 'object' ? organization.location?.id : undefined,
        projects: initialProjects,
      });
    }
  }, [organization, form]);

  const onSubmit = async (data: OrganizationUpdate) => {
    try {
      // Include projects in the update data
      const updateData: any = {
        ...data,
        projects: projects,
      };

      // Only include logo if a new one was uploaded
      if (newLogoUrl) {
        updateData.logo = newLogoUrl;
      } else {
        // Don't include logo field at all if no new logo was uploaded
        delete updateData.logo;
      }
      
      const updatedOrg = await updateOrganization.mutateAsync({ 
        id: organization.id, 
        data: updateData 
      }) as Organization;
      
      // Update the organization in the auth store
      const { updateSelectedOrganization } = useAuth.getState();
      updateSelectedOrganization(updatedOrg);
      
      toast({
        title: t("editOrganization.success"),
        description: t("editOrganization.organizationUpdatedSuccess"),
      });
      
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: t("editOrganization.error"),
        description: error.message || t("editOrganization.failedToUpdateOrganization"),
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      toast({
        title: t("editOrganization.invalidFileType"),
        description: t("editOrganization.pleaseSelectImage"),
        variant: "destructive",
      });
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: t("editOrganization.fileTooLarge"),
        description: t("editOrganization.pleaseSelectSmallerImage"),
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

    // Start uploading immediately
    setIsUploading(true);
    try {
      const uploadResult = await uploadFile.mutateAsync(file);
      
      setNewLogoUrl(uploadResult.url);
      form.setValue('logo', uploadResult.url);
      setLogoFile(null);
      setLogoPreview("");
      
      toast({
        title: t("editOrganization.success"),
        description: t("editOrganization.logoUploadedSuccess"),
      });
    } catch (error: any) {
      toast({
        title: t("editOrganization.uploadFailed"),
        description: error.message || t("editOrganization.failedToUploadLogo"),
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;

    setIsUploading(true);
    try {
      const uploadResult = await uploadFile.mutateAsync(logoFile);
      
      setNewLogoUrl(uploadResult.url);
      form.setValue('logo', uploadResult.url);
      setLogoFile(null);
      setLogoPreview("");
      
      toast({
        title: t("editOrganization.success"),
        description: t("editOrganization.logoUploadedSuccess"),
      });
    } catch (error: any) {
      toast({
        title: t("editOrganization.uploadFailed"),
        description: error.message || t("editOrganization.failedToUploadLogo"),
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview("");
    setNewLogoUrl(null);
  };

  // Project management functions
  const addProject = () => {
    const newProject: Project = {
      id: Date.now(), // temporary ID for new projects
      organization: organization.id,
      title: "",
      description: "",
      link: "",
      date_started: "",
      date_finished: "",
    };
    setProjects([...projects, newProject]);
  };

  const updateProject = (index: number, field: keyof Project, value: string | number) => {
    const updatedProjects = [...projects];
    updatedProjects[index] = { ...updatedProjects[index], [field]: value };
    setProjects(updatedProjects);
  };

  const removeProject = (index: number) => {
    const updatedProjects = projects.filter((_, i) => i !== index);
    setProjects(updatedProjects);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("editOrganization.title")}</DialogTitle>
          <DialogDescription>
            {t("editOrganization.description")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Logo Upload Section */}
            <div className="flex justify-center p-4 bg-muted/50 rounded-lg">
              <div className="relative group">
                <div 
                  className="relative cursor-pointer transition-all duration-200 hover:opacity-80"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                >
                  <Avatar className="h-20 w-20">
                    <AvatarImage 
                      src={logoPreview || organization?.logo} 
                      alt="Organization logo" 
                    />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                      {getOrgInitials(organization?.display_name || organization?.official_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full flex items-center justify-center">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                  
                  {/* Loading overlay */}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                    </div>
                  )}
                </div>
                
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="logo-upload"
                />
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="official_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("editOrganization.organizationName")}*</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder={t("editOrganization.organizationNamePlaceholder")}
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
                    <FormLabel>{t("editOrganization.displayName")}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder={t("editOrganization.displayNamePlaceholder")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Category and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("editOrganization.category")}</FormLabel>
                    <FormControl>
                      <SearchableCategory
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder={t("editOrganization.categoryPlaceholder")}
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
                    <FormLabel>{t("editOrganization.location")}</FormLabel>
                    <FormControl>
                      <SearchableLocation
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder={t("editOrganization.locationPlaceholder")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("editOrganization.businessEmail")}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder={t("editOrganization.businessEmailPlaceholder")}
                        type="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("editOrganization.businessPhone")}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder={t("editOrganization.businessPhonePlaceholder")}
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
                      <FormLabel>{t("editOrganization.website")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input 
                            {...field} 
                            placeholder={t("editOrganization.websitePlaceholder")}
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

            {/* About Section */}
            <FormField
              control={form.control}
              name="about_us"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("editOrganization.aboutUs")}</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder={t("editOrganization.aboutUsPlaceholder")}
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Projects Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t("editOrganization.projects")}</h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={addProject}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("editOrganization.addProject")}
                </Button>
              </div>

              {projects.map((project, index) => (
                <div key={project.id || index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{t("editOrganization.project")} {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProject(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">{t("editOrganization.projectTitle")}*</label>
                      <Input
                        value={project.title}
                        onChange={(e) => updateProject(index, 'title', e.target.value)}
                        placeholder={t("editOrganization.projectTitlePlaceholder")}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">{t("editOrganization.projectLink")}</label>
                      <Input
                        value={project.link || ""}
                        onChange={(e) => updateProject(index, 'link', e.target.value)}
                        placeholder={t("editOrganization.projectLinkPlaceholder")}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">{t("editOrganization.projectDescription")}</label>
                    <Textarea
                      value={project.description || ""}
                      onChange={(e) => updateProject(index, 'description', e.target.value)}
                      placeholder={t("editOrganization.projectDescriptionPlaceholder")}
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">{t("editOrganization.startDate")}</label>
                      <Input
                        type="date"
                        value={project.date_started || ""}
                        onChange={(e) => updateProject(index, 'date_started', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">{t("editOrganization.endDate")}</label>
                      <Input
                        type="date"
                        value={project.date_finished || ""}
                        onChange={(e) => updateProject(index, 'date_finished', e.target.value)}
                        placeholder={t("editOrganization.endDatePlaceholder")}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {projects.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                  <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">{t("editOrganization.noProjectsYet")}</p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={addProject}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t("editOrganization.addYourFirstProject")}
                  </Button>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateOrganization.isPending}
              >
                {t("editOrganization.cancel")}
              </Button>
              <Button 
                type="submit" 
                disabled={updateOrganization.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {updateOrganization.isPending ? t("editOrganization.saving") : t("editOrganization.saveChanges")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}