'use client';

import { useMemo } from 'react';
import {
  Home,
  FolderKanban,
  Users,
  Wallet,
  CalendarDays,
  Vote,
  CreditCard,
  UsersRound,
  MessageSquare,
  Newspaper,
  MonitorPlay,
  UserCircle,
  LogOut,
  Activity,
  Settings,
  Camera,
  Bell,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

// ==================== Types ====================

interface AppSidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isMobile: boolean;
}

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

interface MenuSection {
  label: string;
  urls: string[];
}

// ==================== Menu Configuration ====================

const allRoles: UserRole[] = [
  'admin',
  'président',
  'secretaire',
  'secretaire_general',
  'trésorier',
  'commissaire',
  'celcom',
  'responsable_communication',
  'membre',
];

const menuItems: MenuItem[] = [
  {
    title: 'Tableau de bord',
    url: '/dashboard',
    icon: Home,
    roles: [...allRoles],
  },
  {
    title: 'Projets',
    url: '/projects',
    icon: FolderKanban,
    roles: ['admin', 'président', 'secretaire', 'secretaire_general', 'trésorier', 'commissaire', 'responsable_communication', 'membre'],
  },
  {
    title: 'Membres',
    url: '/members',
    icon: Users,
    roles: ['admin', 'président', 'secretaire', 'secretaire_general', 'trésorier', 'commissaire'],
  },
  {
    title: 'Budget',
    url: '/budget',
    icon: Wallet,
    roles: ['admin', 'président', 'secretaire', 'secretaire_general', 'trésorier'],
  },
  {
    title: 'Calendrier',
    url: '/calendar',
    icon: CalendarDays,
    roles: ['admin', 'président', 'secretaire', 'secretaire_general', 'trésorier', 'commissaire', 'responsable_communication', 'membre'],
  },
  {
    title: 'Votes',
    url: '/votes',
    icon: Vote,
    roles: ['admin', 'président', 'secretaire', 'secretaire_general', 'trésorier', 'commissaire', 'membre'],
  },
  {
    title: 'Paiements',
    url: '/payments',
    icon: CreditCard,
    roles: ['admin', 'président', 'secretaire', 'secretaire_general', 'trésorier', 'commissaire', 'membre'],
  },
  {
    title: 'Recensement',
    url: '/census',
    icon: UsersRound,
    roles: ['admin', 'président', 'secretaire', 'secretaire_general', 'trésorier', 'commissaire', 'membre'],
  },
  {
    title: 'Messagerie',
    url: '/chat',
    icon: MessageSquare,
    roles: ['admin', 'président', 'secretaire', 'secretaire_general', 'trésorier', 'commissaire', 'celcom', 'responsable_communication', 'membre'],
  },
  {
    title: 'Journal',
    url: '/activity',
    icon: Activity,
    roles: [...allRoles],
  },
  {
    title: 'Blog',
    url: '/blog',
    icon: Newspaper,
    roles: [...allRoles, 'visiteur'],
  },
  {
    title: 'Souvenirs',
    url: '/gallery',
    icon: Camera,
    roles: [...allRoles, 'visiteur'],
  },
  {
    title: 'Publicités',
    url: '/ads',
    icon: MonitorPlay,
    roles: ['admin', 'président', 'secretaire', 'secretaire_general', 'celcom', 'responsable_communication'],
  },
  {
    title: 'Notifications',
    url: '/notifications',
    icon: Bell,
    roles: [...allRoles],
  },
  {
    title: 'Paramètres',
    url: '/settings',
    icon: Settings,
    roles: [...allRoles],
  },
];

const menuSections: MenuSection[] = [
  {
    label: 'Vue d\'ensemble',
    urls: ['/dashboard'],
  },
  {
    label: 'Gestion',
    urls: ['/projects', '/members', '/budget', '/calendar', '/votes', '/payments', '/census'],
  },
  {
    label: 'Communication',
    urls: ['/chat', '/activity', '/blog', '/gallery', '/ads'],
  },
  {
    label: 'Administration',
    urls: ['/notifications', '/settings'],
  },
];

