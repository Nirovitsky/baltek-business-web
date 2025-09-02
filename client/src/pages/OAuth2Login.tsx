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
    <div className="min-h-screen bg-white dark:bg-gray-950 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/30 via-transparent to-blue-50/20 dark:from-gray-900/30 dark:to-blue-950/20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(24,119,242,0.05),transparent_70%)]"></div>
      
      {/* Header */}
      <header className="relative z-10">
        <div className="flex items-center justify-between p-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#1877F2] to-[#0056D3] rounded-2xl flex items-center justify-center shadow-lg">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-light text-gray-900 dark:text-white tracking-tight">
              {import.meta.env.VITE_APP_NAME || "baltek business"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <LanguageSelector variant="compact" />
            <Button 
              onClick={handleLogin} 
              className="h-12 px-8 bg-gradient-to-r from-[#1877F2] to-[#0056D3] hover:from-[#1565C0] hover:to-[#0040A1] text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#1877F2]/25 border-0" 
              disabled={isSigningIn}
            >
              {isSigningIn ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {t('auth.loggingIn')}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  {t('auth.loginButton')}
                  <ChevronRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="space-y-12">
            {/* What is this app */}
            <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1877F2]/10 rounded-full text-[#1877F2] font-medium text-sm">
                  <div className="w-2 h-2 bg-[#1877F2] rounded-full animate-pulse"></div>
                  HR Management Dashboard for baltek Karyera Platform
                </div>
                
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extralight text-gray-900 dark:text-white leading-[1.1] tracking-tight">
                  <span className="block font-medium bg-gradient-to-r from-[#1877F2] to-[#0056D3] bg-clip-text text-transparent">
                    baltek business
                  </span>
                  Dashboard
                </h1>
                
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed font-light max-w-2xl">
                  A comprehensive HR management platform designed specifically for companies using the baltek Karyera recruitment ecosystem. 
                  Streamline your hiring process from job posting to candidate communication.
                </p>
            </div>

            {/* Problems it solves */}
            <div className="space-y-6">
                <h2 className="text-2xl font-medium text-gray-900 dark:text-white">Challenges We Solve</h2>
                <div className="grid gap-4">
                  <div className="flex items-start gap-4 p-4 bg-red-50/50 dark:bg-red-950/20 rounded-xl border border-red-100/30 dark:border-red-900/30">
                    <div className="w-2 h-2 bg-red-400 rounded-full mt-3 flex-shrink-0"></div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-1">Fragmented HR Workflows</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Managing job postings, applications, and communications across multiple platforms wastes time and creates confusion.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 bg-orange-50/50 dark:bg-orange-950/20 rounded-xl border border-orange-100/30 dark:border-orange-900/30">
                    <div className="w-2 h-2 bg-orange-400 rounded-full mt-3 flex-shrink-0"></div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-1">Poor Candidate Experience</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Delayed responses and lack of real-time communication damage your company's reputation with potential hires.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 bg-yellow-50/50 dark:bg-yellow-950/20 rounded-xl border border-yellow-100/30 dark:border-yellow-900/30">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mt-3 flex-shrink-0"></div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-1">Limited Recruitment Insights</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Without proper analytics, you can't optimize your hiring process or track recruitment performance effectively.</p>
                    </div>
                  </div>
                </div>
            </div>

            {/* How it works */}
            <div className="space-y-6">
                <h2 className="text-2xl font-medium text-gray-900 dark:text-white">How baltek business Works</h2>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="group p-6 bg-white/60 dark:bg-gray-900/40 rounded-2xl border border-gray-200/20 dark:border-gray-700/30 hover:border-[#1877F2]/20 transition-all duration-300 backdrop-blur-sm">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#1877F2]/10 to-[#1877F2]/5 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Briefcase className="w-6 h-6 text-[#1877F2]" />
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">Centralized Job Management</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Create, edit, and track all your job postings from one dashboard. Automatically sync with the baltek Karyera platform.</p>
                  </div>

                  <div className="group p-6 bg-white/60 dark:bg-gray-900/40 rounded-2xl border border-gray-200/20 dark:border-gray-700/30 hover:border-[#1877F2]/20 transition-all duration-300 backdrop-blur-sm">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#1877F2]/10 to-[#1877F2]/5 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Users className="w-6 h-6 text-[#1877F2]" />
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">Smart Application Review</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Review and manage candidate applications with advanced filtering, sorting, and status tracking tools.</p>
                  </div>

                  <div className="group p-6 bg-white/60 dark:bg-gray-900/40 rounded-2xl border border-gray-200/20 dark:border-gray-700/30 hover:border-[#1877F2]/20 transition-all duration-300 backdrop-blur-sm">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#1877F2]/10 to-[#1877F2]/5 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <MessageCircle className="w-6 h-6 text-[#1877F2]" />
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">Real-time Communication</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Chat directly with candidates through integrated messaging. Share files and maintain conversation history.</p>
                  </div>

                  <div className="group p-6 bg-white/60 dark:bg-gray-900/40 rounded-2xl border border-gray-200/20 dark:border-gray-700/30 hover:border-[#1877F2]/20 transition-all duration-300 backdrop-blur-sm">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#1877F2]/10 to-[#1877F2]/5 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <BarChart3 className="w-6 h-6 text-[#1877F2]" />
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">Analytics & Insights</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Track recruitment metrics, analyze hiring patterns, and optimize your process with comprehensive reporting.</p>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}