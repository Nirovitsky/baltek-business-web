import { useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { LogOut, Settings as SettingsIcon, Shield, Globe, Palette } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";


export default function Settings() {
  const { logout } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();


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
        showCreateButton={true}
      />

      <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
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
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <Palette className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="dark-mode">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Switch between light and dark themes
                    </p>
                  </div>
                </div>
                <Switch
                  id="dark-mode"
                  checked={theme === "dark"}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <Label>Language</Label>
                    <p className="text-sm text-muted-foreground">
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
                    <p className="text-sm text-muted-foreground">
                      Update your account password
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Change Password
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                    <LogOut className="w-5 h-5 text-destructive" />
                  </div>
                  <div className="space-y-1">
                    <Label>Log Out</Label>
                    <p className="text-sm text-muted-foreground">
                      End your current session
                    </p>
                  </div>
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
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
