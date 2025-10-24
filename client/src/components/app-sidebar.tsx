import {
  Home,
  Users,
  CreditCard,
  UsersRound,
  MessageSquare,
  Newspaper,
  Video,
  BarChart3,
  LogOut,
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
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const menuItems = [
  {
    title: "Tableau de bord",
    url: "/dashboard",
    icon: Home,
    roles: ["admin", "président", "trésorier", "commissaire", "membre", "visiteur"],
  },
  {
    title: "Membres",
    url: "/members",
    icon: Users,
    roles: ["admin", "président", "trésorier", "commissaire"],
  },
  {
    title: "Paiements",
    url: "/payments",
    icon: CreditCard,
    roles: ["admin", "président", "trésorier", "commissaire", "membre"],
  },
  {
    title: "Recensement",
    url: "/census",
    icon: UsersRound,
    roles: ["admin", "président", "trésorier", "commissaire", "membre"],
  },
  {
    title: "Messagerie",
    url: "/chat",
    icon: MessageSquare,
    roles: ["admin", "président", "trésorier", "commissaire", "membre"],
  },
  {
    title: "Blog",
    url: "/blog",
    icon: Newspaper,
    roles: ["admin", "président", "trésorier", "commissaire", "membre", "visiteur"],
  },
  {
    title: "Publicités",
    url: "/ads",
    icon: Video,
    roles: ["admin", "président"],
  },
  {
    title: "Statistiques",
    url: "/statistics",
    icon: BarChart3,
    roles: ["admin", "président", "trésorier"],
  },
];

export function AppSidebar() {
  const { userProfile, signOut } = useAuth();
  const [location] = useLocation();

  const filteredItems = menuItems.filter(
    (item) => userProfile && item.roles.includes(userProfile.role)
  );

  const handleSignOut = async () => {
    await signOut();
  };

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
                    <a href={item.url} className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
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
        </div>
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
