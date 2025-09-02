import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { oauth2Service } from "@/lib/oauth2";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Building2, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OAuth2Callback() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setAuthenticated, fetchOrganizations } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        // Check for OAuth2 errors
        if (error) {
          throw new Error(errorDescription || error);
        }

        if (!code || !state) {
          throw new Error(t('auth.missingAuthCode'));
        }

        // Exchange code for tokens
        await oauth2Service.handleCallback(code, state);

        // Update auth state
        setAuthenticated(true);

        // Fetch organizations after successful authentication
        await fetchOrganizations();

        toast({
          title: t('auth.loginSuccessful'),
          description: t('auth.loginSuccessfulDescription'),
        });

        // Redirect to dashboard
        navigate("/", { replace: true });
      } catch (error: any) {
        console.error("OAuth2 callback error:", error);
        setError(error.message || t('auth.authenticationFailed'));
        toast({
          title: t('auth.loginFailed'),
          description: error.message || t('auth.authenticationFailed'),
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [searchParams, navigate, toast, setAuthenticated, fetchOrganizations]);

  const handleRetry = () => {
    oauth2Service.initiateLogin();
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-500 rounded-xl flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">{t('auth.authenticationFailedTitle')}</h2>
            <p className="text-muted-foreground mt-2">{error}</p>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRetry} className="w-full">
              {t('auth.tryAgain')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">{import.meta.env.VITE_APP_NAME || t('landing.appName')}</h2>
          <p className="text-muted-foreground mt-2">
            {isProcessing ? t('auth.completingSignIn') : t('auth.redirecting')}
          </p>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    </div>
  );
}