import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Calendar, 
  Briefcase, 
  GraduationCap, 
  FolderOpen,
  User as UserIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiService } from "@/lib/api";
import { Link } from "wouter";
import TopBar from "@/components/layout/TopBar";
import { useToast } from "@/hooks/use-toast";

// Use the existing User type from schema
import type { User, UserExperience, UserEducation, UserProject, Room } from "@shared/schema";

export default function UserProfile() {
  const [match, params] = useRoute("/profile/:userId");
  const userId = params?.userId;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: userProfile, isLoading, error } = useQuery({
    queryKey: ["/users/", userId],
    queryFn: () => apiService.request<User>(`/users/${userId}/`),
    enabled: !!userId,
  });



  if (!match || !userId) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="User Profile" description="User not found" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="text-center">
            <p className="text-muted-foreground">User not found</p>
            <Link href="/dashboard">
              <Button className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
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
            {/* Profile Header Skeleton */}
            <div className="flex items-center space-x-4 mb-6">
              <Skeleton className="w-20 h-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            
            {/* Content Skeletons */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="User Profile" description="Profile not found" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="text-center py-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">Profile not found</h2>
                <p className="text-muted-foreground mb-4">The user profile you're looking for doesn't exist.</p>
                <Link href="/dashboard">
                  <Button>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
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
        title="User Profile" 
        description={`Profile of ${userProfile.first_name} ${userProfile.last_name}`}
        showCreateButton={false}
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center space-x-2 mb-4"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>

          {/* Personal Information Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Profile Header with Avatar */}
                <div className="flex items-center space-x-4 pb-4 border-b">
                  <Avatar className="w-16 h-16">
                    {userProfile.avatar ? (
                      <AvatarImage src={userProfile.avatar} alt={`${userProfile.first_name} ${userProfile.last_name}`} />
                    ) : (
                      <AvatarFallback className="text-lg bg-gradient-to-br from-blue-400 to-indigo-500 text-white">
                        {(userProfile.first_name?.[0] || "") + (userProfile.last_name?.[0] || "")}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <h1 className="text-xl font-bold text-foreground">
                      {userProfile.first_name} {userProfile.last_name}
                    </h1>
                    {userProfile.profession && (
                      <p className="text-muted-foreground">{userProfile.profession}</p>
                    )}

                  </div>
                  <Button 
                    className="bg-gradient-to-r from-blue-500 to-blue-600"
                    onClick={async () => {
                      try {
                        // Find existing chat room with this user
                        const response = await apiService.request<{results: Room[]}>('/chat/rooms/');
                        console.log('Checking rooms for user:', userProfile.id);
                        console.log('Available rooms:', response.results);
                        
                        const existingRoom = response.results.find((room: Room) => {
                          console.log(`Room ${room.id} members:`, room.members);
                          // Members are stored as numeric IDs, not objects
                          return room.members.some((memberId: number) => {
                            const numericMemberId = typeof memberId === 'number' ? memberId : parseInt(String(memberId));
                            console.log(`Comparing member ${numericMemberId} with user ${userProfile.id}`);
                            return numericMemberId === userProfile.id;
                          });
                        });
                        
                        console.log('Found existing room:', existingRoom);
                        
                        if (existingRoom) {
                          // Navigate to existing room
                          toast({
                            title: "Success",
                            description: "Opening existing chat room...",
                          });
                          setLocation(`/messages#room-${existingRoom.id}`);
                        } else {
                          // Since there's no API to create rooms directly from user profiles,
                          // explain that a room needs to be created through job applications
                          toast({
                            title: "No existing conversation",
                            description: `To start a conversation with ${userProfile.first_name} ${userProfile.last_name}, they need to apply for a job first.`,
                            variant: "destructive",
                          });
                        }
                      } catch (error) {
                        console.error('Error finding chat room:', error);
                        toast({
                          title: "Error",
                          description: "Unable to access chat rooms at this time. Please try again later.",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </div>

                {/* Personal Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">First Name</label>
                    <p className="text-foreground">{userProfile.first_name || "Not provided"}</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Last Name</label>
                    <p className="text-foreground">{userProfile.last_name || "Not provided"}</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <p className="text-foreground">{userProfile.email || "Not provided"}</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Phone</label>
                    <p className="text-foreground">{userProfile.phone}</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Profession</label>
                    <p className="text-foreground">{userProfile.profession || "Not provided"}</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Gender</label>
                    <p className="text-foreground">
                      {userProfile.gender === "m" ? "Male" : userProfile.gender === "f" ? "Female" : "Not provided"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Date of Birth</label>
                    <p className="text-foreground">
                      {userProfile.date_of_birth ? userProfile.date_of_birth : "Not provided"}
                    </p>
                  </div>


                </div>
              </div>
            </CardContent>
          </Card>

          {/* Experience Section */}
          {userProfile.experiences && userProfile.experiences.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Work Experience</CardTitle>
                    <CardDescription>Professional experience and career history</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userProfile.experiences.map((experience) => (
                    <div key={experience.id} className="border-l-2 border-blue-200 pl-4">
                      <h4 className="font-semibold text-foreground">{experience.position}</h4>
                      <p className="text-primary font-medium">{experience.organization_name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {experience.date_started} - {
                          experience.date_finished || "Present"
                        }
                      </p>
                      {experience.description && (
                        <p className="text-foreground mt-2">{experience.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Education Section */}
          {userProfile.educations && userProfile.educations.length > 0 && (
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
                  {userProfile.educations.map((education) => (
                    <div key={education.id} className="border-l-2 border-green-200 pl-4">
                      <h4 className="font-semibold text-foreground capitalize">{education.level}</h4>
                      <p className="text-green-600 font-medium">
                        {typeof education.university === 'object' && education.university?.name
                          ? education.university.name
                          : `University ID: ${education.university}`}
                      </p>
                      {typeof education.university === 'object' && education.university?.location?.name && (
                        <p className="text-sm text-muted-foreground">
                          Location: {education.university.location.name}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        {education.date_started || "Not specified"} - {
                          education.date_finished || "Present"
                        }
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Projects Section */}
          {userProfile.projects && userProfile.projects.length > 0 && (
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
                  {userProfile.projects.map((project) => (
                    <div key={project.id} className="border-l-2 border-purple-200 pl-4">
                      <h4 className="font-semibold text-foreground">{project.title}</h4>
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
                      <p className="text-sm text-muted-foreground mt-1">
                        {project.date_started} - {
                          project.date_finished || "Ongoing"
                        }
                      </p>
                      <p className="text-foreground mt-2">{project.description}</p>
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