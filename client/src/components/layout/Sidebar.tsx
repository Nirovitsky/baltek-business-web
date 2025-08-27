import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  Briefcase,
  Users,
  MessageCircle,
  Settings, 
  UserCircle,
  Bell,
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
        {
          title: "Notifications",
          url: "/notifications",
          icon: Bell,
          showBadge: true,
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
  const { unreadCount } = useNotifications(false); // Don't fetch notifications in sidebar

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <BusinessSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {/* Main Navigation */}
        {data.navMain.map((group) => (
          <SidebarGroup key={group.title}>
            {group.title !== "Platform" && <SidebarGroupLabel>{group.title}</SidebarGroupLabel>}
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
                    {item.showBadge && unreadCount > 0 && (
                      <SidebarMenuAction className="peer-data-[size=sm]/menu-button:top-1">
                        <Badge variant="destructive" className="bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                      </SidebarMenuAction>
                    )}
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
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.avatar} alt={user?.first_name} />
                    <AvatarFallback className="rounded-lg">
                      {user?.first_name?.[0]}{user?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.first_name} {user?.last_name}
                    </span>
                    <span className="truncate text-xs">
                      {selectedOrganization?.official_name}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={user?.avatar} alt={user?.first_name} />
                      <AvatarFallback className="rounded-lg">
                        {user?.first_name?.[0]}{user?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user?.first_name} {user?.last_name}
                      </span>
                      <span className="truncate text-xs">
                        {selectedOrganization?.official_name}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/organization">
                    <UserCircle />
                    Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    <Settings />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
