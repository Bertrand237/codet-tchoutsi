'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Moon,
  Sun,
  Activity,
  Settings,
  Camera,
  Loader2,
  Bell,
  Compass,
  Zap,
  Search,
  ChevronRight,
} from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { useTheme } from 'next-themes';
import { getDocs, query as fbQuery, limit } from '@/lib/db';
import { COLLECTIONS } from '@/lib/appwrite';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

// ==================== Types ====================

interface CommandPaletteProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

interface NavigationItem {
  title: string;
  url: string;
  icon: React.ReactNode;
  keywords?: string[];
}

interface MemberResult {
  $id: string;
  displayName: string;
  role?: string;
  email?: string;
}

// ==================== Navigation Items ====================

const navigationItems: NavigationItem[] = [
  {
    title: 'Tableau de bord',
    url: '/dashboard',
    icon: <Home className="h-4 w-4" />,
    keywords: ['accueil', 'home', 'dashboard', 'vue d\'ensemble'],
  },
  {
    title: 'Projets',
    url: '/projects',
    icon: <FolderKanban className="h-4 w-4" />,
    keywords: ['projet', 'tâche', 'task'],
  },
  {
    title: 'Membres',
    url: '/members',
    icon: <Users className="h-4 w-4" />,
    keywords: ['membre', 'utilisateur', 'user', 'annuaire'],
  },
  {
    title: 'Budget',
    url: '/budget',
    icon: <Wallet className="h-4 w-4" />,
    keywords: ['finances', 'argent', 'finance', 'comptabilité'],
  },
  {
    title: 'Calendrier',
    url: '/calendar',
    icon: <CalendarDays className="h-4 w-4" />,
    keywords: ['événement', 'event', 'planning', 'date'],
  },
  {
    title: 'Votes',
    url: '/votes',
    icon: <Vote className="h-4 w-4" />,
    keywords: ['vote', 'sondage', 'poll', 'consultation'],
  },
  {
    title: 'Paiements',
    url: '/payments',
    icon: <CreditCard className="h-4 w-4" />,
    keywords: ['paiement', 'cotisation', 'facture', 'payment'],
  },
  {
    title: 'Recensement',
    url: '/census',
    icon: <UsersRound className="h-4 w-4" />,
    keywords: ['recensement', 'census', 'démographie', 'famille'],
  },
  {
    title: 'Messagerie',
    url: '/chat',
    icon: <MessageSquare className="h-4 w-4" />,
    keywords: ['chat', 'message', 'discussion', 'conversation'],
  },
  {
    title: 'Journal d\'activité',
    url: '/activity',
    icon: <Activity className="h-4 w-4" />,
    keywords: ['activité', 'journal', 'audit', 'historique', 'log', 'recent'],
  },
  {
    title: 'Blog',
    url: '/blog',
    icon: <Newspaper className="h-4 w-4" />,
    keywords: ['blog', 'article', 'publication', 'actualité'],
  },
  {
    title: 'Souvenirs',
    url: '/gallery',
    icon: <Camera className="h-4 w-4" />,
    keywords: ['galerie', 'photo', 'vidéo', 'souvenir', 'souvenirs', 'image', 'album'],
  },
  {
    title: 'Publicités',
    url: '/ads',
    icon: <MonitorPlay className="h-4 w-4" />,
    keywords: ['pub', 'publicité', 'annonce', 'ad', 'vidéo'],
  },
  {
    title: 'Notifications',
    url: '/notifications',
    icon: <Bell className="h-4 w-4" />,
    keywords: ['notifications', 'alertes', 'avis', 'notification', 'alerte'],
  },
  {
    title: 'Profil',
    url: '/profile',
    icon: <UserCircle className="h-4 w-4" />,
    keywords: ['profil', 'profile', 'compte'],
  },
  {
    title: 'Paramètres',
    url: '/settings',
    icon: <Settings className="h-4 w-4" />,
    keywords: ['paramètres', 'parametres', 'settings', 'préférences'],
  },
];

// ==================== Helpers ====================

const AVATAR_COLORS = [
  'bg-emerald-500', 'bg-teal-500', 'bg-amber-500', 'bg-rose-500',
  'bg-violet-500', 'bg-cyan-500', 'bg-orange-500', 'bg-pink-500',
];

function getHashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getRoleBadgeClass(role: string): string {
  const r = role.toLowerCase();
  if (r === 'admin') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-0';
  if (r === 'président') return 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border-0';
  if (r === 'secretaire' || r === 'secretaire_general') return 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300 border-0';
  if (r === 'trésorier') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-0';
  if (r === 'commissaire') return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-0';
  if (r === 'celcom' || r === 'responsable_communication') return 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300 border-0';
  return 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300 border-0';
}

// ==================== Component ====================

