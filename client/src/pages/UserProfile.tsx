import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, MapPin, Calendar, Briefcase, GraduationCap, ExternalLink, Phone, Mail, Globe } from 'lucide-react';
import { User } from '@/types';

export default function UserProfile() {
  const { userId } = useParams();

  const { data: user, isLoading, error } = useQuery({
    queryKey: [`/api/users/${userId}/`],
    enabled: !!userId,
  }) as { data: any; isLoading: boolean; error: any };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background">
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="bg-white dark:bg-card rounded-lg p-6 shadow-sm">
              <div className="flex items-start gap-6">
                <div className="w-32 h-32 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background">
        <div className="max-w-4xl mx-auto p-6">
          <Link to="/messages">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Messages
            </Button>
          </Link>
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-gray-500">User profile not found or could not be loaded.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <Link to="/messages">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Messages
          </Button>
        </Link>

        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <Avatar className="w-32 h-32">
                <AvatarImage src={user.avatar} alt={`${user.first_name} ${user.last_name}`} />
                <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-2xl">
                  {user.first_name?.[0]?.toUpperCase() || user.last_name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {user.first_name} {user.last_name}
                </h1>
                
                {user.profession && (
                  <p className="text-xl text-gray-600 dark:text-gray-300 mb-3">{user.profession}</p>
                )}
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {user.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{typeof user.location === 'object' ? user.location.name : user.location}</span>
                    </div>
                  )}
                  
                  {user.date_joined && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {formatDate(user.date_joined)}</span>
                    </div>
                  )}
                  
                  {user.is_online !== undefined && (
                    <Badge variant={user.is_online ? "default" : "secondary"}>
                      {user.is_online ? "Online" : "Offline"}
                    </Badge>
                  )}
                </div>

                {/* Contact Information */}
                {(user.email || user.phone || user.website) && (
                  <div className="flex flex-wrap gap-4 mb-4">
                    {user.email && (
                      <a 
                        href={`mailto:${user.email}`}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Mail className="h-4 w-4" />
                        <span className="text-sm">{user.email}</span>
                      </a>
                    )}
                    
                    {user.phone && (
                      <a 
                        href={`tel:${user.phone}`}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Phone className="h-4 w-4" />
                        <span className="text-sm">{user.phone}</span>
                      </a>
                    )}
                    
                    {user.website && (
                      <a 
                        href={user.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Globe className="h-4 w-4" />
                        <span className="text-sm">Website</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}

                {user.bio && (
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{user.bio}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        {user.skills && user.skills.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {user.skills.map((skill: any, index: number) => (
                  <Badge key={index} variant="secondary">
                    {typeof skill === 'object' ? skill.name : skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Experience */}
        {user.experiences && user.experiences.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Work Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {user.experiences.map((exp: any, index: number) => (
                  <div key={index}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{exp.position}</h3>
                        <p className="text-blue-600 dark:text-blue-400">{exp.company}</p>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(exp.start_date)} - {exp.is_current ? 'Present' : formatDate(exp.end_date)}
                      </div>
                    </div>
                    {exp.description && (
                      <p className="text-gray-700 dark:text-gray-300">{exp.description}</p>
                    )}
                    {index < user.experiences.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Education */}
        {user.education && user.education.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Education
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {user.education.map((edu: any, index: number) => (
                  <div key={index}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{edu.degree}</h3>
                        <p className="text-blue-600 dark:text-blue-400">{edu.institution}</p>
                        {edu.field_of_study && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{edu.field_of_study}</p>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(edu.start_date)} - {edu.is_current ? 'Present' : formatDate(edu.end_date)}
                      </div>
                    </div>
                    {index < user.education.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Languages */}
        {user.languages && user.languages.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Languages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {user.languages.map((lang: any, index: number) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="font-medium">
                      {typeof lang === 'object' ? lang.name : lang}
                    </span>
                    {typeof lang === 'object' && lang.level && (
                      <Badge variant="outline">{lang.level}</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}