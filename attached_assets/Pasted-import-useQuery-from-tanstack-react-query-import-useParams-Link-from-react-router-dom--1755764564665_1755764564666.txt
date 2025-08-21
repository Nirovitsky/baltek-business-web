import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import type { Organization } from "@shared/schema";
import { ApiClient } from "@/lib/api";
import BreadcrumbNavigation from "@/components/breadcrumb-navigation";

// Mock categories for companies since API doesn't provide category data
const MOCK_CATEGORIES = {
  1: "IT & Technology",
  21: "Healthcare",
  22: "Marketing & Advertising", 
  23: "Finance & Banking",
  24: "Education",
  25: "Manufacturing",
  26: "Retail & E-commerce",
  27: "Construction",
  28: "Transportation",
  29: "Food & Beverage",
  30: "Media & Entertainment",
  31: "Real Estate",
  32: "Consulting",
  33: "Energy & Utilities",
  34: "Telecommunications",
  35: "Automotive",
  36: "Pharmaceutical",
  37: "Legal Services",
  38: "Tourism & Hospitality",
  39: "Agriculture",
  40: "Fashion & Apparel"
} as const;

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  Building2, 
  MapPin, 
  Globe, 
  Mail, 
  Phone, 
  Clock,
  FolderOpen,
  ExternalLink,
  Calendar,
  Briefcase
} from "lucide-react";

