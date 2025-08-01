import { Link, useLocation } from "wouter";
import {
  BarChart3,
  Briefcase,
  Users,
  MessageCircle,
  Building2,
  Settings, UserCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BusinessSwitcher from "./BusinessSwitcher";

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

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      {/* Logo and Company */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center overflow-hidden">
            {selectedOrganization?.logo ? (
              <img 
                src={selectedOrganization.logo} 
                alt={selectedOrganization.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="text-white text-lg" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {selectedOrganization?.display_name || selectedOrganization?.name || 'baltek business'}
            </h1>
            <p className="text-sm text-gray-500">Dashboard</p>
          </div>
        </div>
        
        {/* Business Switcher */}
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
                  "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                  isActive
                    ? "bg-primary/10 text-primary border-l-4 border-primary"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-gray-200">
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
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User' : 'Profile'}
                  </p>
                  <div className="w-2 h-2 bg-primary/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <p className="text-xs text-gray-600 truncate font-medium">
                  {user?.email || 'Personal Account'}
                </p>
                <div className="mt-1 flex items-center space-x-1">
                  <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600 font-medium">Online</span>
                </div>
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
