'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CreditCard,
  CalendarDays,
  Newspaper,
  FolderKanban,
  CheckCheck,
  Trash2,
  Loader2,
  Vote,
  CheckSquare,
  Square,
  ChevronRight,
  AlertCircle,
  EyeOff,
} from 'lucide-react';
import { COLLECTIONS } from '@/lib/appwrite';
import { getDocs, query, orderBy, limit, updateDoc, deleteDoc, doc, toDate } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import EmptyState from '@/components/EmptyState';

// ==================== Types ====================

type NotificationType = 'payment' | 'event' | 'blog' | 'project' | 'vote' | 'system';

type TimeGroup = "Aujourd'hui" | 'Hier' | 'Cette semaine' | 'Plus ancien';

interface Notification {
  $id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  link?: string;
  userId?: string;
}

type FilterTab = 'all' | 'unread' | 'payment' | 'event' | 'blog' | 'project' | 'vote';

// ==================== Notification Type Config ====================

const NOTIFICATION_CONFIG: Record<NotificationType, {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  colorClass: string;
  bgClass: string;
  darkBgClass: string;
  bottomBorder: string;
  darkBottomBorder: string;
}> = {
  payment: {
    icon: CreditCard,
    label: 'Paiement confirmé',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-100',
    darkBgClass: 'dark:bg-emerald-900/40',
    bottomBorder: 'border-b-emerald-200 dark:border-b-emerald-800/50',
  },
  event: {
    icon: CalendarDays,
    label: 'Nouvel événement',
    colorClass: 'text-sky-600 dark:text-sky-400',
    bgClass: 'bg-sky-100',
    darkBgClass: 'dark:bg-sky-900/40',
    bottomBorder: 'border-b-sky-200 dark:border-b-sky-800/50',
  },
  blog: {
    icon: Newspaper,
    label: 'Nouvel article',
    colorClass: 'text-violet-600 dark:text-violet-400',
    bgClass: 'bg-violet-100',
    darkBgClass: 'dark:bg-violet-900/40',
    bottomBorder: 'border-b-violet-200 dark:border-b-violet-800/50',
  },
  project: {
    icon: FolderKanban,
    label: 'Mise à jour projet',
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-100',
    darkBgClass: 'dark:bg-amber-900/40',
    bottomBorder: 'border-b-amber-200 dark:border-b-amber-800/50',
  },
  vote: {
    icon: Vote,
    label: 'Nouveau vote',
    colorClass: 'text-rose-600 dark:text-rose-400',
    bgClass: 'bg-rose-100',
    darkBgClass: 'dark:bg-rose-900/40',
    bottomBorder: 'border-b-rose-200 dark:border-b-rose-800/50',
  },
  system: {
    icon: Bell,
    label: 'Annonce système',
    colorClass: 'text-gray-600 dark:text-gray-400',
    bgClass: 'bg-gray-100',
    darkBgClass: 'dark:bg-gray-800/40',
    bottomBorder: 'border-b-gray-200 dark:border-b-gray-700/50',
  },
};

// ==================== Time Grouping Helpers ====================

const TIME_GROUP_ORDER: Record<TimeGroup, number> = {
  "Aujourd'hui": 0,
  'Hier': 1,
  'Cette semaine': 2,
  'Plus ancien': 3,
};

function getTimeGroup(dateStr: string): TimeGroup {
  const now = new Date();
  const date = toDate(dateStr);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const notifDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = today.getTime() - notifDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return 'Cette semaine';
  return 'Plus ancien';
}

// ==================== Helpers ====================

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "À l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days}j`;
  const months = Math.floor(days / 30);
  if (months < 12) return `il y a ${months}mo`;
  const years = Math.floor(months / 12);
  return `il y a ${years}an${years > 1 ? 's' : ''}`;
}

// ==================== Stagger Animation ====================

const listItemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: Math.min(i * 0.04, 0.6), duration: 0.3, ease: 'easeOut' },
  }),
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
};

// ==================== Stat Card Skeleton ====================

function StatCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-12 w-12 rounded-full shrink-0 ml-3" />
      </div>
    </Card>
  );
}

