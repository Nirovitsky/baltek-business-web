import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSelector } from "@/components/ui/language-selector";

export default function PrivacyPolicy() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-[#1877F2] to-[#0056D3] rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-light text-gray-900 dark:text-white">
              {import.meta.env.VITE_APP_NAME || t("landing.appName")}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <LanguageSelector variant="compact" />
            <Button
              onClick={() => navigate("/login")}
              variant="ghost"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("common.back", "Back")}
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-light text-gray-900 dark:text-white">
              {t("privacyPolicy.title", "Privacy Policy")}
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              {t("privacyPolicy.lastUpdated", "Last updated: November 2024")}
            </p>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <section className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-3">{t("privacyPolicy.introduction", "Introduction")}</h2>
                <p className="text-gray-700 dark:text-gray-300">
                  {t("privacyPolicy.introText", "This Privacy Policy describes how baltek business collects, uses, and protects your personal information when you use our HR dashboard platform.")}
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">{t("privacyPolicy.dataCollection", "Information We Collect")}</h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>{t("privacyPolicy.personalInfo", "Personal information such as name, email, and contact details")}</li>
                  <li>{t("privacyPolicy.jobData", "Job posting and application data")}</li>
                  <li>{t("privacyPolicy.usageData", "Usage analytics and platform interaction data")}</li>
                  <li>{t("privacyPolicy.communicationData", "Communication records and messages")}</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">{t("privacyPolicy.dataUse", "How We Use Your Information")}</h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>{t("privacyPolicy.serviceProvision", "To provide and improve our HR dashboard services")}</li>
                  <li>{t("privacyPolicy.communication", "To communicate with you about your account and services")}</li>
                  <li>{t("privacyPolicy.matching", "To facilitate job matching and candidate connections")}</li>
                  <li>{t("privacyPolicy.analytics", "To analyze usage patterns and improve platform performance")}</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">{t("privacyPolicy.dataProtection", "Data Protection")}</h2>
                <p className="text-gray-700 dark:text-gray-300">
                  {t("privacyPolicy.protectionText", "We implement industry-standard security measures to protect your personal information. Your data is encrypted in transit and at rest, and access is restricted to authorized personnel only.")}
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">{t("privacyPolicy.yourRights", "Your Rights")}</h2>
                <p className="text-gray-700 dark:text-gray-300">
                  {t("privacyPolicy.rightsText", "You have the right to access, update, or delete your personal information. You may also request data portability or object to certain processing activities. Contact us to exercise these rights.")}
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">{t("privacyPolicy.contact", "Contact Us")}</h2>
                <p className="text-gray-700 dark:text-gray-300">
                  {t("privacyPolicy.contactText", "If you have any questions about this Privacy Policy, please contact us through our support channels.")}
                </p>
              </div>
            </section>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}