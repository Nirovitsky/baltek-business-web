import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ArrowLeft, Mail, Phone, MapPin, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSelector } from "@/components/ui/language-selector";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ContactUs() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log("Contact form submitted");
  };

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
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-gray-900 dark:text-white mb-4">
            {t("contact.title", "Contact Us")}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            {t("contact.subtitle", "We're here to help. Reach out to us anytime.")}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-light">
                  {t("contact.getInTouch", "Get in Touch")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#1877F2]/10 rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6 text-[#1877F2]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {t("contact.email", "Email")}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">support@baltek.net</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#1877F2]/10 rounded-lg flex items-center justify-center">
                    <Phone className="w-6 h-6 text-[#1877F2]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {t("contact.phone", "Phone")}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">+993 12 345 678</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#1877F2]/10 rounded-lg flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-[#1877F2]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {t("contact.address", "Address")}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {t("contact.addressText", "Ashgabat, Turkmenistan")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#1877F2]/10 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-[#1877F2]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {t("contact.hours", "Business Hours")}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {t("contact.hoursText", "Monday - Friday: 9:00 AM - 6:00 PM")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-light">
                {t("contact.sendMessage", "Send us a Message")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">{t("contact.firstName", "First Name")}</Label>
                    <Input id="firstName" placeholder={t("contact.firstNamePlaceholder", "John")} />
                  </div>
                  <div>
                    <Label htmlFor="lastName">{t("contact.lastName", "Last Name")}</Label>
                    <Input id="lastName" placeholder={t("contact.lastNamePlaceholder", "Doe")} />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">{t("contact.email", "Email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("contact.emailPlaceholder", "john.doe@example.com")}
                  />
                </div>

                <div>
                  <Label htmlFor="subject">{t("contact.subject", "Subject")}</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder={t("contact.selectSubject", "Select a subject")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">{t("contact.generalInquiry", "General Inquiry")}</SelectItem>
                      <SelectItem value="support">{t("contact.technicalSupport", "Technical Support")}</SelectItem>
                      <SelectItem value="billing">{t("contact.billing", "Billing")}</SelectItem>
                      <SelectItem value="feature">{t("contact.featureRequest", "Feature Request")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="message">{t("contact.message", "Message")}</Label>
                  <Textarea
                    id="message"
                    placeholder={t("contact.messagePlaceholder", "Tell us how we can help you...")}
                    rows={6}
                  />
                </div>

                <Button type="submit" className="w-full">
                  {t("contact.sendMessage", "Send Message")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}