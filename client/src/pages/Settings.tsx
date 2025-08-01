import { useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { LogOut, Settings as SettingsIcon, Bell, Shield, Globe, Palette } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { logout } = useAuth();
  const { toast } = useToast();
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar 
        title="Settings"
        description="Manage your account settings and preferences"
        showCreateButton={false}
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Preferences Section */}
          <Card className="shadow-md">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-2">
                <Palette className="w-5 h-5 text-primary" />
                <CardTitle>Preferences</CardTitle>
              </div>
              <CardDescription>
                Customize your application experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Palette className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="dark-mode">Dark Mode</Label>
                    <p className="text-sm text-gray-500">
                      Switch between light and dark themes
                    </p>
                  </div>
                </div>
                <Switch
                  id="dark-mode"
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Globe className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="space-y-1">
                    <Label>Language</Label>
                    <p className="text-sm text-gray-500">
                      Currently set to English
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Change
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notifications Section */}
          <Card className="shadow-md">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-primary" />
                <CardTitle>Notifications</CardTitle>
              </div>
              <CardDescription>
                Manage how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Bell className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Receive updates and alerts via email
                    </p>
                  </div>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Bell className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="push-notifications">Push Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Get instant browser notifications
                    </p>
                  </div>
                </div>
                <Switch
                  id="push-notifications"
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Section */}
          <Card className="shadow-md">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-primary" />
                <CardTitle>Security</CardTitle>
              </div>
              <CardDescription>
                Manage your account security and access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="space-y-1">
                    <Label>Password</Label>
                    <p className="text-sm text-gray-500">
                      Update your account password
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Change Password
                </Button>
              </div>

              <Separator />

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <Label className="text-red-700 font-medium">Session Management</Label>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-900">Log out from all devices</p>
                      <p className="text-sm text-red-700">
                        End all active sessions except this one
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-50">
                      Log Out All
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-900">Log out</p>
                      <p className="text-sm text-red-700">
                        End your current session
                      </p>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleLogout}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Log Out
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
