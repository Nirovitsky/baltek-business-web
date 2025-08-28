import { LucideIcon } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    label: string;
    type: 'positive' | 'negative' | 'neutral';
  };
  icon: LucideIcon;
  iconColor?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  iconColor = "text-primary" 
}: StatsCardProps) {
  return (
    <Card className="shadow-sm border border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
          </div>
          <div className={`w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center`}>
            <Icon className={`${iconColor} text-xl w-6 h-6`} />
          </div>
        </div>
        {change && (
          <div className="mt-4 flex items-center">
            <span
              className={`text-sm font-medium ${
                change.type === 'positive'
                  ? 'text-green-500'
                  : change.type === 'negative'
                  ? 'text-red-500'
                  : 'text-muted-foreground'
              }`}
            >
              {change.value}
            </span>
            <span className="text-muted-foreground text-sm ml-2">{change.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
