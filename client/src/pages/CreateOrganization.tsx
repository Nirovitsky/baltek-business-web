import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableLocation } from "@/components/ui/searchable-location";
import { SearchableCategory } from "@/components/ui/searchable-category";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Building2,
  Upload,
  X,
  Sparkles,
  Users,
  Target,
  Zap,
  Loader2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Tag,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Plus,
  Calendar,
  Link,
  Trash2,
} from "lucide-react";
import { apiService } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useReferenceData } from "@/hooks/useReferencedData";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Category, Location, PaginatedResponse, Project } from "@/types";

export default function CreateOrganization() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { organizations, createOrganization, uploadFile } = useOrganizations();
  const { refreshOrganizations, switchOrganization } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const DRAFT_KEY = "organization_draft_new";
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [projects, setProjects] = useState<Omit<Project, 'id' | 'organization'>[]>([]);

  // Load draft or use defaults
  const loadDraftOrDefaults = () => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn("Failed to load organization draft:", error);
    }
    return {
      official_name: "",
      display_name: "",
      about_us: "",
      website: "",
      email: "",
      phone: "",
      category_id: 0,
      location_id: 0,
      projects: [],
    };
  };

  const [formData, setFormData] = useState(loadDraftOrDefaults);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Initialize projects from loaded data
  useEffect(() => {
    const savedData = loadDraftOrDefaults();
    if (savedData.projects) {
      setProjects(savedData.projects);
    }
  }, []);

  const MAX_ORGANIZATIONS = 10;

  // Use shared reference data to avoid duplication
  const {
    categories,
    locations,
    isLoading: isLoadingRefData,
  } = useReferenceData();

  // Check if user has reached maximum organizations
  if (organizations.length >= MAX_ORGANIZATIONS) {
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
                  onClick={() => navigate("/")}
                  className="mr-4 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t("ui.backToDashboard")}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                    <Building2 className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">
                      {t('createOrganization.maxOrganizationsReached')}
                    </h1>
                    <p className="text-muted-foreground mt-2">
                      {t('createOrganization.maxOrganizationsMessage', { max: MAX_ORGANIZATIONS })}
                    </p>
                  </div>
                  <Button onClick={() => navigate("/")} className="w-full">
                    {t('createOrganization.backToDashboard')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Auto-save draft
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        const draftData = { ...formData, projects };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
        setIsDraftSaved(true);
        setTimeout(() => setIsDraftSaved(false), 2000);
      } catch (error) {
        console.warn("Failed to save organization draft:", error);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [formData, projects]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev: typeof formData) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev: typeof formData) => ({
      ...prev,
      [name]: parseInt(value),
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t('createOrganization.fileTooLarge'),
          description: t('createOrganization.logoSizeLimit'),
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: t('createOrganization.invalidFileType'),
          description: t('createOrganization.pleaseUploadImage'),
          variant: "destructive",
        });
        return;
      }

      setLogoFile(file);
      setIsUploadingLogo(true);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload immediately
      try {
        const uploadResponse = await uploadFile.mutateAsync(file);
        setLogoUrl(uploadResponse.url);
        toast({
          title: t('createOrganization.logoUploadedSuccessfully'),
          description: t('createOrganization.logoReadyToUse'),
        });
      } catch (error) {
        console.error("Logo upload failed:", error);
        toast({
          title: t('createOrganization.logoUploadFailed'),
          description: t('createOrganization.pleaseRetry'),
          variant: "destructive",
        });
        // Clear the failed upload
        setLogoFile(null);
        setLogoPreview(null);
      } finally {
        setIsUploadingLogo(false);
      }
    }
  };

  const clearLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setLogoUrl(null);
  };

  // Project management functions
  const addProject = () => {
    setProjects([...projects, {
      title: "",
      description: "",
      link: "",
      date_started: "",
      date_finished: "",
    }]);
  };

  const updateProject = (index: number, field: string, value: string) => {
    const updatedProjects = projects.map((project, i) => 
      i === index ? { ...project, [field]: value } : project
    );
    setProjects(updatedProjects);
  };

  const updateProjectDate = (index: number, field: string, date: Date | undefined) => {
    const updatedProjects = projects.map((project, i) => 
      i === index ? { ...project, [field]: date ? format(date, 'yyyy-MM-dd') : '' } : project
    );
    setProjects(updatedProjects);
  };

  const removeProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate required fields before moving to next step
      if (!formData.official_name.trim()) {
        toast({
          title: t('createOrganization.organizationNameRequired'),
          description: t('createOrganization.pleaseEnterName'),
          variant: "destructive",
        });
        return;
      }

      if (formData.category_id === 0) {
        toast({
          title: t('createOrganization.categoryRequired'),
          description: t('createOrganization.pleaseSelectCategory'),
          variant: "destructive",
        });
        return;
      }

      if (formData.location_id === 0) {
        toast({
          title: t('createOrganization.locationRequired'),
          description: t('createOrganization.pleaseSelectLocation'),
          variant: "destructive",
        });
        return;
      }

      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);

    try {
      // Create organization with proper field mapping
      const organizationData = {
        official_name: formData.official_name,
        display_name: formData.display_name || formData.official_name,
        about_us: formData.about_us,
        website: formData.website || "",
        email: formData.email || "",
        phone: formData.phone || "",
        category: formData.category_id,
        location: formData.location_id,
        projects: projects
          .filter(project => project.title.trim() !== "")
          .map(project => ({
            title: project.title.trim(),
            description: project.description || "",
            link: project.link || "",
            date_started: project.date_started || null,
            date_finished: project.date_finished || null,
          })),
        ...(logoUrl && { logo: logoUrl }),
      };

      const newOrganization =
        await createOrganization.mutateAsync(organizationData);

      toast({
        title: t('createOrganization.organizationCreated'),
        description: t('createOrganization.organizationCreatedSuccess'),
      });

      // Clear draft on successful creation
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch (error) {
        console.warn("Failed to clear organization draft:", error);
      }

      // Refresh organizations in auth context to include the new one
      await refreshOrganizations();

      // Since refreshOrganizations updates the auth context,
      // the new organization should now be automatically selected as it's the first one
      // We can also manually select it to ensure it's the active organization
      if (newOrganization) {
        switchOrganization(newOrganization as any);
      }

      // Redirect to the organization profile page
      navigate("/organization");
    } catch (error: any) {
      console.error("Error creating organization:", error);
      // Error handling is done in the mutation onError callback
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep >= 1
              ? "bg-primary text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-400"
          }`}
        >
          {currentStep > 1 ? <CheckCircle className="w-5 h-5" /> : "1"}
        </div>
        <div
          className={`w-12 h-1 ${currentStep >= 2 ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"}`}
        ></div>
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep >= 2
              ? "bg-primary text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-400"
          }`}
        >
          {currentStep > 2 ? <CheckCircle className="w-5 h-5" /> : "2"}
        </div>
        <div
          className={`w-12 h-1 ${currentStep >= 3 ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"}`}
        ></div>
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep >= 3
              ? "bg-primary text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-400"
          }`}
        >
          3
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label
          htmlFor="official_name"
          className="text-sm font-medium"
        >
          {t('createOrganization.officialName')} <span className="text-red-500">*</span>
        </Label>
        <Input
          id="official_name"
          name="official_name"
          value={formData.official_name}
          onChange={handleInputChange}
          placeholder={t('createOrganization.enterOrganizationName')}
          required
          className="mt-1"
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="display_name"
          className="text-sm font-medium"
        >
          {t('createOrganization.displayName')}
        </Label>
        <Input
          id="display_name"
          name="display_name"
          value={formData.display_name}
          onChange={handleInputChange}
          placeholder={t('createOrganization.displayNamePlaceholder')}
          className="mt-1"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {t('createOrganization.category')} <span className="text-red-500">*</span>
        </Label>
        <SearchableCategory
          value={formData.category_id || undefined}
          onValueChange={(value) =>
            handleSelectChange("category_id", value.toString())
          }
          placeholder={t('createOrganization.searchCategoryPlaceholder')}
          className="mt-1"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {t('createOrganization.location')} <span className="text-red-500">*</span>
        </Label>
        <SearchableLocation
          value={formData.location_id || undefined}
          onValueChange={(value) =>
            handleSelectChange("location_id", value.toString())
          }
          placeholder={t('createOrganization.searchLocationPlaceholder')}
          className="mt-1"
        />
      </div>

      <Button
        onClick={handleNext}
        className="w-full"
      >
        {t('createOrganization.continue')}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label
          htmlFor="about_us"
          className="text-sm font-medium"
        >
          {t('createOrganization.aboutUs')}
        </Label>
        <Textarea
          id="about_us"
          name="about_us"
          value={formData.about_us}
          onChange={handleInputChange}
          placeholder={t('createOrganization.aboutUsPlaceholder')}
          className="min-h-[100px] mt-1"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="website"
            className="text-sm font-medium"
          >
            {t('createOrganization.website')}
          </Label>
          <Input
            id="website"
            name="website"
            value={formData.website}
            onChange={handleInputChange}
            placeholder={t("forms.placeholders.website")}
            className="mt-1"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="text-sm font-medium"
          >
            {t('createOrganization.email')}
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder={t("forms.placeholders.email")}
            className="mt-1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="phone"
          className="text-sm font-medium"
        >
          {t('createOrganization.phoneNumber')}
        </Label>
        <Input
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          placeholder={t("forms.placeholders.phone")}
          className="mt-1"
        />
      </div>

      {/* Logo Upload */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {t('createOrganization.organizationLogo')}
        </Label>
        <label
          htmlFor="logo-upload"
          className={`block border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isUploadingLogo 
              ? 'border-muted-foreground/25 cursor-not-allowed bg-muted/30' 
              : 'border-muted-foreground/25 cursor-pointer hover:border-primary hover:bg-muted/50'
          }`}
        >
          {logoPreview ? (
            <div className="space-y-4">
              <div className="relative inline-block">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-20 h-20 object-cover rounded-lg border"
                />
                {isUploadingLogo && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
                {!isUploadingLogo && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      clearLogo();
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="text-center">
                {isUploadingLogo ? (
                  <p className="text-sm text-muted-foreground">
                    {t('createOrganization.uploadingLogo', 'Uploading logo...')}
                  </p>
                ) : logoUrl ? (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {t('createOrganization.logoUploadedSuccessfully', 'Logo uploaded successfully!')}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t('createOrganization.logoUploadedSuccessfully')}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {t('createOrganization.clickToChangeImage')}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
              <div>
                <span className="text-primary hover:text-primary/80 font-medium">
                  {t('createOrganization.chooseFile')}
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  {t('createOrganization.orDragAndDrop')}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('createOrganization.fileFormatLimit')}
              </p>
            </div>
          )}
          <input
            id="logo-upload"
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            disabled={isUploadingLogo}
            className="hidden"
          />
        </label>
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(1)}
          className="flex-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('createOrganization.back')}
        </Button>

        <Button
          onClick={handleNext}
          className="flex-1"
        >
          {t('createOrganization.continue')}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            {t('createOrganization.projects', 'Projects')}
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addProject}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('createOrganization.addProject', 'Add Project')}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {t('createOrganization.projectsDescription', 'Showcase your organization\'s key projects and achievements.')}
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
          <Target className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            {t('createOrganization.noProjectsYet', 'No projects added yet')}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {t('createOrganization.addFirstProject', 'Add your first project to showcase your work')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project, index) => (
            <Card key={index} className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">
                    {t('createOrganization.project', 'Project')} {index + 1}
                  </h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeProject(index)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">
                      {t('createOrganization.projectTitle', 'Project Title')} *
                    </Label>
                    <Input
                      value={project.title}
                      onChange={(e) => updateProject(index, 'title', e.target.value)}
                      placeholder={t('createOrganization.projectTitlePlaceholder', 'Enter project title')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">
                      {t('createOrganization.projectLink', 'Project Link')}
                    </Label>
                    <Input
                      value={project.link || ""}
                      onChange={(e) => updateProject(index, 'link', e.target.value)}
                      placeholder={t('createOrganization.projectLinkPlaceholder', 'https://example.com')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">
                    {t('createOrganization.projectDescription', 'Description')}
                  </Label>
                  <Textarea
                    value={project.description || ""}
                    onChange={(e) => updateProject(index, 'description', e.target.value)}
                    placeholder={t('createOrganization.projectDescriptionPlaceholder', 'Describe the project and your role')}
                    className="min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">
                      {t('createOrganization.startDate', 'Start Date')}
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !project.date_started && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {project.date_started ? (
                            format(new Date(project.date_started), "PPP")
                          ) : (
                            <span>{t('createOrganization.pickStartDate', 'Pick start date')}</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={project.date_started ? new Date(project.date_started) : undefined}
                          onSelect={(date) => updateProjectDate(index, 'date_started', date)}
                          initialFocus
                          captionLayout="dropdown-buttons"
                          fromYear={1900}
                          toYear={2030}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">
                      {t('createOrganization.endDate', 'End Date')}
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !project.date_finished && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {project.date_finished ? (
                            format(new Date(project.date_finished), "PPP")
                          ) : (
                            <span>{t('createOrganization.pickEndDate', 'Pick end date')}</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={project.date_finished ? new Date(project.date_finished) : undefined}
                          onSelect={(date) => updateProjectDate(index, 'date_finished', date)}
                          initialFocus
                          captionLayout="dropdown-buttons"
                          fromYear={1900}
                          toYear={2030}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="flex gap-4 pt-4">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(2)}
          className="flex-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('createOrganization.back')}
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('createOrganization.creating')}
            </>
          ) : (
            t('createOrganization.createOrganization')
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full min-h-screen bg-background">
      {/* Header - only show back button if user has existing organizations */}
      <div className="bg-card border-b flex-shrink-0">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {organizations.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/")}
                  className="mr-4 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t("ui.backToDashboard")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Step indicator */}
          {renderStepIndicator()}

          {/* Form Card */}
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-card">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">
                    {currentStep === 1 
                      ? t('createOrganization.basicInformation')
                      : currentStep === 2 
                        ? t('createOrganization.additionalDetails')
                        : t('createOrganization.projects', 'Projects')
                    }
                  </CardTitle>
                  <CardDescription>
                    {currentStep === 1
                      ? t('createOrganization.tellUsAbout')
                      : currentStep === 2
                        ? t('createOrganization.additionalDetailsDescription')
                        : t('createOrganization.projectsStepDescription', 'Add your organization\'s projects to showcase your work')
                    }
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6 bg-card">
              {currentStep === 1 ? renderStep1() : currentStep === 2 ? renderStep2() : renderStep3()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
