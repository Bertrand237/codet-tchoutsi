'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  MessageSquare,
  Newspaper,
  FolderKanban,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';

const STORAGE_KEY = 'codet-onboarding-done';
const TOTAL_STEPS = 4;

// ── kbd component ──────────────────────────────────────────────────
function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center rounded border bg-muted px-2 py-0.5 text-xs font-mono">
      {children}
    </kbd>
  );
}

// ── Feature data (Step 2) ───────────────────────────────────────────
const FEATURES = [
  {
    icon: LayoutDashboard,
    title: 'Tableau de bord',
    description: 'Vue d\'ensemble de l\'activité récente, statistiques et notifications.',
    gradient: 'from-emerald-400 to-teal-500',
  },
  {
    icon: MessageSquare,
    title: 'Messagerie',
    description: 'Discutez en temps réel avec les autres membres de la communauté.',
    gradient: 'from-emerald-500 to-green-500',
  },
  {
    icon: Newspaper,
    title: 'Blog',
    description: 'Publiez et lisez des articles, actualités et annonces du groupe.',
    gradient: 'from-teal-400 to-emerald-500',
  },
  {
    icon: FolderKanban,
    title: 'Projets',
    description: 'Gérez les projets collaboratifs, suivez l\'avancement et les tâches.',
    gradient: 'from-green-400 to-emerald-600',
  },
];

// ── Shortcuts data (Step 3) ─────────────────────────────────────────
const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], description: 'Ouvrir la palette de commandes' },
  { keys: ['?'], description: 'Afficher les raccourcis clavier' },
  { keys: ['Alt', '1–5'], description: 'Naviguer entre les pages principales' },
  { keys: ['Ctrl', '/'], description: 'Ouvrir / fermer la barre latérale' },
  { keys: ['Échap'], description: 'Fermer les boîtes de dialogue' },
];

// ── Slide direction variants ────────────────────────────────────────
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 80 : -80,
    opacity: 0,
  }),
};

// ── Step 1: Welcome ────────────────────────────────────────────────
function StepWelcome() {
  return (
    <div className="flex flex-col items-center text-center gap-6 py-4">
      <div className="relative h-24 w-24">
        <Image
          src="/logo.png"
          alt="CODET"
          fill
          className="object-contain"
          priority
        />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Bienvenue sur CODET !
        </h2>
        <p className="text-muted-foreground max-w-sm leading-relaxed">
          CODET est votre espace de gestion communautaire. Gérez les membres,
          les projets, la communication et bien plus — le tout en un seul endroit.
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2 text-sm text-emerald-700 dark:text-emerald-300">
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        Prêt à découvrir l&apos;application
      </div>
    </div>
  );
}

// ── Step 2: Features ───────────────────────────────────────────────
function StepFeatures() {
  return (
    <div className="flex flex-col items-center text-center gap-5 py-2">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-foreground">
          Découvrez les fonctionnalités
        </h2>
        <p className="text-muted-foreground text-sm">
          Tout ce dont vous avez besoin pour gérer votre communauté.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 w-full">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="flex flex-col items-center gap-2 rounded-lg border bg-card p-4 text-center transition-colors hover:bg-accent/50"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${feature.gradient}`}
            >
              <feature.icon className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              {feature.title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Step 3: Shortcuts ──────────────────────────────────────────────
function StepShortcuts() {
  return (
    <div className="flex flex-col items-center text-center gap-5 py-2">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-foreground">
          Raccourcis utiles
        </h2>
        <p className="text-muted-foreground text-sm">
          Gagnez du temps grâce à ces raccourcis clavier.
        </p>
      </div>
      <div className="w-full space-y-2">
        {SHORTCUTS.map((shortcut) => (
          <div
            key={shortcut.description}
            className="flex items-center justify-between gap-4 rounded-lg border bg-card px-4 py-2.5"
          >
            <span className="text-sm text-foreground">{shortcut.description}</span>
            <div className="flex items-center gap-1 shrink-0">
              {shortcut.keys.map((key, i) => (
                <span key={i} className="flex items-center gap-1">
                  <Kbd>{key}</Kbd>
                  {i < shortcut.keys.length - 1 && (
                    <span className="text-muted-foreground text-xs">+</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Step 4: Ready ─────────────────────────────────────────────────
function StepReady() {
  return (
    <div className="flex flex-col items-center text-center gap-6 py-6">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.15 }}
        className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/60"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 15, delay: 0.45 }}
        >
          <Check className="h-10 w-10 text-emerald-600 dark:text-emerald-400" strokeWidth={3} />
        </motion.div>
      </motion.div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Vous êtes prêt !
        </h2>
        <p className="text-muted-foreground max-w-sm leading-relaxed">
          Vous connaissez maintenant les bases de CODET. Explorez l&apos;application
          et n&apos;hésitez pas à revenir consulter les raccourcis avec la touche{' '}
          <Kbd>?</Kbd>.
        </p>
      </div>
    </div>
  );
}

// ── Step indicator dots ────────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <span
          key={i}
          className={`block h-2 rounded-full transition-all duration-300 ${
            i === current
              ? 'w-6 bg-emerald-500'
              : 'w-2 bg-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────
export default function OnboardingDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  // Check localStorage on mount
  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      // Small delay so the app has time to render before showing the dialog
      const timer = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setOpen(false);
  }, []);

  function goNext() {
    if (step < TOTAL_STEPS - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  }

  function goPrev() {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  }

  const stepComponents = [StepWelcome, StepFeatures, StepShortcuts, StepReady];
  const StepComponent = stepComponents[step];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss(); }}>
      <DialogContent className="max-w-lg" showCloseButton={false}>
        {/* Step indicator */}
        <StepIndicator current={step} />

        {/* Step title */}
        <DialogHeader className="sr-only">
          <DialogTitle>Onboarding CODET — Étape {step + 1}</DialogTitle>
          <DialogDescription>Étape {step + 1} sur {TOTAL_STEPS} de l&apos;onboarding.</DialogDescription>
        </DialogHeader>

        {/* Animated step content */}
        <div className="relative overflow-hidden min-h-[320px]">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="w-full"
            >
              <StepComponent />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex-1">
            {step > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={goPrev}
                className="gap-1 text-muted-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>
            ) : (
              <div />
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={dismiss}
            className="text-muted-foreground text-xs"
          >
            Passer
          </Button>

          <div className="flex-1 flex justify-end">
            {step < TOTAL_STEPS - 1 ? (
              <Button
                size="sm"
                onClick={goNext}
                className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={dismiss}
                className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Commencer
                <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
