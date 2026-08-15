'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { COLLECTIONS } from '@/lib/appwrite';
import {
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from '@/lib/db';
import { censusSchema, formatZodErrors } from '@/lib/validations';
import {
  Card,
  CardContent,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import {
  Users,
  UsersRound,
  BarChart3,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  Phone,
  MapPin,
  X,
  LayoutList,
  LayoutGrid,
  UserPlus,
} from 'lucide-react';
import EmptyState from '@/components/EmptyState';

// ==================== Types ====================

type ViewMode = 'table' | 'cards';

interface FamilyMember {
  nom: string;
  prenom: string;
  dateNaissance: string;
  relation: string;
}

interface Family {
  $id: string;
  membreId: string;
  membreNom: string;
  adresse: string;
  telephone: string;
  membres: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== Helpers ====================

function parseMembres(jsonStr: string): FamilyMember[] {
  try {
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
}

function getHashColor(name: string): string {
  const colors = [
    'bg-emerald-500', 'bg-teal-500', 'bg-amber-500', 'bg-rose-500',
    'bg-violet-500', 'bg-cyan-500', 'bg-orange-500', 'bg-pink-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// ==================== Stat Card Skeleton ====================

function StatCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-12 w-12 rounded-full shrink-0 ml-3" />
      </div>
    </Card>
  );
}

// ==================== Component ====================

export default function CensusPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const canManage = user && ['admin', 'président', 'secretaire', 'secretaire_general', 'trésorier', 'commissaire', 'membre'].includes(user.role);

  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('codet-census-view') as ViewMode) || 'cards';
    }
    return 'cards';
  });

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFamily, setEditingFamily] = useState<Family | null>(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [formFamilyName, setFormFamilyName] = useState('');
  const [formMembreNom, setFormMembreNom] = useState('');
  const [formAdresse, setFormAdresse] = useState('');
  const [formTelephone, setFormTelephone] = useState('');
  const [formMembres, setFormMembres] = useState<FamilyMember[]>([
    { nom: '', prenom: '', dateNaissance: '', relation: '' },
  ]);

  // Detail dialog (view-only, opened by card click)
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailFamily, setDetailFamily] = useState<Family | null>(null);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingFamily, setDeletingFamily] = useState<Family | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ==================== Persist view mode ====================

  useEffect(() => {
    localStorage.setItem('codet-census-view', viewMode);
  }, [viewMode]);

  // ==================== Fetch Families ====================

  const fetchFamilies = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getDocs(
        query(COLLECTIONS.FAMILIES, orderBy('createdAt', 'desc'))
      );
      setFamilies(result.documents as unknown as Family[]);
    } catch (error) {
      console.error('Error fetching families:', error);
      toast({ title: 'Erreur', description: 'Impossible de charger les familles.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFamilies();
  }, [fetchFamilies]);

  // ==================== Stats ====================

  const stats = useMemo(() => {
    const totalFamilies = families.length;
    const allMembers = families.reduce((sum, f) => sum + parseMembres(f.membres).length, 0);
    const avg = totalFamilies > 0 ? (allMembers / totalFamilies).toFixed(1) : '0';
    return { totalFamilies, totalMembers: allMembers, avgPerHousehold: avg };
  }, [families]);

  // ==================== Filtered Families ====================

  const filteredFamilies = useMemo(() => {
    if (!searchQuery.trim()) return families;
    const q = searchQuery.toLowerCase();
    return families.filter(f => {
      const chefName = (f.membreNom || '').toLowerCase();
      // Also search parsed members' names
      const membres = parseMembres(f.membres);
      const memberNames = membres.map(m => `${m.nom} ${m.prenom}`.toLowerCase()).join(' ');
      return chefName.includes(q) || memberNames.includes(q);
    });
  }, [families, searchQuery]);

  // ==================== Member Management ====================

  const addFamilyMember = () => {
    setFormMembres([...formMembres, { nom: '', prenom: '', dateNaissance: '', relation: '' }]);
  };

  const removeFamilyMember = (index: number) => {
    if (formMembres.length <= 1) return;
    setFormMembres(formMembres.filter((_, i) => i !== index));
  };

  const updateFamilyMember = (index: number, field: keyof FamilyMember, value: string) => {
    setFormMembres(formMembres.map((m, i) =>
      i === index ? { ...m, [field]: value } : m
    ));
  };

  // ==================== Open Dialogs ====================

  const openCreateDialog = () => {
    setEditingFamily(null);
    setFormFamilyName('');
    setFormMembreNom('');
    setFormAdresse('');
    setFormTelephone('');
    setFormMembres([{ nom: '', prenom: '', dateNaissance: '', relation: '' }]);
    setDialogOpen(true);
  };

  const openEditDialog = (family: Family) => {
    setEditingFamily(family);
    // Extract family name: "Famille X" -> "X", or use membreNom
    const rawName = family.membreNom || '';
    setFormFamilyName(rawName);
    setFormMembreNom(rawName);
    setFormAdresse(family.adresse || '');
    setFormTelephone(family.telephone || '');
    const parsed = parseMembres(family.membres);
    setFormMembres(parsed.length > 0 ? parsed : [{ nom: '', prenom: '', dateNaissance: '', relation: '' }]);
    setDialogOpen(true);
  };

  const openDetailDialog = (family: Family) => {
    setDetailFamily(family);
    setDetailOpen(true);
  };

  // ==================== Save ====================

  const handleSave = async () => {
    const formData = {
      nomFamille: formMembreNom.trim(),
      chefFamille: formMembreNom.trim(),
      telephone: formTelephone.trim(),
      adresse: formAdresse.trim(),
      membres: JSON.stringify(formMembres.filter(m => m.nom.trim() || m.prenom.trim())),
    };
    const result = censusSchema.safeParse(formData);
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      const firstError = Object.values(errors)[0];
      toast({ title: 'Validation', description: firstError, variant: 'destructive' });
      return;
    }

    setDialogLoading(true);
    try {
      const data = {
        membreId: user?.id || '',
        membreNom: formMembreNom.trim(),
        adresse: formAdresse.trim(),
        telephone: formTelephone.trim(),
        membres: JSON.stringify(formMembres.filter(m => m.nom.trim() || m.prenom.trim())),
        updatedAt: new Date().toISOString(),
      };

      if (editingFamily) {
        await updateDoc(doc(COLLECTIONS.FAMILIES, editingFamily.$id), data);
        toast({ title: 'Famille modifiée', description: 'Les informations ont été mises à jour.' });
      } else {
        await addDoc(COLLECTIONS.FAMILIES, {
          ...data,
          createdAt: new Date().toISOString(),
        });
        toast({ title: 'Famille ajoutée', description: 'La famille a été enregistrée avec succès.' });
      }

      setDialogOpen(false);
      fetchFamilies();
    } catch (error) {
      console.error('Error saving family:', error);
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder.', variant: 'destructive' });
    } finally {
      setDialogLoading(false);
    }
  };

  // ==================== Delete ====================

  const openDeleteDialog = (family: Family) => {
    setDeletingFamily(family);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingFamily) return;
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(COLLECTIONS.FAMILIES, deletingFamily.$id));
      toast({ title: 'Famille supprimée', description: 'La famille a été supprimée.' });
      setDeleteOpen(false);
      setDeletingFamily(null);
      if (expandedId === deletingFamily.$id) setExpandedId(null);
      fetchFamilies();
    } catch (error) {
      console.error('Error deleting family:', error);
      toast({ title: 'Erreur', description: 'Impossible de supprimer.', variant: 'destructive' });
    } finally {
      setDeleteLoading(false);
    }
  };

  // ==================== Render: Stats Bar ====================

  const statsBar = (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {loading
        ? Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)
        : [
            {
              label: 'Total familles',
              value: stats.totalFamilies,
              description: 'Foyers enregistrés',
              icon: <Users className="h-5 w-5 text-white" />,
              color: 'text-emerald-600 dark:text-emerald-400',
              iconGradFrom: 'from-emerald-400',
              iconGradTo: 'to-emerald-600',
              bgFrom: 'from-emerald-500/5',
              bgTo: 'to-teal-500/5',
              ringHover: 'hover:ring-emerald-500/50 hover:shadow-emerald-500/5',
            },
            {
              label: 'Total membres',
              value: stats.totalMembers,
              description: 'Personnes recensées',
              icon: <UsersRound className="h-5 w-5 text-white" />,
              color: 'text-sky-600 dark:text-sky-400',
              iconGradFrom: 'from-sky-400',
              iconGradTo: 'to-sky-600',
              bgFrom: 'from-sky-500/5',
              bgTo: 'to-blue-500/5',
              ringHover: 'hover:ring-sky-500/50 hover:shadow-sky-500/5',
            },
            {
              label: 'Moyenne par foyer',
              value: stats.avgPerHousehold,
              description: 'Membres en moyenne',
              icon: <BarChart3 className="h-5 w-5 text-white" />,
              color: 'text-amber-600 dark:text-amber-400',
              iconGradFrom: 'from-amber-400',
              iconGradTo: 'to-amber-600',
              bgFrom: 'from-amber-500/5',
              bgTo: 'to-orange-500/5',
              ringHover: 'hover:ring-amber-500/50 hover:shadow-amber-500/5',
            },
          ].map((stat) => (
            <Card
              key={stat.label}
              className={`group p-4 relative overflow-hidden ring-1 ring-border hover:shadow-lg ${stat.ringHover} hover:-translate-y-0.5 transition-all duration-200`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgFrom} ${stat.bgTo} pointer-events-none rounded-lg`} />
              <div className="relative flex items-start justify-between">
                <div className="space-y-1 flex-1 min-w-0 pt-0.5">
                  <p className="text-xs text-muted-foreground font-medium truncate">
                    {stat.label}
                  </p>
                  <p className="text-3xl md:text-4xl font-bold text-foreground tracking-tight tabular-nums">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {stat.description}
                  </p>
                </div>
                <div
                  className={`h-12 w-12 rounded-full bg-gradient-to-br ${stat.iconGradFrom} ${stat.iconGradTo} flex items-center justify-center shrink-0 ml-3 group-hover:scale-110 transition-transform duration-200 shadow-md`}
                >
                  {stat.icon}
                </div>
              </div>
            </Card>
          ))
      }
    </div>
  );

  // ==================== Render: Family Card ====================

  const renderFamilyCard = (family: Family) => {
    const membres = parseMembres(family.membres);
    const isExpanded = expandedId === family.$id;
    const chefName = family.membreNom || 'Sans nom';
    const memberCount = membres.length;
    const displayMembers = membres.slice(0, 3);
    const extraCount = membres.length - 3;

    return (
      <Card
        key={family.$id}
        className="overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
        onClick={() => openDetailDialog(family)}
      >
        <CardContent className="p-5 space-y-4">
          {/* Family name + member count badge */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold leading-tight truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Famille {chefName}
              </h3>
            </div>
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-0 shrink-0 font-semibold">
              {memberCount} membre{memberCount !== 1 ? 's' : ''}
            </Badge>
          </div>

          {/* Chef de famille with avatar */}
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-full ${getHashColor(chefName)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
              {getInitials(chefName)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{chefName}</p>
              <p className="text-xs text-muted-foreground">Chef de famille</p>
            </div>
          </div>

          {/* Location */}
          {family.adresse && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{family.adresse}</span>
            </div>
          )}

          {/* Phone */}
          {family.telephone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span>{family.telephone}</span>
            </div>
          )}

          {/* Member names list */}
          {memberCount > 0 && (
            <div>
              <div className="flex flex-wrap gap-1.5">
                {displayMembers.map((m, idx) => {
                  const fullName = `${m.prenom} ${m.nom}`.trim() || 'Sans nom';
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full"
                    >
                      <span className={`h-4 w-4 rounded-full ${getHashColor(fullName)} flex items-center justify-center text-white text-[8px] font-bold`}>
                        {getInitials(fullName)}
                      </span>
                      {fullName}
                    </span>
                  );
                })}
                {extraCount > 0 && (
                  <span className="inline-flex items-center text-xs text-muted-foreground px-2 py-0.5">
                    +{extraCount} autre{extraCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Admin actions — stop propagation so card click doesn't trigger */}
          {canManage && (
            <div className="flex items-center gap-2 pt-1 border-t">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  openEditDialog(family);
                }}
              >
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Modifier
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  openDeleteDialog(family);
                }}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Supprimer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // ==================== Render: Family Table Row ====================

  const renderFamilyTableRow = (family: Family) => {
    const membres = parseMembres(family.membres);
    const chefName = family.membreNom || 'Sans nom';
    const memberCount = membres.length;

    return (
      <TableRow
        key={family.$id}
        className="cursor-pointer"
        onClick={() => openDetailDialog(family)}
      >
        {/* Family name */}
        <TableCell className="font-semibold">Famille {chefName}</TableCell>

        {/* Chef de famille with avatar initials */}
        <TableCell>
          <div className="flex items-center gap-2">
            <div className={`h-7 w-7 rounded-full ${getHashColor(chefName)} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
              {getInitials(chefName)}
            </div>
            <span className="truncate">{chefName}</span>
          </div>
        </TableCell>

        {/* Member count badge */}
        <TableCell>
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-0 font-semibold">
            {memberCount}
          </Badge>
        </TableCell>

        {/* Location with MapPin */}
        <TableCell>
          {family.adresse ? (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate max-w-[180px]">{family.adresse}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>

        {/* Phone */}
        <TableCell>
          {family.telephone ? (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span>{family.telephone}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>

        {/* Actions */}
        {canManage && (
          <TableCell>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  openEditDialog(family);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  openDeleteDialog(family);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </TableCell>
        )}
      </TableRow>
    );
  };

  // ==================== Render: Detail Dialog ====================

  const detailDialogContent = detailFamily && (() => {
    const membres = parseMembres(detailFamily.membres);
    const chefName = detailFamily.membreNom || 'Sans nom';
    // Find chef in membres list, otherwise show the chef as first entry
    const chef = membres.find(m => m.relation === 'Chef de famille');
    const otherMembers = membres.filter(m => m.relation !== 'Chef de famille');

    return (
      <div className="space-y-6">
        {/* Section: Famille */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-2">
            <Users className="h-4 w-4" />
            Famille
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Nom de famille</span>
              <p className="font-medium">Famille {chefName}</p>
            </div>
            {detailFamily.adresse && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Localisation</span>
                <div className="flex items-center gap-1.5 font-medium">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  {detailFamily.adresse}
                </div>
              </div>
            )}
            {detailFamily.telephone && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Téléphone</span>
                <div className="flex items-center gap-1.5 font-medium">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  {detailFamily.telephone}
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Section: Chef de famille */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wide flex items-center gap-2">
            <UsersRound className="h-4 w-4" />
            Chef de famille
          </h4>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className={`h-11 w-11 rounded-full ${getHashColor(chefName)} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
              {getInitials(chefName)}
            </div>
            <div>
              <p className="font-semibold">{chefName}</p>
              <p className="text-xs text-muted-foreground">Chef de famille</p>
              {chef && chef.dateNaissance && (
                <p className="text-xs text-muted-foreground">Né(e) le {formatDate(chef.dateNaissance)}</p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Section: Membres du foyer (hierarchy) */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Membres du foyer
            <Badge variant="outline" className="ml-auto font-normal">
              {membres.length} personne{membres.length !== 1 ? 's' : ''}
            </Badge>
          </h4>

          {membres.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun membre de famille enregistré.
            </p>
          ) : (
            <div className="space-y-1.5">
              {/* Indented hierarchy with lines */}
              {membres.map((m, idx) => {
                const fullName = `${m.prenom} ${m.nom}`.trim() || 'Sans nom';
                const isChef = m.relation === 'Chef de famille';
                const isLast = idx === membres.length - 1;

                return (
                  <div key={idx} className="relative flex items-start gap-3">
                    {/* Vertical line + horizontal connector */}
                    <div className="flex flex-col items-center shrink-0">
                      {!isLast && (
                        <div className="w-px h-full bg-border absolute left-[15px] top-8 bottom-0" />
                      )}
                      <div className={`h-8 w-8 rounded-full ${getHashColor(fullName)} flex items-center justify-center text-white text-[10px] font-bold shrink-0 relative z-10`}>
                        {getInitials(fullName)}
                      </div>
                    </div>
                    {/* Member info */}
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm ${isChef ? 'font-semibold' : 'font-medium'}`}>{
                          fullName
                        }</span>
                        {m.relation && (
                          <Badge variant="outline" className="text-[10px] font-normal">
                            {m.relation}
                          </Badge>
                        )}
                      </div>
                      {m.dateNaissance && (
                        <p className="text-xs text-muted-foreground">Né(e) le {formatDate(m.dateNaissance)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Suggestion to add member */}
          {canManage && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/30"
                onClick={() => {
                  setDetailOpen(false);
                  openEditDialog(detailFamily);
                }}
              >
                <UserPlus className="h-4 w-4 mr-1.5" />
                Ajouter / modifier les membres
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  })();

  // ==================== Main Render ====================

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
            <Users className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">Recensement</h2>
              <Badge variant="outline" className="font-normal">
                {filteredFamilies.length} famille{filteredFamilies.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">
              Données démographiques des familles des membres
            </p>
          </div>
        </div>
        <Button onClick={openCreateDialog} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une famille
        </Button>
      </div>

      {/* Stats Bar */}
      {statsBar}

      {/* Search + View Toggle */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom de famille ou chef de famille..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setSearchQuery('')}
                aria-label="Effacer la recherche"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroup
                  type="single"
                  value={viewMode}
                  onValueChange={(val) => {
                    if (val) setViewMode(val as ViewMode);
                  }}
                  variant="outline"
                  className="shrink-0"
                >
                  <ToggleGroupItem value="table" aria-label="Vue tableau">
                    <LayoutList className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="cards" aria-label="Vue cartes">
                    <LayoutGrid className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </TooltipTrigger>
              <TooltipContent>
                {viewMode === 'table' ? 'Vue tableau' : 'Vue cartes'}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </Card>

      {/* Loading Skeletons */}
      {loading && (
        <div className={viewMode === 'cards' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
          {viewMode === 'cards'
            ? Array.from({ length: 6 }).map(i => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-5 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))
            : Array.from({ length: 5 }).map(i => (
                <div key={i} className="flex gap-4 items-center p-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))
          }
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredFamilies.length === 0 && (
        <EmptyState
          icon={Users}
          title="Aucune famille"
          description={
            canManage
              ? 'Ajoutez la première famille au recensement.'
              : searchQuery
                ? 'Aucun résultat trouvé pour cette recherche.'
                : 'Aucune famille enregistrée.'
          }
          action={
            canManage
              ? { label: 'Ajouter une famille', onClick: openCreateDialog }
              : searchQuery
                ? { label: 'Réinitialiser la recherche', onClick: () => setSearchQuery(''), variant: 'outline' }
                : undefined
          }
        />
      )}

      {/* Cards View */}
      {!loading && filteredFamilies.length > 0 && viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFamilies.map(family => renderFamilyCard(family))}
        </div>
      )}

      {/* Table View */}
      {!loading && filteredFamilies.length > 0 && viewMode === 'table' && (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Famille</TableHead>
                <TableHead>Chef de famille</TableHead>
                <TableHead>Membres</TableHead>
                <TableHead>Localisation</TableHead>
                <TableHead>Téléphone</TableHead>
                {canManage && <TableHead className="w-[100px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFamilies.map(family => renderFamilyTableRow(family))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* ==================== Detail Dialog ==================== */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Famille {detailFamily?.membreNom || 'Sans nom'}
            </DialogTitle>
            <DialogDescription>
              Détails de la famille et de ses membres.
            </DialogDescription>
          </DialogHeader>
          {detailDialogContent}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              Fermer
            </Button>
            {canManage && detailFamily && (
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => {
                  setDetailOpen(false);
                  openEditDialog(detailFamily);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== Create/Edit Dialog ==================== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFamily ? 'Modifier la famille' : 'Ajouter une famille'}
            </DialogTitle>
            <DialogDescription>
              {editingFamily
                ? 'Modifiez les informations de la famille.'
                : 'Enregistrez une nouvelle famille dans le recensement.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Section: Famille */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-2">
                <Users className="h-4 w-4" />
                Famille
              </h4>
              <div className="space-y-2">
                <Label htmlFor="fam-name">Nom de la famille *</Label>
                <Input
                  id="fam-name"
                  placeholder="Ex: Famille Ndong"
                  value={formMembreNom}
                  onChange={e => setFormMembreNom(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fam-address">Adresse / Localisation</Label>
                  <Input
                    id="fam-address"
                    placeholder="Ville, pays..."
                    value={formAdresse}
                    onChange={e => setFormAdresse(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fam-phone">Téléphone</Label>
                  <Input
                    id="fam-phone"
                    placeholder="Numéro de téléphone"
                    value={formTelephone}
                    onChange={e => setFormTelephone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Section: Chef de famille */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wide flex items-center gap-2">
                <UsersRound className="h-4 w-4" />
                Chef de famille
              </h4>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className={`h-10 w-10 rounded-full ${formMembreNom ? getHashColor(formMembreNom) : 'bg-muted'} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                  {formMembreNom ? getInitials(formMembreNom) : '?'}
                </div>
                <div className="text-sm">
                  <p className="font-medium">{formMembreNom || 'Non renseigné'}</p>
                  <p className="text-xs text-muted-foreground">Le nom ci-dessus sera utilisé</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Section: Membres du foyer */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Membres du foyer
                  <Badge variant="outline" className="font-normal">
                    {formMembres.length}
                  </Badge>
                </h4>
                <Button variant="ghost" size="sm" onClick={addFamilyMember} className="text-emerald-600">
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>
              <div className="space-y-3">
                {formMembres.map((member, idx) => (
                  <div key={idx} className="border rounded-lg p-3 space-y-2 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Membre {idx + 1}
                      </span>
                      {formMembres.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => removeFamilyMember(idx)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Input
                          placeholder="Nom"
                          value={member.nom}
                          onChange={e => updateFamilyMember(idx, 'nom', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Prénom"
                          value={member.prenom}
                          onChange={e => updateFamilyMember(idx, 'prenom', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Input
                          type="date"
                          value={member.dateNaissance}
                          onChange={e => updateFamilyMember(idx, 'dateNaissance', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Select
                          value={member.relation}
                          onValueChange={val => updateFamilyMember(idx, 'relation', val)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Lien de parenté" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Chef de famille">Chef de famille</SelectItem>
                            <SelectItem value="Conjoint(e)">Conjoint(e)</SelectItem>
                            <SelectItem value="Enfant">Enfant</SelectItem>
                            <SelectItem value="Frère/Soeur">Frère/Soeur</SelectItem>
                            <SelectItem value="Parent">Parent</SelectItem>
                            <SelectItem value="Autre">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={dialogLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {dialogLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingFamily ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== Delete Dialog ==================== */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette famille ?</AlertDialogTitle>
            <AlertDialogDescription>
              La famille de <strong>{deletingFamily?.membreNom}</strong> sera définitivement supprimée.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
