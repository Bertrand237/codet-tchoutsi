'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { COLLECTIONS } from '@/lib/appwrite';
import {
  getDocs,
  query,
  where,
  orderBy,
  limit,
  toDate,
} from '@/lib/db';
import Image from 'next/image';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users,
  FolderOpen,
  Clock,
  Newspaper,
  CalendarDays,
  CreditCard,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  Megaphone,
  UserPlus,
  FolderPlus,
  PlusCircle,
  PenSquare,
  PieChart as PieChartIcon,
  MessageSquare,
  Vote,
  Lightbulb,
} from 'lucide-react';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import AnnouncementManager from '@/components/AnnouncementManager';

// ==================== Types ====================

interface StatCardData {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  iconGradientFrom: string;
  iconGradientTo: string;
  gradientFrom: string;
  gradientTo: string;
  description: string;
}

interface RecentBlogPost {
  $id: string;
  title: string;
  author?: string;
  isPublished: boolean;
  createdAt: string;
}

interface RecentPayment {
  $id: string;
  montant?: number;
  membreId?: string;
  membreName?: string;
  statut: string;
  datePaiement?: string;
  createdAt: string;
}

interface RecentEvent {
  $id: string;
  titre?: string;
  title?: string;
  dateDebut?: string;
  dateFin?: string;
  lieu?: string;
  statut?: string;
  createdAt: string;
}

interface MonthlyPayment {
  month: string;
  total: number;
}

interface PaymentStatusItem {
  name: string;
  value: number;
  color: string;
}

interface RoleDistributionItem {
  name: string;
  value: number;
  color: string;
}

// ==================== Helpers ====================

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

