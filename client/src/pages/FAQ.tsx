import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ArrowLeft, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSelector } from "@/components/ui/language-selector";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState } from "react";

export default function FAQ() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const faqCategories = [
    {
      title: t("faq.gettingStarted", "Getting Started"),
      items: [
        {
          question: t("faq.q1", "How do I create an account?"),
          answer: t("faq.a1", "Click the 'Sign In' button and follow the OAuth2 authentication process to create your account.")
        },
        {
          question: t("faq.q2", "How do I set up my organization?"),
          answer: t("faq.a2", "After logging in, you'll be guided through the organization setup process where you can add your company details and configure settings.")
        },
        {
          question: t("faq.q3", "What features are available?"),
          answer: t("faq.a3", "You can post jobs, review applications, communicate with candidates, and manage your organization's hiring process all in one place.")
        }
      ]
    },
    {
      title: t("faq.jobPosting", "Job Posting"),
      items: [
        {
          question: t("faq.q4", "How do I create a job posting?"),
          answer: t("faq.a4", "Navigate to the Jobs section and click 'Create Job'. Fill in the job details, requirements, and publish your posting.")
        },
        {
          question: t("faq.q5", "Can I edit a job after posting?"),
          answer: t("faq.a5", "Yes, you can edit job postings at any time from the Jobs management page. Changes will be reflected immediately.")
        },
        {
          question: t("faq.q6", "How long do job postings stay active?"),
          answer: t("faq.a6", "Job postings remain active until you manually close them or until their specified end date.")
        }
      ]
    },
    {
      title: t("faq.applications", "Applications"),
      items: [
        {
          question: t("faq.q7", "How do I review applications?"),
          answer: t("faq.a7", "Go to the Applications section to view all submitted applications. You can filter, sort, and review candidate profiles.")
        },
        {
          question: t("faq.q8", "Can I message candidates directly?"),
          answer: t("faq.a8", "Yes, you can communicate with candidates through our built-in messaging system for real-time communication.")
        },
        {
          question: t("faq.q9", "How do I track application status?"),
          answer: t("faq.a9", "Each application has a status that you can update (Under Review, Interview, Hired, Rejected) to track progress.")
        }
      ]
    },
    {
      title: t("faq.account", "Account & Settings"),
      items: [
        {
          question: t("faq.q10", "How do I update my profile?"),
          answer: t("faq.a10", "Go to the Profile section where you can update your personal information, contact details, and preferences.")
        },
        {
          question: t("faq.q11", "Can I change my organization details?"),
          answer: t("faq.a11", "Yes, organization details can be updated from the Organization section in your dashboard.")
        },
        {
          question: t("faq.q12", "How do I enable notifications?"),
          answer: t("faq.a12", "Notification preferences can be configured in your account settings to receive updates about applications and messages.")
        }
      ]
    }
  ];

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

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
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-gray-900 dark:text-white mb-4">
            {t("faq.title", "Frequently Asked Questions")}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            {t("faq.subtitle", "Find answers to common questions about using baltek business.")}
          </p>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder={t("faq.searchPlaceholder", "Search FAQ...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* FAQ Content */}
        <div className="space-y-8">
          {filteredCategories.map((category, categoryIndex) => (
            <Card key={categoryIndex}>
              <CardHeader>
                <CardTitle className="text-2xl font-light text-gray-900 dark:text-white">
                  {category.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {category.items.map((item, itemIndex) => (
                    <AccordionItem key={itemIndex} value={`item-${categoryIndex}-${itemIndex}`}>
                      <AccordionTrigger className="text-left font-medium">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-700 dark:text-gray-300">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}

          {filteredCategories.length === 0 && searchTerm && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">
                  {t("faq.noResults", "No FAQ items found matching your search.")}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Still need help section */}
        <Card className="mt-12">
          <CardContent className="text-center py-8">
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-4">
              {t("faq.stillNeedHelp", "Still need help?")}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t("faq.contactSupport", "Can't find what you're looking for? Contact our support team.")}
            </p>
            <Button onClick={() => navigate("/contact")}>
              {t("faq.contactUs", "Contact Us")}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}