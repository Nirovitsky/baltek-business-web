import { Link, useLocation } from "react-router-dom"
import {
  BarChart3,
  Briefcase,
  Users,
  MessageCircle,
  Settings,
  UserCircle,
  Bell,
  ChevronsUpDown,
  LogOut
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/useAuth"
import { useNotifications } from "@/hooks/useNotifications"
import BusinessSwitcher from "@/components/layout/BusinessSwitcher"

// Main navigation items
const mainNavigationItems = [
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
]

// Account items
const accountItems = [
  {
    name: "Profile",
    href: "/organization",
    icon: UserCircle,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation()
  const { logout, selectedOrganization, user } = useAuth()
  const { unreadCount } = useNotifications(false) // Don't fetch notifications in sidebar

  const getOrgInitials = (name?: string) => {
    if (!name) return 'ORG'
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="p-2">
          <BusinessSwitcher />
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavigationItems.map((item) => {
                const isActive = location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(item.href))
                const Icon = item.icon

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className="relative"
                    >
                      <Link to={item.href}>
                        <Icon />
                        <span>{item.name}</span>
                        {item.showBadge && unreadCount > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="ml-auto bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full"
                          >
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItems.map((item) => {
                const isActive = location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(item.href))
                const Icon = item.icon

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                    >
                      <Link to={item.href}>
                        <Icon />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
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
                    <AvatarImage 
                      src={selectedOrganization?.logo} 
                      alt={selectedOrganization?.display_name || selectedOrganization?.official_name} 
                    />
                    <AvatarFallback className="rounded-lg">
                      {getOrgInitials(selectedOrganization?.display_name || selectedOrganization?.official_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {selectedOrganization?.display_name || selectedOrganization?.official_name || "Organization"}
                    </span>
                    <span className="truncate text-xs">
                      {user?.first_name} {user?.last_name}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
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
                      <AvatarImage 
                        src={selectedOrganization?.logo} 
                        alt={selectedOrganization?.display_name || selectedOrganization?.official_name} 
                      />
                      <AvatarFallback className="rounded-lg">
                        {getOrgInitials(selectedOrganization?.display_name || selectedOrganization?.official_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {selectedOrganization?.display_name || selectedOrganization?.official_name || "Organization"}
                      </span>
                      <span className="truncate text-xs">
                        {user?.first_name} {user?.last_name}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/organization">
                    <UserCircle />
                    Profile
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
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}