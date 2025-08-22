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
  ArrowLeft 
} from "lucide-react";
import { apiService } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/layout/TopBar";

interface UserProfile {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  location?: string | { id: number; name: string };
  bio?: string;
  experience?: string;
  skills?: (string | { id: number; name: string })[];
  created_at: string;
}

export default function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/users/', userId],
    queryFn: () => apiService.request<UserProfile>(`/users/${userId}/`),
    enabled: !!userId,
  });

  if (!userId) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="User Profile" description="User not found" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="text-center">
            <p className="text-muted-foreground">User not found</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
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
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
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
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          {/* User Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start space-x-4">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="text-primary w-10 h-10" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl">
                    {user.first_name} {user.last_name}
                  </CardTitle>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
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
                  <div className="flex items-center space-x-1 mt-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            {user.bio && (
              <CardContent>
                <Separator className="mb-4" />
                <h3 className="font-medium text-foreground mb-2">About</h3>
                <p className="text-muted-foreground">{user.bio}</p>
              </CardContent>
            )}
          </Card>

          {/* Experience and Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {user.experience && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Briefcase className="w-5 h-5" />
                    <span>Experience</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{user.experience}</p>
                </CardContent>
              </Card>
            )}

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
          </div>
        </div>
      </main>
    </div>
  );
}