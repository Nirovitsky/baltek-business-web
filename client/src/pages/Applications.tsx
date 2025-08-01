import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import TopBar from "@/components/layout/TopBar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiService } from "@/lib/api";
import { User, Search, MessageCircle, FileText, Download, Mail, MapPin, Calendar, Briefcase } from "lucide-react";
import type { JobApplication, PaginatedResponse } from "@shared/schema";

export default function Applications() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { toast } = useToast();
  const { selectedOrganization } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data, isLoading } = useQuery({
    queryKey: ['/jobs/applications/', selectedOrganization?.id, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedOrganization) params.append('organization', selectedOrganization.id.toString());
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      return apiService.request<PaginatedResponse<JobApplication>>(`/jobs/applications/?${params.toString()}`);
    },
    enabled: !!selectedOrganization,
  });

  const updateApplicationMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      apiService.request(`/jobs/applications/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/jobs/applications/'] });
      toast({
        title: "Success",
        description: "Application status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update application status",
        variant: "destructive",
      });
    },
  });

  const createChatRoomMutation = useMutation({
    mutationFn: (applicationId: number) => 
      apiService.request(`/jobs/applications/${applicationId}/create_room/`, {
        method: 'POST',
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Chat room created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create chat room",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (applicationId: number, newStatus: string) => {
    updateApplicationMutation.mutate({ id: applicationId, status: newStatus });
  };

  const handleCreateChatRoom = (applicationId: number) => {
    createChatRoomMutation.mutate(applicationId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'invited':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'hired':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const applications = data?.results || [];
  
  // First filter by organization to ensure we only show applications for jobs 
  // that belong to the selected organization
  const organizationFilteredApplications = applications.filter(app => {
    // If the application has job organization info, check it matches
    if (app.job?.organization && selectedOrganization) {
      return app.job.organization.id === selectedOrganization.id;
    }
    // Otherwise rely on backend filtering
    return true;
  });
  
  // Then apply search filter
  const filteredApplications = organizationFilteredApplications.filter(app => 
    searchTerm === "" || 
    (`${app.owner.first_name} ${app.owner.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (app.job.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar 
        title="Applications"
        description="Review and manage job applications"
        showCreateButton={false}
      />

      <main className="flex-1 overflow-y-auto p-6">
        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="invited">Invited</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="hired">Hired</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Applications List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="border-l-4 border-l-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <Skeleton className="w-16 h-16 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-64" />
                        <Skeleton className="h-4 w-56" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-8 w-24" />
                      </div>
                      <div className="flex items-center space-x-3">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? "Try adjusting your search or filters"
                  : "Applications will appear here when candidates apply to your jobs"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((application) => (
              <Card key={application.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  {/* Header Section */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div 
                        className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer hover:shadow-md transition-all"
                        onClick={() => setLocation(`/profile/${application.owner.id}`)}
                      >
                        <User className="text-white w-8 h-8" />
                      </div>
                      
                      <div className="flex-1">
                        <h3 
                          className="text-lg font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => setLocation(`/profile/${application.owner.id}`)}
                        >
                          {`${application.owner.first_name} ${application.owner.last_name}`}
                        </h3>
                        
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Mail className="w-4 h-4" />
                            <span>{application.owner.email}</span>
                          </div>
                          {application.owner.profession && (
                            <div className="flex items-center space-x-1">
                              <Briefcase className="w-4 h-4" />
                              <span>{application.owner.profession}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-1 mt-1 text-sm text-gray-500">
                          <MapPin className="w-4 h-4" />
                          <span>Applied for <strong>{application.job.title}</strong> • {application.job.location.name}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className={getStatusColor(application.status)}>
                        {application.status ? application.status.charAt(0).toUpperCase() + application.status.slice(1) : 'Unknown'}
                      </Badge>
                    </div>
                  </div>

                  {/* Application Details Section */}
                  <div className="space-y-4">
                    {/* Cover Letter */}
                    {application.cover_letter && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <h4 className="text-sm font-semibold text-gray-900">Cover Letter</h4>
                        </div>
                        <div className="text-sm text-gray-700 leading-relaxed">
                          {application.cover_letter.length > 200 ? (
                            <>
                              {application.cover_letter.substring(0, 200)}...
                              <button 
                                className="text-blue-600 hover:text-blue-800 ml-1 font-medium"
                                onClick={() => {
                                  // Show full cover letter in a modal or expand
                                  alert(application.cover_letter);
                                }}
                              >
                                Read more
                              </button>
                            </>
                          ) : (
                            application.cover_letter
                          )}
                        </div>
                      </div>
                    )}

                    {/* Resume/CV */}
                    {application.resume && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Download className="w-5 h-5 text-blue-600" />
                            <h4 className="text-sm font-semibold text-gray-900">Resume/CV</h4>
                          </div>
                          <a 
                            href={application.resume}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                          </a>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          Click to view and download the applicant's resume
                        </p>
                      </div>
                    )}

                    {/* Actions Section */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <div className="flex items-center space-x-3">
                        <Select
                          value={application.status}
                          onValueChange={(value) => handleStatusChange(application.id, value)}
                          disabled={updateApplicationMutation.isPending}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="invited">Invited</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="hired">Hired</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCreateChatRoom(application.id)}
                          disabled={createChatRoomMutation.isPending}
                          className="flex items-center space-x-1"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Message</span>
                        </Button>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <a 
                          href={`mailto:${application.owner.email}`}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                          <span>Email</span>
                        </a>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setLocation(`/profile/${application.owner.id}`)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          View Profile
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
