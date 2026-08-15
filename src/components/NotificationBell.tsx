'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bell, Loader2, CreditCard, CalendarDays,
  Newspaper, Vote, Users, CircleCheck,
} from 'lucide-react';
import { COLLECTIONS } from '@/lib/appwrite';
import { getDocs, query, where, orderBy, limit, toDate } from '@/lib/db';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { CodetUser } from '@/contexts/AuthContext';

// ==================== Types ====================

type NotificationType = 'payment' | 'event' | 'blog' | 'vote' | 'member' | 'system' | string;

type TimeGroup = "Aujourd'hui" | 'Hier' | 'Cette semaine' | 'Plus ancien';

interface NotificationItem {
  $id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  userId: string;
  link?: string;
  createdAt: string;
}

// ==================== Helpers ====================

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

const TIME_GROUP_ORDER: Record<TimeGroup, number> = {
  "Aujourd'hui": 0,
  'Hier': 1,
  'Cette semaine': 2,
  'Plus ancien': 3,
};

interface TypeIconConfig {
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  text: string;
}

function getTypeIcon(type: NotificationType): TypeIconConfig {
  switch (type) {
    case 'payment':
      return { icon: CreditCard, bg: 'bg-amber-100', text: 'text-amber-600' };
    case 'event':
      return { icon: CalendarDays, bg: 'bg-emerald-100', text: 'text-emerald-600' };
    case 'blog':
      return { icon: Newspaper, bg: 'bg-violet-100', text: 'text-violet-600' };
    case 'vote':
      return { icon: Vote, bg: 'bg-rose-100', text: 'text-rose-600' };
    case 'member':
      return { icon: Users, bg: 'bg-sky-100', text: 'text-sky-600' };
    case 'system':
    default:
      return { icon: Bell, bg: 'bg-gray-100', text: 'text-gray-600' };
  }
}

function truncate(text: string, maxLen: number): string {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '…';
}

// ==================== Component ====================

interface NotificationBellProps {
  user: CodetUser;
}

export default function NotificationBell({ user }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const result = await getDocs(
        query(
          COLLECTIONS.NOTIFICATIONS,
          where('userId', '==', user.id),
          where('read', '==', false),
          orderBy('createdAt', 'desc'),
          limit(8)
        )
      );

      const notifs: NotificationItem[] = result.documents.map((d: Record<string, unknown>) => ({
        $id: d.$id as string,
        title: (d.title as string) || '',
        message: (d.message as string) || '',
        type: (d.type as NotificationType) || 'system',
        read: d.read as boolean,
        userId: d.userId as string,
        link: (d.link as string) || undefined,
        createdAt: d.createdAt as string,
      }));

      setNotifications(notifs);
      setUnreadCount(notifs.length);
    } catch {
      // NOTIFICATIONS collection may not exist yet
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user.id]);

  // Poll every 10s with deferred initial fetch
  useEffect(() => {
    pollRef.current = setInterval(fetchNotifications, 10000);
    const timer = setTimeout(fetchNotifications, 0);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      clearTimeout(timer);
    };
  }, [fetchNotifications]);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setLoading(true);
      fetchNotifications().finally(() => setLoading(false));
    }
  }, [fetchNotifications]);

  const handleVoirTout = useCallback(() => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { page: '/notifications' } }));
    setOpen(false);
  }, []);

  // Group notifications by time period
  const groupedNotifications = notifications.reduce((acc, notif) => {
    const group = getTimeGroup(notif.createdAt);
    if (!acc[group]) acc[group] = [];
    acc[group].push(notif);
    return acc;
  }, {} as Record<TimeGroup, NotificationItem[]>);

  const sortedGroups = (Object.entries(groupedNotifications) as [TimeGroup, NotificationItem[]][])
    .sort(([a], [b]) => TIME_GROUP_ORDER[a] - TIME_GROUP_ORDER[b]);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors duration-150 cursor-pointer"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span
              key={unreadCount}
              className="badge-bounce absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <Separator />

        {/* Notification list */}
        <ScrollArea className="codet-scrollbar h-96">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4">
              <CircleCheck className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Tout est lu !</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {sortedGroups.map(([groupLabel, items]) => (
                <React.Fragment key={groupLabel}>
                  <div className="px-4 pt-3 pb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {groupLabel}
                    </span>
                  </div>
                  {items.map((notif) => {
                    const iconConfig = getTypeIcon(notif.type);
                    const IconComponent = iconConfig.icon;
                    return (
                      <div
                        key={notif.$id}
                        className="animate-slide-in-right flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors duration-150"
                      >
                        {/* Type icon */}
                        <div className={`h-8 w-8 rounded-full ${iconConfig.bg} ${iconConfig.text} flex items-center justify-center shrink-0 mt-0.5`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight truncate">
                            {notif.title || 'Notification'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            {truncate(notif.message, 60)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* "Voir tout" link */}
        <Separator />
        <div className="px-4 py-2">
          <button
            type="button"
            onClick={handleVoirTout}
            className="w-full text-center text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors cursor-pointer py-1"
          >
            Voir toutes les notifications
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
