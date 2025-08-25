import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/layout/TopBar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { apiService } from "@/lib/api";
import { User, Search, MessageCircle, FileText, Download, MapPin, Calendar, Briefcase, X, Eye, UserX, UserCheck, AlertTriangle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { JobApplication, PaginatedResponse } from "@/types";

// Helper function to get status colors for applications (plain text, no borders)
const getStatusTextColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'text-primary';
    case 'ongoing':
      return 'text-green-700 dark:text-green-300';
    case 'rejected':
      return 'text-red-700 dark:text-red-300';
    case 'hired':
      return 'text-green-700 dark:text-green-300';
    case 'expired':
      return 'text-muted-foreground';
    default:
      return 'text-muted-foreground';  
  }
};

// Helper function to determine actual status (check for active chats)
const getActualStatus = (application: JobApplication, findExistingRoom: any) => {
  // If there's an existing chat room with this user, status should be ongoing
  if (application.owner?.id && findExistingRoom(application.owner.id)) {
    return 'ongoing';
  }
  return application.status;
};

export default function Applications() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{ applicationId: number; action: string; applicantName: string } | null>(null);
  
  const { createChatMutation, findExistingRoom } = useUserProfile(undefined, { fetchRooms: true });
  
  const { toast } = useToast();
  const { selectedOrganization } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['/jobs/applications/', statusFilter, selectedOrganization?.id],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (selectedOrganization) params.append('organization', selectedOrganization.id.toString());
      
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
    mutationFn: ({ id, status }: { id: number; status: string }) => {
      console.log(`Attempting to update application ${id} to status: ${status}`);
      return apiService.request(`/jobs/applications/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/jobs/applications/'] });
      toast({
        title: "Success",
        description: "Application status updated successfully",
      });
    },
    onError: (error: any) => {
      console.error('Application status update error:', error);
      toast({
        title: "Error",
        description: `Failed to update status: ${error.message || 'Unknown error'}. The backend may still have references to old status values.`,
        variant: "destructive",
      });
    },
  });



  const handleStatusChange = (applicationId: number, newStatus: string) => {
    updateApplicationMutation.mutate({ id: applicationId, status: newStatus });
  };

  // Handle action confirmations
  const handleConfirmAction = () => {
    if (!pendingAction) return;
    
    updateApplicationMutation.mutate({ 
      id: pendingAction.applicationId, 
      status: pendingAction.action 
    });
    setPendingAction(null);
  };

  // Handle chat creation
  const handleStartChat = async (application: JobApplication) => {
    if (!application.id || !application.owner?.id) {
      toast({
        title: "Error",
        description: "Cannot start chat: Application information not available",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if chat room already exists for this application
      const existingRoom = findExistingRoom(application.owner.id);
      
      if (existingRoom) {
        // Navigate to existing chat room
        navigate(`/chat?room=${existingRoom.id}`);
      } else {
        // Create new chat room using application ID
        const roomData = await createChatMutation.mutateAsync(application.id);
        if (roomData?.id) {
          navigate(`/chat?room=${roomData.id}`);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start chat",
        variant: "destructive",
      });
    }
  };

  // Sort applications by ID in descending order (newest first, since higher ID = more recent)
  const applications = data?.results ? 
    [...data.results].sort((a, b) => b.id - a.id) : 
    [];
  
  // Apply search filter
  const filteredApplications = applications.filter(app => 
    searchTerm === "" || 
    (`${app.owner?.first_name || ''} ${app.owner?.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (typeof app.job === 'object' && app.job.title?.toLowerCase().includes(searchTerm.toLowerCase()))
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
              <SelectItem value="ongoing">Ongoing</SelectItem>
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
                              if (application.owner?.id) {
                                navigate(`/user/${application.owner.id}`);
                              }
                            }}
                          >
                            <AvatarImage 
                              src={application.owner?.avatar} 
                              alt={`${application.owner?.first_name || ''} ${application.owner?.last_name || ''}`}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                              {application.owner?.first_name?.[0]}{application.owner?.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="min-w-0">
                            <div 
                              className="font-medium text-foreground cursor-pointer hover:text-primary transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (application.owner?.id) {
                                  navigate(`/user/${application.owner.id}`);
                                }
                              }}
                            >
                              {`${application.owner?.first_name || ''} ${application.owner?.last_name || ''}`}
                            </div>
                            {application.owner?.email && (
                              <div className="text-sm text-muted-foreground flex items-center space-x-1">
                                <Briefcase className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{application.owner.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="font-medium">{typeof application.job === 'object' ? application.job.title : 'Job Title'}</div>
                        <div className="text-sm text-muted-foreground">{typeof application.job === 'object' && application.job.organization && typeof application.job.organization === 'object' ? (application.job.organization as any).name || 'Organization' : 'Organization'}</div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span>{typeof application.job === 'object' && application.job.location && typeof application.job.location === 'object' ? (application.job.location as any).name || 'Location' : 'Not specified'}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {(() => {
                          const actualStatus = getActualStatus(application, findExistingRoom);
                          return (
                            <span className={`text-sm font-medium ${getStatusTextColor(actualStatus)}`}>
                              {actualStatus ? actualStatus.charAt(0).toUpperCase() + actualStatus.slice(1) : 'Unknown'}
                            </span>
                          );
                        })()}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          <span>Recently</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {application.status !== 'rejected' && application.status !== 'hired' && application.status !== 'expired' ? (
                            <>
                              <div onClick={(e) => e.stopPropagation()}>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                      disabled={updateApplicationMutation.isPending}
                                    >
                                      <UserX className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-red-500" />
                                        Reject Application
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to reject the application from {`${application.owner?.first_name || ''} ${application.owner?.last_name || ''}`}? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleStatusChange(application.id, 'rejected')}
                                        className="bg-red-500 hover:bg-red-600"
                                      >
                                        Reject
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>

                              <div onClick={(e) => e.stopPropagation()}>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                                      disabled={updateApplicationMutation.isPending}
                                    >
                                      <UserCheck className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="flex items-center gap-2">
                                        <UserCheck className="h-5 w-5 text-green-500" />
                                        Hire Candidate
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to hire {`${application.owner?.first_name || ''} ${application.owner?.last_name || ''}`}? This will mark their application as hired.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleStatusChange(application.id, 'hired')}
                                        className="bg-green-500 hover:bg-green-600"
                                      >
                                        Hire
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>

                              {(application.status === 'pending' || application.status === 'ongoing') && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartChat(application);
                                  }}
                                  disabled={createChatMutation.isPending}
                                >
                                  <MessageCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
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
            <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto custom-scrollbar">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-3">
                  <Avatar 
                    className="w-12 h-12 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all duration-200"
                    onClick={() => {
                      if (selectedApplication.owner?.id) {
                        navigate(`/user/${selectedApplication.owner.id}`);
                        setSelectedApplication(null);
                      }
                    }}
                  >
                    <AvatarImage 
                      src={selectedApplication.owner?.avatar} 
                      alt={`${selectedApplication.owner?.first_name || ''} ${selectedApplication.owner?.last_name || ''}`}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                      {selectedApplication.owner?.first_name?.[0]}{selectedApplication.owner?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div 
                    className="cursor-pointer hover:text-primary transition-colors duration-200"
                    onClick={() => {
                      if (selectedApplication.owner?.id) {
                        navigate(`/user/${selectedApplication.owner.id}`);
                        setSelectedApplication(null);
                      }
                    }}
                  >
                    <h2 className="text-xl font-bold text-foreground">
                      {`${selectedApplication.owner?.first_name || ''} ${selectedApplication.owner?.last_name || ''}`}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Application for {typeof selectedApplication.job === 'object' ? selectedApplication.job.title : 'Job'}
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
                      {selectedApplication.owner?.email && (
                        <div className="flex items-center space-x-2">
                          <Briefcase className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{selectedApplication.owner.email}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{typeof selectedApplication.job === 'object' && selectedApplication.job.location && typeof selectedApplication.job.location === 'object' ? (selectedApplication.job.location as any).name || 'Location' : 'Not specified'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Application Status</h3>
                    <div className="space-y-2">
                      <span className={`text-sm font-medium ${getStatusTextColor(getActualStatus(selectedApplication, findExistingRoom))}`}>
                        {(() => {
                          const actualStatus = getActualStatus(selectedApplication, findExistingRoom);
                          return actualStatus ? actualStatus.charAt(0).toUpperCase() + actualStatus.slice(1) : 'Unknown';
                        })()}
                      </span>
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
                    <div className="bg-muted/50 border rounded-lg p-4">
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
                                link.download = `${selectedApplication.owner?.first_name || 'user'}_${selectedApplication.owner?.last_name || 'cv'}_CV.pdf`;
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
                    <div className="bg-background border rounded-lg p-4">
                      <p className="text-sm text-muted-foreground italic">
                        No CV/resume uploaded by the applicant
                      </p>
                    </div>
                  )}
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
