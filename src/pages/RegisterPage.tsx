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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Loader2,
  ArrowLeft,
  UserPlus,
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Briefcase,
  Users,
  Info,
  Check,
  Circle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface RegisterPageProps {
  onSwitchToLogin: () => void;
  onRegisterSuccess?: () => void;
}

const fadeSlideUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 0, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
} as const;

// ==================== Password Strength ====================

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  switch (score) {
    case 1: return { score, label: 'Faible', color: 'bg-red-500' };
    case 2: return { score, label: 'Moyen', color: 'bg-amber-500' };
    case 3: return { score, label: 'Fort', color: 'bg-emerald-500' };
    case 4: return { score, label: 'Très fort', color: 'bg-emerald-600' };
    default: return { score: 0, label: '', color: '' };
  }
}

// ==================== Inline Validation ====================

type ValidatableField = 'displayName' | 'email' | 'password' | 'confirmPassword' | 'phoneNumber';

interface ValidationState {
  valid: boolean;
  message?: string;
}

function getValidationState(
  field: ValidatableField,
  value: string,
  passwordValue?: string
): ValidationState {
  switch (field) {
    case 'displayName': {
      const trimmed = value.trim();
      if (!trimmed) return { valid: false, message: 'Le nom complet est requis.' };
      if (trimmed.length < 2) return { valid: false, message: 'Au moins 2 caractères requis.' };
      return { valid: true, message: 'Nom valide.' };
    }
    case 'email': {
      const trimmed = value.trim();
      if (!trimmed) return { valid: false, message: "L'email est requis." };
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) return { valid: false, message: 'Adresse email invalide.' };
      return { valid: true, message: 'Email valide.' };
    }
    case 'password': {
      if (!value) return { valid: false, message: 'Le mot de passe est requis.' };
      if (value.length < 8) return { valid: false, message: `Encore ${8 - value.length} caractère(s) requis.` };
      return { valid: true, message: 'Mot de passe valide.' };
    }
    case 'confirmPassword': {
      if (!value) return { valid: false, message: 'Veuillez confirmer le mot de passe.' };
      if (value !== passwordValue) return { valid: false, message: 'Les mots de passe ne correspondent pas.' };
      return { valid: true, message: 'Les mots de passe correspondent.' };
    }
    case 'phoneNumber': {
      if (!value.trim()) return { valid: true }; // optional
      const digits = value.replace(/\D/g, '');
      if (digits.length < 8) return { valid: false, message: 'Numéro invalide (min. 8 chiffres).' };
      return { valid: true, message: 'Numéro valide.' };
    }
    default:
      return { valid: true };
  }
}

function ValidationMessage({ state }: { state: ValidationState }) {
  if (!state.message) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
      className={`flex items-center gap-1 ${
        state.valid ? 'text-xs text-emerald-600 dark:text-emerald-400' : 'text-xs text-red-500'
      }`}
    >
      {state.valid ? (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <XCircle className="h-3.5 w-3.5 shrink-0" />
      )}
      <span>{state.message}</span>
    </motion.div>
  );
}

// ==================== Step Indicator ====================

const STEPS = [
  { num: 1, label: 'Identité', icon: User },
  { num: 2, label: 'Contact', icon: Mail },
  { num: 3, label: 'Sécurité', icon: Lock },
] as const;

