import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  Briefcase,
  Users,
  MessageCircle,
  Building2,
  Settings, 
  UserCircle,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import BusinessSwitcher from "./BusinessSwitcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { useNotifications } from "@/hooks/useNotifications";

const navigationItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: BarChart3,
  },
  {
    name: "Jobs",
    href: "/jobs",
    icon: Briefcase,
  },
  {
    name: "Applications",
    href: "/applications",
    icon: Users,
  },
  {
    name: "Chat",
    href: "/chat",
    icon: MessageCircle,
  },
  {
    name: "Notifications",
    href: "/notifications",
    icon: Bell,
    showBadge: true,
  },
  {
    name: "Organization",
    href: "/organization",
    icon: Building2,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  const location = useLocation();
  const { logout, selectedOrganization, user } = useAuth();
  const { unreadCount } = useNotifications(false); // Don't fetch notifications in sidebar

  return (
    <div className="w-64 bg-sidebar shadow-lg border-r border-sidebar-border flex flex-col">
      {/* Business Switcher */}
      <div className="p-6 border-b border-sidebar-border">
        <BusinessSwitcher />
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link key={item.href} to={item.href}>
              <div
                className={cn(
                  "flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                  isActive
                    ? "bg-primary/10 text-primary border-l-4 border-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <div className="flex items-center">
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </div>
                {item.showBadge && unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-auto bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

    </div>
  );
}
