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
                    {t('landing.heroTitle')}
                    <br />
                    Hire <span className="italic font-medium text-[#1877F2]">{t('landing.heroTitleHighlight')}</span>.
                  </h1>
                  
                  <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed font-light max-w-3xl mx-auto">
                    {t('landing.heroSubtitle')}
                  </p>
                </div>


                {/* Stats */}
                <div className="flex justify-center items-center gap-8 text-center">
                  <div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">250M+</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t('landing.candidatesWorldwide')}</div>
                  </div>
                  <div className="w-px h-12 bg-gray-300 dark:bg-gray-600"></div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">36M+</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t('landing.resumesAvailable')}</div>
                  </div>
                </div>
            </div>

            {/* Value Propositions - Indeed Style */}
            <div className="space-y-16">
              <div className="text-center">
                <h2 className="text-4xl font-light text-gray-900 dark:text-white mb-4">
                  {t('landing.peopleYouAreLookingFor')}
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  {t('landing.findAndConnect')}
                </p>
              </div>

              {/* Three-Step Process */}
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-[#1877F2] rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Briefcase className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white">{t('landing.postYourJob')}</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {t('landing.postYourJobDescription')}
                  </p>
                </div>

                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-[#1877F2] rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white">{t('landing.reviewApplications')}</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {t('landing.reviewApplicationsDescription')}
                  </p>
                </div>

                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-[#1877F2] rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <MessageCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white">{t('landing.connectAndHire')}</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {t('landing.connectAndHireDescription')}
                  </p>
                </div>
              </div>

              {/* Benefits Section */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-3xl p-8 md:p-12">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-light text-gray-900 dark:text-white mb-4">
                    {t('landing.whyChoose')}
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
                        <h3 className="font-medium text-gray-900 dark:text-white mb-1">{t('landing.accessToQualityCandidates')}</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">{t('landing.accessToQualityCandidatesDescription')}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white mb-1">{t('landing.streamlinedHiringProcess')}</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">{t('landing.streamlinedHiringProcessDescription')}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white mb-1">{t('landing.realTimeCollaboration')}</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">{t('landing.realTimeCollaborationDescription')}</p>
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
                        <h3 className="font-medium text-gray-900 dark:text-white mb-1">{t('landing.dataDrivenInsights')}</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">{t('landing.dataDrivenInsightsDescription')}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white mb-1">{t('landing.enterpriseSecurity')}</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">{t('landing.enterpriseSecurityDescription')}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white mb-1">{t('landing.dedicatedSupport')}</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">{t('landing.dedicatedSupportDescription')}</p>
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