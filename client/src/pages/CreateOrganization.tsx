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
} from "lucide-react";
import { apiService } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useReferenceData } from "@/hooks/useReferencedData";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import type { Category, Location, PaginatedResponse } from "@/types";

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
    };
  };

  const [formData, setFormData] = useState(loadDraftOrDefaults);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

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
                  Back to Dashboard
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
        localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
        setIsDraftSaved(true);
        setTimeout(() => setIsDraftSaved(false), 2000);
      } catch (error) {
        console.warn("Failed to save organization draft:", error);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [formData]);

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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleNext = () => {
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
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);

    try {
      let logoUrl = null;

      // Upload logo if provided
      if (logoFile) {
        try {
          const uploadResponse = await uploadFile.mutateAsync(logoFile);
          logoUrl = uploadResponse.url;
        } catch (error) {
          console.error("Logo upload failed:", error);
          // Continue without logo if upload fails
        }
      }

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
          2
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
            placeholder="https://example.com"
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
            placeholder="contact@example.com"
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
          placeholder="+993 12 345678"
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
          className="block border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors"
        >
          {logoPreview ? (
            <div className="space-y-4">
              <div className="relative inline-block">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-20 h-20 object-cover rounded-lg border"
                />
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
              </div>
              <p className="text-sm text-muted-foreground">
                {t('createOrganization.logoUploadedSuccessfully')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('createOrganization.clickToChangeImage')}
              </p>
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
                  Back to Dashboard
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
                      : t('createOrganization.additionalDetails')
                    }
                  </CardTitle>
                  <CardDescription>
                    {currentStep === 1
                      ? t('createOrganization.tellUsAbout')
                      : t('createOrganization.additionalDetailsDescription')
                    }
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6 bg-card">
              {currentStep === 1 ? renderStep1() : renderStep2()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
