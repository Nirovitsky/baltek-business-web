import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Upload, X, Sparkles, Users, Target, Zap, Loader2, Globe, Mail, Phone, MapPin, Tag, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import { apiService } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useReferenceData } from "@/hooks/useReferencedData";
import { useToast } from "@/hooks/use-toast";
import type { Category, Location, PaginatedResponse } from "@/types";

export default function CreateOrganization() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { organizations, createOrganization, uploadFile } = useOrganizations();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    official_name: "",
    display_name: "",
    description: "",
    about_us: "",
    website: "",
    email: "",
    phone: "",
    category_id: 0,
    location_id: 0,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const MAX_ORGANIZATIONS = 10;



  // Use shared reference data to avoid duplication
  const { categories, locations, isLoading: isLoadingRefData } = useReferenceData();

  // Check if user has reached maximum organizations
  if (organizations.length >= MAX_ORGANIZATIONS) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-950 dark:via-slate-900 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                <Building2 className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Maximum Organizations Reached</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  You can only create up to {MAX_ORGANIZATIONS} organizations. Please delete an existing organization to create a new one.
                </p>
              </div>
              <Button onClick={() => navigate('/')} className="w-full">
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: parseInt(value)
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Logo must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
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
        title: "Organization name required",
        description: "Please enter your organization name",
        variant: "destructive",
      });
      return;
    }

    if (formData.category_id === 0) {
      toast({
        title: "Category required",
        description: "Please select a category",
        variant: "destructive",
      });
      return;
    }

    if (formData.location_id === 0) {
      toast({
        title: "Location required",
        description: "Please select a location",
        variant: "destructive",
      });
      return;
    }

    setCurrentStep(2);
  };

  const handleSkip = () => {
    handleSubmit();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);

    try {
      let logoUrl = null;

      // Upload logo if provided
      if (logoFile) {
        const logoFormData = new FormData();
        logoFormData.append('file', logoFile);

        try {
          const uploadResponse = await uploadFile.mutateAsync(logoFormData);
          logoUrl = uploadResponse.url;
        } catch (error) {
          console.error('Logo upload failed:', error);
          // Continue without logo if upload fails
        }
      }

      // Create organization with proper field mapping
      const organizationData = {
        official_name: formData.official_name,
        display_name: formData.display_name || formData.official_name,
        description: formData.description,
        about_us: formData.about_us,
        website: formData.website || "",
        email: formData.email || "",
        phone: formData.phone || "",
        category: formData.category_id,
        location: formData.location_id,
        ...(logoUrl && { logo: logoUrl })
      };

      await createOrganization.mutateAsync(organizationData);
      
      toast({
        title: "Organization created",
        description: "Your organization has been created successfully",
      });
      navigate('/');
      
    } catch (error: any) {
      console.error('Error creating organization:', error);
      // Error handling is done in the mutation onError callback
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
          currentStep >= 1 ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
        }`}>
          {currentStep > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
        </div>
        <div className={`w-12 h-1 ${currentStep >= 2 ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
          currentStep >= 2 ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
        }`}>
          2
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Basic Information</h2>
        <p className="text-gray-600 dark:text-gray-300">Tell us about your organization</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="official_name" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Organization Name *
          </Label>
          <Input
            id="official_name"
            name="official_name"
            value={formData.official_name}
            onChange={handleInputChange}
            placeholder="Enter your organization name"
            required
            className="h-12 border-2 border-gray-200 dark:border-gray-600 focus:border-primary dark:focus:border-primary transition-all duration-200"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="display_name" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Display Name
          </Label>
          <Input
            id="display_name"
            name="display_name"
            value={formData.display_name}
            onChange={handleInputChange}
            placeholder="How should we display your organization? (optional)"
            className="h-12 border-2 border-gray-200 dark:border-gray-600 focus:border-primary dark:focus:border-primary transition-all duration-200"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center">
            <Tag className="w-4 h-4 mr-2" />
            Category *
          </Label>
          <Select onValueChange={(value) => handleSelectChange('category_id', value)} required>
            <SelectTrigger className="h-12 border-2 border-gray-200 dark:border-gray-600 focus:border-primary dark:focus:border-primary">
              <SelectValue placeholder="Select your industry category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center">
            <MapPin className="w-4 h-4 mr-2" />
            Location *
          </Label>
          <Select onValueChange={(value) => handleSelectChange('location_id', value)} required>
            <SelectTrigger className="h-12 border-2 border-gray-200 dark:border-gray-600 focus:border-primary dark:focus:border-primary">
              <SelectValue placeholder="Select your location" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id.toString()}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleNext}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Additional Details</h2>
        <p className="text-gray-600 dark:text-gray-300">Add more information about your organization (optional)</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Short Description
          </Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Brief description of your organization"
            className="min-h-[80px] border-2 border-gray-200 dark:border-gray-600 focus:border-primary dark:focus:border-primary transition-all duration-200"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="about_us" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            About Us
          </Label>
          <Textarea
            id="about_us"
            name="about_us"
            value={formData.about_us}
            onChange={handleInputChange}
            placeholder="Tell us more about your organization, mission, and values"
            className="min-h-[100px] border-2 border-gray-200 dark:border-gray-600 focus:border-primary dark:focus:border-primary transition-all duration-200"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="website" className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center">
              <Globe className="w-4 h-4 mr-2" />
              Website
            </Label>
            <Input
              id="website"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="https://example.com"
              className="h-12 border-2 border-gray-200 dark:border-gray-600 focus:border-primary dark:focus:border-primary transition-all duration-200"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center">
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="contact@example.com"
              className="h-12 border-2 border-gray-200 dark:border-gray-600 focus:border-primary dark:focus:border-primary transition-all duration-200"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center">
            <Phone className="w-4 h-4 mr-2" />
            Phone Number
          </Label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="+993 12 345678"
            className="h-12 border-2 border-gray-200 dark:border-gray-600 focus:border-primary dark:focus:border-primary transition-all duration-200"
          />
        </div>

        {/* Logo Upload */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Organization Logo
          </Label>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            {logoPreview ? (
              <div className="space-y-4">
                <div className="relative inline-block">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={clearLogo}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Logo uploaded successfully
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                <div>
                  <label htmlFor="logo-upload" className="cursor-pointer">
                    <span className="text-primary hover:text-primary/80 font-medium">
                      Choose a file
                    </span>
                    <span className="text-gray-500 dark:text-gray-400"> or drag and drop</span>
                  </label>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PNG, JPG up to 5MB
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Button 
            variant="outline"
            onClick={() => setCurrentStep(1)}
            className="flex-1 h-12 border-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleSkip}
            disabled={isLoading}
            className="flex-1 h-12 border-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Skip & Create'
            )}
          </Button>
          
          <Button 
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 h-12 bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Organization'
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-950 dark:via-slate-900 dark:to-gray-900 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-300/10 to-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          
          {/* Hero content */}
          <div className="text-center space-y-6 mb-8">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium">
              <Sparkles className="w-4 h-4 mr-2" />
              Welcome to Baltek Business
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
              Create Your
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Organization
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto">
              Set up your company profile and start managing job postings, applications, and candidate communications.
            </p>
          </div>

          {/* Step indicator */}
          {renderStepIndicator()}

          {/* Form Card */}
          <Card className="shadow-2xl border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Building2 className="h-7 w-7 text-white" />
              </div>
            </CardHeader>

            <CardContent>
              {currentStep === 1 ? renderStep1() : renderStep2()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}