import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TopBar from "@/components/layout/TopBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase, 
  GraduationCap, 
  FolderOpen, 
  FileText,
  Edit2,
  Save,
  X,
  Plus
} from "lucide-react";
import { z } from "zod";
import type { User as UserType, UserExperience, UserEducation, UserProject, UserResume } from "@shared/schema";

const profileUpdateSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").optional(),
  profession: z.string().optional(),
  gender: z.enum(["m", "f"]).optional(),
  date_of_birth: z.string().optional(),
  location: z.number().optional(),
});

type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { user } = useAuth();
  
  // Fetch full user profile from API
  const { data: profile, isLoading } = useQuery({
    queryKey: ["/users/me/"],
    queryFn: () => apiService.request<UserType>("/users/me/"),
  });

  // Fetch locations for the location dropdown
  const { data: locations } = useQuery({
    queryKey: ["/locations/"],
    queryFn: () => apiService.request<{results: Array<{id: number, name: string}>}>("/locations/"),
  });

  const form = useForm<ProfileUpdate>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      profession: "",
      gender: undefined,
      date_of_birth: "",
      location: undefined,
    },
  });

  // Update form when profile data loads
  useEffect(() => {
    if (profile) {
      form.reset({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: profile.email || "",
        profession: profile.profession || "",
        gender: profile.gender || undefined,
        date_of_birth: profile.date_of_birth || "",
        location: profile.location || undefined,
      });
    }
  }, [profile, form]);

  const updateMutation = useMutation({
    mutationFn: (data: ProfileUpdate) =>
      apiService.request<UserType>(`/users/${profile?.id}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/users/me/"] });
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileUpdate) => {
    updateMutation.mutate(data);
  };

  const handleCancel = () => {
    if (profile) {
      form.reset({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: profile.email || "",
        profession: profile.profession || "",
        gender: profile.gender || undefined,
        date_of_birth: profile.date_of_birth || "",
        location: profile.location || undefined,
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          title="My Profile"
          description="Manage your personal information"
          showCreateButton={false}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          title="My Profile"
          description="Manage your personal information"
          showCreateButton={false}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">No profile information found</p>
                <p className="text-sm text-gray-400 mt-2">
                  Complete your profile to enhance your experience
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar
        title="My Profile"
        description="Manage your personal information"
        showCreateButton={false}
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Header */}
          <div className="flex items-center space-x-4 mb-6">
            <Avatar className="w-20 h-20">
              {profile.avatar ? (
                <AvatarImage src={profile.avatar} alt={`${profile.first_name} ${profile.last_name}`} />
              ) : (
                <AvatarFallback className="text-lg">
                  {(profile.first_name?.[0] || "") + (profile.last_name?.[0] || "")}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {profile.first_name} {profile.last_name}
              </h1>
              {profile.profession && (
                <p className="text-gray-600 text-lg">{profile.profession}</p>
              )}
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                {profile.email && (
                  <div className="flex items-center space-x-1">
                    <Mail className="w-4 h-4" />
                    <span>{profile.email}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Phone className="w-4 h-4" />
                  <span>{profile.phone}</span>
                </div>
                {profile.is_online && (
                  <Badge variant="outline" className="text-green-600 border-green-300">
                    Online
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Personal Information Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Update your personal details and contact information
                    </CardDescription>
                  </div>
                </div>
                {!isEditing && (
                  <Button onClick={() => setIsEditing(true)} variant="outline">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {isEditing ? (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="first_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your first name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="last_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your last name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your email" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="profession"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Profession</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your profession" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="m">Male</SelectItem>
                                <SelectItem value="f">Female</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="date_of_birth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value || "")}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select location" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {locations?.results?.map((location) => (
                                  <SelectItem key={location.id} value={String(location.id)}>
                                    {location.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-center space-x-4 pt-4">
                      <Button type="submit" disabled={updateMutation.isPending}>
                        {updateMutation.isPending ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      <Button type="button" variant="outline" onClick={handleCancel}>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">First Name</label>
                      <p className="text-gray-900">{profile.first_name || "Not provided"}</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Last Name</label>
                      <p className="text-gray-900">{profile.last_name || "Not provided"}</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <p className="text-gray-900">{profile.email || "Not provided"}</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Phone</label>
                      <p className="text-gray-900">{profile.phone}</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Profession</label>
                      <p className="text-gray-900">{profile.profession || "Not provided"}</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Gender</label>
                      <p className="text-gray-900">
                        {profile.gender === "m" ? "Male" : profile.gender === "f" ? "Female" : "Not provided"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                      <p className="text-gray-900">
                        {profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : "Not provided"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Location</label>
                      <p className="text-gray-900">
                        {profile.location ? 
                          locations?.results?.find(l => l.id === profile.location)?.name || `Location ID: ${profile.location}`
                          : "Not provided"
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Experience Section */}
          {profile.experiences && profile.experiences.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Work Experience</CardTitle>
                    <CardDescription>Professional experience and career history</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profile.experiences.map((experience) => (
                    <div key={experience.id} className="border-l-2 border-blue-200 pl-4">
                      <h4 className="font-semibold text-gray-900">{experience.position}</h4>
                      <p className="text-blue-600 font-medium">{experience.organization_name}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(experience.date_started).toLocaleDateString()} - {
                          experience.date_finished 
                            ? new Date(experience.date_finished).toLocaleDateString() 
                            : "Present"
                        }
                      </p>
                      {experience.description && (
                        <p className="text-gray-700 mt-2">{experience.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Education Section */}
          {profile.educations && profile.educations.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>Education</CardTitle>
                    <CardDescription>Educational background and qualifications</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profile.educations.map((education) => (
                    <div key={education.id} className="border-l-2 border-green-200 pl-4">
                      <h4 className="font-semibold text-gray-900 capitalize">{education.level}</h4>
                      <p className="text-green-600 font-medium">University ID: {education.university}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {education.date_started && new Date(education.date_started).toLocaleDateString()} - {
                          education.date_finished 
                            ? new Date(education.date_finished).toLocaleDateString() 
                            : "Present"
                        }
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Projects Section */}
          {profile.projects && profile.projects.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FolderOpen className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>Projects</CardTitle>
                    <CardDescription>Personal and professional projects</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profile.projects.map((project) => (
                    <div key={project.id} className="border-l-2 border-purple-200 pl-4">
                      <h4 className="font-semibold text-gray-900">{project.title}</h4>
                      {project.link && (
                        <a 
                          href={project.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-800 text-sm"
                        >
                          View Project →
                        </a>
                      )}
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(project.date_started).toLocaleDateString()} - {
                          project.date_finished 
                            ? new Date(project.date_finished).toLocaleDateString() 
                            : "Ongoing"
                        }
                      </p>
                      <p className="text-gray-700 mt-2">{project.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resumes Section */}
          {profile.resumes && profile.resumes.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle>Resumes</CardTitle>
                    <CardDescription>Uploaded resume documents</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profile.resumes.map((resume) => (
                    <div key={resume.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-orange-600" />
                        <div>
                          <p className="font-medium text-gray-900">{resume.title}</p>
                          <p className="text-sm text-gray-500">
                            Uploaded on {new Date(resume.date_created).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {resume.file && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={resume.file} target="_blank" rel="noopener noreferrer">
                            View
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}