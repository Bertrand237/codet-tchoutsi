'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { COLLECTIONS, STORAGE_FOLDERS } from '@/lib/appwrite';
import {
  updateDoc,
  doc,
  ref,
  storageObj,
  uploadBytesResumable,
  getDownloadURL,
} from '@/lib/db';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  UserCircle,
  Mail,
  Calendar,
  Camera,
  Loader2,
  Save,
  Lock,
  Shield,
  Pencil,
  Phone,
  Briefcase,
  MapPin,
  Users,
  Check,
  Trash2,
  AlertTriangle,
  Circle as CircleIcon,
} from 'lucide-react';

// ==================== Helpers ====================

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function getRoleBadgeClass(role: string): string {
  const adminRoles = ['admin', 'président', 'secretaire_general'];
  if (adminRoles.includes(role)) {
    return 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white border-0 px-3.5 py-1 rounded-full text-sm font-bold shadow-sm';
  }
  const bureauRoles = ['secretaire', 'trésorier', 'commissaire'];
  if (bureauRoles.includes(role)) {
    return 'bg-gradient-to-r from-sky-400 to-blue-500 text-white border-0 px-3.5 py-1 rounded-full text-sm font-bold shadow-sm';
  }
  return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white border-0 px-3.5 py-1 rounded-full text-sm font-semibold shadow-sm';
}

// ==================== Component ====================

