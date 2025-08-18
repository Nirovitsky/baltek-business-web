import { Link, useLocation } from "wouter";
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
    name: "Job Postings",
    href: "/jobs",
    icon: Briefcase,
  },
  {
    name: "Applications",
    href: "/applications",
    icon: Users,
  },
  {
    name: "Messages",
    href: "/messages",
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
  const [location] = useLocation();
  const { logout, selectedOrganization, user } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <div className="w-64 bg-sidebar shadow-lg border-r border-sidebar-border flex flex-col">
      {/* Business Switcher */}
      <div className="p-6 border-b border-sidebar-border">
        <BusinessSwitcher />
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
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

      {/* User Profile */}
      <div className="p-3 border-t border-sidebar-border">
        <Link href="/profile">
          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/20 p-4 cursor-pointer hover:from-primary/10 hover:via-primary/15 hover:to-primary/25 transition-all duration-300 border border-primary/10 hover:border-primary/20 hover:shadow-lg">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative flex items-center space-x-3">
              <div className="relative">
                <Avatar className="w-12 h-12 shadow-lg ring-2 ring-white/20 group-hover:ring-white/40 transition-all duration-300">
                  <AvatarImage 
                    src={user?.avatar} 
                    alt={user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'User'} 
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-white font-bold text-sm">
                    {user ? (
                      `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`
                    ) : (
                      <UserCircle className="w-6 h-6" />
                    )}
                  </AvatarFallback>
                </Avatar>

              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-semibold text-sidebar-foreground truncate">
                    {user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User' : 'Profile'}
                  </p>
                  <div className="w-2 h-2 bg-primary/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <p className="text-xs text-muted-foreground truncate font-medium">
                  {user?.phone || 'Personal Account'}
                </p>
              </div>
            </div>
            
            {/* Hover Arrow */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
              <div className="w-5 h-5 text-primary/60">
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
