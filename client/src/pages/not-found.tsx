import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-foreground">{t("notFound.title")}</h1>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            {t("notFound.description")}
          </p>

          <Button 
            onClick={() => navigate("/")} 
            className="mt-6 w-full"
            variant="default"
          >
            <Home className="mr-2 h-4 w-4" />
            {t("notFound.backToHome")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
