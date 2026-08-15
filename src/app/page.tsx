'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { ChevronRight, ArrowUp, ChevronDown, Newspaper, Mail, Users, ShieldCheck, Target, Eye, CalendarDays, Coins, MessageSquare, Globe, Phone, Quote } from 'lucide-react';
import { AuthProvider, useAuth, UserRole } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import ThemeToggle from '@/components/ThemeToggle';
import AppSidebar from '@/components/AppSidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import CommandPalette from '@/components/CommandPalette';
import KeyboardShortcutsDialog from '@/components/KeyboardShortcutsDialog';
import OnboardingDialog from '@/components/OnboardingDialog';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Search } from 'lucide-react';

// Import auth pages
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ChangePasswordPage from '@/pages/ChangePasswordPage';

// Import feature pages
import DashboardPage from '@/pages/DashboardPage';
import MembersPage from '@/pages/MembersPage';
import ProjectsPage from '@/pages/ProjectsPage';
import BudgetPage from '@/pages/BudgetPage';
import CalendarPage from '@/pages/CalendarPage';
import BlogPage from '@/pages/BlogPage';
import AdsPage from '@/pages/AdsPage';
import VotesPage from '@/pages/VotesPage';
import PaymentsPage from '@/pages/PaymentsPage';
import CensusPage from '@/pages/CensusPage';
import ProfilePage from '@/pages/ProfilePage';
import ChatPage from '@/pages/ChatPage';
import ActivityLogPage from '@/pages/ActivityLogPage';
import SettingsPage from '@/pages/SettingsPage';
import GalleryPage from '@/pages/GalleryPage';
import NotificationBell from '@/components/NotificationBell';
import NotificationsPage from '@/pages/NotificationsPage';

// ==================== Animated Counter ====================

function AnimatedCounter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);

  return <span>{prefix}{count}{suffix}</span>;
}

// ==================== Types ====================

type AuthView = 'login' | 'register' | 'public';

// ==================== Placeholder Page ====================

