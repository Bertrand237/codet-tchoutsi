'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getDocs } from '@/lib/db';
import { COLLECTIONS } from '@/lib/appwrite';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
} from '@/components/ui/alert-dialog';
import {
  Palette,
  Bell,
  Globe,
  HardDrive,
  Info,
  Trash2,
  Volume2,
  Calendar,
  Newspaper,
  Download,
  ExternalLink,
  ShieldCheck,
  Database,
  Users,
  FolderKanban,
  Wallet,
  CalendarDays,
  CreditCard,
  Loader2,
} from 'lucide-react';

// ==================== Helpers ====================

function getLocalStorageBool(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback;
  const stored = localStorage.getItem(key);
  if (stored === null) return fallback;
  return stored === 'true';
}

// ==================== Section Header ====================

interface SectionHeaderProps {
  icon: React.ElementType;
  title: string;
  gradientFrom: string;
  gradientTo: string;
  iconColor: string;
  iconBg: string;
}

function SectionHeader({ icon: Icon, title, gradientFrom, gradientTo, iconColor, iconBg }: SectionHeaderProps) {
  return (
    <div className={`relative overflow-hidden rounded-t-xl bg-gradient-to-r ${gradientFrom} ${gradientTo} p-5 pb-4`}>
      <div className="absolute inset-0 bg-white/10" />
      <div className="relative flex items-center gap-3">
        <div className={`h-10 w-10 rounded-xl ${iconBg} flex items-center justify-center shadow-sm`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
    </div>
  );
}

// ==================== Component ====================

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // ---- Appearance ----
  const [autoDarkMode, setAutoDarkMode] = useState(() =>
    getLocalStorageBool('codet-theme-preference', false),
  );

  const handleAutoDarkModeChange = useCallback((checked: boolean) => {
    setAutoDarkMode(checked);
    localStorage.setItem('codet-theme-preference', String(checked));
    window.dispatchEvent(new CustomEvent('theme-change', { detail: { autoDarkMode: checked } }));
  }, []);

  // ---- Notifications ----
  const [soundNotifications, setSoundNotifications] = useState(() =>
    getLocalStorageBool('codet-sound-notifications', false),
  );
  const [eventReminders, setEventReminders] = useState(() =>
    getLocalStorageBool('codet-event-reminders', false),
  );
  const [blogUpdates, setBlogUpdates] = useState(() =>
    getLocalStorageBool('codet-blog-updates', true),
  );

  const handleSoundNotificationsChange = useCallback((checked: boolean) => {
    setSoundNotifications(checked);
    localStorage.setItem('codet-sound-notifications', String(checked));
  }, []);

  const handleEventRemindersChange = useCallback((checked: boolean) => {
    setEventReminders(checked);
    localStorage.setItem('codet-event-reminders', String(checked));
  }, []);

  const handleBlogUpdatesChange = useCallback((checked: boolean) => {
    setBlogUpdates(checked);
    localStorage.setItem('codet-blog-updates', String(checked));
  }, []);

  // ---- Language ----
  const [language, setLanguage] = useState('fr');

  // ---- Clear Cache ----
  const handleClearCache = () => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('codet-')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    // Reset local state after clearing
    setAutoDarkMode(false);
    setSoundNotifications(false);
    setEventReminders(false);
    setBlogUpdates(false);

    toast({
      title: 'Cache effacé',
      description: `${keysToRemove.length} élément(s) de données locales ont été supprimés.`,
    });
  };

  // ---- Export Data (admin) ----
  const canExport = ['admin', 'président', 'secretaire', 'secretaire_general', 'trésorier'].includes(user.role);

  const [exportLoading, setExportLoading] = useState<Record<string, boolean>>({});
  const [exportAllLoading, setExportAllLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [collectionCounts, setCollectionCounts] = useState<Record<string, number>>({});

  const exportCollections = [
    { id: COLLECTIONS.USERS, name: 'Membres', icon: Users, bgClass: 'bg-emerald-100 dark:bg-emerald-900/40', textClass: 'text-emerald-600 dark:text-emerald-400' },
    { id: COLLECTIONS.PROJECTS, name: 'Projets', icon: FolderKanban, bgClass: 'bg-sky-100 dark:bg-sky-900/40', textClass: 'text-sky-600 dark:text-sky-400' },
    { id: COLLECTIONS.TRANSACTIONS, name: 'Transactions', icon: Wallet, bgClass: 'bg-amber-100 dark:bg-amber-900/40', textClass: 'text-amber-600 dark:text-amber-400' },
    { id: COLLECTIONS.EVENTS, name: 'Événements', icon: CalendarDays, bgClass: 'bg-violet-100 dark:bg-violet-900/40', textClass: 'text-violet-600 dark:text-violet-400' },
    { id: COLLECTIONS.PAYMENTS, name: 'Paiements', icon: CreditCard, bgClass: 'bg-rose-100 dark:bg-rose-900/40', textClass: 'text-rose-600 dark:text-rose-400' },
    { id: COLLECTIONS.BLOG_POSTS, name: 'Articles', icon: Newspaper, bgClass: 'bg-cyan-100 dark:bg-cyan-900/40', textClass: 'text-cyan-600 dark:text-cyan-400' },
  ];

  useEffect(() => {
    if (!canExport) return;
    exportCollections.forEach(async (col) => {
      try {
        const result = await getDocs(col.id);
        setCollectionCounts(prev => ({ ...prev, [col.id]: result.total }));
      } catch {
        // silently fail for counts
      }
    });
  }, []);

  const exportCollection = async (collectionId: string, fileName: string) => {
    setExportLoading(prev => ({ ...prev, [collectionId]: true }));
    try {
      const result = await getDocs(collectionId);
      const blob = new Blob([JSON.stringify(result.documents, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Export réussi', description: `${result.documents.length} documents exportés.` });
    } catch {
      toast({ title: 'Erreur d\'export', description: 'Impossible d\'exporter les données.', variant: 'destructive' });
    } finally {
      setExportLoading(prev => ({ ...prev, [collectionId]: false }));
    }
  };

  const handleExportAll = async () => {
    setExportAllLoading(true);
    setExportProgress('');
    try {
      const allData: Record<string, unknown[]> = {};
      for (let i = 0; i < exportCollections.length; i++) {
        setExportProgress(`${i + 1}/${exportCollections.length}`);
        const col = exportCollections[i];
        const result = await getDocs(col.id);
        allData[col.name] = result.documents;
      }
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `codet-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Export réussi', description: 'Toutes les collections ont été exportées.' });
    } catch {
      toast({ title: 'Erreur d\'export', description: 'Impossible d\'exporter les données.', variant: 'destructive' });
    } finally {
      setExportAllLoading(false);
      setExportProgress('');
    }
  };

  // ---- Download Data ----
  const handleDownloadData = () => {
    const data: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('codet-')) {
        data[key] = localStorage.getItem(key) || '';
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `codet-donnees-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast({
      title: 'Données téléchargées',
      description: 'Vos données locales ont été exportées avec succès.',
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center flex-1 p-6">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <Info className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">Utilisateur non connecté.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const buildDate = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="flex items-start justify-center p-4 md:p-6 min-h-[calc(100vh-8rem)]">
      <div className="w-full max-w-3xl space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
            <Palette className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Paramètres</h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              Préférences de l&apos;application
            </p>
          </div>
        </div>

        {/* ==================== Section 1: Apparence ==================== */}
        <Card className="overflow-hidden">
          <SectionHeader
            icon={Palette}
            title="Apparence"
            gradientFrom="from-emerald-600"
            gradientTo="to-emerald-500"
            iconColor="text-white"
            iconBg="bg-white/20"
          />
          <CardContent className="space-y-4 pt-5">
            {/* Auto dark mode toggle */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="auto-dark-mode" className="text-sm font-medium cursor-pointer">
                  Mode sombre automatique
                </Label>
                <p className="text-xs text-muted-foreground">
                  Basculer automatiquement entre le mode clair et sombre selon les préférences de votre système
                </p>
              </div>
              <Switch
                id="auto-dark-mode"
                checked={autoDarkMode}
                onCheckedChange={handleAutoDarkModeChange}
              />
            </div>

            <Separator />

            {/* Visual preview boxes */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="rounded-lg border-2 border-emerald-500 bg-white dark:bg-zinc-900 h-24 p-3 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-muted" />
                    <div className="h-1.5 w-12 rounded bg-muted" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-1.5 w-20 rounded bg-muted-foreground/20" />
                    <div className="h-1.5 w-16 rounded bg-muted-foreground/20" />
                    <div className="h-1.5 w-24 rounded bg-muted-foreground/20" />
                  </div>
                </div>
                <p className="text-xs text-center text-muted-foreground mt-1.5 font-medium">Clair</p>
              </div>
              <div className="flex-1">
                <div className="rounded-lg border-2 border-muted bg-zinc-900 dark:bg-zinc-950 h-24 p-3 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-zinc-600" />
                    <div className="h-1.5 w-12 rounded bg-zinc-700" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-1.5 w-20 rounded bg-zinc-700" />
                    <div className="h-1.5 w-16 rounded bg-zinc-700" />
                    <div className="h-1.5 w-24 rounded bg-zinc-700" />
                  </div>
                </div>
                <p className="text-xs text-center text-muted-foreground mt-1.5 font-medium">Sombre</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ==================== Section 2: Notifications ==================== */}
        <Card className="overflow-hidden">
          <SectionHeader
            icon={Bell}
            title="Notifications"
            gradientFrom="from-amber-500"
            gradientTo="to-amber-400"
            iconColor="text-white"
            iconBg="bg-white/20"
          />
          <CardContent className="space-y-4 pt-5">
            {/* Sound notifications */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0 mt-0.5">
                  <Volume2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="space-y-0.5">
                  <Label htmlFor="sound-notifications" className="text-sm font-medium cursor-pointer">
                    Son des messages
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Jouer un son lors de la réception de nouveaux messages
                  </p>
                </div>
              </div>
              <Switch
                id="sound-notifications"
                checked={soundNotifications}
                onCheckedChange={handleSoundNotificationsChange}
              />
            </div>

            <Separator />

            {/* Event reminders */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0 mt-0.5">
                  <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="space-y-0.5">
                  <Label htmlFor="event-reminders" className="text-sm font-medium cursor-pointer">
                    Rappels d&apos;événements
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Recevoir des rappels pour les événements à venir
                  </p>
                </div>
              </div>
              <Switch
                id="event-reminders"
                checked={eventReminders}
                onCheckedChange={handleEventRemindersChange}
              />
            </div>

            <Separator />

            {/* Blog updates */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0 mt-0.5">
                  <Newspaper className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="space-y-0.5">
                  <Label htmlFor="blog-updates" className="text-sm font-medium cursor-pointer">
                    Mises à jour du blog
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Être notifié lorsqu&apos;un nouvel article est publié
                  </p>
                </div>
              </div>
              <Switch
                id="blog-updates"
                checked={blogUpdates}
                onCheckedChange={handleBlogUpdatesChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* ==================== Section 3: Langue ==================== */}
        <Card className="overflow-hidden">
          <SectionHeader
            icon={Globe}
            title="Langue"
            gradientFrom="from-sky-500"
            gradientTo="to-sky-400"
            iconColor="text-white"
            iconBg="bg-white/20"
          />
          <CardContent className="space-y-3 pt-5">
            <p className="text-xs text-muted-foreground">
              Choisir la langue de l&apos;interface
            </p>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">Français</SelectItem>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <SelectItem value="en" disabled>
                        English
                      </SelectItem>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Bientôt disponible</TooltipContent>
                </Tooltip>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* ==================== Section 4: Données ==================== */}
        <Card className="overflow-hidden">
          <SectionHeader
            icon={HardDrive}
            title="Données"
            gradientFrom="from-violet-500"
            gradientTo="to-violet-400"
            iconColor="text-white"
            iconBg="bg-white/20"
          />
          <CardContent className="space-y-5 pt-5">
            {/* Storage indicator */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Stockage local</p>
                <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">2.4 MB utilisés</p>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full w-[12%] rounded-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-500" />
              </div>
              <p className="text-xs text-muted-foreground">20 MB maximum disponibles</p>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Vider le cache
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer la suppression du cache</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action supprimera toutes les données locales de l&apos;application, y compris vos préférences enregistrées. Cette action est irréversible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearCache}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadData}
                className="shrink-0"
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger mes données
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ==================== Section 5: Export des données ==================== */}
        {canExport && (
          <Card className="overflow-hidden">
            <SectionHeader
              icon={Database}
              title="Export des données"
              gradientFrom="from-teal-600"
              gradientTo="to-teal-500"
              iconColor="text-white"
              iconBg="bg-white/20"
            />
            <CardContent className="space-y-5 pt-5">
              <p className="text-xs text-muted-foreground">
                Télécharger les données de toutes les collections au format JSON. Utile pour les sauvegardes et l&apos;analyse.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {exportCollections.map((col) => {
                  const ColIcon = col.icon;
                  const isLoading = exportLoading[col.id] || false;
                  const count = collectionCounts[col.id];
                  return (
                    <button
                      key={col.id}
                      type="button"
                      disabled={isLoading}
                      onClick={() => exportCollection(col.id, `codet-${col.name.toLowerCase()}`)}
                      className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <div className={`h-10 w-10 rounded-lg ${col.bgClass} flex items-center justify-center shrink-0`}>
                        <ColIcon className={`h-5 w-5 ${col.textClass}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{col.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {count !== undefined ? `${count} documents` : '…'}
                        </p>
                      </div>
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />
                      ) : (
                        <Download className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleExportAll}
                disabled={exportAllLoading}
              >
                {exportAllLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                <Download className="h-4 w-4 mr-2" />
                {exportAllLoading && exportProgress ? `Tout exporter (JSON) — Exportation... ${exportProgress} collections` : 'Tout exporter (JSON)'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ==================== Section 6: À propos ==================== */}
        <Card className="overflow-hidden">
          <SectionHeader
            icon={Info}
            title="À propos"
            gradientFrom="from-gray-500"
            gradientTo="to-gray-400"
            iconColor="text-white"
            iconBg="bg-white/20"
          />
          <CardContent className="space-y-5 pt-5">
            {/* App identity */}
            <div className="flex items-center gap-4">
              <div className="relative h-14 w-14 rounded-xl overflow-hidden shrink-0 ring-2 ring-emerald-200 dark:ring-emerald-700/40 shadow-md">
                <Image src="/logo.png" alt="CODET" fill className="object-contain" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-foreground">CODET</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-medium text-muted-foreground">v2.0.0</span>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="text-xs text-muted-foreground">Build {buildDate}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Comité de Développement Tchoutsi — Plateforme de gestion communautaire
                </p>
              </div>
            </div>

            <Separator />

            {/* Links */}
            <div className="space-y-2">
              <a
                href="#"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Politique de confidentialité</span>
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <a
                href="#"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
              >
                <Info className="h-4 w-4" />
                <span>Conditions d&apos;utilisation</span>
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>

            <Separator />

            {/* Tech stack badges */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Stack technique</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs font-medium gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-sky-500" />
                  Next.js
                </Badge>
                <Badge variant="secondary" className="text-xs font-medium gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-pink-500" />
                  Appwrite
                </Badge>
                <Badge variant="secondary" className="text-xs font-medium gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-cyan-500" />
                  Tailwind CSS
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Credits */}
            <p className="text-xs text-muted-foreground text-center">
              Développé avec ❤ pour la communauté Tchoutsi
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
