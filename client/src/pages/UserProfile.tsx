import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
  ArrowLeft,
  GraduationCap,
  FileText,
  Link,
  Building2,
  Download
} from "lucide-react";
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
  is_active?: boolean;
  profession?: string;
  // Detailed information
  experience?: UserExperience[];
  education?: UserEducation[];
  projects?: UserProject[];
  resumes?: UserResume[];
  skills?: (string | { id: number; name: string })[];
  languages?: (string | { id: number; name: string })[];
  // Legacy fields for backward compatibility
  experience_text?: string;
  created_at?: string;
}

export default function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();

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
        <TopBar title="User Profile" description="User not found" />
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
        <TopBar title="User Profile" description="Loading user information..." />
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
        <TopBar title="User Profile" description="Error loading user" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="text-center">
            <p className="text-red-500">Error loading user profile</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar 
        title="User Profile" 
        description={`${user.first_name} ${user.last_name}`}
      />
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* User Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start space-x-4">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={`${user.first_name} ${user.last_name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="text-primary w-12 h-12" />
                  )}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl">
                    {user.first_name} {user.last_name}
                  </CardTitle>
                  {user.profession && (
                    <p className="text-lg text-primary font-medium mt-1">{user.profession}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground flex-wrap gap-2">
                    {user.email && (
                      <div className="flex items-center space-x-1">
                        <Mail className="w-4 h-4" />
                        <span>{user.email}</span>
                      </div>
                    )}
                    {user.phone && (
                      <div className="flex items-center space-x-1">
                        <Phone className="w-4 h-4" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                    {user.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{typeof user.location === 'string' ? user.location : user.location.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {new Date(user.date_joined || user.created_at || '').toLocaleDateString()}</span>
                    </div>
                    {user.is_active !== undefined && (
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            {user.bio && (
              <CardContent>
                <Separator className="mb-4" />
                <h3 className="font-medium text-foreground mb-2">About</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{user.bio}</p>
              </CardContent>
            )}
          </Card>

          {/* Experience Section */}
          {user.experience && user.experience.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Briefcase className="w-5 h-5" />
                  <span>Work Experience</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user.experience.map((exp, index) => (
                  <div key={exp.id || index} className="border-l-2 border-primary/20 pl-4 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{exp.position}</h4>
                        <p className="text-primary font-medium">{exp.company}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(exp.start_date).toLocaleDateString()} - {
                            exp.is_current ? 'Present' : 
                            exp.end_date ? new Date(exp.end_date).toLocaleDateString() : 'Present'
                          }
                        </p>
                        {exp.description && (
                          <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Legacy Experience Text */}
          {user.experience_text && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Briefcase className="w-5 h-5" />
                  <span>Experience</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{user.experience_text}</p>
              </CardContent>
            </Card>
          )}

          {/* Education Section */}
          {user.education && user.education.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <GraduationCap className="w-5 h-5" />
                  <span>Education</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user.education.map((edu, index) => (
                  <div key={edu.id || index} className="border-l-2 border-primary/20 pl-4 pb-4">
                    <h4 className="font-semibold text-foreground">{edu.degree}</h4>
                    <p className="text-primary font-medium">{edu.institution}</p>
                    {edu.field_of_study && (
                      <p className="text-sm text-muted-foreground">{edu.field_of_study}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(edu.start_date).toLocaleDateString()} - {
                        edu.is_current ? 'Present' : 
                        edu.end_date ? new Date(edu.end_date).toLocaleDateString() : 'Present'
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
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5" />
                  <span>Projects</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user.projects.map((project, index) => (
                  <div key={project.id || index} className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{project.title}</h4>
                        {project.description && (
                          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{project.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(project.start_date).toLocaleDateString()} - {
                            project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Ongoing'
                          }
                        </p>
                      </div>
                      {project.url && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={project.url} target="_blank" rel="noopener noreferrer">
                            <Link className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Skills and Languages */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {user.skills && user.skills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {typeof skill === 'string' ? skill : skill.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {user.languages && user.languages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Languages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {user.languages.map((language, index) => (
                      <Badge key={index} variant="outline">
                        {typeof language === 'string' ? language : language.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Resumes Section */}
          {user.resumes && user.resumes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Resume / CV</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {user.resumes.map((resume, index) => (
                  <div key={resume.id || index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">{resume.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          Uploaded {new Date(resume.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={resume.file_url} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}