function getFrenchDate(): string {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const now = new Date();
  return `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

function getStatusBadge(statut: string) {
  const s = (statut || '').toLowerCase().replace(/\s+/g, '_');
  if (s === 'confirme' || s === 'confirmé' || s === 'valide' || s === 'validé' || s === 'termine' || s === 'terminé' || s === 'complet') {
    return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-0 shrink-0 font-medium">Confirmé</Badge>;
  }
  if (s === 'en_attente' || s === 'en-attente') {
    return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-0 shrink-0 font-medium">En attente</Badge>;
  }
  if (s === 'en_cours' || s === 'en-cours' || s === 'actif' || s === 'active') {
    return <Badge className="bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400 border-0 shrink-0 font-medium">En cours</Badge>;
  }
  if (s === 'rejete' || s === 'rejeté' || s === 'echec' || s === 'échec') {
    return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-0 shrink-0 font-medium">Rejeté</Badge>;
  }
  return <Badge variant="secondary" className="shrink-0">{statut || 'N/A'}</Badge>;
}

// ==================== Daily Motivational Quotes ====================

const dailyQuotes = [
  'Le CODET grandit grâce à des membres comme vous.',
  'Ensemble, nous construisons quelque chose de grand.',
  'Chaque action compte pour notre communauté. Continuez comme ça !',
  'Votre engagement fait la différence. Merci d\'être là !',
  'L\'union fait la force. Continuons ensemble !',
  'Une belle journée pour avancer nos projets communautaires.',
  'Aujourd\'hui est un jour de possibilités pour notre communauté.',
];

function getDailyQuote(): string {
  const day = new Date().getDay(); // 0=Dimanche, 1=Lundi, ...
  return dailyQuotes[day];
}

// ==================== Daily Tips ====================

const dailyTips = [
  "Pensez à vérifier les paiements en attente pour maintenir la trésorerie à jour.",
  "Un message d'encouragement à un nouveau membre peut faire toute la différence.",
  "Planifiez vos événements au moins 2 semaines à l'avance pour une meilleure participation.",
  "Utilisez Ctrl+K pour accéder rapidement à n'importe quelle page.",
  "N'oubliez pas de publier des articles de blog pour informer la communauté.",
  "Consultez le journal d'activité pour suivre les actions récentes de l'équipe.",
  "Accueillez chaque nouveau membre avec un message personnalisé dès son inscription.",
  "Relancez doucement les membres dont les paiements sont en attente depuis plus de 7 jours.",
  "Créez des votes pour impliquer les membres dans les décisions importantes.",
  "Partagez des photos de la galerie pour renforcer le sentiment d'appartenance.",
  "Mettez à jour les statuts des projets terminés pour garder un tableau de bord clair.",
  "Organisez un événement mensuel régulier pour maintenir l'engagement de la communauté.",
  "Vérifiez régulièrement que les informations des membres sont à jour.",
  "Utilisez les annonces pour communiquer les nouvelles importantes à tous les membres.",
  "Encouragez les membres à participer aux votes — chaque voix compte !",
  "Un bon article de blog peut attirer de nouveaux membres vers la communauté.",
  "Surveillez les tendances des paiements mensuels pour anticiper les besoins budgétaires.",
  "Déléguez des tâches aux membres actifs pour renforcer l'esprit d'équipe.",
  "Utilisez les raccourcis clavier (Alt+1 à Alt+5) pour naviguer plus rapidement.",
  "Félicitez publiquement les membres qui contribuent le plus à la vie du groupe.",
  "Archivez les anciens projets pour garder une vue d'ensemble organisée.",
  "Pensez à varier les types d'événements : culturels, sportifs, spirituels.",
  "Les messages du jour sont un bon indicateur de l'activité communautaire.",
];

function getDailyTip(): string {
  const day = new Date().getDate() % dailyTips.length;
  return dailyTips[day];
}

// ==================== Animated Counter ====================

function AnimatedCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) return;
    let frame: number;
    const duration = 800;
    const start = performance.now();

    function animate(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="inline-block"
    >
      {display}
    </motion.span>
  );
}

// ==================== Quick Actions Data ====================

const quickActions = [
  { label: 'Nouveau membre', icon: UserPlus, page: 'Membres', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/50' },
  { label: 'Nouveau projet', icon: FolderPlus, page: 'Projets', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-100 dark:bg-sky-900/50' },
  { label: 'Enregistrer paiement', icon: PlusCircle, page: 'Paiements', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/50' },
  { label: 'Créer un vote', icon: PlusCircle, page: 'Votes', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-900/50' },
  { label: 'Publier article', icon: PenSquare, page: 'Blog', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/50' },
];

// ==================== Skeleton Components ====================

function WelcomeCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-4 p-4 md:p-6">
        <Skeleton className="h-14 w-14 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full hidden sm:block" />
      </div>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card className="p-4 relative overflow-hidden">
      {/* Gradient overlay skeleton */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted/20 pointer-events-none rounded-lg" />
      <div className="relative flex items-start justify-between">
        <div className="space-y-3 flex-1 min-w-0 pt-1">
          <Skeleton className="h-3.5 w-28 rounded" />
          <Skeleton className="h-10 w-16 rounded" />
          <Skeleton className="h-3 w-36 rounded" />
        </div>
        <Skeleton className="h-12 w-12 rounded-full shrink-0" />
      </div>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <Card className="p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-5 w-36 rounded" />
      </div>
      <Skeleton className="h-3 w-64 mb-4 rounded" />
      <div className="h-[250px] w-full rounded-lg flex items-end gap-2 px-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t-md"
            style={{ height: `${30 + Math.random() * 70}%` }}
          />
        ))}
      </div>
    </Card>
  );
}

function PieChartSkeleton() {
  return (
    <Card className="p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-5 w-44 rounded" />
      </div>
      <div className="h-[280px] w-full flex items-center justify-center">
        <Skeleton className="h-40 w-40 rounded-full" />
      </div>
    </Card>
  );
}

function RecentItemSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
      <div className="flex-1 space-y-1.5 min-w-0">
        <Skeleton className="h-4 w-48 rounded" />
        <Skeleton className="h-3 w-28 rounded" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full shrink-0" />
    </div>
  );
}

function RecentActivitySkeleton() {
  return (
    <Card className="p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-5 w-32 rounded" />
      </div>
      <div className="space-y-0 divide-y">
        {Array.from({ length: 5 }).map((_, i) => (
          <RecentItemSkeleton key={i} />
        ))}
      </div>
    </Card>
  );
}

// ==================== Custom Pie Tooltip ====================

interface PieTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: PaymentStatusItem;
  }>;
}

function PaymentPieTooltip({ active, payload }: PieTooltipProps) {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <div className="flex items-center gap-2">
        <span
          className="h-3 w-3 rounded-full shrink-0"
          style={{ backgroundColor: data.payload.color }}
        />
        <span className="font-medium text-popover-foreground">{data.name}</span>
      </div>
      <p className="text-muted-foreground mt-1 pl-5">{data.value} paiement{data.value !== 1 ? 's' : ''}</p>
    </div>
  );
}

// ==================== Custom Pie Legend ====================

interface PieLegendProps {
  payload?: Array<{
    value: string;
    color: string;
  }>;
}

function PaymentPieLegend({ payload }: PieLegendProps) {
  if (!payload?.length) return null;
  return (
    <div className="flex items-center justify-center gap-4 mt-2">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// ==================== Engagement Skeleton ====================

function EngagementQuickStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
          <Skeleton className="h-9 w-9 rounded-full shrink-0" />
          <div className="space-y-1.5 flex-1 min-w-0">
            <Skeleton className="h-5 w-8 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== Role Donut Legend ====================

interface RolePieLegendProps {
  payload?: Array<{
    value: string;
    color: string;
    payload?: RoleDistributionItem;
  }>;
}

function RolePieLegend({ payload }: RolePieLegendProps) {
  if (!payload?.length) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-2">
      {payload.map((entry, index) => {
        const count = entry.payload?.value ?? 0;
        return (
          <div key={index} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-muted-foreground">
              {entry.value} ({count})
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ==================== Main Component ====================

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [showAnnouncementManager, setShowAnnouncementManager] = useState(false);

  const adminRoles = ['admin', 'président', 'secretaire_general'];
  const canManageAnnouncements = user ? adminRoles.includes(user.role) : false;

  const [loading, setLoading] = useState(true);
  const [totalMembers, setTotalMembers] = useState(0);
  const [activeProjects, setActiveProjects] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [publishedPosts, setPublishedPosts] = useState(0);

  const [recentPosts, setRecentPosts] = useState<RecentBlogPost[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [monthlyPayments, setMonthlyPayments] = useState<MonthlyPayment[]>([]);
  const [paymentStatusData, setPaymentStatusData] = useState<PaymentStatusItem[]>([
    { name: 'Confirmé', value: 0, color: '#10b981' },
    { name: 'En attente', value: 0, color: '#f59e0b' },
    { name: 'Rejeté', value: 0, color: '#ef4444' },
  ]);
  const [roleDistributionData, setRoleDistributionData] = useState<RoleDistributionItem[]>([]);
  const [todayMessagesCount, setTodayMessagesCount] = useState(0);
  const [upcomingEventsCount, setUpcomingEventsCount] = useState(0);
  const [activePollsCount, setActivePollsCount] = useState(0);
  const [memberGrowthData, setMemberGrowthData] = useState<{ month: string; count: number }[]>([]);

  // Fetch all dashboard data
  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        // Fetch total members + role distribution
        const usersResult = await getDocs(COLLECTIONS.USERS);
        setTotalMembers(usersResult.total);

        // Compute role distribution from user documents
        const roleColors: Record<string, string> = {
          admin: '#10b981',
          président: '#0ea5e9',
          secretaire: '#8b5cf6',
          secretaire_general: '#f59e0b',
          trésorier: '#f43f5e',
          commissaire: '#06b6d4',
          celcom: '#ec4899',
          responsable_communication: '#f97316',
          membre: '#6b7280',
        };
        const roleLabels: Record<string, string> = {
          admin: 'Admin',
          président: 'Président',
          secretaire: 'Secrétaire',
          secretaire_general: 'Secr. général',
          trésorier: 'Trésorier',
          commissaire: 'Commissaire',
          celcom: 'Celcom',
          responsable_communication: 'Resp. communication',
          membre: 'Membre',
        };
        const roleMap: Record<string, number> = {};
        usersResult.documents.forEach((u: Record<string, unknown>) => {
          const r = (u.role as string) || 'membre';
          roleMap[r] = (roleMap[r] || 0) + 1;
        });
        setRoleDistributionData(
          Object.entries(roleMap).map(([role, count]) => ({
            name: roleLabels[role] || role,
            value: count,
            color: roleColors[role] || '#6b7280',
          }))
        );

        // Compute member growth sparkline data (last 6 months)
        const monthNamesShort = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        const userGrowthMap = new Map<string, number>();
        usersResult.documents.forEach((u: Record<string, unknown>) => {
          try {
            const d = toDate(u.createdAt as string);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            userGrowthMap.set(key, (userGrowthMap.get(key) || 0) + 1);
          } catch { /* skip */ }
        });
        const growthNow = new Date();
        const growthData: { month: string; count: number }[] = [];
        for (let i = 5; i >= 0; i--) {
          const gd = new Date(growthNow.getFullYear(), growthNow.getMonth() - i, 1);
          const gKey = `${gd.getFullYear()}-${String(gd.getMonth() + 1).padStart(2, '0')}`;
          growthData.push({ month: monthNamesShort[gd.getMonth()], count: userGrowthMap.get(gKey) || 0 });
        }
        setMemberGrowthData(growthData);

        // Fetch active projects (statut === 'en_cours')
        try {
          const projectsResult = await getDocs(
            query(COLLECTIONS.PROJECTS, where('statut', '==', 'en_cours'))
          );
          setActiveProjects(projectsResult.total);
        } catch {
          try {
            const allProjects = await getDocs(COLLECTIONS.PROJECTS);
            const active = allProjects.documents.filter(
              (p: Record<string, unknown>) => p.statut === 'en_cours' || p.statut === 'en-cours'
            );
            setActiveProjects(active.length);
          } catch {
            setActiveProjects(0);
          }
        }

        // Fetch pending payments (statut === 'en_attente')
        try {
          const paymentsResult = await getDocs(
            query(COLLECTIONS.PAYMENTS, where('statut', '==', 'en_attente'))
          );
          setPendingPayments(paymentsResult.total);
        } catch {
          try {
            const allPayments = await getDocs(COLLECTIONS.PAYMENTS);
            const pending = allPayments.documents.filter(
              (p: Record<string, unknown>) => p.statut === 'en_attente' || p.statut === 'en-attente'
            );
            setPendingPayments(pending.length);
          } catch {
            setPendingPayments(0);
          }
        }

        // Fetch published blog posts count
        try {
          const postsResult = await getDocs(
            query(COLLECTIONS.BLOG_POSTS, where('isPublished', '==', true))
          );
          setPublishedPosts(postsResult.total);
        } catch {
          try {
            const allPosts = await getDocs(COLLECTIONS.BLOG_POSTS);
            const published = allPosts.documents.filter(
              (p: Record<string, unknown>) => p.isPublished === true
            );
            setPublishedPosts(published.length);
          } catch {
            setPublishedPosts(0);
          }
        }

        // Fetch recent blog posts (last 5)
        try {
          const postsSnap = await getDocs(
            query(COLLECTIONS.BLOG_POSTS, orderBy('createdAt', 'desc'), limit(5))
          );
          setRecentPosts(postsSnap.documents as unknown as RecentBlogPost[]);
        } catch {
          setRecentPosts([]);
        }

        // Fetch recent payments (last 5)
        try {
          const paymentsSnap = await getDocs(
            query(COLLECTIONS.PAYMENTS, orderBy('createdAt', 'desc'), limit(5))
          );
          setRecentPayments(paymentsSnap.documents as unknown as RecentPayment[]);
        } catch {
          setRecentPayments([]);
        }

        // Fetch recent events (last 5)
        try {
          const eventsSnap = await getDocs(
            query(COLLECTIONS.EVENTS, orderBy('createdAt', 'desc'), limit(5))
          );
          setRecentEvents(eventsSnap.documents as unknown as RecentEvent[]);
        } catch {
          setRecentEvents([]);
        }

        // Fetch engagement metrics: messages today
        try {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const messagesResult = await getDocs(
            query(COLLECTIONS.MESSAGES, where('createdAt', '>=', todayStart.toISOString()))
          );
          setTodayMessagesCount(messagesResult.total);
        } catch {
          try {
            const allMessages = await getDocs(COLLECTIONS.MESSAGES);
            let count = 0;
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            allMessages.documents.forEach((m: Record<string, unknown>) => {
              try {
                const d = toDate(m.createdAt as string);
                if (d >= todayStart) count++;
              } catch { /* skip */ }
            });
            setTodayMessagesCount(count);
          } catch {
            setTodayMessagesCount(0);
          }
        }

        // Fetch engagement metrics: upcoming events
        try {
          const nowISO = new Date().toISOString();
          const upcomingResult = await getDocs(
            query(COLLECTIONS.EVENTS, where('dateDebut', '>', nowISO))
          );
          setUpcomingEventsCount(upcomingResult.total);
        } catch {
          try {
            const allEvents = await getDocs(COLLECTIONS.EVENTS);
            const now = new Date();
            let count = 0;
            allEvents.documents.forEach((e: Record<string, unknown>) => {
              try {
                const d = toDate(e.dateDebut as string);
                if (d > now) count++;
              } catch { /* skip */ }
            });
            setUpcomingEventsCount(count);
          } catch {
            setUpcomingEventsCount(0);
          }
        }

        // Fetch engagement metrics: active polls
        try {
          const activePollsResult = await getDocs(
            query(COLLECTIONS.POLLS, where('actif', '==', true))
          );
          setActivePollsCount(activePollsResult.total);
        } catch {
          try {
            const allPolls = await getDocs(COLLECTIONS.POLLS);
            const active = allPolls.documents.filter(
              (p: Record<string, unknown>) => p.actif === true
            );
            setActivePollsCount(active.length);
          } catch {
            setActivePollsCount(0);
          }
        }

        // Fetch all payments for monthly chart + payment status distribution
        try {
          const allPaymentsSnap = await getDocs(COLLECTIONS.PAYMENTS);
          const payments = allPaymentsSnap.documents as unknown as RecentPayment[];

          // Group by month
          const monthMap = new Map<string, number>();
          const monthNames = [
            'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
            'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
          ];

          // Count by status for pie chart
          let confirmed = 0;
          let pending = 0;
          let rejected = 0;

          payments.forEach((p) => {
            try {
              const d = toDate(p.createdAt);
              const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
              const current = monthMap.get(key) || 0;
              monthMap.set(key, current + (p.montant || 0));
            } catch {
              // Skip invalid dates
            }

            // Categorize payment status
            const s = (p.statut || '').toLowerCase().replace(/\s+/g, '_');
            if (s === 'confirme' || s === 'confirmé' || s === 'valide' || s === 'validé' || s === 'termine' || s === 'terminé' || s === 'complet') {
              confirmed++;
            } else if (s === 'en_attente' || s === 'en-attente') {
              pending++;
            } else if (s === 'rejete' || s === 'rejeté' || s === 'echec' || s === 'échec') {
              rejected++;
            }
          });

          // Build chart data for last 6 months
          const now = new Date();
          const chartData: MonthlyPayment[] = [];
          for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            chartData.push({
              month: monthNames[d.getMonth()],
              total: monthMap.get(key) || 0,
            });
          }
          setMonthlyPayments(chartData);

          // Set payment status distribution
          setPaymentStatusData([
            { name: 'Confirmé', value: confirmed, color: '#10b981' },
            { name: 'En attente', value: pending, color: '#f59e0b' },
            { name: 'Rejeté', value: rejected, color: '#ef4444' },
          ]);
        } catch {
          setMonthlyPayments([]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: 'Erreur de chargement',
          description: 'Impossible de charger les données du tableau de bord.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [toast]);

  // Stabilize daily quote, tip and date
  const dailyQuote = useMemo(() => getDailyQuote(), []);
  const dailyTip = useMemo(() => getDailyTip(), []);
  const frenchDate = useMemo(() => getFrenchDate(), []);

  // Member growth sparkline: only show if 2+ months have data
  const showMemberSparkline = useMemo(
    () => memberGrowthData.filter((d) => d.count > 0).length >= 2,
    [memberGrowthData]
  );

  // Role badge color
  const roleBadgeClass = useMemo(() => {
    const adminRoles = ['admin', 'président', 'secretaire_general'];
    if (adminRoles.includes(user?.role || '')) {
      return 'border-emerald-400 text-emerald-700 dark:border-emerald-600 dark:text-emerald-400';
    }
    return 'border-sky-400 text-sky-700 dark:border-sky-600 dark:text-sky-400';
  }, [user?.role]);

  // Stats cards data with gradient info
  const stats: StatCardData[] = [
    {
      label: 'Total Membres',
      value: totalMembers,
      icon: <Users className="h-5 w-5 text-white" />,
      color: 'text-emerald-600 dark:text-emerald-400',
      iconGradientFrom: 'from-emerald-400',
      iconGradientTo: 'to-emerald-600',
      gradientFrom: 'from-emerald-500/5',
      gradientTo: 'to-teal-500/5',
      description: 'Membres inscrits',
    },
    {
      label: 'Projets Actifs',
      value: activeProjects,
      icon: <FolderOpen className="h-5 w-5 text-white" />,
      color: 'text-sky-600 dark:text-sky-400',
      iconGradientFrom: 'from-sky-400',
      iconGradientTo: 'to-sky-600',
      gradientFrom: 'from-sky-500/5',
      gradientTo: 'to-blue-500/5',
      description: 'En cours de réalisation',
    },
    {
      label: 'Paiements en attente',
      value: pendingPayments,
      icon: <Clock className="h-5 w-5 text-white" />,
      color: 'text-amber-600 dark:text-amber-400',
      iconGradientFrom: 'from-amber-400',
      iconGradientTo: 'to-amber-600',
      gradientFrom: 'from-amber-500/5',
      gradientTo: 'to-orange-500/5',
      description: 'En attente de validation',
    },
    {
      label: 'Articles publiés',
      value: publishedPosts,
      icon: <Newspaper className="h-5 w-5 text-white" />,
      color: 'text-violet-600 dark:text-violet-400',
      iconGradientFrom: 'from-violet-400',
      iconGradientTo: 'to-violet-600',
      gradientFrom: 'from-violet-500/5',
      gradientTo: 'to-purple-500/5',
      description: 'Sur le blog',
    },
  ];

  // Total payments for pie chart
  const totalPayments = useMemo(
    () => paymentStatusData.reduce((sum, item) => sum + item.value, 0),
    [paymentStatusData]
  );

  const handleQuickAction = (page: string) => {
    toast({
      title: `Navigation vers ${page}`,
      description: `Utilisez la navigation pour accéder à ${page}`,
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Announcement Banner */}
      <AnnouncementBanner />

      {/* Bienvenue Card */}
      {loading ? (
        <WelcomeCardSkeleton />
      ) : (
        <Card className="overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 md:p-6 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-cyan-50/30 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-cyan-950/10">
            {/* User avatar */}
            <Avatar className="h-14 w-14 ring-2 ring-emerald-300 dark:ring-emerald-700 shrink-0">
              <AvatarImage src={user?.photoURL} />
              <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-lg font-bold">
                {user?.displayName?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-bold text-foreground">
                  Bienvenue, {user?.displayName || 'Membre'} !
                </h2>
                <Sparkles className="h-5 w-5 text-amber-500 hidden sm:inline-block" />
                {canManageAnnouncements && (
                  <button
                    onClick={() => setShowAnnouncementManager(true)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    aria-label="Gérer les annonces"
                  >
                    <Megaphone className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground/70 mt-1 font-medium">
                {frenchDate}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {dailyQuote}
              </p>
            </div>
            <Badge variant="outline" className={`border capitalize text-sm shrink-0 ${roleBadgeClass}`}>
              {(user?.role || 'membre').replace(/_/g, ' ')}
            </Badge>
          </div>

          {/* Daily Tip */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mx-4 md:mx-6 mb-4 md:mb-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 rounded-lg p-3"
          >
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">Conseil du jour</p>
                <p className="text-xs text-amber-800 dark:text-amber-200 mt-0.5 leading-relaxed">{dailyTip}</p>
              </div>
            </div>
          </motion.div>

          {/* Member Growth Sparkline */}
          {showMemberSparkline && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mx-4 md:mx-6 mb-4 md:mb-6"
            >
              <p className="text-[11px] text-muted-foreground mb-1">Tendance membres (6 mois)</p>
              <div className="h-10 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={memberGrowthData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </Card>
      )}

      {/* Engagement Quick Stats */}
      {loading ? (
        <EngagementQuickStatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
          {[
            { icon: <MessageSquare className="h-4 w-4" />, value: todayMessagesCount, label: "Messages aujourd'hui", color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-100 dark:bg-sky-900/50' },
            { icon: <Newspaper className="h-4 w-4" />, value: publishedPosts, label: 'Articles publiés', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-900/50' },
            { icon: <CalendarDays className="h-4 w-4" />, value: upcomingEventsCount, label: 'Événements à venir', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/50' },
            { icon: <Vote className="h-4 w-4" />, value: activePollsCount, label: 'Votes actifs', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/50' },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.08 }}
            >
              <div className={`h-9 w-9 rounded-full ${item.bg} ${item.color} flex items-center justify-center shrink-0 dark:opacity-80`}>
                {item.icon}
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-foreground tabular-nums leading-tight">
                  <AnimatedCounter value={item.value} />
                </p>
                <p className="text-[11px] text-muted-foreground truncate">{item.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : stats.map((stat) => (
              <Card
                key={stat.label}
                className="group p-4 relative overflow-hidden ring-1 ring-border hover:ring-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* Subtle gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradientFrom} ${stat.gradientTo} pointer-events-none rounded-lg`} />

                <div className="relative flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0 pt-0.5">
                    <p className="text-xs text-muted-foreground font-medium truncate">
                      {stat.label}
                    </p>
                    <p className="text-3xl md:text-4xl font-bold text-foreground tracking-tight tabular-nums">
                      {stat.value}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs text-muted-foreground truncate">
                        {stat.description}
                      </p>
                      <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                        <ArrowUpRight className="h-3 w-3" />
                        <span className="text-[11px] font-semibold">+12%</span>
                      </span>
                    </div>
                  </div>
                  {/* Icon in a gradient circle */}
                  <div
                    className={`h-12 w-12 rounded-full bg-gradient-to-br ${stat.iconGradientFrom} ${stat.iconGradientTo} flex items-center justify-center shrink-0 ml-3 group-hover:scale-110 transition-transform duration-200 shadow-md dark:opacity-80`}
                  >
                    {stat.icon}
                  </div>
                </div>
              </Card>
            ))
        }
      </div>

      {/* Monthly Payments Chart - Full Width */}
      {loading ? (
        <ChartSkeleton />
      ) : (
        <Card className="p-4 md:p-6">
          <CardHeader className="p-0 pb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-base">Paiements par mois</CardTitle>
                <CardDescription>
                  Montant total des paiements des 6 derniers mois
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {monthlyPayments.some((m) => m.total > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyPayments} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => `${value.toLocaleString('fr-FR')} FCFA`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: 'hsl(var(--popover-foreground))',
                    }}
                    itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                    labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                  />
                  <Bar
                    dataKey="total"
                    fill="hsl(160, 84%, 39%)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex flex-col items-center justify-center text-muted-foreground">
                <div className="relative h-20 w-20 mb-4 opacity-15">
                  <Image
                    src="/logo.png"
                    alt="CODET"
                    fill
                    className="object-contain"
                  />
                </div>
                <p className="text-sm font-medium">Aucune donnée financière</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Les données apparaîtront une fois les paiements enregistrés
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment Donut + Role Distribution Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Status Donut */}
        {loading ? (
          <PieChartSkeleton />
        ) : (
          <Card className="p-4 md:p-6">
            <CardHeader className="p-0 pb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
                  <PieChartIcon className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <CardTitle className="text-base">Répartition des paiements</CardTitle>
                  <CardDescription>
                    Distribution par statut de validation
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {totalPayments > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={paymentStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {paymentStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<PaymentPieTooltip />} />
                      <Legend content={<PaymentPieLegend />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex items-center justify-center gap-6 pt-2">
                    {paymentStatusData.map((item) => (
                      <div key={item.name} className="text-center">
                        <p className="text-lg font-bold tabular-nums" style={{ color: item.color }}>
                          {item.value}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{item.name}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[280px] flex flex-col items-center justify-center text-muted-foreground">
                  <div className="relative h-20 w-20 mb-4 opacity-15">
                    <Image
                      src="/logo.png"
                      alt="CODET"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <p className="text-sm font-medium">Aucun paiement enregistré</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    La répartition apparaîtra une fois les paiements ajoutés
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Role Distribution Donut */}
        {loading ? (
          <PieChartSkeleton />
        ) : (
          <Card className="p-4 md:p-6">
            <CardHeader className="p-0 pb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                  <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-base">Répartition des rôles</CardTitle>
                  <CardDescription>
                    Distribution des membres par rôle
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {roleDistributionData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={roleDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {roleDistributionData.map((entry, index) => (
                          <Cell key={`role-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [`${value} membre${value !== 1 ? 's' : ''}`, name]}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '13px',
                          color: 'hsl(var(--popover-foreground))',
                        }}
                        itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                        labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                      />
                      <Legend content={<RolePieLegend />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 pt-2">
                    {roleDistributionData.map((item) => (
                      <div key={item.name} className="text-center">
                        <p className="text-lg font-bold tabular-nums" style={{ color: item.color }}>
                          {item.value}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{item.name}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[280px] flex flex-col items-center justify-center text-muted-foreground">
                  <div className="relative h-20 w-20 mb-4 opacity-15">
                    <Image
                      src="/logo.png"
                      alt="CODET"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <p className="text-sm font-medium">Aucun membre enregistré</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    La répartition apparaîtra une fois les membres inscrits
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => handleQuickAction(action.page)}
              className="group/card flex flex-col items-center gap-2.5 p-4 rounded-xl border border-border bg-card hover:bg-accent/50 hover:border-emerald-500/30 hover:shadow-md hover:shadow-emerald-500/5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <div className={`h-10 w-10 rounded-lg ${action.bg} ${action.color} flex items-center justify-center group-hover/card:scale-110 transition-transform duration-200`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-foreground text-center leading-tight">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Recent Activity + Derniers articles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        {loading ? (
          <RecentActivitySkeleton />
        ) : (
          <Card className="p-4 md:p-6">
            <CardHeader className="p-0 pb-3">
              <div className="flex items-center gap-3 border-l-2 border-l-sky-400 pl-3">
                <div className="h-8 w-8 rounded-lg bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center">
                  <ArrowUpRight className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <CardTitle className="text-base">Activité récente</CardTitle>
                  <CardDescription className="text-xs">
                    Dernières actions enregistrées
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0 divide-y max-h-[320px] overflow-y-auto">
                {/* Recent Blog Posts */}
                {recentPosts.map((post) => (
                  <div key={post.$id} className="flex items-center gap-3 py-3 first:pt-0 px-2 -mx-2 rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="h-9 w-9 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center shrink-0">
                      <Newspaper className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${post.isPublished ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                        <p className="text-sm font-medium truncate">{post.title}</p>
                      </div>
                      <p className="text-xs text-muted-foreground pl-4">{formatDate(post.createdAt)}</p>
                    </div>
                    {post.isPublished ? (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-0 shrink-0 font-medium">Publié</Badge>
                    ) : (
                      <Badge variant="secondary" className="shrink-0">Brouillon</Badge>
                    )}
                  </div>
                ))}

                {/* Recent Payments */}
                {recentPayments.map((payment) => (
                  <div key={payment.$id} className="flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                      <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {payment.membreName || payment.membreId || 'Paiement'}
                        {payment.montant ? ` — ${payment.montant.toLocaleString('fr-FR')} FCFA` : ''}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(payment.createdAt)}</p>
                    </div>
                    {getStatusBadge(payment.statut)}
                  </div>
                ))}

                {/* Recent Events */}
                {recentEvents.map((event) => (
                  <div key={event.$id} className="flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="h-9 w-9 rounded-lg bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center shrink-0">
                      <CalendarDays className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {event.titre || event.title || 'Événement'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(event.createdAt)}
                        {event.lieu ? ` — ${event.lieu}` : ''}
                      </p>
                    </div>
                    {getStatusBadge(event.statut || '')}
                  </div>
                ))}

                {/* Empty state */}
                {!recentPosts.length && !recentPayments.length && !recentEvents.length && (
                  <div className="py-12 text-center text-muted-foreground">
                    <div className="relative h-16 w-16 mx-auto mb-3 opacity-15">
                      <Image
                        src="/logo.png"
                        alt="CODET"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <p className="text-sm font-medium">Aucune activité récente</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      L'activité apparaîtra ici dès que des actions seront effectuées
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Derniers articles */}
        {loading ? (
          <RecentActivitySkeleton />
        ) : (
          <Card className="p-4 md:p-6">
            <CardHeader className="p-0 pb-3">
              <div className="flex items-center gap-3 border-l-2 border-l-violet-400 pl-3">
                <div className="h-8 w-8 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
                  <Newspaper className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <CardTitle className="text-base">Derniers articles</CardTitle>
                  <CardDescription className="text-xs">
                    Articles récents du blog
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0 divide-y max-h-[320px] overflow-y-auto">
                {recentPosts.length > 0 ? (
                  recentPosts.map((post) => (
                    <div key={post.$id} className="flex items-center gap-3 py-3 first:pt-0 px-2 -mx-2 rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="h-9 w-9 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center shrink-0">
                        <Newspaper className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full shrink-0 ${post.isPublished ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                          <p className="text-sm font-medium truncate">{post.title}</p>
                        </div>
                        <p className="text-xs text-muted-foreground pl-4">
                          {post.author && <span className="text-foreground/70">{post.author} · </span>}
                          {formatDate(post.createdAt)}
                        </p>
                      </div>
                      {post.isPublished ? (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-0 shrink-0 font-medium">Publié</Badge>
                      ) : (
                        <Badge variant="secondary" className="shrink-0">Brouillon</Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    <Newspaper className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">Aucun article</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Les articles publiés apparaîtront ici
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Announcement Manager Dialog */}
      <AnnouncementManager
        open={showAnnouncementManager}
        onOpenChange={setShowAnnouncementManager}
      />
    </div>
  );
}
