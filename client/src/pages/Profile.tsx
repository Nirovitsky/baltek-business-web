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

  const form = useForm<ProfileUpdate>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
    },
  });

  // Update form when profile data loads
  useEffect(() => {
    if (profile) {
      form.reset({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: profile.email || "",
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
            <Avatar className="w-16 h-16">
              {profile.avatar ? (
                <AvatarImage src={profile.avatar} alt={`${profile.first_name} ${profile.last_name}`} />
              ) : (
                <AvatarFallback className="text-lg">
                  {(profile.first_name?.[0] || "") + (profile.last_name?.[0] || "")}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {profile.first_name} {profile.last_name}
              </h1>
              <p className="text-gray-600">Business User</p>
              <div className="flex items-center space-x-3 mt-1 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Phone className="w-4 h-4" />
                  <span>{profile.phone}</span>
                </div>
                <Badge variant="outline" className="text-blue-600 border-blue-300">
                  Business User
                </Badge>
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
                    <CardTitle>Business Account Information</CardTitle>
                    <CardDescription>
                      Update your basic business account details
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
                            <FormLabel>Email (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your email" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Phone Number</label>
                        <p className="text-gray-900 bg-gray-50 p-2 rounded-md border">{profile.phone}</p>
                        <p className="text-xs text-gray-500">Phone number cannot be changed</p>
                      </div>
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
                      <label className="text-sm font-medium text-gray-700">Phone Number</label>
                      <p className="text-gray-900">{profile.phone}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>


        </div>
      </main>
    </div>
  );
}