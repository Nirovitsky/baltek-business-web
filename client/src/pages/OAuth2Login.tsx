import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { oauth2Service } from "@/lib/oauth2";
import { useAuth } from "@/hooks/useAuth";
import { Building2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/ui/language-selector";
import { ThemeToggle } from "@/components/theme-toggle";

export default function OAuth2Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, hasOrganizations } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Redirect authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      navigate(hasOrganizations ? "/" : "/create-organization", { replace: true });
    }
  }, [isAuthenticated, hasOrganizations, navigate]);

  const handleLogin = async () => {
    try {
      setIsSigningIn(true);
      await oauth2Service.initiateLogin();
    } catch (error) {
      console.error('Failed to initiate login:', error);
      setIsSigningIn(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ThemeToggle />
        <LanguageSelector variant="compact" />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">{import.meta.env.VITE_APP_NAME || "baltek business"}</CardTitle>
          <CardDescription>
            {t('auth.loginTitle')}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            {t('auth.loginError')}
          </div>

          <Button onClick={handleLogin} className="w-full" disabled={isSigningIn}>
            <ExternalLink className="w-4 h-4 mr-2" />
            {isSigningIn ? t('auth.loggingIn') : t('auth.loginButton')}
          </Button>

          <div className="text-xs text-center text-muted-foreground">
            By signing in, you agree to our terms of service and privacy policy
          </div>
        </CardContent>
      </Card>
    </div>
  );
}