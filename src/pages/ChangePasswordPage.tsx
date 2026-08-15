'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Lock, Eye, EyeOff, CheckCircle2, XCircle, ShieldCheck, ArrowLeft } from 'lucide-react';

interface ChangePasswordPageProps {
  onSuccess?: () => void;
}

const fadeSlideUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 0, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
} as const;

const barColors = ['bg-muted', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-600'];

export default function ChangePasswordPage({ onSuccess }: ChangePasswordPageProps) {
  const { changePassword, loading, signOut } = useAuth();
  const { toast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const strengthChecks = useMemo(() => {
    const pwd = newPassword;
    return {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*]/.test(pwd),
    };
  }, [newPassword]);

  const strengthScore = useMemo(() => {
    const checks = [strengthChecks.length, strengthChecks.uppercase, strengthChecks.number, strengthChecks.special];
    return checks.filter(Boolean).length;
  }, [strengthChecks]);

  const strengthLabel = useMemo(() => {
    if (strengthScore === 0) return '';
    if (strengthScore === 1) return 'Faible';
    if (strengthScore === 2) return 'Moyen';
    if (strengthScore === 3) return 'Fort';
    return 'Très fort';
  }, [strengthScore]);

  const strengthTextColor = useMemo(() => {
    if (strengthScore <= 1) return 'text-red-500';
    if (strengthScore === 2) return 'text-amber-500';
    return 'text-emerald-600 dark:text-emerald-400';
  }, [strengthScore]);

  const passwordsMatch = newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast({
        variant: 'destructive',
        title: 'Champ requis',
        description: 'Veuillez entrer votre mot de passe actuel.',
      });
      return;
    }

    if (!newPassword) {
      toast({
        variant: 'destructive',
        title: 'Champ requis',
        description: 'Veuillez entrer un nouveau mot de passe.',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        variant: 'destructive',
        title: 'Mot de passe trop court',
        description: 'Le nouveau mot de passe doit contenir au moins 8 caractères.',
      });
      return;
    }

    if (newPassword === currentPassword) {
      toast({
        variant: 'destructive',
        title: 'Mot de passe identique',
        description: 'Le nouveau mot de passe doit être différent de l\'actuel.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Confirmation incorrecte',
        description: 'La confirmation du mot de passe ne correspond pas.',
      });
      return;
    }

    try {
      await changePassword(currentPassword, newPassword);
      setIsSuccess(true);
      toast({
        title: 'Mot de passe modifié !',
        description: 'Votre mot de passe a été mis à jour avec succès.',
      });
      onSuccess?.();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: err?.message || 'Impossible de modifier le mot de passe.',
      });
    }
  };

  const handleBack = () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'dashboard' } }));
  };

  const inputClass = 'h-11 bg-white/60 dark:bg-background/40 border-emerald-200/60 dark:border-emerald-800/30 focus-visible:ring-emerald-400/40 text-sm';

  return (
    <div className="relative flex items-center justify-center min-h-screen p-4 sm:p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-background overflow-hidden">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none" aria-hidden="true">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="change-dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="currentColor" className="text-emerald-800" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#change-dots)" />
        </svg>
      </div>

      {/* Decorative blobs */}
      <div className="absolute top-[-8%] right-[-6%] w-60 h-60 rounded-full bg-emerald-200/30 dark:bg-emerald-800/10 blur-3xl pointer-events-none" aria-hidden="true"></div>
      <div className="absolute bottom-[-8%] left-[-6%] w-56 h-56 rounded-full bg-teal-200/25 dark:bg-teal-800/10 blur-3xl pointer-events-none" aria-hidden="true"></div>

      <motion.div
        className="w-full max-w-md relative z-10"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0, scale: 0.96, y: 16 },
          visible: {
            opacity: 1, scale: 1, y: 0,
            transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
          },
        }}
      >
        <Card className="bg-white/80 dark:bg-card/80 backdrop-blur-xl border border-emerald-200/60 dark:border-emerald-800/30 shadow-xl shadow-emerald-900/5 dark:shadow-black/20">
          <CardContent className="pt-8 pb-4 px-6 sm:px-8">
            {/* Back link */}
            <motion.div className="mb-4" custom={0} variants={fadeSlideUp}>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                onClick={handleBack}
                disabled={loading}
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </button>
            </motion.div>

            <AnimatePresence mode="wait">
              {isSuccess ? (
                /* ── Success State ── */
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="flex flex-col items-center text-center py-10"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, duration: 0.6, type: 'spring', stiffness: 180, damping: 12 }}
                    className="mb-6"
                  >
                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <CheckCircle2 className="h-14 w-14 text-white" strokeWidth={2} />
                    </div>
                  </motion.div>
                  <motion.h2
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                    className="text-xl font-bold text-emerald-800 dark:text-emerald-300 mb-2"
                  >
                    Mot de passe modifié avec succès !
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.65, duration: 0.4 }}
                    className="text-sm text-muted-foreground mb-8"
                  >
                    Votre mot de passe a été mis à jour en toute sécurité.
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.4 }}
                  >
                    <Button
                      onClick={handleBack}
                      className="h-11 px-8 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 transition-all duration-200"
                    >
                      Retour au tableau de bord
                    </Button>
                  </motion.div>
                </motion.div>
              ) : (
                /* ── Form State ── */
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                >
                  {/* Header */}
                  <motion.div
                    className="flex flex-col items-center text-center mb-7"
                    custom={1}
                    variants={fadeSlideUp}
                  >
                    <div className="relative mb-4">
                      <div className="relative w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-emerald-200 dark:ring-emerald-700/40 shadow-md shadow-emerald-200/40 dark:shadow-emerald-900/30">
                        <Image
                          src="/logo.png"
                          alt="CODET Logo"
                          fill
                          className="object-cover"
                          priority
                        />
                      </div>
                      {/* Lock badge overlapping bottom-right */}
                      <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <Lock className="h-3.5 w-3.5 text-white" />
                      </div>
                    </div>
                    <h1 className="text-xl font-bold text-emerald-800 dark:text-emerald-300 tracking-tight">
                      Changement de mot de passe
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1.5">
                      Pour continuer, vous devez changer votre mot de passe.
                    </p>
                  </motion.div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Current Password */}
                    <motion.div className="space-y-2" custom={2} variants={fadeSlideUp}>
                      <Label htmlFor="currentPassword" className="text-sm font-medium">
                        Mot de passe actuel
                      </Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          disabled={loading}
                          autoComplete="current-password"
                          className={`pr-10 ${inputClass}`}
                        />
                        <button
                          type="button"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          tabIndex={-1}
                          aria-label={showCurrentPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </motion.div>

                    {/* New Password */}
                    <motion.div className="space-y-2" custom={3} variants={fadeSlideUp}>
                      <Label htmlFor="newPassword" className="text-sm font-medium">
                        Nouveau mot de passe
                      </Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          placeholder="Min. 8 caractères"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          disabled={loading}
                          autoComplete="new-password"
                          className={`pr-10 ${inputClass}`}
                        />
                        <button
                          type="button"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          tabIndex={-1}
                          aria-label={showNewPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>

                      {/* Password Strength Meter + Checklist */}
                      <AnimatePresence>
                        {newPassword.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-3 pt-1 overflow-hidden"
                          >
                            {/* Requirements Checklist */}
                            <div className="space-y-1.5">
                              <RequirementItem label="Au moins 8 caractères" met={strengthChecks.length} />
                              <RequirementItem label="Une lettre majuscule" met={strengthChecks.uppercase} />
                              <RequirementItem label="Un chiffre" met={strengthChecks.number} />
                              <RequirementItem label="Un caractère spécial (!@#$%^&*)" met={strengthChecks.special} />
                            </div>

                            {/* 4-segment Strength Meter */}
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                {[1, 2, 3, 4].map((level) => (
                                  <div
                                    key={level}
                                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                      strengthScore >= level
                                        ? barColors[strengthScore]
                                        : 'bg-muted'
                                    }`}
                                  />
                                ))}
                              </div>
                              <p className={`text-xs font-medium transition-colors duration-300 ${strengthTextColor}`}>
                                {strengthLabel}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* Confirm Password */}
                    <motion.div className="space-y-2" custom={4} variants={fadeSlideUp}>
                      <Label htmlFor="confirmNewPassword" className="text-sm font-medium">
                        Confirmer le nouveau mot de passe
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmNewPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          placeholder="Retapez le nouveau mot de passe"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={loading}
                          autoComplete="new-password"
                          className={`${inputClass} ${passwordsMatch ? 'border-emerald-400 dark:border-emerald-600' : ''} ${passwordsMismatch ? 'border-red-400 dark:border-red-600' : ''}`}
                        />
                        {passwordsMatch && (
                          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                        )}
                        {passwordsMismatch && (
                          <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                        )}
                      </div>
                      {passwordsMismatch && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          Les mots de passe ne correspondent pas
                        </p>
                      )}
                      {passwordsMatch && (
                        <p className="text-xs text-emerald-500 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Les mots de passe correspondent
                        </p>
                      )}
                    </motion.div>

                    {/* Submit */}
                    <motion.div custom={5} variants={fadeSlideUp}>
                      <Button
                        type="submit"
                        className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 transition-all duration-200"
                        disabled={loading}
                        size="lg"
                      >
                        {loading ? (
                          <React.Fragment>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Modification en cours...
                          </React.Fragment>
                        ) : (
                          <React.Fragment>
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Changer le mot de passe
                          </React.Fragment>
                        )}
                      </Button>
                    </motion.div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>

          {/* Sign out link in footer */}
          <CardFooter className="flex flex-col items-center pt-2 pb-6 px-6">
            <Separator className="w-full mb-3 border-emerald-200/40 dark:border-emerald-800/15" />
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
              onClick={signOut}
              disabled={loading || isSuccess}
            >
              Se déconnecter
            </button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}

/* ── Requirement Checklist Item ── */
function RequirementItem({ label, met }: { label: string; met: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs transition-colors duration-200">
      {met ? (
        <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
      ) : (
        <XCircle className="h-3.5 w-3.5 flex-shrink-0 text-red-400/60" />
      )}
      <span className={met ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground/60'}>
        {label}
      </span>
    </div>
  );
}
