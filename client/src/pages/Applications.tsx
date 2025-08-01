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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiService } from "@/lib/api";
import { User, Search, MessageCircle, FileText, Download, Mail, MapPin, Calendar, Briefcase } from "lucide-react";
import type { JobApplication, PaginatedResponse } from "@shared/schema";

export default function Applications() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="border-l-4 border-l-gray-200 h-fit">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="bg-gray-50 rounded-md p-3">
                      <Skeleton className="h-3 w-20 mb-2" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <Skeleton className="h-8 w-20" />
                      <div className="flex items-center space-x-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-14" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredApplications.map((application) => (
              <Card 
                key={application.id} 
                className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 h-fit cursor-pointer"
                onClick={() => setSelectedApplication(application)}
              >
                <CardContent className="p-4">
                  {/* Header Section */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3">
                      <div 
                        className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer hover:shadow-md transition-all"
                        onClick={() => setLocation(`/profile/${application.owner.id}`)}
                      >
                        <User className="text-white w-6 h-6" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 
                          className="font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors truncate"
                          onClick={() => setLocation(`/profile/${application.owner.id}`)}
                        >
                          {`${application.owner.first_name} ${application.owner.last_name}`}
                        </h3>
                        
                        <div className="text-xs text-gray-600 mt-1">
                          <div className="flex items-center space-x-1 truncate">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{application.owner.email}</span>
                          </div>
                          {application.owner.profession && (
                            <div className="flex items-center space-x-1 mt-1 truncate">
                              <Briefcase className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{application.owner.profession}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-1 mt-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">Applied for <strong>{application.job.title}</strong></span>
                        </div>
                      </div>
                    </div>
                    
                    <Badge variant="secondary" className={`${getStatusColor(application.status)} text-xs`}>
                      {application.status ? application.status.charAt(0).toUpperCase() + application.status.slice(1) : 'Unknown'}
                    </Badge>
                  </div>

                  {/* Application Details Section */}
                  <div className="space-y-3">
                    {/* Cover Letter */}
                    {application.cover_letter && (
                      <div className="bg-gray-50 rounded-md p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <h4 className="text-xs font-semibold text-gray-900">Cover Letter</h4>
                        </div>
                        <div className="text-xs text-gray-700 leading-relaxed">
                          {application.cover_letter.length > 120 ? (
                            <>
                              {application.cover_letter.substring(0, 120)}...
                              <button 
                                className="text-blue-600 hover:text-blue-800 ml-1 font-medium"
                                onClick={() => {
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
                      <div className="bg-blue-50 rounded-md p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Download className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <h4 className="text-xs font-semibold text-gray-900">Resume/CV</h4>
                          </div>
                          <a 
                            href={application.resume}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-xs font-medium transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            <span>View</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Show message if no cover letter or CV */}
                    {!application.cover_letter && !application.resume && (
                      <div className="text-xs text-gray-500 italic text-center py-2">
                        No cover letter or CV provided
                      </div>
                    )}

                    {/* Actions Section */}
                    <div 
                      className="flex items-center justify-between pt-2 border-t border-gray-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Select
                        value={application.status}
                        onValueChange={(value) => handleStatusChange(application.id, value)}
                        disabled={updateApplicationMutation.isPending}
                      >
                        <SelectTrigger className="w-24 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="invited">Invited</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="hired">Hired</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateChatRoom(application.id);
                          }}
                          disabled={createChatRoomMutation.isPending}
                          className="h-8 px-2 text-xs"
                        >
                          <MessageCircle className="w-3 h-3 mr-1" />
                          Message
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/profile/${application.owner.id}`);
                          }}
                          className="h-8 px-2 text-xs text-gray-600 hover:text-gray-900"
                        >
                          Profile
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Application Details Dialog */}
        {selectedApplication && (
          <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <User className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {`${selectedApplication.owner.first_name} ${selectedApplication.owner.last_name}`}
                    </h2>
                    <p className="text-sm text-gray-600">
                      Application for {selectedApplication.job.title}
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 mt-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{selectedApplication.owner.email}</span>
                      </div>
                      {selectedApplication.owner.profession && (
                        <div className="flex items-center space-x-2">
                          <Briefcase className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{selectedApplication.owner.profession}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{selectedApplication.job.location.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Application Status</h3>
                    <div className="space-y-2">
                      <Badge variant="secondary" className={`${getStatusColor(selectedApplication.status)} text-sm`}>
                        {selectedApplication.status ? selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1) : 'Unknown'}
                      </Badge>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Applied recently</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cover Letter */}
                {selectedApplication.cover_letter && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span>Cover Letter</span>
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {selectedApplication.cover_letter}
                      </p>
                    </div>
                  </div>
                )}

                {/* Resume/CV */}
                {selectedApplication.resume && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                      <Download className="w-5 h-5 text-blue-600" />
                      <span>Resume/CV</span>
                    </h3>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-medium text-gray-900">Resume Document</span>
                        </div>
                        <a 
                          href={selectedApplication.resume}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download CV</span>
                        </a>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        Click the download button to view the full resume document
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-3">
                    <Select
                      value={selectedApplication.status}
                      onValueChange={(value) => handleStatusChange(selectedApplication.id, value)}
                      disabled={updateApplicationMutation.isPending}
                    >
                      <SelectTrigger className="w-40">
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
                      variant="outline"
                      onClick={() => handleCreateChatRoom(selectedApplication.id)}
                      disabled={createChatRoomMutation.isPending}
                      className="flex items-center space-x-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Start Conversation</span>
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      onClick={() => setLocation(`/profile/${selectedApplication.owner.id}`)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      View Full Profile
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => setSelectedApplication(null)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
}