function PlaceholderPage({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex items-center justify-center flex-1 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{title}</CardTitle>
          {description && (
            <CardDescription>{description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="CODET"
                width={40}
                height={40}
                className="object-contain opacity-50"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Cette page est en cours de développement.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== Page Title Map ====================

const pageTitles: Record<string, { title: string; description: string }> = {
  '/dashboard': { title: 'Tableau de bord', description: 'Vue d\'ensemble de l\'activité du CODET' },
  '/projects': { title: 'Projets', description: 'Gestion des projets communautaires' },
  '/members': { title: 'Membres', description: 'Annuaire des membres du CODET' },
  '/budget': { title: 'Budget', description: 'Suivi financier et budget' },
  '/calendar': { title: 'Calendrier', description: 'Événements et planning' },
  '/votes': { title: 'Votes', description: 'Système de vote et consultations' },
  '/payments': { title: 'Paiements', description: 'Suivi des cotisations et paiements' },
  '/census': { title: 'Recensement', description: 'Données démographiques des membres' },
  '/chat': { title: 'Messagerie', description: 'Communication entre membres' },
  '/activity': { title: 'Activité', description: 'Journal des actions récentes' },
  '/blog': { title: 'Blog', description: 'Actualités et publications' },
  '/ads': { title: 'Publicités', description: 'Gestion des publicités' },
  '/profile': { title: 'Profil', description: 'Votre profil utilisateur' },
  '/settings': { title: 'Paramètres', description: 'Préférences de l\'application' },
  '/gallery': { title: 'Souvenirs', description: 'Galerie photos et vidéos de la communauté' },
  '/notifications': { title: 'Notifications', description: 'Historique de vos notifications' },
};

// ==================== BackToTop for Scroll Area ====================

function BackToTopScrollArea({ targetId }: { targetId: string }) {
  const [visible, setVisible] = useState(false);

  const handleScroll = useCallback(() => {
    const el = document.getElementById(targetId);
    if (el) {
      setVisible(el.scrollTop > 300);
    }
  }, [targetId]);

  const scrollToTop = useCallback(() => {
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [targetId]);

  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll, targetId]);

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Retour en haut"
      className={`fixed bottom-20 right-6 z-50 h-10 w-10 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 flex items-center justify-center transition-all duration-300 cursor-pointer hover:bg-emerald-700 hover:shadow-emerald-600/40 hover:scale-105 ${
        visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}

// ==================== Authenticated App Layout ====================

function AuthenticatedApp() {
  const { user, loading, initialized, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState('/dashboard');

  const currentPageInfo = pageTitles[currentPage] || { title: 'Page', description: '' };

  // Register global keyboard shortcuts
  useKeyboardShortcuts({
    disabled: !user,
    onNavigate: setCurrentPage,
  });

  // Listen for sidebar toggle from keyboard shortcut
  useEffect(() => {
    function handleToggleSidebar() {
      const sidebarTrigger = document.querySelector('[data-sidebar-trigger]') as HTMLButtonElement | null;
      if (sidebarTrigger) sidebarTrigger.click();
    }
    document.addEventListener('toggle-sidebar', handleToggleSidebar);
    return () => document.removeEventListener('toggle-sidebar', handleToggleSidebar);
  }, []);

  return (
    <TooltipProvider>
      <SidebarProvider>
        {/* App Sidebar */}
        <AppSidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          isMobile={false}
        />

        {/* Main content area */}
        <SidebarInset className="flex flex-col min-h-0">
          {/* Top header bar with gradient bottom border */}
          <header className="relative flex h-14 shrink-0 items-center gap-2 px-4 bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 border-b-0">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />

            {/* Breadcrumb path: CODET > Page title */}
            <div className="flex-1 flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">CODET</span>
              <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />
              <h1 className="text-sm font-medium truncate">{currentPageInfo.title}</h1>
              {currentPageInfo.description && (
                <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground/70 min-w-0">
                  <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/30" />
                  <span className="truncate">{currentPageInfo.description}</span>
                </span>
              )}
            </div>

            {/* Right side: search, role badge, theme toggle, user info */}
            <div className="flex items-center gap-2">
              <CommandPalette
                currentPage={currentPage}
                onNavigate={setCurrentPage}
                onLogout={signOut}
              />
              <button
                type="button"
                onClick={() => {
                  const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true });
                  document.dispatchEvent(event);
                }}
                className="hidden sm:inline-flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-background text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-150 cursor-pointer"
              >
                <Search className="h-4 w-4" />
                <span>Rechercher...</span>
                <kbd className="pointer-events-none ml-1 inline-flex h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </button>
              
              <Badge
                variant="outline"
                className="hidden sm:inline-flex border-0 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/60 dark:to-teal-950/60 text-emerald-700 dark:text-emerald-300 capitalize text-xs font-medium"
              >
                {user?.role.replace(/_/g, ' ')}
              </Badge>
              <ThemeToggle />
              {user && <NotificationBell user={user} />}
              <div className="flex items-center gap-2 ml-1">
                <div className="relative h-8 w-8 rounded-full overflow-hidden ring-2 ring-muted hover:ring-emerald-500 transition-all duration-200 cursor-pointer">
                  {user?.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={user.displayName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                      {user?.displayName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium hidden md:inline max-w-[120px] truncate">
                  {user?.displayName}
                </span>
              </div>
            </div>

            {/* Gradient bottom border */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
          </header>

          {/* Page content */}
          <div className="flex flex-1 flex-col min-h-0 overflow-y-auto" id="authenticated-scroll-area">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                className="flex flex-1 flex-col min-h-0"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                {currentPage === '/dashboard' && <DashboardPage />}
                {currentPage === '/members' && <MembersPage />}
                {currentPage === '/projects' && <ProjectsPage />}
                {currentPage === '/budget' && <BudgetPage />}
                {currentPage === '/calendar' && <CalendarPage />}
                {currentPage === '/blog' && <BlogPage />}
                {currentPage === '/ads' && <AdsPage />}
                {currentPage === '/votes' && <VotesPage />}
                {currentPage === '/payments' && <PaymentsPage />}
                {currentPage === '/census' && <CensusPage />}
                {currentPage === '/profile' && <ProfilePage />}
                {currentPage === '/chat' && <ChatPage />}
                {currentPage === '/activity' && <ActivityLogPage />}
                {currentPage === '/settings' && <SettingsPage />}
                {currentPage === '/gallery' && <GalleryPage />}
                {currentPage === '/notifications' && <NotificationsPage />}
                {!pageTitles[currentPage] && (
                  <PlaceholderPage
                    title={currentPageInfo.title}
                    description={currentPageInfo.description}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Gradient separator above footer */}
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {/* Sticky footer */}
          <footer className="shrink-0 mt-auto py-3 px-4 bg-background/95 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Image
                  src="/logo.png"
                  alt=""
                  width={16}
                  height={16}
                  className="h-4 w-4 object-contain shrink-0"
                />
                <span>© 2025 CODET — Comité de Développement Tchoutsi</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => document.dispatchEvent(new CustomEvent('show-shortcuts'))}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-150 cursor-pointer"
                >
                  Aide
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage('/settings')}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-150 cursor-pointer"
                >
                  Paramètres
                </button>
              </div>
            </div>
          </footer>

          {/* Back to Top button */}
          <BackToTopScrollArea targetId="authenticated-scroll-area" />

          {/* Mobile bottom navigation bar */}
          <MobileBottomNav
            currentPage={currentPage}
            onNavigate={setCurrentPage}
          />

          {/* Keyboard shortcuts dialog */}
          <KeyboardShortcutsDialog />

          {/* First-time onboarding dialog */}
          <OnboardingDialog />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

// ==================== Unauthenticated Public View ====================

// Framer Motion variants for staggered section animations
const sectionFadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const itemFadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

// Testimonial data
const testimonials = [
  {
    quote: "Rejoindre le CODET a été une décision transformatrice. Grâce à la transparence budgétaire et à l'engagement de chaque membre, je vois concrètement l'impact de nos actions sur le terrain.",
    name: "Amina Tchoutsi",
    role: "Membre depuis 2022",
  },
  {
    quote: "La plateforme nous permet de suivre chaque projet en temps réel. C'est un outil puissant pour la coordination et la mobilisation de notre communauté.",
    name: "Jean-Paul Kamga",
    role: "Coordinateur de projet",
  },
  {
    quote: "En tant que membre du comité, la messagerie intégrée et les votes démocratiques rendent la prise de décision fluide et participative. Une vraie gouvernance moderne.",
    name: "Fatou Nganou",
    role: "Trésorière adjointe",
  },
];

function PublicView({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* CSS Keyframes for floating shapes and gradient animation */}
      <style jsx>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(20px, -30px) rotate(180deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-25px, 20px) rotate(-120deg); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(15px, 25px) rotate(90deg); }
        }
        @keyframes float4 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-20px, -15px) rotate(200deg); }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes logoGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.3), 0 0 60px rgba(16, 185, 129, 0.1); }
          50% { box-shadow: 0 0 40px rgba(16, 185, 129, 0.5), 0 0 80px rgba(16, 185, 129, 0.2); }
        }
        .hero-gradient {
          background: linear-gradient(-45deg, #059669, #0d9488, #10b981, #047857, #0f766e);
          background-size: 400% 400%;
          animation: gradientShift 12s ease infinite;
        }
        .float-shape-1 { animation: float1 8s ease-in-out infinite; }
        .float-shape-2 { animation: float2 10s ease-in-out infinite; }
        .float-shape-3 { animation: float3 12s ease-in-out infinite; }
        .float-shape-4 { animation: float4 9s ease-in-out infinite; }
        .logo-glow { animation: logoGlow 3s ease-in-out infinite; }
      `}</style>

      {/* Public header */}
      <header className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden">
              <Image src="/logo.png" alt="CODET" fill className="object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-emerald-800 dark:text-emerald-300 text-lg leading-tight">
                CODET
              </h1>
              <p className="text-xs text-muted-foreground leading-tight hidden sm:block">
                Comité de Développement Tchoutsi
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" onClick={onLogin} className="text-sm">
              Connexion
            </Button>
            <Button onClick={onRegister} className="text-sm">
              Inscription
            </Button>
          </div>
        </div>
      </header>

      {/* ==================== Hero Section ==================== */}
      <motion.section
        className="relative overflow-hidden hero-gradient"
        initial="hidden"
        animate="visible"
        variants={sectionFadeUp}
      >
        {/* Animated dot pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}>
          <div className="absolute inset-0 animate-pulse" style={{
            backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)',
            backgroundSize: '32px 32px',
            backgroundPosition: '8px 8px'
          }}></div>
        </div>

        {/* Floating geometric shapes */}
        <svg className="absolute top-16 left-[10%] w-12 h-12 float-shape-1 opacity-20" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="22" stroke="white" strokeWidth="2" />
        </svg>
        <svg className="absolute top-32 right-[15%] w-8 h-8 float-shape-2 opacity-15" viewBox="0 0 32 32" fill="none">
          <rect x="2" y="2" width="28" height="28" rx="4" stroke="white" strokeWidth="2" />
        </svg>
        <svg className="absolute bottom-28 left-[20%] w-10 h-10 float-shape-3 opacity-15" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="18" stroke="white" strokeWidth="1.5" />
        </svg>
        <svg className="absolute top-20 right-[8%] w-6 h-6 float-shape-4 opacity-10" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="2" width="20" height="20" rx="2" stroke="white" strokeWidth="1.5" />
        </svg>
        <svg className="absolute bottom-20 right-[25%] w-14 h-14 float-shape-1 opacity-10" viewBox="0 0 56 56" fill="none">
          <circle cx="28" cy="28" r="26" stroke="white" strokeWidth="1" />
        </svg>

        {/* Decorative blurred orbs */}
        <div className="absolute -top-20 -left-20 h-60 w-60 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-teal-400/20 blur-3xl"></div>

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center justify-center px-4 pt-20 pb-16 md:pt-28 md:pb-24">
          {/* Logo with pulsing glow */}
          <div className="relative h-[130px] w-[130px] rounded-full ring-4 ring-white/30 bg-white/10 flex items-center justify-center mb-8 logo-glow">
            <Image
              src="/logo.png"
              alt="CODET"
              width={88}
              height={88}
              className="object-contain drop-shadow-lg"
            />
          </div>

          {/* Title with gradient text effect */}
          <h2 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-3 text-center"
            style={{ textShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
          >
            CODET
          </h2>

          {/* Subtitle */}
          <p className="text-white/90 text-lg md:text-xl mb-4 text-center font-medium">
            Comité de Développement Tchoutsi
          </p>

          {/* Tagline */}
          <p className="text-white/70 text-base md:text-lg max-w-lg text-center leading-relaxed">
            Ensemble pour le développement de notre communauté
          </p>

          {/* CTA buttons */}
          <div className="flex items-center gap-3 mt-10">
            <Button
              onClick={onLogin}
              size="lg"
              className="bg-white text-emerald-700 hover:bg-white/90 font-semibold shadow-lg shadow-black/10"
            >
              Connexion
            </Button>
            <Button
              onClick={onRegister}
              variant="outline"
              size="lg"
              className="border-white/40 text-white hover:bg-white/10 hover:text-white"
            >
              Inscription
            </Button>
          </div>
        </div>

        {/* Scroll down indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
          <span className="text-white/50 text-xs tracking-wider uppercase">Découvrir</span>
          <ChevronDown className="h-5 w-5 text-white/60 animate-bounce" />
        </div>
      </motion.section>

      {/* ==================== Stats Section ==================== */}
      <motion.section
        className="bg-muted/30 dark:bg-muted/20 border-t"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        variants={sectionFadeUp}
      >
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Members */}
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 mb-3">
                <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                <AnimatedCounter target={150} />+
              </span>
              <span className="text-sm text-muted-foreground mt-1">Membres actifs</span>
            </div>

            {/* Projects */}
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-sky-100 dark:bg-sky-900/50 mb-3">
                <Target className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              </div>
              <span className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                <AnimatedCounter target={12} />
              </span>
              <span className="text-sm text-muted-foreground mt-1">Projets en cours</span>
            </div>

            {/* Events */}
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/50 mb-3">
                <CalendarDays className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                <AnimatedCounter target={25} />
              </span>
              <span className="text-sm text-muted-foreground mt-1">Événements réalisés</span>
            </div>

            {/* Funds */}
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-rose-100 dark:bg-rose-900/50 mb-3">
                <Coins className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <span className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                <AnimatedCounter target={10} prefix="" suffix="k+" />
              </span>
              <span className="text-sm text-muted-foreground mt-1">FCFA collectés</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ==================== Features Section ==================== */}
      <motion.section
        className="py-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        variants={staggerContainer}
      >
        <div className="max-w-5xl mx-auto px-4">
          {/* Section header */}
          <motion.div className="flex items-center gap-3 mb-10" variants={itemFadeUp}>
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-md">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Pourquoi rejoindre le CODET ?</h2>
            </div>
          </motion.div>

          {/* Feature cards grid - now 4 columns on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1: Gestion Communautaire */}
            <motion.div variants={itemFadeUp}>
              <Card className="p-6 h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300 dark:bg-card/80 dark:border-border/50">
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-md mb-4 dark:opacity-80">
                  <ShieldCheck className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Gestion Communautaire</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Organisation structurée avec des rôles définis, des sous-comités et un suivi transparent des activités.
                </p>
              </Card>
            </motion.div>

            {/* Feature 2: Projets Structurants */}
            <motion.div variants={itemFadeUp}>
              <Card className="p-6 h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300 dark:bg-card/80 dark:border-border/50">
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 shadow-md mb-4 dark:opacity-80">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Projets Structurants</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Des projets concrets pour le développement : infrastructures, éducation, santé et autonomie financière.
                </p>
              </Card>
            </motion.div>

            {/* Feature 3: Transparence Totale */}
            <motion.div variants={itemFadeUp}>
              <Card className="p-6 h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300 dark:bg-card/80 dark:border-border/50">
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-md mb-4 dark:opacity-80">
                  <Eye className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Transparence Totale</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Budget en temps réel, rapports de paiements accessibles et système de votes démocratiques.
                </p>
              </Card>
            </motion.div>

            {/* Feature 4: Communication Moderne */}
            <motion.div variants={itemFadeUp}>
              <Card className="p-6 h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300 dark:bg-card/80 dark:border-border/50">
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 shadow-md mb-4 dark:opacity-80">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Communication Moderne</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Messagerie intégrée, publications de blog et partage de photos pour renforcer les liens communautaires.
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ==================== Testimonials Section ==================== */}
      <motion.section
        className="py-16 bg-muted/20 dark:bg-muted/10"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        variants={staggerContainer}
      >
        <div className="max-w-5xl mx-auto px-4">
          {/* Section header */}
          <motion.div className="flex items-center gap-3 mb-10" variants={itemFadeUp}>
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-md">
              <Quote className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Ce que disent nos membres</h2>
            </div>
          </motion.div>

          {/* Testimonial cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={i} variants={itemFadeUp}>
                <Card className="p-6 h-full border-l-4 border-l-emerald-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 dark:bg-card/80 dark:border-border/50">
                  <Quote className="h-6 w-6 text-emerald-500/40 mb-3" />
                  <p className="text-sm text-foreground/80 italic leading-relaxed mb-6">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="mt-auto">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mb-2">
                      <span className="text-xs font-bold text-white">
                        {t.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ==================== CTA Section ==================== */}
      <motion.section
        className="relative overflow-hidden py-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        variants={sectionFadeUp}
      >
        {/* Subtle emerald gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950/30 dark:via-background dark:to-teal-950/30"></div>
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-teal-500/10 blur-3xl"></div>

        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
            Rejoignez-nous
          </h2>
          <p className="text-muted-foreground text-base md:text-lg mb-8 max-w-lg mx-auto">
            Faites partie de notre communauté engagée. Ensemble, construisons un avenir meilleur pour la communauté Tchoutsi.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={onRegister}
              size="lg"
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg shadow-emerald-600/20 w-full sm:w-auto"
            >
              Créer un compte
            </Button>
            <Button
              onClick={onLogin}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              Se connecter
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Divider before Blog */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="border-t" />
      </div>

      {/* ==================== Blog Section ==================== */}
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4">
          {/* Section header */}
          <div className="flex items-center gap-3 pt-4 pb-6">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-md">
              <Newspaper className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Actualités & Publications</h2>
              <p className="text-sm text-muted-foreground">Restez informé des dernières nouvelles du CODET</p>
            </div>
          </div>

          {/* Blog content */}
          <BlogPage />
        </div>
      </main>

      {/* ==================== Enhanced Footer ==================== */}
      <footer className="border-t bg-muted/30 mt-auto">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {/* Column 1: À propos */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative h-10 w-10 rounded-lg overflow-hidden">
                  <Image src="/logo.png" alt="CODET" fill className="object-contain" />
                </div>
                <div>
                  <h3 className="font-bold text-emerald-800 dark:text-emerald-300 text-lg leading-tight">CODET</h3>
                  <p className="text-xs text-muted-foreground leading-tight">Comité de Développement Tchoutsi</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Organisation dédiée au développement et à l&apos;amélioration des conditions de vie de la communauté Tchoutsi à travers des projets structurants et la mobilisation citoyenne.
              </p>
            </div>

            {/* Column 2: Liens rapides */}
            <div>
              <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">Liens rapides</h4>
              <ul className="space-y-3">
                <li>
                  <button
                    type="button"
                    onClick={onLogin}
                    className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-150 cursor-pointer"
                  >
                    Connexion
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onRegister}
                    className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-150 cursor-pointer"
                  >
                    Inscription
                  </button>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-150"
                  >
                    Retour en haut
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Contact */}
            <div>
              <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">Contact</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2.5">
                  <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-sm text-muted-foreground">www.codet-tchoutsi.org</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-sm text-muted-foreground">contact@codet-tchoutsi.org</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-sm text-muted-foreground">+237 6 XX XX XX XX</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright bar */}
          <div className="mt-10 pt-6 border-t">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>© {new Date().getFullYear()} CODET — Comité de Développement Tchoutsi. Tous droits réservés.</span>
              <span className="flex items-center gap-1.5">
                <img src="/logo.png" alt="" className="h-3.5 w-3.5" />
                <span>CODET v1.0</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ==================== Loading Screen ====================

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-6">
        {/* Logo with prominent pulse and ring */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full ring-4 ring-emerald-300/40 dark:ring-emerald-700/40 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="relative h-[120px] w-[120px] animate-pulse rounded-full ring-4 ring-emerald-300/50 dark:ring-emerald-700/50" style={{ animationDuration: '1.5s' }}>
            <Image src="/logo.png" alt="CODET" fill className="object-contain" />
          </div>
        </div>

        {/* Title */}
        <span className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 tracking-wide">
          CODET
        </span>

        {/* Subtitle */}
        <span className="text-sm text-muted-foreground">
          Comité de Développement Tchoutsi
        </span>

        {/* Staggered skeleton bars */}
        <div className="flex flex-col gap-3 w-[220px]">
          <div
            className="h-[4px] rounded-full bg-emerald-400/30"
            style={{ animation: 'skeleton-stagger-1 1.5s ease-in-out infinite' }}
          />
          <div
            className="h-[4px] rounded-full bg-teal-400/25"
            style={{ animation: 'skeleton-stagger-2 1.5s ease-in-out 0.3s infinite' }}
          />
          <div
            className="h-[4px] rounded-full bg-emerald-400/20"
            style={{ animation: 'skeleton-stagger-3 1.5s ease-in-out 0.6s infinite' }}
          />
        </div>

        {/* Subtle progress bar */}
        <div className="w-[220px] h-[3px] rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400"
            style={{ animation: 'progress-sweep 2.5s ease-in-out infinite' }}
          />
        </div>

        {/* Chargement text */}
        <span className="text-xs text-muted-foreground tracking-wider animate-pulse">
          Chargement...
        </span>
      </div>
    </div>
  );
}

// ==================== Auth Switcher ====================

function AuthSwitcher() {
  const [view, setView] = useState<AuthView>('public');
  const { user, loading, initialized } = useAuth();

  // Not initialized or loading
  if (!initialized || loading) {
    return <LoadingScreen />;
  }

  // Must change password
  if (user?.mustChangePassword) {
    return <ChangePasswordPage />;
  }

  // Authenticated - show the full app with sidebar
  if (user) {
    return <AuthenticatedApp />;
  }

  // Unauthenticated - show register page
  if (view === 'register') {
    return (
      <RegisterPage
        onSwitchToLogin={() => setView('login')}
        onRegisterSuccess={() => setView('login')}
      />
    );
  }

  // Unauthenticated - show login page
  if (view === 'login') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950/20 dark:via-background dark:to-teal-950/20 p-4">
        <div className="w-full max-w-md">
          <LoginPage onSwitchToRegister={() => setView('register')} />
        </div>
      </div>
    );
  }

  // Unauthenticated - show public view with blog
  return (
    <PublicView
      onLogin={() => setView('login')}
      onRegister={() => setView('register')}
    />
  );
}

// ==================== Root Page ====================

export default function Home() {
  return (
    <AuthProvider>
      <AuthSwitcher />
    </AuthProvider>
  );
}
