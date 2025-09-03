import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSelector } from "@/components/ui/language-selector";

export default function TermsOfService() {
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
              {t("termsOfService.title", "Terms of Service")}
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              {t("termsOfService.lastUpdated", "Last updated: November 2024")}
            </p>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <section className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-3">{t("termsOfService.acceptance", "Acceptance of Terms")}</h2>
                <p className="text-gray-700 dark:text-gray-300">
                  {t("termsOfService.acceptanceText", "By accessing and using baltek business, you accept and agree to be bound by the terms and provision of this agreement.")}
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">{t("termsOfService.serviceDescription", "Service Description")}</h2>
                <p className="text-gray-700 dark:text-gray-300">
                  {t("termsOfService.serviceText", "baltek business is a comprehensive HR dashboard platform that enables organizations to manage job postings, review applications, and communicate with candidates.")}
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">{t("termsOfService.userResponsibilities", "User Responsibilities")}</h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>{t("termsOfService.accurateInfo", "Provide accurate and up-to-date information")}</li>
                  <li>{t("termsOfService.lawfulUse", "Use the platform in compliance with applicable laws")}</li>
                  <li>{t("termsOfService.respectfulConduct", "Maintain respectful and professional conduct")}</li>
                  <li>{t("termsOfService.accountSecurity", "Protect your account credentials and notify us of any security breaches")}</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">{t("termsOfService.prohibitedUse", "Prohibited Uses")}</h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>{t("termsOfService.illegalActivities", "Any illegal activities or violation of laws")}</li>
                  <li>{t("termsOfService.harassment", "Harassment, discrimination, or inappropriate content")}</li>
                  <li>{t("termsOfService.spam", "Sending spam, bulk messages, or unsolicited communications")}</li>
                  <li>{t("termsOfService.systemInterference", "Attempting to interfere with or disrupt the platform")}</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">{t("termsOfService.intellectualProperty", "Intellectual Property")}</h2>
                <p className="text-gray-700 dark:text-gray-300">
                  {t("termsOfService.ipText", "The platform and its original content, features, and functionality are owned by baltek and are protected by international copyright, trademark, and other intellectual property laws.")}
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">{t("termsOfService.limitation", "Limitation of Liability")}</h2>
                <p className="text-gray-700 dark:text-gray-300">
                  {t("termsOfService.limitationText", "In no event shall baltek be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the platform.")}
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">{t("termsOfService.termination", "Termination")}</h2>
                <p className="text-gray-700 dark:text-gray-300">
                  {t("termsOfService.terminationText", "We may terminate or suspend your account and access to the platform immediately, without prior notice, for any reason, including breach of these Terms.")}
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">{t("termsOfService.changes", "Changes to Terms")}</h2>
                <p className="text-gray-700 dark:text-gray-300">
                  {t("termsOfService.changesText", "We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting to the platform.")}
                </p>
              </div>
            </section>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}