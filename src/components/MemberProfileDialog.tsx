'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getDoc, doc } from '@/lib/db';
import { COLLECTIONS } from '@/lib/appwrite';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Users,
  Shield,
  CalendarDays,
  CircleDot,
  AlertCircle,
  RefreshCw,
  User,
  Globe,
  Building2,
} from 'lucide-react';

// ==================== Types ====================

interface MemberProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
}

interface UserProfile {
  $id: string;
  email?: string;
  displayName: string;
  gender?: string;
  phoneNumber?: string;
  role: string;
  profession?: string;
  sousComite?: string;
  pays?: string;
  ville?: string;
  photoURL?: string;
  mustChangePassword?: boolean;
  createdAt: string;
}

// ==================== Helpers ====================

function getRoleBadgeClass(role: string): string {
  const r = role.toLowerCase();
  if (r === 'admin') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-0';
  if (r === 'président') return 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border-0';
  if (r === 'secretaire' || r === 'secretaire_general') return 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300 border-0';
  if (r === 'trésorier') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-0';
  if (r === 'commissaire') return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-0';
  if (r === 'celcom' || r === 'responsable_communication') return 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300 border-0';
  return 'bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-300 border-0';
}

function getHashColor(name: string): string {
  const colors = [
    'bg-emerald-500',
    'bg-teal-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-violet-500',
    'bg-cyan-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-sky-500',
    'bg-lime-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  return colors[Math.abs(hash) % colors.length];
}

function formatDateFrench(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
}

function formatRoleName(role: string): string {
  return (role || 'membre').replace(/_/g, ' ');
}

function getGenderLabel(gender?: string): string {
  if (gender === 'monsieur') return 'Monsieur';
  if (gender === 'madame') return 'Madame';
  return 'Non renseigné';
}

// ==================== Section Component ====================

interface ProfileSectionProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  children: React.ReactNode;
}

function ProfileSection({ icon, iconBg, title, children }: ProfileSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
      </div>
      <div className="space-y-2.5 pl-9">
        {children}
      </div>
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value?: string | null;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">
        {value || <span className="text-muted-foreground/50 italic">Non renseigné</span>}
      </span>
    </div>
  );
}

// ==================== Loading Skeleton ====================

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col items-center text-center space-y-3">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2 w-full max-w-[200px]">
          <Skeleton className="h-5 w-40 mx-auto" />
          <Skeleton className="h-5 w-20 mx-auto rounded-full" />
        </div>
      </div>

      <Separator />

      {/* Sections skeleton */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded-lg" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="space-y-2.5 pl-9">
            {Array.from({ length: i === 1 ? 2 : 3 }).map((_, j) => (
              <div key={j} className="flex items-baseline justify-between gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== Main Component ====================

export default function MemberProfileDialog({
  open,
  onOpenChange,
  userId,
}: MemberProfileDialogProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    try {
      const result = await getDoc(doc(COLLECTIONS.USERS, userId));
      setProfile(result as unknown as UserProfile);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Impossible de charger le profil. Veuillez réessayer.');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (open && userId) {
      fetchProfile();
    } else {
      // Reset state when dialog closes
      if (!open) {
        setProfile(null);
        setError(null);
        setLoading(false);
      }
    }
  }, [open, userId, fetchProfile]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Profil du membre</DialogTitle>
          <DialogDescription>
            Détails complets du profil du membre sélectionné.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[85vh]">
          <div className="p-6 space-y-6">
            {/* No user selected state */}
            {!userId && !loading && !error && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Aucun membre sélectionné.
                </p>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">
                    Erreur de chargement
                  </p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchProfile}
                  className="mt-2"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Réessayer
                </Button>
              </div>
            )}

            {/* Loading state */}
            {loading && <ProfileSkeleton />}

            {/* Profile content */}
            {!loading && !error && profile && (
              <>
                {/* Header */}
                <div className="flex flex-col items-center text-center space-y-3">
                  <div
                    className={`h-20 w-20 rounded-full flex items-center justify-center text-2xl font-bold shrink-0 text-white ring-4 ring-emerald-200 dark:ring-emerald-800 ${getHashColor(profile.displayName || '')}`}
                  >
                    {(profile.displayName || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold tracking-tight">
                      {profile.displayName}
                    </h2>
                    <Badge
                      className={`capitalize text-xs font-medium ${getRoleBadgeClass(profile.role)}`}
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      {formatRoleName(profile.role)}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Identité Section */}
                <ProfileSection
                  icon={<User className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />}
                  iconBg="bg-violet-100 dark:bg-violet-900/40"
                  title="Identité"
                >
                  <InfoRow
                    label="Email"
                    value={profile.email}
                  />
                  <InfoRow
                    label="Téléphone"
                    value={profile.phoneNumber}
                  />
                  <InfoRow
                    label="Genre"
                    value={getGenderLabel(profile.gender)}
                  />
                </ProfileSection>

                <Separator />

                {/* Adresse Section */}
                <ProfileSection
                  icon={<MapPin className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
                  iconBg="bg-emerald-100 dark:bg-emerald-900/40"
                  title="Adresse"
                >
                  <InfoRow
                    label="Pays"
                    value={profile.pays}
                  />
                  <InfoRow
                    label="Ville"
                    value={profile.ville}
                  />
                </ProfileSection>

                <Separator />

                {/* Activité Section */}
                <ProfileSection
                  icon={<Briefcase className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />}
                  iconBg="bg-amber-100 dark:bg-amber-900/40"
                  title="Activité"
                >
                  <InfoRow
                    label="Profession"
                    value={profile.profession}
                  />
                  <InfoRow
                    label="Sous-comité"
                    value={profile.sousComite}
                  />
                </ProfileSection>

                <Separator />

                {/* Compte Section */}
                <ProfileSection
                  icon={<Shield className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />}
                  iconBg="bg-sky-100 dark:bg-sky-900/40"
                  title="Compte"
                >
                  <InfoRow
                    label="Date d'inscription"
                    value={formatDateFrench(profile.createdAt)}
                  />
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-sm text-muted-foreground shrink-0">Statut</span>
                    {profile.mustChangePassword ? (
                      <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400">
                        <CircleDot className="h-3 w-3 mr-1" />
                        Mot de passe à changer
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400">
                        <CircleDot className="h-3 w-3 mr-1" />
                        Actif
                      </Badge>
                    )}
                  </div>
                </ProfileSection>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
