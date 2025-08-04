import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ArrowLeft, Upload, X, Sparkles, Users, Target, Zap, Loader2, Globe, Mail, Phone, MapPin, Tag } from "lucide-react";
import { apiService } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Category, Location, PaginatedResponse } from "@shared/schema";

export default function CreateOrganization() {
  const [, setLocation] = useLocation();
  const { fetchOrganizations, organizations } = useAuth();
  const { toast } = useToast();
  
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
              <Button onClick={() => setLocation('/')} className="w-full">
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

  // Fetch categories and locations
  const { data: categories } = useQuery({
    queryKey: ['/categories/'],
    queryFn: () => apiService.request<Category[]>('/categories/'),
  });

  const { data: locationsData } = useQuery({
    queryKey: ['/locations/'],
    queryFn: () => apiService.request<PaginatedResponse<Location>>('/locations/'),
  });

  const locations = locationsData?.results || [];

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (2MB limit to prevent server issues)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Logo must be smaller than 2MB",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let logoUrl = null;

      // Upload logo if provided
      if (logoFile) {
        const logoFormData = new FormData();
        logoFormData.append('file', logoFile);

        try {
          const uploadResponse = await apiService.request<{ url: string }>('/upload/', {
            method: 'POST',
            body: logoFormData,
            headers: {}, // Remove Content-Type to let browser set it with boundary
          });
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
        category_id: formData.category_id,
        location_id: formData.location_id,
        ...(logoUrl && { logo: logoUrl })
      };

      await apiService.request('/organizations/', {
        method: 'POST',
        body: JSON.stringify(organizationData),
      });

      toast({
        title: "Organization created",
        description: "Your organization has been created successfully",
      });

      // Refresh organizations and redirect
      await fetchOrganizations();
      setLocation('/');
      
    } catch (error: any) {
      console.error('Error creating organization:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create organization",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-950 dark:via-slate-900 dark:to-gray-900 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-300/10 to-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            
            {/* Left side - Hero content */}
            <div className="space-y-8 text-center lg:text-left">
              <div className="space-y-6">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Start Your Journey
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                  Create Your
                  <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Organization
                  </span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-lg mx-auto lg:mx-0">
                  Build your company profile and start managing job postings, applications, and candidate communications.
                </p>
              </div>

              {/* Feature highlights */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-medium">Manage team members and roles</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span className="font-medium">Post and track job openings</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="font-medium">Streamline hiring process</span>
                </div>
              </div>
            </div>

            {/* Right side - Form */}
            <div className="w-full">
              <Card className="shadow-2xl border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl">
                <CardHeader className="text-center pb-6">
                  <div className="mx-auto mb-4 w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Building2 className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                    Organization Details
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="official_name" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                          Organization Name *
                        </Label>
                        <Input
                          id="official_name"
                          name="official_name"
                          value={formData.official_name}
                          onChange={handleInputChange}
                          placeholder="Enter official organization name"
                          required
                          className="h-12 border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 bg-white dark:bg-gray-700"
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
                          placeholder="Public display name (optional)"
                          className="h-12 border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 bg-white dark:bg-gray-700"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Short Description
                      </Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Brief description of your organization..."
                        rows={3}
                        className="border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 resize-none bg-white dark:bg-gray-700"
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
                        placeholder="Tell us more about your organization, mission, values, and culture..."
                        rows={4}
                        className="border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 resize-none bg-white dark:bg-gray-700"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="website" className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Website
                        </Label>
                        <Input
                          id="website"
                          name="website"
                          type="url"
                          value={formData.website}
                          onChange={handleInputChange}
                          placeholder="https://example.com"
                          className="h-12 border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 bg-white dark:bg-gray-700"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Contact Email
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="contact@example.com"
                          className="h-12 border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 bg-white dark:bg-gray-700"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+993 XX XXX XXX"
                        className="h-12 border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 bg-white dark:bg-gray-700"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                          <Tag className="w-4 h-4" />
                          Category *
                        </Label>
                        <Select 
                          value={formData.category_id.toString()} 
                          onValueChange={(value) => handleSelectChange('category_id', value)}
                        >
                          <SelectTrigger className="h-12 border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 bg-white dark:bg-gray-700">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories?.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Location *
                        </Label>
                        <Select 
                          value={formData.location_id.toString()} 
                          onValueChange={(value) => handleSelectChange('location_id', value)}
                        >
                          <SelectTrigger className="h-12 border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 bg-white dark:bg-gray-700">
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            {locations?.map((location) => (
                              <SelectItem key={location.id} value={location.id.toString()}>
                                {location.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Organization Logo</Label>
                      <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                        {logoPreview ? (
                          <div className="space-y-4">
                            <div className="relative inline-block">
                              <img
                                src={logoPreview}
                                alt="Logo preview"
                                className="w-20 h-20 object-cover rounded-xl shadow-lg ring-4 ring-white dark:ring-gray-600"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={clearLogo}
                                className="absolute -top-2 -right-2 h-7 w-7 rounded-full p-0 shadow-lg"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Click to change logo</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl flex items-center justify-center">
                              <Upload className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Upload your logo</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PNG, JPG up to 2MB</p>
                            </div>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setLocation('/')}
                        className="flex-1 h-12 border-2 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={isLoading || !formData.official_name.trim() || !formData.category_id || !formData.location_id}
                        className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <div className="flex items-center">
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Creating...
                          </div>
                        ) : (
                          <>
                            <Building2 className="mr-2 h-4 w-4" />
                            Create Organization
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}