import { Link, useLocation } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  Briefcase,
  Users,
  MessageCircle,
  Bell,
  LogOut,
  UserCircle,
  ChevronUp,
  User2,
  MoreHorizontal,
  Building
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useHoverPrefetch } from "@/hooks/usePrefetch";
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
const getNavigationData = (t: any) => ({
  navMain: [
    {
      title: "Platform",
      url: "#",
      items: [
        {
          title: t('navigation.dashboard'),
          url: "/",
          icon: BarChart3,
        },
        {
          title: t('navigation.jobs'),
          url: "/jobs", 
          icon: Briefcase,
        },
        {
          title: t('navigation.applications'),
          url: "/applications",
          icon: Users,
        },
        {
          title: t('navigation.chat'),
          url: "/chat",
          icon: MessageCircle,
        },
        {
          title: t('navigation.notifications'),
          url: "/notifications",
          icon: Bell,
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: t('navigation.profile'),
      url: "/organization",
      icon: UserCircle,
    },
  ],
});

export default function AppSidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const { logout, selectedOrganization, user } = useAuth();
  const { prefetchRoute } = useHoverPrefetch();
  const { unreadCount } = useNotifications(false);
  
  const data = getNavigationData(t);
  
  const handleLogout = () => {
    logout();
  };

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
                      <Link 
                        to={item.url}
                        onMouseEnter={() => prefetchRoute(item.url)}
                        className="relative"
                      >
                        <item.icon />
                        <span>{item.title}</span>
                        {item.url === "/notifications" && unreadCount > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[18px] h-4 flex items-center justify-center rounded-full px-1 ml-auto"
                          >
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </Badge>
                        )}
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
                    <Link 
                      to={item.url}
                      onMouseEnter={() => prefetchRoute(item.url)}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
            {/* Logout Button with Confirmation */}
            <SidebarMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <SidebarMenuButton>
                    <LogOut className="h-4 w-4" />
                    <span>{t('auth.logout')}</span>
                  </SidebarMenuButton>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('auth.confirmLogout')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('auth.logoutConfirmation')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleLogout}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {t('auth.logout')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

    </Sidebar>
  );
}
