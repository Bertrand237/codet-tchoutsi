import { useMemo } from "react";
import {
  Home,
  Users,
  CreditCard,
  Wallet,
  UsersRound,
  MessageSquare,
  Newspaper,
  Video,
  BarChart3,
  LogOut,
  FolderKanban,
  User,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const menuItems = [
  {
    title: "Tableau de bord",
    url: "/dashboard",
    icon: Home,
    roles: ["admin", "président", "secretaire", "secretaire_general", "trésorier", "commissaire", "celcom", "responsable_communication", "membre", "visiteur"],
  },
  {
    title: "Projets",
    url: "/projects",
    icon: FolderKanban,
    roles: ["admin", "président", "secretaire", "secretaire_general", "trésorier", "commissaire", "responsable_communication", "membre"],
  },
  {
    title: "Membres",
    url: "/members",
    icon: Users,
    roles: ["admin", "président", "secretaire", "secretaire_general", "trésorier", "commissaire"],
  },
  {
    title: "Budget",
    url: "/budget",
    icon: Wallet,
    roles: ["admin", "président", "secretaire", "secretaire_general", "trésorier"],
  },
  {
    title: "Calendrier",
    url: "/calendar",
    icon: BarChart3,
    roles: ["admin", "président", "secretaire", "secretaire_general", "trésorier", "commissaire", "responsable_communication", "membre"],
  },
  {
    title: "Votes",
    url: "/votes",
    icon: Video,
    roles: ["admin", "président", "secretaire", "secretaire_general", "trésorier", "commissaire", "membre"],
  },
  {
    title: "Paiements",
    url: "/payments",
    icon: CreditCard,
    roles: ["admin", "président", "secretaire", "secretaire_general", "trésorier", "commissaire", "membre"],
  },
  {
    title: "Recensement",
    url: "/census",
    icon: UsersRound,
    roles: ["admin", "président", "secretaire", "secretaire_general", "trésorier", "commissaire", "membre"],
  },
  {
    title: "Messagerie",
    url: "/chat",
    icon: MessageSquare,
    roles: ["admin", "président", "secretaire", "secretaire_general", "trésorier", "commissaire", "celcom", "responsable_communication", "membre"],
  },
  {
    title: "Blog",
    url: "/blog",
    icon: Newspaper,
    roles: ["admin", "président", "secretaire", "secretaire_general", "trésorier", "commissaire", "celcom", "responsable_communication", "membre", "visiteur"],
  },
  {
    title: "Publicités",
    url: "/ads",
    icon: Video,
    roles: ["admin", "président", "secretaire", "secretaire_general", "celcom", "responsable_communication"],
  },
  {
    title: "Statistiques",
    url: "/statistics",
    icon: BarChart3,
    roles: ["admin", "président", "secretaire", "secretaire_general", "trésorier"],
  },
];

export function AppSidebar() {
  const { userProfile, signOut } = useAuth();
  const [location] = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();

  const filteredItems = useMemo(() => {
    if (!userProfile) return [];
    return menuItems.filter((item) => item.roles.includes(userProfile.role));
  }, [userProfile?.role]);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };
  
  if (!userProfile) {
    return null;
  }

  return (
    <Sidebar>
      <SidebarHeader className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <span className="text-xl font-bold text-sidebar-primary-foreground">C</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-sidebar-foreground">CODET</h2>
            <p className="text-xs text-sidebar-foreground/70">Comité de Développement</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Link href={item.url} onClick={handleLinkClick} className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <Link href="/profile" onClick={handleLinkClick}>
          <div className="flex items-center gap-3 mb-3 p-2 rounded-lg hover:bg-sidebar-accent cursor-pointer transition-colors">
            <Avatar className="h-10 w-10">
              <AvatarImage src={userProfile?.photoURL} />
              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
                {userProfile?.displayName?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {userProfile?.displayName}
              </p>
              <p className="text-xs text-sidebar-foreground/70 truncate capitalize">
                {userProfile?.role}
              </p>
            </div>
            <User className="h-4 w-4 text-sidebar-foreground/50" />
          </div>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="w-full justify-start gap-2 border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent"
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
