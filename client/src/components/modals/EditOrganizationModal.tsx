import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
import type { Organization, Project } from "@/types";

const projectSchema = z.object({
  id: z.number().optional(),
  organization: z.number().optional(),
  title: z.string().min(1, "Project title is required"),
  description: z.string().optional(),
  link: z.string().optional(),
  date_started: z.string().optional(),
  date_finished: z.string().optional(),
});

const organizationUpdateSchema = z.object({
  official_name: z.string().min(1, "Organization name is required"),
  display_name: z.string().optional(),
  category: z.number().optional(),
  logo: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  about_us: z.string().optional(),
  location: z.number().optional(),
  projects: z.array(projectSchema).optional(),
});

type OrganizationUpdate = z.infer<typeof organizationUpdateSchema>;

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
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const { toast } = useToast();
  const { updateOrganization, uploadFile } = useOrganizationMutations();

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
      const updateData = {
        ...data,
        projects: projects,
      };
      
      const updatedOrg = await updateOrganization.mutateAsync({ 
        id: organization.id, 
        data: updateData 
      }) as Organization;
      
      // Update the organization in the auth store
      const { updateSelectedOrganization } = useAuth.getState();
      updateSelectedOrganization(updatedOrg);
      
      toast({
        title: "Success",
        description: "Organization updated successfully",
      });
      
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update organization",
        variant: "destructive",
      });
    }
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
    if (!logoFile) return;

    setIsUploading(true);
    try {
      const uploadResult = await uploadFile.mutateAsync(logoFile);
      
      form.setValue('logo', uploadResult.url);
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
          <DialogTitle>Edit Organization</DialogTitle>
          <DialogDescription>
            Update your organization's profile information
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Logo Upload Section */}
            <div className="flex items-center gap-6 p-4 bg-muted/50 rounded-lg">
              <Avatar className="h-20 w-20">
                <AvatarImage 
                  src={logoPreview || organization?.logo} 
                  alt="Organization logo" 
                />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                  {getOrgInitials(organization?.display_name || organization?.official_name)}
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

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* Contact Information */}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* About Section */}
            <FormField
              control={form.control}
              name="about_us"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>About Us</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Tell people about your organization..."
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
                <h3 className="text-lg font-semibold">Projects</h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={addProject}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Project
                </Button>
              </div>

              {projects.map((project, index) => (
                <div key={project.id || index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Project {index + 1}</h4>
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
                      <label className="text-sm font-medium">Project Title*</label>
                      <Input
                        value={project.title}
                        onChange={(e) => updateProject(index, 'title', e.target.value)}
                        placeholder="Enter project title"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Project Link</label>
                      <Input
                        value={project.link || ""}
                        onChange={(e) => updateProject(index, 'link', e.target.value)}
                        placeholder="https://project-url.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={project.description || ""}
                      onChange={(e) => updateProject(index, 'description', e.target.value)}
                      placeholder="Describe the project..."
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Start Date</label>
                      <Input
                        type="date"
                        value={project.date_started || ""}
                        onChange={(e) => updateProject(index, 'date_started', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">End Date</label>
                      <Input
                        type="date"
                        value={project.date_finished || ""}
                        onChange={(e) => updateProject(index, 'date_finished', e.target.value)}
                        placeholder="Leave empty if ongoing"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {projects.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                  <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No projects added yet</p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={addProject}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Project
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
      </DialogContent>
    </Dialog>
  );
}