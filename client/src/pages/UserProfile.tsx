import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  User, 
  MapPin, 
  Mail, 
  Phone, 
  Calendar, 
  Briefcase,
  GraduationCap,
  FileText,
  ExternalLink,
  Code2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiService } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/layout/TopBar";
import type { UserExperience, UserEducation, UserProject, UserResume } from "@/types";

interface UserProfile {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  location?: string | { id: number; name: string };
  bio?: string;
  avatar?: string;
  date_joined?: string;
  date_of_birth?: string;
  gender?: string;
  is_active?: boolean;
  profession?: string;
  // Detailed information arrays
  experiences?: any[];
  educations?: any[];
  projects?: any[];
  resumes?: any[];
  skills?: (string | { id: number; name: string })[];
  languages?: (string | { id: number; name: string })[];
  // Legacy fields for backward compatibility
  experience?: UserExperience[];
  education?: UserEducation[];
  experience_text?: string;
  created_at?: string;
}

export default function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Debug logging
  console.log('UserProfile component loaded, userId:', userId);

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['users/', userId],
    queryFn: () => {
      console.log('Making API request to users/' + userId + '/');
      return apiService.request<UserProfile>(`users/${userId}/`);
    },
    enabled: !!userId,
  });

  console.log('Query state:', { user, isLoading, error, userId });

  if (!userId) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title={t('userProfile.title')} description={t('userProfile.userNotFound')} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="text-center">
            <p className="text-muted-foreground">User not found</p>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title={t('userProfile.title')} description={t('userProfile.loadingUserInfo')} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start space-x-4">
                  <Skeleton className="w-20 h-20 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="User Profile" description={t("errors.errorLoadingUser")} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="text-center">
            <p className="text-red-500">{t("errors.errorLoadingUserProfile")}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar 
        title={t('userProfile.title')} 
        description={`${user.first_name} ${user.last_name}`}
      />
      
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="layout-container-body py-4">
          {/* Single Column Layout */}
          <div className="max-w-4xl mx-auto space-y-6">
          {/* Personal Information Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Profile Header with Avatar */}
                <div className="flex items-center space-x-4 pb-4 border-b">
                  <Avatar className="w-16 h-16">
                    {user.avatar ? (
                      <AvatarImage
                        src={user.avatar}
                        alt={`${user.first_name} ${user.last_name}`}
                      />
                    ) : (
                      <AvatarFallback className="text-lg bg-gradient-to-br from-blue-400 to-indigo-500 text-white">
                        {(user.first_name?.[0] || "") +
                          (user.last_name?.[0] || "")}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <h1 className="text-xl font-bold text-foreground">
                      {user.first_name} {user.last_name}
                    </h1>
                    {user.profession && (
                      <p className="text-muted-foreground">
                        {user.profession}
                      </p>
                    )}
                    {user.bio && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {user.bio}
                      </p>
                    )}
                  </div>
                </div>

                {/* Personal Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">
                      Email
                    </label>
                    <p className="text-foreground flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-muted-foreground/60" />
                      {user.email || "Not provided"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">
                      Phone
                    </label>
                    <p className="text-foreground flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-muted-foreground/60" />
                      {user.phone || "Not provided"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">
                      Location
                    </label>
                    <p className="text-foreground flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-muted-foreground/60" />
                      {typeof user.location === "string"
                        ? user.location
                        : user.location?.name || "Not provided"}
                    </p>
                  </div>

                  {user.date_of_birth && (
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">
                        Date of Birth
                      </label>
                      <p className="text-foreground">
                        {format(new Date(user.date_of_birth), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">
                      Gender
                    </label>
                    <p className="text-foreground">
                      {user.gender
                        ? user.gender.charAt(0).toUpperCase() +
                          user.gender.slice(1)
                        : "Not provided"}
                    </p>
                  </div>

                </div>

                {/* Skills Section */}
                {user.skills && user.skills.length > 0 && (
                  <div className="pt-4 border-t">
                    <label className="text-sm font-medium text-foreground mb-3 block">
                      Skills
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {user.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {typeof skill === 'string' ? skill : skill.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Experience Section */}
          {user.experiences && user.experiences.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {user.experiences.map((experience, index) => (
                    <div key={experience.id || index} className="border-l-2 border-blue-200 pl-4">
                      <h4 className="font-semibold text-foreground">
                        {experience.position}
                      </h4>
                      <p className="text-primary font-medium">
                        {experience.organization_name}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {experience.date_started} - {experience.date_finished || t('common.present')}
                      </p>
                      {experience.description && (
                        <p className="text-foreground mt-2">
                          {experience.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Legacy Experience handling */}
          {user.experience && user.experience.length > 0 && !user.experiences && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Briefcase className="w-5 h-5" />
                  <span>Work Experience</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user.experience.map((exp, index) => (
                  <div key={exp.id || index} className="border-l-2 border-blue-200 pl-4">
                    <h4 className="font-semibold text-foreground">{exp.position}</h4>
                    <p className="text-primary font-medium">{exp.company}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(new Date(exp.start_date), 'MMM yyyy')} - {
                        exp.is_current ? 'Present' : 
                        exp.end_date ? format(new Date(exp.end_date), 'MMM yyyy') : 'Present'
                      }
                    </p>
                    {exp.description && (
                      <p className="text-foreground mt-2">{exp.description}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Education Section */}
          {user.educations && user.educations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Education</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {user.educations.map((education, index) => (
                    <div key={education.id || index} className="border-l-2 border-green-200 pl-4">
                      <h4 className="font-semibold text-foreground capitalize">
                        {education.level}
                      </h4>
                      <p className="text-green-600 font-medium">
                        {education.university_name}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {education.date_started} - {education.date_finished || t('common.present')}
                      </p>
                      {education.description && (
                        <p className="text-foreground mt-2">
                          {education.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Legacy Education handling */}
          {user.education && user.education.length > 0 && !user.educations && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <GraduationCap className="w-5 h-5" />
                  <span>Education</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user.education.map((edu, index) => (
                  <div key={edu.id || index} className="border-l-2 border-green-200 pl-4">
                    <h4 className="font-semibold text-foreground">{edu.degree}</h4>
                    <p className="text-green-600 font-medium">{edu.institution}</p>
                    {edu.field_of_study && (
                      <p className="text-sm text-muted-foreground">{edu.field_of_study}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(new Date(edu.start_date), 'MMM yyyy')} - {
                        edu.is_current ? 'Present' : 
                        edu.end_date ? format(new Date(edu.end_date), 'MMM yyyy') : 'Present'
                      }
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Projects Section */}
          {user.projects && user.projects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {user.projects.map((project, index) => (
                    <div key={project.id || index} className="border-l-2 border-purple-200 pl-4">
                      <h4 className="font-semibold text-foreground">
                        {project.title}
                      </h4>
                      {project.url && (
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-800 text-sm flex items-center mt-1"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View Project
                        </a>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        {project.date_started} - {project.date_finished || "Ongoing"}
                      </p>
                      <p className="text-foreground mt-2">
                        {project.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resumes Section */}
          {user.resumes && user.resumes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Resumes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {user.resumes.map((resume, index) => (
                    <div key={resume.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-8 h-8 text-primary" />
                        <div>
                          <h4 className="font-medium">{resume.title || resume.filename}</h4>
                          <p className="text-sm text-muted-foreground">
                            Uploaded: {format(new Date(resume.created_at || resume.uploaded_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {(resume.file || resume.file_url) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(resume.file || resume.file_url, "_blank")}
                          >
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          </div>
        </div>
      </main>
    </div>
  );
}