export default function ProfilePage() {
  const { user, refreshUser, changePassword } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editable fields
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [profession, setProfession] = useState(user?.profession || '');
  const [pays, setPays] = useState(user?.pays || '');
  const [ville, setVille] = useState(user?.ville || '');
  const [sousComite, setSousComite] = useState(user?.sousComite || '');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Password dialog
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Delete account dialog
  const [deleteOpen, setDeleteOpen] = useState(false);

  // ==================== Profile Completion ====================

  const RING_RADIUS = 24;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

  const { completion, incompleteFields } = useMemo(() => {
    if (!user) return { completion: 0, incompleteFields: [] };

    const fields = [
      { key: 'photoURL', filled: !!user.photoURL, label: 'Photo de profil' },
      { key: 'displayName', filled: !!user.displayName?.trim(), label: "Nom d'affichage" },
      { key: 'phoneNumber', filled: !!user.phoneNumber?.trim(), label: 'Téléphone' },
      { key: 'profession', filled: !!user.profession?.trim(), label: 'Profession' },
      { key: 'ville', filled: !!user.ville?.trim(), label: 'Ville' },
      { key: 'pays', filled: !!user.pays?.trim(), label: 'Pays' },
      { key: 'sousComite', filled: !!user.sousComite?.trim(), label: 'Sous-comité' },
    ];

    const weights: Record<string, number> = {
      photoURL: 15,
      displayName: 15,
      phoneNumber: 15,
      profession: 15,
      ville: 15,
      pays: 15,
      sousComite: 10,
    };

    const total = fields.reduce((sum, f) => sum + (f.filled ? weights[f.key] : 0), 0);
    const incomplete = fields.filter(f => !f.filled);

    return { completion: total, incompleteFields: incomplete };
  }, [user, displayName, phoneNumber, profession, pays, ville, sousComite]);

  // ==================== Sync user data when it changes ====================

  React.useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhoneNumber(user.phoneNumber || '');
      setProfession(user.profession || '');
      setPays(user.pays || '');
      setVille(user.ville || '');
      setSousComite(user.sousComite || '');
    }
  }, [user]);

  // Reset save success after animation
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  // ==================== Save Profile ====================

  const handleSave = async () => {
    if (!user) return;
    if (!displayName.trim()) {
      toast({ title: 'Champ requis', description: 'Le nom d\'affichage est obligatoire.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    setSaveSuccess(false);
    try {
      await updateDoc(doc(COLLECTIONS.USERS, user.id), {
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim(),
        profession: profession.trim(),
        pays: pays.trim(),
        ville: ville.trim(),
        sousComite: sousComite.trim(),
      });
      toast({ title: 'Profil mis à jour', description: 'Vos informations ont été enregistrées.' });
      setSaveSuccess(true);
      refreshUser();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder le profil.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ==================== Photo Upload ====================

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Fichier invalide', description: 'Veuillez sélectionner une image.', variant: 'destructive' });
      return;
    }

    setPhotoUploading(true);
    setUploadProgress(0);

    try {
      const fileRef = ref(storageObj, STORAGE_FOLDERS.PROFILE_PICTURES + user.id + '_' + Date.now() + '_' + file.name);
      let downloadURL = '';

      await new Promise<void>((resolve, reject) => {
        uploadBytesResumable(fileRef, file)
          .on(
            'state_changed',
            (snapshot: any) => {
              const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              setUploadProgress(progress);
            },
            (error: any) => {
              console.error('Upload error:', error);
              reject(error);
            },
            async () => {
              try {
                downloadURL = await getDownloadURL(fileRef);
                resolve();
              } catch (err) {
                reject(err);
              }
            }
          );
      });

      await updateDoc(doc(COLLECTIONS.USERS, user.id), {
        photoURL: downloadURL,
      });

      toast({ title: 'Photo mise à jour', description: 'Votre photo de profil a été changée.' });
      refreshUser();
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({ title: 'Erreur', description: 'Impossible de télécharger la photo.', variant: 'destructive' });
    } finally {
      setPhotoUploading(false);
      setUploadProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // ==================== Change Password ====================

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast({ title: 'Champ requis', description: 'Entrez votre mot de passe actuel.', variant: 'destructive' });
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      toast({ title: 'Mot de passe faible', description: 'Le nouveau mot de passe doit avoir au moins 8 caractères.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Non concordant', description: 'Les mots de passe ne correspondent pas.', variant: 'destructive' });
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast({ title: 'Mot de passe changé', description: 'Votre mot de passe a été mis à jour.' });
      setPasswordOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: 'Erreur',
        description: err?.message || 'Impossible de changer le mot de passe.',
        variant: 'destructive',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  // ==================== Render ====================

  if (!user) {
    return (
      <div className="flex items-center justify-center flex-1 p-6">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <UserCircle className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">Utilisateur non connecté.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-center p-4 md:p-6 min-h-[calc(100vh-8rem)]">
      <div className="w-full max-w-xl space-y-6">
        {/* Logo + Title */}
        <div className="text-center space-y-2">
          <div className="relative w-16 h-16 mx-auto rounded-lg overflow-hidden">
            <Image src="/logo.png" alt="CODET" fill className="object-contain" />
          </div>
          <h2 className="text-xl font-bold">Mon Profil</h2>
          <p className="text-sm text-muted-foreground">
            Gérez vos informations personnelles
          </p>
        </div>

        {/* Avatar Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-3">
              <div className="relative group cursor-pointer" onClick={() => !photoUploading && fileInputRef.current?.click()}>
                <div className="h-28 w-28 rounded-full p-1 bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 shadow-lg">
                  <div className="h-full w-full rounded-full overflow-hidden ring-2 ring-background">
                    {user.photoURL ? (
                      <Image
                        src={user.photoURL}
                        alt={user.displayName}
                        width={112}
                        height={112}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-4xl font-bold">
                        {user.displayName?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                  {/* Profile completion ring */}
                <svg width="56" height="56" className="absolute -bottom-1 -right-1 drop-shadow-md">
                  {/* White background */}
                  <circle cx="28" cy="28" r="26" fill="white" className="dark:fill-card" />
                  {/* Background track */}
                  <circle cx="28" cy="28" r={RING_RADIUS} fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                  {/* Progress arc */}
                  <circle
                    cx="28" cy="28" r={RING_RADIUS}
                    fill="none"
                    stroke={completion >= 60 ? '#10b981' : '#f59e0b'}
                    strokeWidth="3"
                    strokeDasharray={RING_CIRCUMFERENCE}
                    strokeDashoffset={RING_CIRCUMFERENCE - (completion / 100) * RING_CIRCUMFERENCE}
                    strokeLinecap="round"
                    transform="rotate(-90 28 28)"
                    style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                  />
                  {/* Center text */}
                  <text
                    x="28" y="28"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={completion >= 60 ? '#10b981' : '#f59e0b'}
                    style={{ fontSize: '11px', fontWeight: 700 }}
                  >
                    {completion}%
                  </text>
                </svg>
              {/* Upload overlay on hover */}
                {!photoUploading && (
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white pointer-events-none">
                    <Camera className="h-5 w-5 mb-0.5" />
                    <span className="text-[10px] font-medium">Changer la photo</span>
                </div>
                )}
                {photoUploading && (
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
              {/* Role badge */}
              <Badge className={getRoleBadgeClass(user.role)}>
                {user.role.replace(/_/g, ' ')}
              </Badge>
              <p className="text-lg font-semibold">{user.displayName}</p>
              {photoUploading && uploadProgress > 0 && (
                <div className="w-full max-w-xs space-y-1">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">{uploadProgress}%</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Completion Tips Card */}
        {completion < 100 && (
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Complétez votre profil</h3>
                <Badge variant="secondary" className="text-xs font-medium">
                  {completion}%
                </Badge>
              </div>
              <ul className="space-y-2">
                {incompleteFields.map(field => (
                  <li key={field.key} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CircleIcon className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                    {field.label}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">
                Un profil complet aide les autres membres à vous connaître
              </p>
            </CardContent>
          </Card>
        )}

        {/* Informations personnelles Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Pencil className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Nom d&apos;affichage *</Label>
              <Input
                id="profile-name"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Votre nom complet"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profile-profession">Profession</Label>
                <Input
                  id="profile-profession"
                  value={profession}
                  onChange={e => setProfession(e.target.value)}
                  placeholder="Votre profession"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-souscomite">Sous-comité</Label>
                <Input
                  id="profile-souscomite"
                  value={sousComite}
                  onChange={e => setSousComite(e.target.value)}
                  placeholder="Sous-comité d&apos;appartenance"
                />
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className={`w-full sm:w-auto transition-all duration-300 ${
                saveSuccess
                  ? 'bg-emerald-600 hover:bg-emerald-600'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {saveSuccess ? (
                <Check className="h-4 w-4 mr-2" />
              ) : saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saveSuccess ? 'Enregistré !' : 'Enregistrer'}
            </Button>
          </CardContent>
        </Card>

        {/* Contact Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" /> Email
              </Label>
              <p className="text-sm font-medium">{user.email || 'Non renseigné'}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-phone">Téléphone</Label>
              <Input
                id="profile-phone"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                placeholder="Numéro de téléphone"
              />
            </div>
          </CardContent>
        </Card>

        {/* Activité Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Activité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <UserCircle className="h-3 w-3" /> Genre
                </Label>
                <p className="text-sm font-medium capitalize">{user.gender === 'monsieur' ? 'Homme' : 'Femme'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Inscription
                </Label>
                <p className="text-sm font-medium">{formatDate(user.createdAt)}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profile-pays">Pays</Label>
                <Input
                  id="profile-pays"
                  value={pays}
                  onChange={e => setPays(e.target.value)}
                  placeholder="Pays de résidence"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-ville">Ville</Label>
                <Input
                  id="profile-ville"
                  value={ville}
                  onChange={e => setVille(e.target.value)}
                  placeholder="Ville"
                />
              </div>
            </div>
            <Separator />
            <Button
              variant="outline"
              onClick={() => setPasswordOpen(true)}
              className="w-full sm:w-auto"
            >
              <Lock className="h-4 w-4 mr-2" />
              Changer le mot de passe
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200 dark:border-red-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" />
              Zone dangereuse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Supprimer le compte</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Cette action est irréversible. Toutes vos données seront perdues.
                </p>
              </div>
              <Button
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300 shrink-0"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ==================== Change Password Dialog ==================== */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Changer le mot de passe</DialogTitle>
            <DialogDescription>
              Entrez votre mot de passe actuel et choisissez un nouveau mot de passe.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-pw">Mot de passe actuel *</Label>
              <Input
                id="current-pw"
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Entrez votre mot de passe actuel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-pw">Nouveau mot de passe *</Label>
              <Input
                id="new-pw"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Au moins 8 caractères"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-pw">Confirmer le mot de passe *</Label>
              <Input
                id="confirm-pw"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirmez le nouveau mot de passe"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={passwordLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {passwordLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Mettre à jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== Delete Account Dialog ==================== */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer votre compte</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et toutes vos données seront définitivement perdues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                setDeleteOpen(false);
                toast({
                  title: 'Non implémenté',
                  description: 'La suppression de compte n\'est pas encore disponible.',
                  variant: 'destructive',
                });
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}