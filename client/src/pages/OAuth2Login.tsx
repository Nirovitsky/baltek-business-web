import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { oauth2Service } from "@/lib/oauth2";
import { useAuth } from "@/hooks/useAuth";
import { Building2, ExternalLink, Users, Briefcase, MessageCircle, BarChart3, ChevronRight, Star } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1877F2] rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {import.meta.env.VITE_APP_NAME || "baltek business"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSelector variant="compact" />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Hero Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-[#1877F2] font-medium">
                  <Star className="w-5 h-5 fill-current" />
                  <span>Professional HR Management Platform</span>
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                  Streamline Your
                  <span className="text-[#1877F2] block">HR Operations</span>
                </h1>
                
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  Manage job postings, review applications, and communicate with candidates 
                  all in one powerful platform. Built for modern HR teams who value efficiency and results.
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
                  <div className="w-10 h-10 bg-[#1877F2]/10 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-[#1877F2]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Job Management</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Create & track positions</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
                  <div className="w-10 h-10 bg-[#1877F2]/10 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-[#1877F2]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Candidate Pipeline</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Review applications</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
                  <div className="w-10 h-10 bg-[#1877F2]/10 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-[#1877F2]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Real-time Chat</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Communicate instantly</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
                  <div className="w-10 h-10 bg-[#1877F2]/10 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-[#1877F2]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Analytics</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Track performance</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Login Card */}
            <div className="flex justify-center lg:justify-end">
              <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                <CardHeader className="text-center space-y-4 pb-6">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#1877F2] to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                      Welcome Back
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      Sign in to access your HR dashboard
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <Button 
                    onClick={handleLogin} 
                    className="w-full h-12 bg-[#1877F2] hover:bg-blue-600 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl" 
                    disabled={isSigningIn}
                  >
                    <ExternalLink className="w-5 h-5 mr-3" />
                    {isSigningIn ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        {t('auth.loggingIn')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        {t('auth.loginButton')}
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>

                  <div className="text-xs text-center text-gray-500 dark:text-gray-400 leading-relaxed">
                    By signing in, you agree to our terms of service and privacy policy
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}