function StepIndicators({ currentSection }: { currentSection: number }) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6">
      {STEPS.map((step, idx) => {
        const isCompleted = currentSection > step.num;
        const isActive = currentSection === step.num;
        const StepIcon = step.icon;
        return (
          <React.Fragment key={step.num}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={[
                  'h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2',
                  isCompleted
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : isActive
                      ? 'bg-emerald-100 dark:bg-emerald-900/50 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                      : 'bg-muted border-muted-foreground/20 text-muted-foreground',
                ].join(' ')}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <StepIcon className="h-4 w-4" />
                )}
              </div>
              <span
                className={[
                  'text-[11px] font-medium transition-colors',
                  isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground',
                ].join(' ')}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={[
                  'h-[2px] w-8 sm:w-12 rounded-full mt-[-18px] transition-colors duration-300',
                  isCompleted ? 'bg-emerald-500' : 'bg-muted-foreground/15',
                ].join(' ')}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ==================== Tooltip Field Label ====================

function FieldLabelWithTooltip({
  htmlFor,
  tooltip,
  children,
}: {
  htmlFor: string;
  tooltip: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1">
      <Label htmlFor={htmlFor} className="text-sm font-medium">
        {children}
      </Label>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="inline-flex" tabIndex={-1}>
            <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px] text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

// ==================== Component ====================

export default function RegisterPage({ onSwitchToLogin, onRegisterSuccess }: RegisterPageProps) {
  const { signUp, loading } = useAuth();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState<'monsieur' | 'madame'>('monsieur');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sousComite, setSousComite] = useState('');
  const [pays, setPays] = useState('');
  const [ville, setVille] = useState('');
  const [profession, setProfession] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Track which section the user has interacted with
  const [activeSection, setActiveSection] = useState(1);

  // Track which fields have been touched (for inline validation)
  const [touchedFields, setTouchedFields] = useState<Record<ValidatableField, boolean>>({
    displayName: false,
    email: false,
    password: false,
    confirmPassword: false,
    phoneNumber: false,
  });

  const handleFieldBlur = (field: ValidatableField) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  // Compute validation states for touched fields
  const validationStates = useMemo(() => ({
    displayName: getValidationState('displayName', displayName),
    email: getValidationState('email', email),
    password: getValidationState('password', password),
    confirmPassword: getValidationState('confirmPassword', confirmPassword, password),
    phoneNumber: getValidationState('phoneNumber', phoneNumber),
  }), [displayName, email, password, confirmPassword, phoneNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Champ requis',
        description: 'Veuillez entrer votre nom complet.',
      });
      return;
    }

    if (!email.trim()) {
      toast({
        variant: 'destructive',
        title: 'Champ requis',
        description: 'Veuillez entrer votre email.',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        variant: 'destructive',
        title: 'Email invalide',
        description: 'Veuillez entrer une adresse email valide.',
      });
      return;
    }

    if (!password) {
      toast({
        variant: 'destructive',
        title: 'Champ requis',
        description: 'Veuillez entrer un mot de passe.',
      });
      return;
    }

    if (password.length < 8) {
      toast({
        variant: 'destructive',
        title: 'Mot de passe trop court',
        description: 'Le mot de passe doit contenir au moins 8 caractères.',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Mots de passe différents',
        description: 'La confirmation du mot de passe ne correspond pas.',
      });
      return;
    }

    try {
      await signUp({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        gender,
        phoneNumber: phoneNumber.trim() || undefined,
        sousComite: sousComite.trim() || undefined,
        pays: pays.trim() || undefined,
        ville: ville.trim() || undefined,
        profession: profession.trim() || undefined,
      });
      toast({
        title: 'Inscription réussie !',
        description: 'Bienvenue dans la communauté CODET. Vous devrez changer votre mot de passe.',
      });
      onRegisterSuccess?.();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        variant: 'destructive',
        title: "Erreur d'inscription",
        description: err?.message || 'Impossible de créer le compte. Veuillez réessayer.',
      });
    }
  };

  const inputClass = 'h-10 bg-white/60 dark:bg-background/40 border-emerald-200/60 dark:border-emerald-800/30 focus-visible:ring-emerald-400/40 text-sm';

  const barColors = ['bg-muted', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-600'];

  return (
    <div className="relative flex items-center justify-center min-h-screen p-4 sm:p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-background overflow-y-auto">
      {/* Decorative background pattern - subtle dots */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none" aria-hidden="true">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="register-dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="currentColor" className="text-emerald-800" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#register-dots)" />
        </svg>
      </div>

      {/* Decorative blobs */}
      <div className="absolute top-[-8%] left-[-6%] w-56 h-56 rounded-full bg-emerald-200/30 dark:bg-emerald-800/10 blur-3xl pointer-events-none" aria-hidden="true"></div>
      <div className="absolute bottom-[-8%] right-[-6%] w-60 h-60 rounded-full bg-teal-200/25 dark:bg-teal-800/10 blur-3xl pointer-events-none" aria-hidden="true"></div>

      <motion.div
        className="w-full max-w-lg relative z-10 my-8"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0, scale: 0.96, y: 16 },
          visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
          },
        }}
      >
        <Card className="bg-white/80 dark:bg-card/80 backdrop-blur-xl border border-emerald-200/60 dark:border-emerald-800/30 shadow-xl shadow-emerald-900/5 dark:shadow-black/20">
          <CardContent className="pt-8 pb-4 px-6 sm:px-8">
            {/* Header with logo */}
            <motion.div
              className="flex flex-col items-center text-center mb-5"
              custom={0}
              variants={fadeSlideUp}
            >
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-emerald-200 dark:ring-emerald-700/40 shadow-md shadow-emerald-200/40 dark:shadow-emerald-900/30 mb-4">
                <Image
                  src="/logo.png"
                  alt="CODET Logo"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <h1 className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 tracking-tight">
                Inscription
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Rejoignez la communauté CODET
              </p>
            </motion.div>

            {/* Step Indicators */}
            <motion.div custom={0.5} variants={fadeSlideUp}>
              <StepIndicators currentSection={activeSection} />
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* ── Step 1: Identité ── */}
              <motion.div
                className="space-y-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 p-4 -mx-1 border border-emerald-100/60 dark:border-emerald-900/20"
                custom={1}
                variants={fadeSlideUp}
                onFocusCapture={() => setActiveSection(1)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Identité</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5 sm:col-span-2">
                    <FieldLabelWithTooltip htmlFor="displayName" tooltip="Ce nom sera visible par tous les membres">
                      Nom complet <span className="text-red-500">*</span>
                    </FieldLabelWithTooltip>
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="Jean Dupont"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      onBlur={() => handleFieldBlur('displayName')}
                      disabled={loading}
                      autoComplete="name"
                      className={inputClass}
                    />
                    <AnimatePresence>
                      {touchedFields.displayName && <ValidationMessage state={validationStates.displayName} />}
                    </AnimatePresence>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      Civilité <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={gender}
                      onValueChange={(val) => setGender(val as 'monsieur' | 'madame')}
                      disabled={loading}
                    >
                      <SelectTrigger className={`${inputClass} w-full`}>
                        <SelectValue placeholder="Civilité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monsieur">Monsieur</SelectItem>
                        <SelectItem value="madame">Madame</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>

              {/* ── Step 2: Contact ── */}
              <motion.div
                className="space-y-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 p-4 -mx-1 border border-emerald-100/60 dark:border-emerald-900/20"
                custom={2}
                variants={fadeSlideUp}
                onFocusCapture={() => setActiveSection(2)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Contact</span>
                </div>

                <div className="space-y-1.5">
                  <FieldLabelWithTooltip htmlFor="email" tooltip="Utilisé pour la connexion et les notifications">
                    <Mail className="inline h-3.5 w-3.5 mr-1" />
                    Email <span className="text-red-500">*</span>
                  </FieldLabelWithTooltip>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => handleFieldBlur('email')}
                    disabled={loading}
                    autoComplete="email"
                    className={inputClass}
                  />
                  <AnimatePresence>
                    {touchedFields.email && <ValidationMessage state={validationStates.email} />}
                  </AnimatePresence>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="phoneNumber" className="text-sm font-medium">
                      <Phone className="inline h-3.5 w-3.5 mr-1" />
                      Téléphone
                    </Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="+33 6 12 34 56 78"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      onBlur={() => handleFieldBlur('phoneNumber')}
                      disabled={loading}
                      autoComplete="tel"
                      className={inputClass}
                    />
                    <AnimatePresence>
                      {touchedFields.phoneNumber && <ValidationMessage state={validationStates.phoneNumber} />}
                    </AnimatePresence>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sousComite" className="text-sm font-medium">
                      <Users className="inline h-3.5 w-3.5 mr-1" />
                      Sous-comité
                    </Label>
                    <Input
                      id="sousComite"
                      type="text"
                      placeholder="Ex: Communication"
                      value={sousComite}
                      onChange={(e) => setSousComite(e.target.value)}
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="pays" className="text-sm font-medium">
                      <MapPin className="inline h-3.5 w-3.5 mr-1" />
                      Pays
                    </Label>
                    <Input
                      id="pays"
                      type="text"
                      placeholder="Ex: France"
                      value={pays}
                      onChange={(e) => setPays(e.target.value)}
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ville" className="text-sm font-medium">
                      Ville
                    </Label>
                    <Input
                      id="ville"
                      type="text"
                      placeholder="Ex: Paris"
                      value={ville}
                      onChange={(e) => setVille(e.target.value)}
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="profession" className="text-sm font-medium">
                    <Briefcase className="inline h-3.5 w-3.5 mr-1" />
                    Profession
                  </Label>
                  <Input
                    id="profession"
                    type="text"
                    placeholder="Ex: Développeur"
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    disabled={loading}
                    className={inputClass}
                  />
                </div>
              </motion.div>

              {/* ── Step 3: Sécurité ── */}
              <motion.div
                className="space-y-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 p-4 -mx-1 border border-emerald-100/60 dark:border-emerald-900/20"
                custom={3}
                variants={fadeSlideUp}
                onFocusCapture={() => setActiveSection(3)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Sécurité</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <FieldLabelWithTooltip htmlFor="password" tooltip="Minimum 8 caractères avec majuscules, chiffres et caractères spéciaux recommandés">
                      Mot de passe <span className="text-red-500">*</span>
                    </FieldLabelWithTooltip>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min. 8 caractères"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() => handleFieldBlur('password')}
                        disabled={loading}
                        autoComplete="new-password"
                        className={`pr-10 ${inputClass}`}
                      />
                      <button
                        type="button"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {/* Password Strength Meter */}
                    {password.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                passwordStrength.score >= level
                                  ? barColors[level]
                                  : 'bg-muted'
                              }`}
                            />
                          ))}
                        </div>
                        <p className={`text-xs font-medium transition-colors duration-300 ${
                          passwordStrength.score <= 1
                            ? 'text-red-500'
                            : passwordStrength.score === 2
                              ? 'text-amber-500'
                              : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {passwordStrength.label}
                        </p>
                      </div>
                    )}
                    <AnimatePresence>
                      {touchedFields.password && <ValidationMessage state={validationStates.password} />}
                    </AnimatePresence>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">
                      Confirmer <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Retapez le mot de passe"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onBlur={() => handleFieldBlur('confirmPassword')}
                      disabled={loading}
                      autoComplete="new-password"
                      className={inputClass}
                    />
                    <AnimatePresence>
                      {touchedFields.confirmPassword && <ValidationMessage state={validationStates.confirmPassword} />}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>

              {/* Submit */}
              <motion.div custom={4} variants={fadeSlideUp}>
                <Button
                  type="submit"
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 transition-all duration-200"
                  disabled={loading}
                  size="lg"
                >
                  {loading ? (
                    <React.Fragment>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création du compte...
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Créer mon compte
                    </React.Fragment>
                  )}
                </Button>
              </motion.div>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col items-center pt-2 pb-6 px-6">
            <Separator className="w-full mb-3 border-emerald-200/40 dark:border-emerald-800/15" />
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
              onClick={onSwitchToLogin}
              disabled={loading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la connexion
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