// ==================== Component ====================

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ---- Fetch notifications ----
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await getDocs(
        query(
          COLLECTIONS.NOTIFICATIONS,
          orderBy('createdAt', 'desc'),
          limit(100),
        )
      );
      const docs: Notification[] = result.documents.map((d: Record<string, unknown>) => ({
        $id: d.$id as string,
        title: (d.title as string) || '',
        message: (d.message as string) || '',
        type: (d.type as NotificationType) || 'system',
        read: (d.read as boolean) || false,
        createdAt: (d.createdAt as string) || new Date().toISOString(),
        link: (d.link as string) || undefined,
        userId: (d.userId as string) || undefined,
      }));
      setNotifications(docs);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ---- Derived data ----
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const thisWeekCount = useMemo(
    () => {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return notifications.filter((n) => new Date(n.createdAt) >= weekAgo).length;
    },
    [notifications],
  );

  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case 'unread':
        return notifications.filter((n) => !n.read);
      case 'payment':
      case 'event':
      case 'blog':
      case 'project':
      case 'vote':
        return notifications.filter((n) => n.type === activeTab);
      default:
        return notifications;
    }
  }, [notifications, activeTab]);

  // Group filtered notifications by time period
  const groupedNotifications = useMemo(() => {
    const groups = filteredNotifications.reduce((acc, notif) => {
      const group = getTimeGroup(notif.createdAt);
      if (!acc[group]) acc[group] = [];
      acc[group].push(notif);
      return acc;
    }, {} as Record<TimeGroup, Notification[]>);

    return (Object.entries(groups) as [TimeGroup, Notification[]][])
      .sort(([a], [b]) => TIME_GROUP_ORDER[a] - TIME_GROUP_ORDER[b]);
  }, [filteredNotifications]);

  // ---- Selection ----
  const toggleSelectMode = useCallback(() => {
    setSelectMode((prev) => !prev);
    setSelectedIds(new Set());
  }, []);

  const toggleSelectOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotifications.map((n) => n.$id)));
    }
  }, [selectedIds.size, filteredNotifications]);

  // ---- Actions ----
  const handleMarkAsRead = useCallback(async (notification: Notification) => {
    if (notification.read) return;
    try {
      await updateDoc(doc(COLLECTIONS.NOTIFICATIONS, notification.$id), { read: true });
      setNotifications((prev) =>
        prev.map((n) => (n.$id === notification.$id ? { ...n, read: true } : n)),
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const handleMarkAsUnread = useCallback(async (notification: Notification) => {
    if (!notification.read) return;
    try {
      await updateDoc(doc(COLLECTIONS.NOTIFICATIONS, notification.$id), { read: false });
      setNotifications((prev) =>
        prev.map((n) => (n.$id === notification.$id ? { ...n, read: false } : n)),
      );
    } catch (error) {
      console.error('Error marking notification as unread:', error);
    }
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    setMarkingAllRead(true);
    try {
      await Promise.all(
        unread.map((n) => updateDoc(doc(COLLECTIONS.NOTIFICATIONS, n.$id), { read: true })),
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setMarkingAllRead(false);
    }
  }, [notifications]);

  const handleDelete = useCallback(async (notification: Notification) => {
    try {
      await deleteDoc(doc(COLLECTIONS.NOTIFICATIONS, notification.$id));
      setNotifications((prev) => prev.filter((n) => n.$id !== notification.$id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(notification.$id);
        return next;
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, []);

  const handleDeleteSelected = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      await Promise.all(
        ids.map((id) => deleteDoc(doc(COLLECTIONS.NOTIFICATIONS, id))),
      );
      setNotifications((prev) => prev.filter((n) => !selectedIds.has(n.$id)));
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Error deleting selected notifications:', error);
    }
  }, [selectedIds]);

  const handleMarkSelectedRead = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      await Promise.all(
        ids.map((id) => updateDoc(doc(COLLECTIONS.NOTIFICATIONS, id), { read: true })),
      );
      setNotifications((prev) =>
        prev.map((n) => (selectedIds.has(n.$id) ? { ...n, read: true } : n)),
      );
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Error marking selected as read:', error);
    }
  }, [selectedIds]);

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      if (selectMode) {
        toggleSelectOne(notification.$id);
        return;
      }
      handleMarkAsRead(notification);
      if (notification.link) {
        const event = new CustomEvent('navigate', { detail: notification.link });
        document.dispatchEvent(event);
      }
    },
    [handleMarkAsRead, selectMode, toggleSelectOne],
  );

  // ---- Tab change handler (also used as a prop for Tabs) ----
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as FilterTab);
    setSelectedIds(new Set());
  }, []);

  // ---- Render: Loading skeletons ----
  if (loading) {
    return (
      <div className="flex flex-col gap-1 p-4 md:p-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-40" />
        </div>
        {/* Stats bar skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        {/* Tabs skeleton */}
        <Skeleton className="h-9 w-full max-w-lg mb-4" />
        {/* Items skeleton */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4 p-4 rounded-lg">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ---- Render: Stats Bar ----
  const statsBar = (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
      {[
        {
          label: 'Total',
          value: notifications.length,
          description: 'Notifications',
          icon: <Bell className="h-5 w-5 text-white" />,
          color: 'text-emerald-600 dark:text-emerald-400',
          iconGradFrom: 'from-emerald-400',
          iconGradTo: 'to-emerald-600',
          bgFrom: 'from-emerald-500/5',
          bgTo: 'to-teal-500/5',
          ringHover: 'hover:ring-emerald-500/50 hover:shadow-emerald-500/5',
        },
        {
          label: 'Non lues',
          value: unreadCount,
          description: 'À lire',
          icon: <AlertCircle className="h-5 w-5 text-white" />,
          color: 'text-amber-600 dark:text-amber-400',
          iconGradFrom: 'from-amber-400',
          iconGradTo: 'to-amber-600',
          bgFrom: 'from-amber-500/5',
          bgTo: 'to-orange-500/5',
          ringHover: 'hover:ring-amber-500/50 hover:shadow-amber-500/5',
        },
        {
          label: 'Cette semaine',
          value: thisWeekCount,
          description: '7 derniers jours',
          icon: <CalendarDays className="h-5 w-5 text-white" />,
          color: 'text-sky-600 dark:text-sky-400',
          iconGradFrom: 'from-sky-400',
          iconGradTo: 'to-sky-600',
          bgFrom: 'from-sky-500/5',
          bgTo: 'to-blue-500/5',
          ringHover: 'hover:ring-sky-500/50 hover:shadow-sky-500/5',
        },
      ].map((stat) => (
        <Card
          key={stat.label}
          className={`group p-4 relative overflow-hidden ring-1 ring-border hover:shadow-lg ${stat.ringHover} hover:-translate-y-0.5 transition-all duration-200`}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgFrom} ${stat.bgTo} pointer-events-none rounded-xl`} />
          <div className="relative flex items-start justify-between">
            <div className="space-y-1 flex-1 min-w-0 pt-0.5">
              <p className="text-xs text-muted-foreground font-medium truncate">
                {stat.label}
              </p>
              <p className="text-3xl md:text-4xl font-bold text-foreground tracking-tight tabular-nums">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {stat.description}
              </p>
            </div>
            <div
              className={`h-10 w-10 rounded-full bg-gradient-to-br ${stat.iconGradFrom} ${stat.iconGradTo} flex items-center justify-center shrink-0 ml-3 group-hover:scale-110 transition-transform duration-200 shadow-md`}
            >
              {stat.icon}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  // ---- Render: Notification item ----
  const renderNotificationItem = (notification: Notification, index: number) => {
    const config = NOTIFICATION_CONFIG[notification.type] || NOTIFICATION_CONFIG.system;
    const Icon = config.icon;
    const isUnread = !notification.read;
    const isSelected = selectedIds.has(notification.$id);

    return (
      <motion.div
        key={notification.$id}
        custom={index}
        variants={listItemVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        layout
        className={[
          'group relative flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-colors duration-150',
          'hover:bg-accent/50',
          config.bottomBorder,
          'last:border-b-0',
          isUnread
            ? 'bg-emerald-50/50 dark:bg-emerald-950/10'
            : '',
          selectMode && isSelected
            ? 'ring-2 ring-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20'
            : '',
        ].join(' ')}
        onClick={() => handleNotificationClick(notification)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleNotificationClick(notification);
          }
        }}
      >
        {/* Left gradient border for unread */}
        {isUnread && (
          <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600" />
        )}

        {/* Checkbox in select mode */}
        {selectMode && (
          <div className="shrink-0 pt-1" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => toggleSelectOne(notification.$id)}
              aria-label={`Sélectionner la notification`}
            />
          </div>
        )}

        {/* Type icon circle */}
        <div
          className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${config.bgClass} ${config.darkBgClass}`}
        >
          <Icon className={`h-5 w-5 ${config.colorClass}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className={`text-sm leading-snug ${
                isUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'
              }`}
            >
              {notification.title}
            </p>
            <div className="flex items-center gap-1 shrink-0">
              {/* Mark as unread button — visible on hover */}
              {notification.read && !selectMode && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAsUnread(notification);
                  }}
                  className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground/0 group-hover:text-muted-foreground hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all duration-150 cursor-pointer"
                  aria-label="Marquer comme non lue"
                >
                  <EyeOff className="h-3.5 w-3.5" />
                </button>
              )}
              {/* Delete button — visible on hover */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(notification);
                }}
                className="shrink-0 h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground/0 group-hover:text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all duration-150 cursor-pointer"
                aria-label="Supprimer la notification"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
            {notification.message}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <p
              className={`text-xs ${
                isUnread ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-muted-foreground/70'
              }`}
            >
              {timeAgo(notification.createdAt)}
            </p>
            {/* Voir button when link exists */}
            {notification.link && !selectMode && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNotificationClick(notification);
                }}
                className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer"
              >
                Voir
                <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Unread dot indicator with pulse */}
        {isUnread && (
          <span className="absolute top-5 right-4 h-2 w-2 rounded-full bg-emerald-500 group-hover:opacity-0 transition-opacity animate-pulse" />
        )}
      </motion.div>
    );
  };

  // ---- Render: Floating action bar for select mode ----
  const floatingBar = selectMode && selectedIds.size > 0 && (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-xl px-4 py-3"
    >
      <span className="text-sm font-medium text-foreground tabular-nums">
        {selectedIds.size} sélectionnée{selectedIds.size > 1 ? 's' : ''}
      </span>
      <div className="w-px h-5 bg-border mx-1" />
      <Button
        variant="outline"
        size="sm"
        onClick={handleMarkSelectedRead}
        className="text-xs h-8 gap-1.5 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
      >
        <CheckCheck className="h-3.5 w-3.5" />
        Marquer comme lu
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDeleteSelected}
        className="text-xs h-8 gap-1.5 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Supprimer
      </Button>
    </motion.div>
  );

  // ---- Render: Page ----
  return (
    <div className="flex flex-col gap-1 p-4 md:p-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 px-2 py-0.5 text-xs font-medium">
              {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Select mode toggle */}
          <Button
            variant={selectMode ? 'default' : 'outline'}
            size="sm"
            onClick={toggleSelectMode}
            className={`text-xs h-8 gap-1.5 ${
              selectMode
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                : 'border-border'
            }`}
          >
            {selectMode ? (
              <CheckSquare className="h-3.5 w-3.5" />
            ) : (
              <Square className="h-3.5 w-3.5" />
            )}
            {selectMode ? 'Annuler' : 'Sélectionner'}
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markingAllRead}
              className="text-xs h-8 gap-1.5 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            >
              {markingAllRead ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5" />
              )}
              Tout marquer comme lu
            </Button>
          )}
        </div>
      </div>

      {/* Select all bar */}
      {selectMode && filteredNotifications.length > 0 && (
        <div className="flex items-center gap-3 mb-2 p-2 rounded-lg bg-muted/50">
          <Checkbox
            checked={selectedIds.size === filteredNotifications.length && filteredNotifications.length > 0}
            onCheckedChange={toggleSelectAll}
            aria-label="Tout sélectionner"
          />
          <span className="text-xs text-muted-foreground">
            Tout sélectionner ({filteredNotifications.length})
          </span>
        </div>
      )}

      {/* Stats bar */}
      {statsBar}

      {/* Filter tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full mb-2">
        <TabsList className="w-full max-w-3xl">
          <TabsTrigger value="all" className="text-xs sm:text-sm">
            Tous
          </TabsTrigger>
          <TabsTrigger value="unread" className="text-xs sm:text-sm">
            Non lus
          </TabsTrigger>
          <TabsTrigger value="payment" className="text-xs sm:text-sm">
            Paiements
          </TabsTrigger>
          <TabsTrigger value="event" className="text-xs sm:text-sm">
            Événements
          </TabsTrigger>
          <TabsTrigger value="blog" className="text-xs sm:text-sm">
            Articles
          </TabsTrigger>
          <TabsTrigger value="project" className="text-xs sm:text-sm">
            Projets
          </TabsTrigger>
          <TabsTrigger value="vote" className="text-xs sm:text-sm">
            Votes
          </TabsTrigger>
        </TabsList>

        {/* All tabs share the same content — filtered dynamically */}
        <TabsContent value={activeTab} className="mt-2">
          {filteredNotifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title={
                activeTab === 'unread'
                  ? 'Aucune notification non lue'
                  : 'Aucune notification'
              }
              description={
                activeTab === 'unread'
                  ? 'Toutes vos notifications ont été lues. Revenez plus tard !'
                  : 'Vous n\'avez pas encore de notification. Les nouvelles notifications apparaîtront ici.'
              }
            />
          ) : (
            <div className="max-h-[calc(100vh-380px)] overflow-y-auto rounded-xl border bg-card/50 shadow-sm">
              <AnimatePresence mode="popLayout">
                {groupedNotifications.map(([groupLabel, items]) => (
                  <React.Fragment key={groupLabel}>
                    {/* Time group header */}
                    <div className="px-4 pt-3 pb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {groupLabel}
                      </span>
                    </div>
                    {items.map((notification, i) =>
                      renderNotificationItem(notification, i),
                    )}
                  </React.Fragment>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Floating action bar */}
      <AnimatePresence>
        {floatingBar}
      </AnimatePresence>
    </div>
  );
}
