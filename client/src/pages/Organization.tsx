import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import TopBar from "@/components/layout/TopBar";
import EditOrganizationModal from "@/components/modals/EditOrganizationModal";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizationById } from "@/hooks/useOrganizations";
import {
  Building2,
  MapPin,
  Globe,
  Mail,
  Phone,
  FolderOpen,
  Edit3,
} from "lucide-react";
import type { Organization } from "@/types";

// Loading Skeleton
function OrganizationProfileSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar
        title={t("organizationProfile.title")}
        description={t("organizationProfile.description")}
        showCreateButton={true}
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
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
      </main>
    </div>
  );
}

export default function Organization() {
  const { t } = useTranslation();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { selectedOrganization } = useAuth();

  // Fetch organization details by ID
  const {
    data: organizationDetails,
    isLoading: isLoadingDetails,
    error: detailsError,
  } = useOrganizationById(selectedOrganization?.id);

  // Use detailed organization data or fallback to selectedOrganization
  const currentOrganization = organizationDetails || selectedOrganization;

  // Get organization initials for avatar fallback
  const getOrgInitials = (name?: string) => {
    if (!name) return "ORG";
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoadingDetails) {
    return <OrganizationProfileSkeleton />;
  }

  if (detailsError || !currentOrganization) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          title={t("organizationProfile.title")}
          description={t("organizationProfile.description")}
          showCreateButton={true}
        />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground dark:text-foreground mb-2">
                  {t("organizationProfile.notFound")}
                </h1>
                <p className="text-muted-foreground dark:text-muted-foreground/60 mb-4">
                  {t("organizationProfile.createOrSelectMessage")}
                </p>
                <Link to="/create-organization">
                  <Button>
                    <Building2 className="h-4 w-4 mr-2" />
                    {t("organizationProfile.createOrganization")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar
        title={t("organizationProfile.title")}
        description={t("organizationProfile.description")}
        showCreateButton={true}
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-background rounded-lg shadow-sm border dark:border-gray-700 p-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={currentOrganization?.logo}
                  alt={
                    currentOrganization?.display_name ||
                    currentOrganization?.official_name
                  }
                />
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                  {getOrgInitials(
                    currentOrganization?.display_name ||
                      currentOrganization?.official_name,
                  )}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground dark:text-foreground">
                      {currentOrganization?.display_name ||
                        currentOrganization?.official_name}
                    </h1>
                    {currentOrganization?.official_name &&
                      currentOrganization?.display_name &&
                      currentOrganization?.official_name !==
                        currentOrganization?.display_name && (
                        <p className="text-lg text-muted-foreground dark:text-muted-foreground/60 mb-2">
                          {currentOrganization.official_name}
                        </p>
                      )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setIsEditModalOpen(true)}>
                      <Edit3 className="h-3 w-3 mr-1.5" />
                      {t("organizationProfile.editProfile")}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground dark:text-muted-foreground/60">
                  {currentOrganization?.category && (
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      <span>
                        {typeof currentOrganization.category === "object"
                          ? currentOrganization.category.name
                          : currentOrganization.category}
                      </span>
                    </div>
                  )}

                  {(currentOrganization?.address ||
                    currentOrganization?.location) && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {currentOrganization.address ||
                          (typeof currentOrganization.location === "object"
                            ? currentOrganization.location.name
                            : currentOrganization.location)}
                      </span>
                    </div>
                  )}

                  {currentOrganization?.website && (
                    <div className="flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      <a
                        href={
                          currentOrganization.website.startsWith("http")
                            ? currentOrganization.website
                            : `https://${currentOrganization.website}`
                        }
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
                      <a
                        href={`mailto:${currentOrganization.email}`}
                        className="text-primary hover:text-primary/80"
                      >
                        {currentOrganization.email}
                      </a>
                    </div>
                  )}

                  {currentOrganization?.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      <a
                        href={`tel:${currentOrganization.phone}`}
                        className="text-primary hover:text-primary/80"
                      >
                        {currentOrganization.phone}
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
              {t("organizationProfile.aboutUs")}
            </h2>

            {currentOrganization?.description ||
            currentOrganization?.about_us ? (
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-foreground dark:text-muted-foreground/60 leading-relaxed">
                  {currentOrganization?.description ||
                    currentOrganization?.about_us}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground dark:text-muted-foreground/60 italic">
                  {t("organizationProfile.noDescriptionAvailable")}
                </p>
              </div>
            )}
          </div>

          {/* Projects Section */}
          {currentOrganization?.projects &&
            currentOrganization.projects.length > 0 && (
              <div className="bg-white dark:bg-background rounded-lg shadow-sm border dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold text-foreground dark:text-foreground mb-4 flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  {t("organizationProfile.projects")}
                </h2>

                <div className="grid gap-4">
                  {currentOrganization.projects.map((project) => (
                    <div
                      key={project.id}
                      className="border rounded-lg p-4 dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-foreground dark:text-foreground">
                          {project.title}
                        </h4>
                        {project.link && (
                          <a
                            href={
                              project.link.startsWith("http")
                                ? project.link
                                : `https://${project.link}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80"
                          >
                            <Globe className="h-4 w-4" />
                          </a>
                        )}
                      </div>

                      {project.description && (
                        <p className="text-sm text-muted-foreground dark:text-muted-foreground/60 mb-2">
                          {project.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {project.date_started && (
                          <span>
                            {project.date_started}
                            {project.date_finished &&
                              ` - ${project.date_finished}`}
                            {!project.date_finished && " - Present"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Edit Organization Modal */}
          {currentOrganization && (
            <EditOrganizationModal
              open={isEditModalOpen}
              onOpenChange={setIsEditModalOpen}
              organization={currentOrganization}
            />
          )}
        </div>
      </main>
    </div>
  );
}
