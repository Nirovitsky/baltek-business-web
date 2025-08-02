import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import TopBar from "@/components/layout/TopBar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiService } from "@/lib/api";
import { User, Search, MessageCircle, FileText, Download, MapPin, Calendar, Briefcase, X, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { JobApplication, PaginatedResponse } from "@shared/schema";

// Helper function to get status colors for applications
const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-primary/10 text-primary';
    case 'invited':
      return 'bg-green-500/10 text-green-700 dark:text-green-300';
    case 'rejected':
      return 'bg-red-500/10 text-red-700 dark:text-red-300';
    case 'hired':
      return 'bg-green-500/10 text-green-700 dark:text-green-300';
    case 'expired':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-muted text-muted-foreground';  
  }
};

export default function Applications() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
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

  // Query for detailed application data when viewing details
  const { data: detailedApplication, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['/jobs/applications/', selectedApplication?.id],
    queryFn: () => {
      if (!selectedApplication) return null;
      return apiService.request<JobApplication>(`/jobs/applications/${selectedApplication.id}/`);
    },
    enabled: !!selectedApplication,
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
    onSuccess: (roomData: any) => {
      toast({
        title: "Success",
        description: "Opening chat room...",
      });
      // Navigate to the chat room
      if (roomData?.id) {
        setLocation(`/messages#room-${roomData.id}`);
      } else {
        // Fallback: refresh rooms and find the new one
        setTimeout(() => {
          setLocation('/messages');
        }, 1000);
      }
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

  const handleCreateChatRoom = async (application: JobApplication) => {
    try {
      // First check if there's already a chat room with this user
      const roomsResponse = await apiService.request<{results: any[]}>('/chat/rooms/');
      console.log('Checking rooms for user:', application.owner.id);
      console.log('Available rooms:', roomsResponse.results);
      
      const existingRoom = roomsResponse.results.find((room: any) => {
        console.log(`Room ${room.id} members:`, room.members);
        // Members are stored as numeric IDs
        return room.members.some((memberId: number) => {
          const numericMemberId = typeof memberId === 'number' ? memberId : parseInt(String(memberId));
          console.log(`Comparing member ${numericMemberId} with user ${application.owner.id}`);
          return numericMemberId === application.owner.id;
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
        // Create new room via application
        createChatRoomMutation.mutate(application.id);
      }
    } catch (error) {
      console.error('Error finding chat room:', error);
      // Fallback to creating new room
      createChatRoomMutation.mutate(application.id);
    }
  };

  // Sort applications by ID in descending order (newest first, since higher ID = more recent)
  const applications = data?.results ? 
    [...data.results].sort((a, b) => b.id - a.id) : 
    [];
  
  // Debug: Log the first application to see its structure
  if (applications.length > 0) {
    console.log('First application data:', applications[0]);
    console.log('Cover letter available:', !!applications[0].cover_letter);
    console.log('Resume available:', !!applications[0].resume);
  }
  
  // Debug: Log detailed application data when fetched
  if (detailedApplication) {
    console.log('Detailed application data:', detailedApplication);
    console.log('Detailed cover letter:', detailedApplication.cover_letter);
    console.log('Detailed resume:', detailedApplication.resume);
  }
  
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

      <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
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

        {/* Applications Table */}
        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Job Position</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16 rounded" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-8 w-20" />
                          <Skeleton className="h-8 w-16" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No applications found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? "Try adjusting your search or filters"
                  : "Applications will appear here when candidates apply to your jobs"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Job Position</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((application) => (
                    <TableRow 
                      key={application.id} 
                      className="cursor-pointer hover:bg-background"
                      onClick={() => setSelectedApplication(application)}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar 
                            className="w-10 h-10 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocation(`/profile/${application.owner.id}`);
                            }}
                          >
                            <AvatarImage 
                              src={application.owner.avatar} 
                              alt={`${application.owner.first_name} ${application.owner.last_name}`}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                              {application.owner.first_name?.[0]}{application.owner.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="min-w-0">
                            <div 
                              className="font-medium text-foreground cursor-pointer hover:text-primary transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/profile/${application.owner.id}`);
                              }}
                            >
                              {`${application.owner.first_name} ${application.owner.last_name}`}
                            </div>
                            {application.owner.profession && (
                              <div className="text-sm text-muted-foreground flex items-center space-x-1">
                                <Briefcase className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{application.owner.profession}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="font-medium">{application.job.title}</div>
                        <div className="text-sm text-muted-foreground">{application.job.organization?.name || 'Organization'}</div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span>{application.job.location?.name || 'Not specified'}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="secondary" className={getStatusColor(application.status)}>
                          {application.status ? application.status.charAt(0).toUpperCase() + application.status.slice(1) : 'Unknown'}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          <span>Recently</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Select
                            value={application.status}
                            onValueChange={(value) => handleStatusChange(application.id, value)}
                            disabled={updateApplicationMutation.isPending}
                          >
                            <SelectTrigger className="w-28 h-8 text-xs" onClick={(e) => e.stopPropagation()}>
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCreateChatRoom(application);
                            }}
                            disabled={createChatRoomMutation.isPending}
                            className="h-8 px-2 text-xs"
                          >
                            <MessageCircle className="w-3 h-3 mr-1" />
                            Message
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Application Details Dialog */}
        {selectedApplication && (
          <Dialog open={!!selectedApplication} onOpenChange={() => {
            setSelectedApplication(null);
            setPreviewUrl(null);
          }}>
            <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage 
                      src={selectedApplication.owner.avatar} 
                      alt={`${selectedApplication.owner.first_name} ${selectedApplication.owner.last_name}`}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                      {selectedApplication.owner.first_name?.[0]}{selectedApplication.owner.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {`${selectedApplication.owner.first_name} ${selectedApplication.owner.last_name}`}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Application for {selectedApplication.job.title}
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              {isLoadingDetails ? (
                <div className="space-y-4 mt-6">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (

              <div className="space-y-6 mt-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Contact Information</h3>
                    <div className="space-y-2">
                      {selectedApplication.owner.profession && (
                        <div className="flex items-center space-x-2">
                          <Briefcase className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{selectedApplication.owner.profession}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{selectedApplication.job.location.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Application Status</h3>
                    <div className="space-y-2">
                      <Badge variant="secondary" className={`${getStatusColor(selectedApplication.status)} text-sm`}>
                        {selectedApplication.status ? selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1) : 'Unknown'}
                      </Badge>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Applied recently</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cover Letter */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <span>Cover Letter</span>
                  </h3>
                  {(detailedApplication?.cover_letter || selectedApplication.cover_letter) ? (
                    <div className="bg-background rounded-lg p-4">
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {detailedApplication?.cover_letter || selectedApplication.cover_letter}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-background rounded-lg p-4">
                      <p className="text-sm text-muted-foreground italic">
                        No cover letter provided by the applicant
                      </p>
                    </div>
                  )}
                </div>

                {/* Resume/CV */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground flex items-center space-x-2">
                    <Download className="w-5 h-5 text-primary" />
                    <span>Resume/CV</span>
                  </h3>
                  {(detailedApplication?.resume || selectedApplication.resume) ? (
                    <>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-5 h-5 text-primary" />
                          <span className="text-sm font-medium text-foreground">Resume Document</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewUrl(detailedApplication?.resume || selectedApplication.resume || null)}
                            className="flex items-center space-x-2"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Preview</span>
                          </Button>
                          <Button
                            size="sm"
                            onClick={async () => {
                              try {
                                const response = await fetch(detailedApplication?.resume || selectedApplication.resume || '');
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `${selectedApplication.owner.first_name}_${selectedApplication.owner.last_name}_CV.pdf`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                window.URL.revokeObjectURL(url);
                              } catch (error) {
                                console.error('Download failed:', error);
                                toast({
                                  title: "Download Failed",
                                  description: "Could not download the file. Please try again.",
                                  variant: "destructive",
                                });
                              }
                            }}
                            className="flex items-center space-x-2 bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Preview the document inline or download it directly
                      </p>
                    </div>
                  
                    {/* Inline CV Preview */}
                    {previewUrl && (
                      <div className="mt-4 bg-card rounded-lg border-2 border-primary/20 overflow-hidden shadow-lg">
                        <div className="flex items-center justify-between bg-primary/5 px-4 py-3 border-b border-primary/20">
                          <h4 className="text-sm font-medium text-primary flex items-center space-x-2">
                            <FileText className="w-4 h-4" />
                            <span>CV Preview</span>
                          </h4>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(previewUrl, '_blank')}
                              className="text-xs border-primary/30 text-primary hover:bg-primary/10"
                            >
                              Open Full Size
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPreviewUrl(null)}
                              className="text-primary hover:text-primary/80 hover:bg-primary/10"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="relative bg-background overflow-auto">
                          <iframe
                            src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewUrl)}&embedded=true`}
                            className="w-full h-[600px] border-0 bg-card"
                            title="CV Preview"
                            sandbox="allow-same-origin allow-scripts"
                            style={{ minHeight: '600px' }}
                          />
                        </div>
                      </div>
                    )}
                    </>
                  ) : (
                    <div className="bg-background rounded-lg p-4">
                      <p className="text-sm text-muted-foreground italic">
                        No CV/resume uploaded by the applicant
                      </p>
                    </div>
                  )}
                </div>



                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border">
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
                      onClick={() => handleCreateChatRoom(selectedApplication)}
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
                      className="text-muted-foreground hover:text-foreground"
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
              )}
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
}
