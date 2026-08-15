'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Megaphone, X } from 'lucide-react';
import { COLLECTIONS } from '@/lib/appwrite';
import {
  getDocs,
  query,
  where,
  orderBy,
  limit,
  toDate,
} from '@/lib/db';

interface Announcement {
  $id: string;
  title: string;
  content?: string;
  createdAt: string;
}

const DISMISSED_KEY = 'codet-dismissed-announcements';
const AUTO_DISMISS_MS = 10000; // 10 seconds

function getDismissedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveDismissedId(id: string) {
  try {
    const existing = getDismissedIds();
    existing.add(id);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...existing]));
  } catch {
    // ignore
  }
}

function formatDate(dateStr: string): string {
  try {
    const d = toDate(dateStr);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Date inconnue';
  }
}

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
  }, []);

  const startAutoDismiss = useCallback(() => {
    stopTimers();
    setProgress(100);

    const startTime = Date.now();
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / AUTO_DISMISS_MS) * 100);
      setProgress(remaining);
    }, 50);

    timerRef.current = setTimeout(() => {
      setVisible(false);
      stopTimers();
    }, AUTO_DISMISS_MS);
  }, [stopTimers]);

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        let docs: Announcement[] = [];
        try {
          const result = await getDocs(
            query(
              COLLECTIONS.BLOG_POSTS,
              where('type', '==', 'announcement'),
              where('isPublished', '==', true),
              orderBy('createdAt', 'desc'),
              limit(3)
            )
          );
          docs = result.documents as unknown as Announcement[];
        } catch {
          // Fallback: fetch all and filter client-side
          const allResult = await getDocs(COLLECTIONS.BLOG_POSTS);
          docs = (allResult.documents as unknown as Announcement[])
            .filter(
              (d) => d.type === 'announcement' && d.isPublished === true
            )
            .sort((a, b) => {
              try {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              } catch {
                return 0;
              }
            })
            .slice(0, 3);
        }

        // Filter out already dismissed
        const dismissedIds = getDismissedIds();
        const visibleAnnouncements = docs.filter((a) => !dismissedIds.has(a.$id));

        setAnnouncements(visibleAnnouncements);
        if (visibleAnnouncements.length > 0) {
          setVisible(true);
          startAutoDismiss();
        }
      } catch (error) {
        console.error('Error fetching announcements:', error);
      }
    }

    fetchAnnouncements();

    return () => {
      stopTimers();
    };
  }, [startAutoDismiss, stopTimers]);

  const handleDismiss = useCallback(() => {
    if (announcements[currentIndex]) {
      saveDismissedId(announcements[currentIndex].$id);
    }
    stopTimers();

    // Move to next or hide
    if (currentIndex < announcements.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(100);
      startAutoDismiss();
    } else {
      setVisible(false);
    }
  }, [announcements, currentIndex, stopTimers, startAutoDismiss]);

  const handleDotClick = useCallback(
    (index: number) => {
      setCurrentIndex(index);
      setProgress(100);
      startAutoDismiss();
    },
    [startAutoDismiss]
  );

  if (!visible || announcements.length === 0) return null;

  const current = announcements[currentIndex];

  return (
    <div className="relative rounded-lg border border-amber-200/60 dark:border-amber-800/30 bg-amber-50 dark:bg-amber-950/20 overflow-hidden">
      {/* Auto-dismiss progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-200/40 dark:bg-amber-800/20">
        <div
          className="h-full bg-amber-500/60 dark:bg-amber-400/40 transition-[width] duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-start gap-3 p-4">
        {/* Megaphone icon */}
        <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0 mt-0.5">
          <Megaphone className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-100">
            {current.title}
          </h3>
          {current.content && (
            <p className="text-sm text-amber-800/80 dark:text-amber-200/70 mt-0.5 line-clamp-2">
              {current.content}
            </p>
          )}
          <p className="text-xs text-amber-600/70 dark:text-amber-400/60 mt-1">
            Publiée le {formatDate(current.createdAt)}
          </p>

          {/* Pagination dots */}
          {announcements.length > 1 && (
            <div className="flex items-center gap-1.5 mt-2">
              {announcements.map((_, i) => (
                <button
                  key={announcements[i].$id}
                  onClick={() => handleDotClick(i)}
                  className={`rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                    i === currentIndex
                      ? 'w-5 h-1.5 bg-amber-600 dark:bg-amber-400'
                      : 'w-1.5 h-1.5 bg-amber-300 dark:bg-amber-700 hover:bg-amber-400 dark:hover:bg-amber-500'
                  }`}
                  aria-label={`Annonce ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="h-7 w-7 rounded-md flex items-center justify-center text-amber-600/70 dark:text-amber-400/60 hover:text-amber-900 dark:hover:text-amber-100 hover:bg-amber-200/50 dark:hover:bg-amber-800/30 transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          aria-label="Fermer l'annonce"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
