import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { oauth2Service } from "@/lib/oauth2";
import { useAuth } from "@/hooks/useAuth";
import { Building2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OAuth2Login() {
  const navigate = useNavigate();
  const { isAuthenticated, hasOrganizations } = useAuth();

  // Redirect authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      navigate(hasOrganizations ? "/" : "/create-organization", { replace: true });
    }
  }, [isAuthenticated, hasOrganizations, navigate]);

  const handleLogin = () => {
    oauth2Service.initiateLogin();
  };

  // Auto-redirect to OAuth2 authorization immediately
  useEffect(() => {
    // Small delay to show the UI briefly before redirect
    const timer = setTimeout(() => {
      handleLogin();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">baltek business</CardTitle>
          <CardDescription>
            Secure authentication powered by OAuth2
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            You will be redirected to the secure Baltek authentication page to sign in.
          </div>

          <Button onClick={handleLogin} className="w-full">
            <ExternalLink className="w-4 h-4 mr-2" />
            Sign In with Baltek
          </Button>

          <div className="text-xs text-center text-muted-foreground">
            By signing in, you agree to our terms of service and privacy policy
          </div>
        </CardContent>
      </Card>
    </div>
  );
}