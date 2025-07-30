import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { apiService } from "@/lib/api";
import { Link } from "wouter";

interface UserProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  bio?: string;
  position?: string;
  location?: string;
  joined_date: string;
  profile_picture?: string;
}

export default function UserProfile() {
  const [match, params] = useRoute("/profile/:userId");
  const userId = params?.userId;

  const { data: userProfile, isLoading } = useQuery({
    queryKey: ["/users/profile/", userId],
    queryFn: () => apiService.request<UserProfile>(`/users/${userId}/`),
    enabled: !!userId,
  });

  if (!match || !userId) {
    return <div>User not found</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile not found</h2>
          <p className="text-gray-600 mb-4">The user profile you're looking for doesn't exist.</p>
          <Link href="/messages">
            <Button>Back to Messages</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/messages">
            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Messages</span>
            </Button>
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <Card className="mb-8 shadow-lg">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
                <Avatar className="w-20 h-20 shadow-lg">
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-2xl font-bold">
                    {userProfile.first_name[0]}{userProfile.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {userProfile.first_name} {userProfile.last_name}
                      </h1>
                      {userProfile.position && (
                        <p className="text-lg text-gray-600 mb-2">{userProfile.position}</p>
                      )}
                      {userProfile.location && (
                        <div className="flex items-center text-gray-500 mb-4">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>{userProfile.location}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button className="bg-gradient-to-r from-blue-500 to-blue-600">
                        <Mail className="w-4 h-4 mr-2" />
                        Send Message
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              {userProfile.bio && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-gray-700 leading-relaxed">{userProfile.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-blue-500" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{userProfile.email}</span>
                </div>
                {userProfile.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{userProfile.phone}</span>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">
                    Joined {new Date(userProfile.joined_date).toLocaleDateString([], {
                      month: "long",
                      year: "numeric"
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="w-5 h-5 mr-2 text-blue-500" />
                  Professional Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userProfile.position && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Position</h4>
                    <p className="text-gray-600">{userProfile.position}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Active Member
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}