// ==================== Component ====================

export default function AppSidebar({ currentPage, onNavigate, isMobile }: AppSidebarProps) {
  const { user, signOut } = useAuth();
  const { setOpenMobile } = useSidebar();

  const filteredItems = useMemo(() => {
    if (!user) return [];
    return menuItems.filter((item) => item.roles.includes(user.role));
  }, [user]);

  const filteredSections = useMemo(() => {
    const filteredUrls = new Set(filteredItems.map((item) => item.url));
    return menuSections
      .map((section) => ({
        ...section,
        items: filteredItems.filter((item) => section.urls.includes(item.url)),
      }))
      .filter((section) => section.items.length > 0);
  }, [filteredItems]);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleNavigate = (url: string) => {
    onNavigate(url);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Sidebar collapsible="icon">
      {/* Header with logo and gradient bottom border */}
      <SidebarHeader className="p-4 border-b-0 relative">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="CODET"
            className="h-10 w-10 rounded-lg object-contain"
          />
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-sidebar-foreground leading-tight">CODET</h2>
            <p className="text-xs text-sidebar-foreground/70 leading-tight">Comité de Développement Tchoutsi</p>
          </div>
        </div>
        {/* Gradient fade bottom border */}
        <div className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
      </SidebarHeader>

      {/* Scrollable navigation menu */}
      <SidebarContent className="overflow-y-auto codet-scrollbar">
        {filteredSections.map((section, sectionIndex) => (
          <SidebarGroup key={section.label}>
            {sectionIndex > 0 && (
              <div className="flex items-center gap-2 px-2 py-2">
                <SidebarSeparator className="flex-1" />
                <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/50">
                  {section.label}
                </span>
                <SidebarSeparator className="flex-1" />
              </div>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive = currentPage === item.url;
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => handleNavigate(item.url)}
                        tooltip={item.title}
                        className={[
                          'relative transition-all duration-200',
                          isActive
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 rounded-r-md'
                            : 'hover:shadow-[inset_0_0_0_1px_hsl(var(--border)),_0_1px_3px_hsl(var(--border)/30%)]',
                        ].join(' ')}
                      >
                        {isActive && (
                          <div className="sidebar-active-indicator absolute left-0 top-0 h-full w-[3px] rounded-r-full bg-gradient-to-b from-emerald-400 via-teal-500 to-emerald-600" />
                        )}
                        <item.icon className={isActive ? 'h-4 w-4 text-emerald-700 dark:text-emerald-400' : 'h-4 w-4'} />
                        <span className={isActive ? 'text-emerald-700 dark:text-emerald-400' : ''}>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer with user info and profile/logout */}
      <SidebarFooter className="p-2 border-t-0 relative">
        {/* Gradient top border */}
        <div className="absolute top-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent" />

        {/* Profile link */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={currentPage === '/profile'}
              onClick={() => handleNavigate('/profile')}
              tooltip="Profil"
              className={[
                'mb-1 transition-colors duration-150 relative',
                currentPage === '/profile'
                  ? 'border-l-[3px] border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 rounded-r-md'
                  : 'hover:bg-accent border-l-[3px] border-l-transparent',
              ].join(' ')}
            >
              <UserCircle className="h-5 w-5" />
              <span>Profil</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarSeparator />

        {/* User avatar and info - card-like background */}
        <div className="flex items-center gap-3 px-3 py-3 mx-1 rounded-lg bg-sidebar-accent/50">
          <Avatar className="h-9 w-9 ring-1 ring-sidebar-border">
            <AvatarImage src={user.photoURL} />
            <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
              {user.displayName?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user.displayName}
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate capitalize">
              {user.role.replace(/_/g, ' ')}
            </p>
          </div>
        </div>

        {/* Logout button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="w-full justify-start gap-2 border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground mt-1 transition-colors duration-150"
        >
          <LogOut className="h-4 w-4" />
          <span>Déconnexion</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
