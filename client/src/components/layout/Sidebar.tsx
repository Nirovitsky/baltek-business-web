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
  const { logout, selectedOrganization } = useAuth();

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
      <div className="p-4 border-t border-gray-200">
        <Link href="/profile">
          <div className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <UserCircle className="text-primary w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Profile</p>
              <p className="text-xs text-gray-500">Manage your account</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