// Company Suggestions Component
function CompanySuggestions({ currentCompanyId }: { currentCompanyId: string | undefined }) {
  const { data: companiesData, isLoading } = useQuery({
    queryKey: ["organizations", "suggestions"],
    queryFn: () => ApiClient.getOrganizations({ limit: 15 }),
  });

  // Handle both array and paginated response formats
  const allCompanies = Array.isArray(companiesData) ? companiesData : ((companiesData as any)?.results || []);
  
  // Add mock categories to companies
  const companiesWithCategories = allCompanies.map((company: Organization) => ({
    ...company,
    mockCategory: MOCK_CATEGORIES[company.id as keyof typeof MOCK_CATEGORIES] || "Business Services"
  }));
  
  const suggestions = companiesWithCategories.filter((org: Organization) => 
    org.id.toString() !== currentCompanyId
  ).slice(0, 10) || [];

  return (
    <div className="bg-white dark:bg-background rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden w-full">
      <div className="px-6 py-4 bg-gradient-to-r from-primary/5 to-blue-50 dark:from-primary/10 dark:to-blue-900/20 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-foreground dark:text-foreground flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Other Companies
        </h3>
      </div>
      
      {isLoading ? (
        <div>
          {Array.from({ length: 10 }).map((_, i) => (
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
          {suggestions.map((company: Organization, index: number) => (
            <div key={company.id}>
              <Link to={`/company/${company.id}`}>
                <div className="flex items-center gap-4 p-4 hover:bg-muted dark:hover:bg-gray-700/50 transition-all duration-200 cursor-pointer group">
                  <Avatar className="h-12 w-12 ring-2 ring-gray-100 dark:ring-gray-600 group-hover:ring-primary/30 transition-all duration-200">
                    <AvatarImage src={company.logo} alt={company.display_name || company.official_name} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/20 text-primary text-sm font-bold border border-primary/20">
                      {(company.display_name || company.official_name || 'CO')
                        .split(' ')
                        .map(word => word.charAt(0))
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground dark:text-foreground truncate group-hover:text-primary transition-colors text-sm">
                      {company.display_name || company.official_name}
                    </h4>
                    
                    <div className="flex items-center gap-1 mt-1">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground dark:text-muted-foreground/60 font-medium">
                        {(company as any).mockCategory}
                      </span>
                    </div>
                    
                    {company.location?.name && (
                      <div className="flex items-center gap-1 mt-2">
                        <MapPin className="h-3 w-3 text-muted-foreground/60" />
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground/60 truncate">
                          {company.location.name}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary" />
                  </div>
                </div>
              </Link>
              <hr className="border-gray-200 dark:border-gray-700" />
            </div>
          ))}
          
          {suggestions.length === 0 && (
            <div className="p-8 text-center">
              <div className="bg-muted dark:bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <Building2 className="h-8 w-8 text-muted-foreground/60" />
              </div>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground/60 font-medium mb-1">
                No other companies available
              </p>
              <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                Check back later for more companies
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Loading Skeleton
function CompanyProfileSkeleton() {
  return (
    <div className="min-h-screen bg-muted dark:bg-gray-900">
      <BreadcrumbNavigation />
      <div className="layout-container-body py-4">
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

export default function CompanyProfile() {
  const { id: companyId } = useParams();

  const { data: company, isLoading: companyLoading, error: companyError } = useQuery({
    queryKey: ["organization", companyId],
    queryFn: () => ApiClient.getOrganization(parseInt(companyId!)),
    enabled: !!companyId,
  });

  if (companyLoading) {
    return <CompanyProfileSkeleton />;
  }

  if (companyError || !company) {
    return (
      <div className="min-h-screen bg-muted dark:bg-gray-900">
        <BreadcrumbNavigation />
        <div className="flex items-center justify-center">
          <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground dark:text-foreground mb-2">
            Company Not Found
          </h1>
          <p className="text-muted-foreground dark:text-muted-foreground/60 mb-4">
            The company you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/jobs">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Button>
          </Link>
          </div>
        </div>
      </div>
    );
  }

  const organizationData = company as Organization;

  // Get company initials for avatar fallback
  const getCompanyInitials = (name?: string) => {
    if (!name) return 'CO';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="h-full overflow-y-auto bg-muted dark:bg-gray-900">
      <BreadcrumbNavigation />
      <div className="layout-container-body py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Company Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white dark:bg-background rounded-lg shadow-sm border dark:border-gray-700 p-6">
              <div className="flex items-start gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={organizationData?.logo} alt={organizationData?.display_name || organizationData?.official_name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                    {getCompanyInitials(organizationData?.display_name || organizationData?.official_name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h1 className="text-3xl font-bold text-foreground dark:text-foreground">
                      {organizationData?.display_name || organizationData?.official_name}
                    </h1>
                    <Link to={`/jobs?organization=${companyId}`}>
                      <Button size="sm" className="ml-4">
                        <Briefcase className="h-3 w-3 mr-1.5" />
                        Open Positions
                      </Button>
                    </Link>
                  </div>
                  
                  {organizationData?.official_name && organizationData?.display_name && 
                   organizationData?.official_name !== organizationData?.display_name && (
                    <p className="text-lg text-muted-foreground dark:text-muted-foreground/60 mb-2">
                      {organizationData.official_name}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground dark:text-muted-foreground/60">
                    {(organizationData?.industry || organizationData?.category?.name) && (
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        <span>{organizationData.industry || organizationData.category?.name}</span>
                      </div>
                    )}
                    
                    {(organizationData?.address || organizationData?.location?.name) && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {organizationData.address || organizationData.location?.name}
                          {organizationData.postal_code && `, ${organizationData.postal_code}`}
                        </span>
                      </div>
                    )}
                    
                    {organizationData?.website && (
                      <div className="flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        <a 
                          href={organizationData.website.startsWith('http') ? organizationData.website : `https://${organizationData.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80"
                        >
                          {organizationData.website}
                        </a>
                      </div>
                    )}
                    
                    {organizationData?.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        <a href={`mailto:${organizationData.email}`} className="text-primary hover:text-primary/80">
                          {organizationData.email}
                        </a>
                      </div>
                    )}
                    
                    {organizationData?.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        <a href={`tel:${organizationData.phone}`} className="text-primary hover:text-primary/80">
                          {organizationData.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* About Us Section */}
            <div className="bg-white dark:bg-background rounded-lg shadow-sm border dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-foreground dark:text-foreground mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                About Us
              </h2>
              
              {(organizationData?.description || organizationData?.about_us) ? (
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-foreground dark:text-muted-foreground/60 leading-relaxed">
                    {organizationData?.description || organizationData?.about_us}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground dark:text-muted-foreground/60 italic">
                    No company description available. Stay tuned for updates!
                  </p>
                </div>
              )}
            </div>

            {/* Projects Section */}
            <div className="bg-white dark:bg-background rounded-lg shadow-sm border dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-foreground dark:text-foreground mb-4 flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Projects
              </h2>
              
              {organizationData?.projects && organizationData.projects.length > 0 ? (
                <div className="grid gap-4">
                  {organizationData.projects.map((project: any) => (
                    <div key={project.id} className="border rounded-lg p-4 dark:border-gray-700">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-foreground dark:text-foreground">{project.title}</h4>
                        {project.link && (
                          <a
                            href={project.link.startsWith('http') ? project.link : `https://${project.link}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                      
                      {project.description && (
                        <p className="text-sm text-muted-foreground dark:text-muted-foreground/60 mb-2">
                          {project.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {project.date_started}
                          {project.date_finished && ` - ${project.date_finished}`}
                          {!project.date_finished && ' - Present'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground dark:text-muted-foreground/60 italic">
                    No projects available yet. Check back soon!
                  </p>
                </div>
              )}
            </div>


          </div>

          {/* Right Column - Suggested Companies */}
          <div className="lg:col-span-1 lg:min-w-[400px]">
            <CompanySuggestions currentCompanyId={companyId} />
          </div>
        </div>
      </div>
    </div>
  );
}