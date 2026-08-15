'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  getDocs,
  query,
  orderBy,
  limit,
  toDate,
} from '@/lib/db';
import { COLLECTIONS } from '@/lib/appwrite';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Newspaper,
  FolderOpen,
  CreditCard,
  CalendarDays,
  Vote,
  Download,
  TrendingUp,
  CalendarClock,
  CalendarRange,
} from 'lucide-react';
import EmptyState from '@/components/EmptyState';

interface ActivityItem {
  $id: string;
  type: string;
  collection: string;
  title: string;
  description: string;
  userName: string;
  createdAt: string;
}

type FilterTab = 'tous' | 'article' | 'projet' | 'paiement' | 'événement' | 'vote';

function formatTimeAgo(dateStr: string): string {
  try {
    const date = toDate(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    if (diffSec < 60) return "À l'instant";
    if (diffMin < 60) return `il y a ${diffMin} min`;
    if (diffHour < 24) return `il y a ${diffHour}h`;
    if (diffDay === 1) return 'hier';
    if (diffDay < 30) return `il y a ${diffDay}j`;
    return `il y a ${Math.floor(diffDay / 30)} mois`;
  } catch {
    return 'Date inconnue';
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'article':
      return { icon: Newspaper, bg: 'bg-violet-100 dark:bg-violet-900/50', color: 'text-violet-600 dark:text-violet-400', dot: 'bg-violet-500' };
    case 'projet':
      return { icon: FolderOpen, bg: 'bg-sky-100 dark:bg-sky-900/50', color: 'text-sky-600 dark:text-sky-400', dot: 'bg-sky-500' };
    case 'paiement':
      return { icon: CreditCard, bg: 'bg-amber-100 dark:bg-amber-900/50', color: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' };
    case 'événement':
      return { icon: CalendarDays, bg: 'bg-emerald-100 dark:bg-emerald-900/50', color: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' };
    case 'vote':
      return { icon: Vote, bg: 'bg-rose-100 dark:bg-rose-900/50', color: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500' };
    default:
      return { icon: Activity, bg: 'bg-gray-100 dark:bg-gray-900/50', color: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-500' };
  }
}

function getCollectionBadgeStyle(type: string): string {
  switch (type) {
    case 'article':
      return 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border-0';
    case 'projet':
      return 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 border-0';
    case 'paiement':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-0';
    case 'événement':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-0';
    case 'vote':
      return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-0';
    default:
      return 'bg-muted text-muted-foreground border-0';
  }
}

function getCollectionLabel(type: string): string {
  switch (type) {
    case 'article': return 'Blog';
    case 'projet': return 'Projets';
    case 'paiement': return 'Paiements';
    case 'événement': return 'Événements';
    case 'vote': return 'Votes';
    default: return type;
  }
}

function TimelineRowSkeleton() {
  return (
    <div className="flex items-start gap-4 px-4 py-4">
      <div className="flex flex-col items-center gap-1 shrink-0">
        <Skeleton className="h-11 w-11 rounded-xl" />
        <Skeleton className="h-3 w-3 rounded-full" />
      </div>
      <div className="flex-1 min-w-0 space-y-2 pt-1">
        <Skeleton className="h-4 w-3/5 rounded" />
        <Skeleton className="h-3.5 w-2/5 rounded" />
      </div>
    </div>
  );
}

function countActivitiesInRange(items: ActivityItem[], range: 'today' | 'week' | 'month'): number {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (range) {
    case 'today': {
      return items.filter((a) => {
        try {
          const d = toDate(a.createdAt);
          return d >= startOfDay;
        } catch { return false; }
      }).length;
    }
    case 'week': {
      const startOfWeek = new Date(startOfDay);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Monday
      return items.filter((a) => {
        try {
          const d = toDate(a.createdAt);
          return d >= startOfWeek;
        } catch { return false; }
      }).length;
    }
    case 'month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return items.filter((a) => {
        try {
          const d = toDate(a.createdAt);
          return d >= startOfMonth;
        } catch { return false; }
      }).length;
    }
  }
}

export default function ActivityLogPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('tous');

  useEffect(() => {
    async function fetchActivities() {
      setLoading(true);
      try {
        const allItems: ActivityItem[] = [];

        try {
          const postsSnap = await getDocs(
            query(COLLECTIONS.BLOG_POSTS, orderBy('createdAt', 'desc'), limit(5))
          );
          for (const post of postsSnap.documents) {
            allItems.push({
              $id: post.$id,
              type: 'article',
              collection: COLLECTIONS.BLOG_POSTS,
              title: post.title || 'Sans titre',
              description: post.isPublished ? 'Nouvel article publié' : 'Article modifié',
              userName: post.author || 'Inconnu',
              createdAt: post.createdAt,
            });
          }
        } catch { /* skip */ }

        try {
          const projectsSnap = await getDocs(
            query(COLLECTIONS.PROJECTS, orderBy('createdAt', 'desc'), limit(5))
          );
          for (const project of projectsSnap.documents) {
            allItems.push({
              $id: project.$id,
              type: 'projet',
              collection: COLLECTIONS.PROJECTS,
              title: project.titre || project.title || 'Sans titre',
              description: 'Projet créé/modifié',
              userName: project.responsable || 'Inconnu',
              createdAt: project.createdAt,
            });
          }
        } catch { /* skip */ }

        try {
          const paymentsSnap = await getDocs(
            query(COLLECTIONS.PAYMENTS, orderBy('createdAt', 'desc'), limit(5))
          );
          for (const payment of paymentsSnap.documents) {
            allItems.push({
              $id: payment.$id,
              type: 'paiement',
              collection: COLLECTIONS.PAYMENTS,
              title: `Paiement de ${payment.membreName || 'membre'}`,
              description: `${(payment.montant || 0).toLocaleString('fr-FR')} FCFA`,
              userName: payment.membreName || 'Inconnu',
              createdAt: payment.createdAt,
            });
          }
        } catch { /* skip */ }

        try {
          const eventsSnap = await getDocs(
            query(COLLECTIONS.EVENTS, orderBy('createdAt', 'desc'), limit(5))
          );
          for (const event of eventsSnap.documents) {
            allItems.push({
              $id: event.$id,
              type: 'événement',
              collection: COLLECTIONS.EVENTS,
              title: event.titre || event.title || 'Sans titre',
              description: 'Événement planifié',
              userName: 'Inconnu',
              createdAt: event.createdAt,
            });
          }
        } catch { /* skip */ }

        try {
          const pollsSnap = await getDocs(
            query(COLLECTIONS.POLLS, orderBy('createdAt', 'desc'), limit(5))
          );
          for (const poll of pollsSnap.documents) {
            allItems.push({
              $id: poll.$id,
              type: 'vote',
              collection: COLLECTIONS.POLLS,
              title: poll.question || 'Sans titre',
              description: 'Sondage créé',
              userName: 'Inconnu',
              createdAt: poll.createdAt,
            });
          }
        } catch { /* skip */ }

        allItems.sort((a, b) => {
          const dateA = toDate(a.createdAt).getTime();
          const dateB = toDate(b.createdAt).getTime();
          return dateB - dateA;
        });

        setActivities(allItems.slice(0, 50));
      } catch (error) {
        console.error('Error fetching activity log:', error);
        toast({
          title: 'Erreur de chargement',
          description: "Impossible de charger le journal d'activité.",
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
    fetchActivities();
  }, [toast]);

  const filteredActivities = useMemo(() => {
    if (activeFilter === 'tous') return activities;
    return activities.filter((a) => a.type === activeFilter);
  }, [activities, activeFilter]);

  const exportCSV = useCallback(() => {
    const BOM = '\uFEFF';
    const header = 'Type,Collection,Titre,Description,Utilisateur,Date';
    const rows = filteredActivities.map((a) => {
      const date = toDate(a.createdAt);
      const dateStr = date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${a.type},${getCollectionLabel(a.type)},"${a.title.replace(/"/g, '""')}","${a.description.replace(/"/g, '""')}","${a.userName.replace(/"/g, '""')}","${dateStr}"`;
    });
    const csv = BOM + header + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `journal-activite-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Export réussi', description: 'Le fichier CSV a été téléchargé.' });
  }, [filteredActivities, toast]);

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'tous', label: 'Tous' },
    { key: 'article', label: 'Articles' },
    { key: 'projet', label: 'Projets' },
    { key: 'paiement', label: 'Paiements' },
    { key: 'événement', label: 'Événements' },
    { key: 'vote', label: 'Votes' },
  ];

  const todayCount = countActivitiesInRange(activities, 'today');
  const weekCount = countActivitiesInRange(activities, 'week');
  const monthCount = countActivitiesInRange(activities, 'month');

  const getFilterCount = (key: FilterTab): number => {
    if (key === 'tous') return activities.length;
    return activities.filter((a) => a.type === key).length;
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
            <Activity className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl md:text-2xl font-bold text-foreground">
                Journal d&apos;activité
              </h2>
              {!loading && activities.length > 0 && (
                <Badge variant="secondary" className="text-xs font-medium">
                  {filteredActivities.length}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Suivi des actions récentes dans le système
            </p>
          </div>
        </div>
        {!loading && filteredActivities.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            className="shrink-0"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Activity Stats Bar */}
      {!loading && activities.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <Card className="py-3 px-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-xl font-bold text-foreground leading-tight">{todayCount}</p>
                <p className="text-[11px] text-muted-foreground truncate">Aujourd&apos;hui</p>
              </div>
            </div>
          </Card>
          <Card className="py-3 px-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center shrink-0">
                <CalendarClock className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-xl font-bold text-foreground leading-tight">{weekCount}</p>
                <p className="text-[11px] text-muted-foreground truncate">Cette semaine</p>
              </div>
            </div>
          </Card>
          <Card className="py-3 px-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
                <CalendarRange className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-xl font-bold text-foreground leading-tight">{monthCount}</p>
                <p className="text-[11px] text-muted-foreground truncate">Ce mois</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filter Tabs — Pills with count badges */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {filterTabs.map((tab) => {
          const count = getFilterCount(tab.key);
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key)}
              className={[
                'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap cursor-pointer',
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
              ].join(' ')}
            >
              {tab.label}
              <span
                className={[
                  'text-[11px] font-semibold leading-none px-1.5 py-0.5 rounded-full min-w-[20px] text-center',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-muted-foreground/10 text-muted-foreground',
                ].join(' ')}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Timeline Content */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y">
              {Array.from({ length: 8 }).map((_, i) => (
                <TimelineRowSkeleton key={i} />
              ))}
            </div>
          ) : filteredActivities.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="Aucune activité récente"
              description="L'activité apparaîtra ici dès que des actions seront effectuées."
            />
          ) : (
            <div className="relative py-4">
              {/* Emerald gradient vertical line */}
              <div className="absolute left-[27px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-emerald-400 via-emerald-300 to-emerald-200 dark:from-emerald-600 dark:via-emerald-700 dark:to-emerald-800 hidden sm:block" />

              <AnimatePresence mode="popLayout">
                {filteredActivities.map((item, index) => {
                  const { icon: TypeIcon, bg, color, dot } = getTypeIcon(item.type);
                  const badgeStyle = getCollectionBadgeStyle(item.type);
                  return (
                    <motion.div
                      key={item.$id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      transition={{
                        duration: 0.3,
                        delay: Math.min(index * 0.04, 0.4),
                        ease: [0.25, 0.46, 0.45, 0.94],
                      }}
                      className="relative flex items-start gap-4 px-4 sm:px-6 py-3.5 hover:bg-muted/30 transition-colors duration-150"
                    >
                      {/* Connecting dot on the timeline line (desktop) */}
                      <div className="absolute left-[22px] top-6 h-[10px] w-[10px] rounded-full border-2 border-background dark:border-card bg-emerald-400 dark:bg-emerald-600 hidden sm:block z-10" />

                      {/* Type icon — larger with colored background */}
                      <div className={`h-11 w-11 rounded-xl ${bg} flex items-center justify-center shrink-0 shadow-sm z-20 relative`}>
                        <TypeIcon className={`h-5 w-5 ${color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate text-foreground">
                              {item.title}
                            </p>
                            <p className="text-sm text-muted-foreground mt-0.5 truncate">
                              {item.description}
                            </p>
                          </div>
                          {/* Collection pill badge */}
                          <Badge
                            className={`shrink-0 text-[11px] font-medium rounded-full px-2.5 py-0 ${badgeStyle}`}
                          >
                            {getCollectionLabel(item.type)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            {formatTimeAgo(item.createdAt)}
                          </span>
                          {item.userName !== 'Inconnu' && (
                            <>
                              <span className="text-muted-foreground/30">·</span>
                              <span className="text-xs text-muted-foreground">{item.userName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
