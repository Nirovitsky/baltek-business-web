import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  Briefcase,
  Users,
  MessageCircle,
  Settings, 
  UserCircle,
  ChevronUp,
  User2,
  MoreHorizontal,
  Building
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
} from "@/components/ui/sidebar";
import BusinessSwitcher from "./BusinessSwitcher";
import { useNotifications } from "@/hooks/useNotifications";

// Navigation data structure following shadcn/ui blocks pattern
const data = {
  navMain: [
    {
      title: "Platform",
      url: "#",
      items: [
        {
          title: "Dashboard",
          url: "/",
          icon: BarChart3,
        },
        {
          title: "Jobs",
          url: "/jobs", 
          icon: Briefcase,
        },
        {
          title: "Applications",
          url: "/applications",
          icon: Users,
        },
        {
          title: "Chat",
          url: "/chat",
          icon: MessageCircle,
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Profile",
      url: "/organization",
      icon: UserCircle,
    },
    {
      title: "Settings", 
      url: "/settings",
      icon: Settings,
    },
  ],
};

export default function AppSidebar() {
  const location = useLocation();
  const { logout, selectedOrganization, user } = useAuth();

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <BusinessSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {/* Main Navigation */}
        {data.navMain.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
                const isActive = location.pathname === item.url || (item.url !== "/" && location.pathname.startsWith(item.url));
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}

        {/* Secondary Navigation */}
        <SidebarGroup className="mt-auto">
          <SidebarMenu>
            {data.navSecondary.map((item) => {
              const isActive = location.pathname === item.url || (item.url !== "/" && location.pathname.startsWith(item.url));
              
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

    </Sidebar>
  );
}
