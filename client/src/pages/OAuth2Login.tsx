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
            {/* Hero Section - Indeed Style */}
            <div className="space-y-12 text-center">
                <div className="space-y-6">
                  <div className="inline-block px-4 py-2 bg-[#1877F2]/10 rounded-full text-[#1877F2] font-medium text-sm">
                    baltek business
                  </div>
                  
                  <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light text-gray-900 dark:text-white leading-[1.1] tracking-tight">
                    Hire faster. Hire easier.
                    <br />
                    Hire <span className="italic font-medium text-[#1877F2]">smarter</span>.
                  </h1>
                  
                  <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed font-light max-w-3xl mx-auto">
                    Connect with top talent on the baltek Karyera platform. Streamline your entire hiring process from job posting to final interviews.
                  </p>
                </div>

                {/* CTA Section */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <div className="flex flex-col sm:flex-row gap-2 p-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 min-w-[400px]">
                    <input 
                      type="text" 
                      placeholder="What job title are you hiring for?" 
                      className="flex-1 px-4 py-3 text-gray-900 dark:text-white bg-transparent border-0 outline-none placeholder:text-gray-500"
                    />
                    <button className="px-6 py-3 bg-[#1877F2] hover:bg-[#1565C0] text-white font-medium rounded-lg transition-colors">
                      Get started
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex justify-center items-center gap-8 text-center">
                  <div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">250M+</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">candidates worldwide</div>
                  </div>
                  <div className="w-px h-12 bg-gray-300 dark:bg-gray-600"></div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">36M+</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">resumes available</div>
                  </div>
                </div>
            </div>

            {/* Value Propositions - Indeed Style */}
            <div className="space-y-16">
              <div className="text-center">
                <h2 className="text-4xl font-light text-gray-900 dark:text-white mb-4">
                  The people you're looking for are here
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Find and connect with your candidates on a leading global matching and hiring platform.
                </p>
              </div>

              {/* Three-Step Process */}
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-[#1877F2] rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Briefcase className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white">Post your job</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Create compelling job descriptions using our templates and screening tools to attract quality candidates who meet your criteria.
                  </p>
                </div>

                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-[#1877F2] rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white">Review applications</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Use smart filtering and evaluation tools to quickly identify the best candidates from your applicant pool.
                  </p>
                </div>

                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-[#1877F2] rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <MessageCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white">Connect and hire</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Communicate directly with candidates, schedule interviews, and make hiring decisions all in one platform.
                  </p>
                </div>
              </div>

              {/* Benefits Section */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-3xl p-8 md:p-12">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-light text-gray-900 dark:text-white mb-4">
                    Why choose baltek business?
                  </h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white mb-1">Access to quality candidates</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Tap into baltek Karyera's extensive network of active job seekers and professionals.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white mb-1">Streamlined hiring process</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Manage your entire recruitment workflow from one integrated platform.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white mb-1">Real-time collaboration</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Keep your hiring team aligned with instant messaging and shared candidate notes.</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white mb-1">Data-driven insights</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Make informed decisions with comprehensive analytics and hiring performance metrics.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white mb-1">Enterprise security</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Rest assured with enterprise-grade security and data protection standards.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white mb-1">Dedicated support</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Get help when you need it with our responsive customer support team.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}