export default function CommandPalette({
  currentPage,
  onNavigate,
  onLogout,
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [memberResults, setMemberResults] = useState<MemberResult[]>([]);
  const [memberLoading, setMemberLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const membersCacheRef = useRef<MemberResult[]>([]);
  const membersFetchedRef = useRef(false);

  // Ctrl+K / Cmd+K keyboard shortcut + custom event
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    function handleOpenCommandPalette() {
      setOpen(true);
    }
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('open-command-palette', handleOpenCommandPalette);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('open-command-palette', handleOpenCommandPalette);
    };
  }, []);

  // Fetch all members once (cache for the session)
  const fetchAllMembers = useCallback(async () => {
    if (membersFetchedRef.current) return membersCacheRef.current;
    try {
      const result = await getDocs(fbQuery(COLLECTIONS.USERS, limit(100)));
      const docs = (result.documents || []) as unknown as MemberResult[];
      membersCacheRef.current = docs;
      membersFetchedRef.current = true;
      return docs;
    } catch {
      return [];
    }
  }, []);

  // When the palette opens, pre-fetch members in the background
  useEffect(() => {
    if (open && user) {
      fetchAllMembers();
    }
  }, [open, user, fetchAllMembers]);

  // Debounced member search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const q = searchValue.trim().toLowerCase();

    if (q.length < 2) {
      setMemberResults([]);
      setMemberLoading(false);
      return;
    }

    // Skip if not authenticated
    if (!user) {
      setMemberResults([]);
      return;
    }

    setMemberLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const allMembers = await fetchAllMembers();
        const filtered = allMembers.filter(
          (m) =>
            (m.displayName || '').toLowerCase().includes(q) ||
            (m.email || '').toLowerCase().includes(q)
        );
        setMemberResults(filtered.slice(0, 8));
      } catch {
        setMemberResults([]);
      } finally {
        setMemberLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchValue, user, fetchAllMembers]);

  const handleNavigate = useCallback(
    (url: string) => {
      onNavigate(url);
      setOpen(false);
    },
    [onNavigate]
  );

  const handleLogout = useCallback(() => {
    onLogout();
    setOpen(false);
  }, [onLogout]);

  const handleToggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
    setOpen(false);
  }, [theme, setTheme]);

  const showMemberResults = memberResults.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Rechercher une page, un membre ou une action..."
        value={searchValue}
        onValueChange={setSearchValue}
      />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center py-6">
            <Search className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Aucun résultat trouvé</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">Essayez un autre terme de recherche</p>
          </div>
        </CommandEmpty>

        {/* Navigation group */}
        <CommandGroup>
          <div className="flex items-center gap-2 px-2 pt-2 pb-1">
            <Compass className="h-3.5 w-3.5 text-muted-foreground/50" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">Navigation</span>
          </div>
          {navigationItems.map((item) => (
            <CommandItem
              key={item.url}
              value={`nav ${item.title} ${item.keywords?.join(' ') || ''}`}
              onSelect={() => handleNavigate(item.url)}
              className={
                currentPage === item.url
                  ? 'bg-emerald-50 dark:bg-emerald-950/30'
                  : ''
              }
            >
              <span className={
                currentPage === item.url
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-foreground'
              }>
                {item.icon}
              </span>
              <span>{item.title}</span>
              {currentPage === item.url && (
                <span className="ml-auto flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Actuel</span>
                </span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Members search results */}
        {searchValue.trim().length >= 2 && (
          <>
            <CommandSeparator />
            <CommandGroup>
              <div className="flex items-center gap-2 px-2 pt-2 pb-1">
                <Users className="h-3.5 w-3.5 text-muted-foreground/50" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">Membres</span>
              </div>
              {memberLoading && (
                <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Recherche de membres...</span>
                </div>
              )}
              {!memberLoading && showMemberResults &&
                memberResults.map((member) => (
                  <CommandItem
                    key={member.$id}
                    value={`member ${member.displayName} ${member.email || ''} ${member.role || ''}`}
                    onSelect={() => handleNavigate('/members')}
                  >
                    <span
                      className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${getHashColor(member.displayName || '')}`}
                    >
                      {(member.displayName || '?').charAt(0).toUpperCase()}
                    </span>
                    <span className="truncate font-medium">{member.displayName}</span>
                    {member.role && (
                      <Badge
                        variant="outline"
                        className={`ml-1.5 text-[10px] px-1.5 py-0 h-5 capitalize shrink-0 ${getRoleBadgeClass(member.role)}`}
                      >
                        {member.role.replace(/_/g, ' ')}
                      </Badge>
                    )}
                    <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground/40" />
                  </CommandItem>
                ))}

            </CommandGroup>
          </>
        )}

        <CommandSeparator />

        {/* Actions group */}
        <CommandGroup>
          <div className="flex items-center gap-2 px-2 pt-2 pb-1">
            <Zap className="h-3.5 w-3.5 text-muted-foreground/50" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">Actions rapides</span>
          </div>
          <CommandItem
            value="action changer thème theme dark light mode"
            onSelect={handleToggleTheme}
          >
            <span className="text-muted-foreground">
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </span>
            <span>Changer le thème</span>
            <span className="ml-auto text-[10px] font-mono text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded border border-border">Ctrl+Shift+T</span>
          </CommandItem>
          <CommandItem
            value="action déconnexion logout sign out quitter"
            onSelect={handleLogout}
          >
            <span className="text-muted-foreground">
              <LogOut className="h-4 w-4" />
            </span>
            <span>Déconnexion</span>
            <span className="ml-auto text-[10px] font-mono text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded border border-border">Ctrl+Shift+Q</span>
          </CommandItem>
        </CommandGroup>
        <div className="flex items-center justify-between px-2 py-1.5 border-t border-border/50 mt-1">
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50">
            <span className="flex items-center gap-1"><kbd className="font-mono bg-muted px-1 py-0.5 rounded border border-border text-[9px]">↑↓</kbd> Naviguer</span>
            <span className="flex items-center gap-1"><kbd className="font-mono bg-muted px-1 py-0.5 rounded border border-border text-[9px]">↵</kbd> Sélectionner</span>
            <span className="flex items-center gap-1"><kbd className="font-mono bg-muted px-1 py-0.5 rounded border border-border text-[9px]">esc</kbd> Fermer</span>
          </div>
        </div>
      </CommandList>
    </CommandDialog>
  );
}
