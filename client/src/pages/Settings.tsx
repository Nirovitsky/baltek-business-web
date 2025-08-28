import { useTranslation } from 'react-i18next';
import TopBar from "@/components/layout/TopBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LogOut, Settings as SettingsIcon, Globe, Palette, Monitor, Sun, Moon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";
import { LanguageSelector } from "@/components/ui/language-selector";


export default function Settings() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();


  const handleConfirmLogout = () => {
    logout();
    toast({
      title: t('auth.logoutSuccess'),
      description: t('auth.logoutSuccess'),
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar 
        title={t('settings.title')}
        description={t('settings.description')}
        showCreateButton={true}
      />

      <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Preferences Section */}
          <Card className="shadow-md">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-2">
                <Palette className="w-5 h-5 text-primary" />
                <CardTitle>{t('settings.general')}</CardTitle>
              </div>
              <CardDescription>
                {t('settings.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Language Settings */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <Label>{t('settings.language')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.selectLanguage')}
                    </p>
                  </div>
                </div>
                <div className="ml-13">
                  <LanguageSelector />
                </div>
              </div>

              <Separator />

              {/* Theme Settings */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <Palette className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <Label>{t('settings.theme')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.selectTheme')}
                    </p>
                  </div>
                </div>
                
                <RadioGroup
                  value={theme}
                  onValueChange={setTheme}
                  className="grid grid-cols-3 gap-4 pt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="light" />
                    <Label htmlFor="light" className="flex items-center gap-2 cursor-pointer">
                      <Sun className="w-4 h-4" />
                      {t('settings.lightMode')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="dark" />
                    <Label htmlFor="dark" className="flex items-center gap-2 cursor-pointer">
                      <Moon className="w-4 h-4" />
                      {t('settings.darkMode')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="system" id="system" />
                    <Label htmlFor="system" className="flex items-center gap-2 cursor-pointer">
                      <Monitor className="w-4 h-4" />
                      {t('settings.systemMode')}
                    </Label>
                  </div>
                </RadioGroup>
              </div>


            </CardContent>
          </Card>

          {/* Logout Button - Bottom Right */}
          <div className="flex justify-end pt-6">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will end your current session and you'll need to log in again to access your account.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleConfirmLogout}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Log Out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </main>
    </div>
  );
}
