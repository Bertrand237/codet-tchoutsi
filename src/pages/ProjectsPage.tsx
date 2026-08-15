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
} from '@/lib/db';
import { projectSchema, formatZodErrors } from '@/lib/validations';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  FolderKanban,
  Loader2,
  Calendar,
  User,
  DollarSign,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Pause,
  TrendingUp,
  Wallet,
  ArrowUpRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import EmptyState from '@/components/EmptyState';
import { notifyProjectUpdate } from '@/lib/notification-triggers';

// ==================== Types ====================

interface Project {
  $id: string;
  titre: string;
  description: string;
  statut: string;
  priorite: string;
  budget: number;
  budgetUtilise: number;
  responsableId: string;
  responsableNom: string;
  dateDebut: string;
  dateEcheance: string;
  dateAchevement: string;
  progression: number;
  documentPDFUrl: string;
  tags: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_OPTIONS = [
  { value: 'planifié', label: 'Planifié' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'en_pause', label: 'En pause' },
  { value: 'terminé', label: 'Terminé' },
  { value: 'archivé', label: 'Archivé' },
];

const PRIORITY_OPTIONS = [
  { value: 'basse', label: 'Basse' },
  { value: 'moyenne', label: 'Moyenne' },
  { value: 'haute', label: 'Haute' },
  { value: 'urgente', label: 'Urgente' },
];

// ==================== Helpers ====================

function getStatusDotColor(statut: string): string {
  switch (statut) {
    case 'planifié': return 'bg-sky-400';
    case 'en_cours': return 'bg-amber-400';
    case 'en_pause': return 'bg-gray-400';
    case 'terminé': return 'bg-emerald-400';
    case 'archivé': return 'bg-red-400';
    default: return 'bg-gray-400';
  }
}

function getStatusBadgeClass(statut: string): string {
  switch (statut) {
    case 'planifié': return 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 border-0';
    case 'en_cours': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-0';
    case 'en_pause': return 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400 border-0';
    case 'terminé': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-0';
    case 'archivé': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-0';
    default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400 border-0';
  }
}

function getStatusIconColor(statut: string): string {
  switch (statut) {
    case 'planifié': return 'text-sky-500';
    case 'en_cours': return 'text-amber-500';
    case 'en_pause': return 'text-gray-400';
    case 'terminé': return 'text-emerald-500';
    case 'archivé': return 'text-red-500';
    default: return 'text-gray-400';
  }
}

function getStatusIcon(statut: string): React.ReactNode {
  const cls = 'h-4 w-4 ' + getStatusIconColor(statut);
  switch (statut) {
    case 'terminé': return <CheckCircle2 className={cls} />;
    case 'en_cours': return <Clock className={cls} />;
    case 'planifié': return <Calendar className={cls} />;
    case 'archivé': return <XCircle className={cls} />;
    case 'en_pause': return <Pause className={cls} />;
    default: return <Clock className={cls} />;
  }
}

function getStatusLabel(statut: string): string {
  const found = STATUS_OPTIONS.find((s) => s.value === statut);
  return found ? found.label : statut;
}

function getStatusBorderColor(statut: string): string {
  switch (statut) {
    case 'planifié': return 'border-l-sky-400';
    case 'en_cours': return 'border-l-amber-400';
    case 'en_pause': return 'border-l-gray-400';
    case 'terminé': return 'border-l-emerald-500';
    case 'archivé': return 'border-l-red-400';
    default: return 'border-l-gray-300';
  }
}

function getPriorityBadgeClass(priorite: string): string {
  switch (priorite) {
    case 'urgente': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-0';
    case 'haute': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-0';
    case 'moyenne': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-0';
    case 'basse': return 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400 border-0';
    default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400 border-0';
  }
}

function getPriorityLabel(priorite: string): string {
  const found = PRIORITY_OPTIONS.find((p) => p.value === priorite);
  return found ? found.label : priorite;
}

/** Returns gradient classes for the progress bar based on status & budget */
function getProgressGradient(statut: string, budget: number, budgetUtilise: number): string {
  if (statut === 'terminé') return 'bg-gradient-to-r from-emerald-500 to-emerald-400';
  if (budget > 0 && budgetUtilise > budget) return 'bg-gradient-to-r from-red-500 to-red-400';
  if (statut === 'en_pause' || statut === 'archivé') return 'bg-gradient-to-r from-gray-400 to-gray-300';
  return 'bg-gradient-to-r from-emerald-500 to-teal-400';
}

/** Budget colour: green=under, amber=close(>80%), red=over */
function getBudgetColorClass(budget: number, budgetUtilise: number): string {
  if (!budget || budget <= 0) return 'text-foreground';
  const pct = (budgetUtilise || 0) / budget;
  if (pct > 1) return 'text-red-600 dark:text-red-400';
  if (pct > 0.8) return 'text-amber-600 dark:text-amber-400';
  return 'text-emerald-600 dark:text-emerald-400';
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function parseTags(tagsStr: string): string[] {
  if (!tagsStr) return [];
  try {
    const parsed = JSON.parse(tagsStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return tagsStr.split(',').map((t: string) => t.trim()).filter(Boolean);
  }
}

function formatBudget(amount: number) {
  if (!amount) return '0 FCFA';
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}

function formatBudgetShort(amount: number) {
  if (!amount) return '0';
  if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(1).replace('.0', '') + 'M';
  if (amount >= 1_000) return (amount / 1_000).toFixed(0) + 'k';
  return String(amount);
}

// ==================== Animation variants ====================

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

// ==================== Component ====================

export default function ProjectsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [formTitre, setFormTitre] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatut, setFormStatut] = useState('planifié');
  const [formPriorite, setFormPriorite] = useState('moyenne');
  const [formBudget, setFormBudget] = useState('');
  const [formDateDebut, setFormDateDebut] = useState('');
  const [formDateEcheance, setFormDateEcheance] = useState('');
  const [formProgression, setFormProgression] = useState(0);

  const canManage = user && ['admin', 'président', 'secretaire', 'secretaire_general', 'trésorier', 'commissaire', 'responsable_communication', 'membre'].includes(user.role);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getDocs(COLLECTIONS.PROJECTS);
      setProjects(result.documents as Project[]);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les projets.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Stats
  const stats = useMemo(() => {
    const total = projects.length;
    const enCours = projects.filter((p) => p.statut === 'en_cours').length;
    const termines = projects.filter((p) => p.statut === 'terminé').length;
    const budgetTotal = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    return { total, enCours, termines, budgetTotal };
  }, [projects]);

  // Status counts for filter tabs
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: projects.length };
    STATUS_OPTIONS.forEach((s) => {
      counts[s.value] = projects.filter((p) => p.statut === s.value).length;
    });
    return counts;
  }, [projects]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch = !searchTerm ||
        p.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.responsableNom?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || p.statut === statusFilter;
      const matchPriority = priorityFilter === 'all' || p.priorite === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [projects, searchTerm, statusFilter, priorityFilter]);

  // Reset form
  const resetForm = () => {
    setFormTitre('');
    setFormDescription('');
    setFormStatut('planifié');
    setFormPriorite('moyenne');
    setFormBudget('');
    setFormDateDebut('');
    setFormDateEcheance('');
    setFormProgression(0);
  };

  // Open create dialog
  const openCreateDialog = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (project: Project) => {
    setSelectedProject(project);
    setFormTitre(project.titre || '');
    setFormDescription(project.description || '');
    setFormStatut(project.statut || 'planifié');
    setFormPriorite(project.priorite || 'moyenne');
    setFormBudget(project.budget ? String(project.budget) : '');
    setFormDateDebut(project.dateDebut ? project.dateDebut.split('T')[0] : '');
    setFormDateEcheance(project.dateEcheance ? project.dateEcheance.split('T')[0] : '');
    setFormProgression(project.progression || 0);
    setEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (project: Project) => {
    setSelectedProject(project);
    setDeleteDialogOpen(true);
  };

  // Create project
  const handleCreate = async () => {
    const formData = {
      nom: formTitre.trim(),
      description: formDescription.trim(),
      statut: formStatut,
      priorite: formPriorite,
      dateDebut: formDateDebut || '',
      dateFin: formDateEcheance || '',
      budget: formBudget ? parseFloat(formBudget) : undefined,
    };
    const result = projectSchema.safeParse(formData);
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      const firstError = Object.values(errors)[0];
      toast({ title: 'Validation', description: firstError, variant: 'destructive' });
      return;
    }
    try {
      setSaving(true);
      await addDoc(COLLECTIONS.PROJECTS, {
        titre: formTitre.trim(),
        description: formDescription.trim(),
        statut: formStatut,
        priorite: formPriorite,
        budget: formBudget ? parseFloat(formBudget) : 0,
        budgetUtilise: 0,
        responsableId: user?.id || '',
        responsableNom: user?.displayName || '',
        dateDebut: formDateDebut || new Date().toISOString(),
        dateEcheance: formDateEcheance || '',
        dateAchevement: '',
        progression: 0,
        documentPDFUrl: '',
        tags: JSON.stringify([]),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast({ title: 'Succès', description: 'Projet créé avec succès.' });
      notifyProjectUpdate(formTitre.trim(), getStatusLabel(formStatut)).catch(() => {});
      setCreateDialogOpen(false);
      resetForm();
      fetchProjects();
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast({ title: 'Erreur', description: 'Impossible de créer le projet.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Edit project
  const handleEdit = async () => {
    if (!selectedProject) return;
    const formData = {
      nom: formTitre.trim(),
      description: formDescription.trim(),
      statut: formStatut,
      priorite: formPriorite,
      dateDebut: formDateDebut || '',
      dateFin: formDateEcheance || '',
      budget: formBudget ? parseFloat(formBudget) : undefined,
    };
    const result = projectSchema.safeParse(formData);
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      const firstError = Object.values(errors)[0];
      toast({ title: 'Validation', description: firstError, variant: 'destructive' });
      return;
    }
    try {
      setSaving(true);
      await updateDoc(doc(COLLECTIONS.PROJECTS, selectedProject.$id), {
        titre: formTitre.trim(),
        description: formDescription.trim(),
        statut: formStatut,
        priorite: formPriorite,
        budget: formBudget ? parseFloat(formBudget) : 0,
        dateDebut: formDateDebut || selectedProject.dateDebut,
        dateEcheance: formDateEcheance || selectedProject.dateEcheance,
        progression: formProgression,
        updatedAt: new Date().toISOString(),
      });
      toast({ title: 'Succès', description: 'Projet mis à jour.' });
      if (formStatut !== selectedProject.statut) {
        notifyProjectUpdate(formTitre.trim(), getStatusLabel(formStatut)).catch(() => {});
      }
      setEditDialogOpen(false);
      setSelectedProject(null);
      fetchProjects();
    } catch (error: any) {
      console.error('Error updating project:', error);
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour le projet.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Delete project
  const handleDelete = async () => {
    if (!selectedProject) return;
    try {
      setDeleting(true);
      await deleteDoc(doc(COLLECTIONS.PROJECTS, selectedProject.$id));
      toast({ title: 'Succès', description: 'Projet supprimé.' });
      setDeleteDialogOpen(false);
      setSelectedProject(null);
      fetchProjects();
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast({ title: 'Erreur', description: 'Impossible de supprimer le projet.', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  // Update progress
  const handleProgressUpdate = async (project: Project, newProgress: number) => {
    try {
      await updateDoc(doc(COLLECTIONS.PROJECTS, project.$id), {
        progression: newProgress,
        updatedAt: new Date().toISOString(),
      });
      setProjects((prev) =>
        prev.map((p) => (p.$id === project.$id ? { ...p, progression: newProgress } : p))
      );
      toast({ title: 'Succès', description: `Progression mise à jour : ${newProgress}%` });
    } catch (error: any) {
      console.error('Error updating progress:', error);
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour la progression.', variant: 'destructive' });
    }
  };

  // Project form dialog content — grouped by sections
  const ProjectFormFields = () => (
    <div className="grid gap-5 py-2">
      {/* Informations section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FolderKanban className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-semibold text-foreground">Informations</span>
        </div>
        <Separator />
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="titre">Titre *</Label>
            <Input
              id="titre"
              value={formTitre}
              onChange={(e) => setFormTitre(e.target.value)}
              placeholder="Nom du projet"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Description détaillée du projet"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Statut</Label>
                <Badge className={`text-[10px] px-1.5 py-0 ${getStatusBadgeClass(formStatut)}`}>
                  {getStatusLabel(formStatut)}
                </Badge>
              </div>
              <Select value={formStatut} onValueChange={setFormStatut}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Priorité</Label>
                <Badge className={`text-[10px] px-1.5 py-0 rounded-full ${getPriorityBadgeClass(formPriorite)}`}>
                  {getPriorityLabel(formPriorite)}
                </Badge>
              </div>
              <Select value={formPriorite} onValueChange={setFormPriorite}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Dates section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-semibold text-foreground">Dates</span>
        </div>
        <Separator />
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="dateDebut">Date de début</Label>
            <Input
              id="dateDebut"
              type="date"
              value={formDateDebut}
              onChange={(e) => setFormDateDebut(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dateEcheance">Date d&apos;échéance</Label>
            <Input
              id="dateEcheance"
              type="date"
              value={formDateEcheance}
              onChange={(e) => setFormDateEcheance(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Budget section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-semibold text-foreground">Budget</span>
        </div>
        <Separator />
        <div className="grid gap-2">
          <Label htmlFor="budget">Budget (FCFA)</Label>
          <Input
            id="budget"
            type="number"
            value={formBudget}
            onChange={(e) => setFormBudget(e.target.value)}
            placeholder="0"
            min={0}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
            <FolderKanban className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">Projets</h2>
              {!loading && projects.length > 0 && (
                <Badge variant="secondary" className="text-xs font-normal">
                  {projects.length} projet{projects.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Gestion des projets communautaires
            </p>
          </div>
        </div>
        {canManage && (
          <Button onClick={openCreateDialog} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau projet
          </Button>
        )}
      </div>

      {/* Stats Bar */}
      {!loading && projects.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="group p-4 relative overflow-hidden ring-1 ring-border hover:ring-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5 transition-all duration-200">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 pointer-events-none rounded-lg" />
            <div className="relative flex items-start justify-between">
              <div className="space-y-1 flex-1 min-w-0 pt-0.5">
                <p className="text-xs text-muted-foreground font-medium">Total projets</p>
                <p className="text-2xl md:text-3xl font-bold text-foreground tracking-tight tabular-nums">{stats.total}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0 ml-3 group-hover:scale-110 transition-transform duration-200 shadow-md dark:opacity-80">
                <FolderKanban className="h-5 w-5 text-white" />
              </div>
            </div>
          </Card>

          <Card className="group p-4 relative overflow-hidden ring-1 ring-border hover:ring-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5 hover:-translate-y-0.5 transition-all duration-200">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 pointer-events-none rounded-lg" />
            <div className="relative flex items-start justify-between">
              <div className="space-y-1 flex-1 min-w-0 pt-0.5">
                <p className="text-xs text-muted-foreground font-medium">En cours</p>
                <p className="text-2xl md:text-3xl font-bold text-foreground tracking-tight tabular-nums">{stats.enCours}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 ml-3 group-hover:scale-110 transition-transform duration-200 shadow-md dark:opacity-80">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </div>
          </Card>

          <Card className="group p-4 relative overflow-hidden ring-1 ring-border hover:ring-sky-500/50 hover:shadow-lg hover:shadow-sky-500/5 hover:-translate-y-0.5 transition-all duration-200">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-cyan-500/5 pointer-events-none rounded-lg" />
            <div className="relative flex items-start justify-between">
              <div className="space-y-1 flex-1 min-w-0 pt-0.5">
                <p className="text-xs text-muted-foreground font-medium">Terminés</p>
                <p className="text-2xl md:text-3xl font-bold text-foreground tracking-tight tabular-nums">{stats.termines}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shrink-0 ml-3 group-hover:scale-110 transition-transform duration-200 shadow-md dark:opacity-80">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
            </div>
          </Card>

          <Card className="group p-4 relative overflow-hidden ring-1 ring-border hover:ring-violet-500/50 hover:shadow-lg hover:shadow-violet-500/5 hover:-translate-y-0.5 transition-all duration-200">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5 pointer-events-none rounded-lg" />
            <div className="relative flex items-start justify-between">
              <div className="space-y-1 flex-1 min-w-0 pt-0.5">
                <p className="text-xs text-muted-foreground font-medium">Budget total</p>
                <p className="text-2xl md:text-3xl font-bold text-foreground tracking-tight tabular-nums">{formatBudgetShort(stats.budgetTotal)}</p>
                <p className="text-[11px] text-muted-foreground">FCFA</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shrink-0 ml-3 group-hover:scale-110 transition-transform duration-200 shadow-md dark:opacity-80">
                <Wallet className="h-5 w-5 text-white" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Status Filter Tabs + Search + Priority Filter */}
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4 space-y-3">
          {/* Status filter pills */}
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-1">
              <button
                onClick={() => setStatusFilter('all')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-150 border ${
                  statusFilter === 'all'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-card text-muted-foreground border-border hover:bg-accent hover:text-foreground'
                }`}
              >
                Tous
                <span className={`text-xs tabular-nums ${statusFilter === 'all' ? 'text-emerald-100' : 'text-muted-foreground/70'}`}>
                  {statusCounts.all}
                </span>
              </button>
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStatusFilter(s.value)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-150 border ${
                    statusFilter === s.value
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-card text-muted-foreground border-border hover:bg-accent hover:text-foreground'
                  }`}
                >
                  {s.label}
                  <span className={`text-xs tabular-nums ${statusFilter === s.value ? 'text-emerald-100' : 'text-muted-foreground/70'}`}>
                    {statusCounts[s.value] || 0}
                  </span>
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Search + Priority filter row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un projet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes priorités</SelectItem>
                {PRIORITY_OPTIONS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredProjects.length < projects.length && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Filter className="h-3 w-3" />
              <span>{filteredProjects.length} résultat(s) sur {projects.length}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projects grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-l-4 border-l-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-3/4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="space-y-1.5">
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
                <Separator />
                <div className="flex gap-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="Aucun projet"
          description={
            projects.length === 0
              ? "Aucun projet n'a encore été créé. Commencez par créer votre premier projet."
              : 'Aucun projet ne correspond à vos filtres de recherche.'
          }
          action={
            projects.length === 0 && canManage
              ? { label: 'Créer un projet', onClick: openCreateDialog }
              : projects.length > 0
                ? { label: 'Réinitialiser les filtres', onClick: () => { setSearchTerm(''); setStatusFilter('all'); setPriorityFilter('all'); }, variant: 'outline' }
                : undefined
          }
        />
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {filteredProjects.map((project) => {
            const tags = parseTags(project.tags);
            const budgetPercent = project.budget ? Math.min(100, Math.round(((project.budgetUtilise || 0) / project.budget) * 100)) : 0;
            const progress = Math.min(100, Math.max(0, project.progression || 0));
            const isInProgress = project.statut === 'en_cours' && progress > 0 && progress < 100;
            const progressGradient = getProgressGradient(project.statut, project.budget, project.budgetUtilise || 0);
            const budgetColor = getBudgetColorClass(project.budget, project.budgetUtilise || 0);
            return (
              <motion.div key={project.$id} variants={cardVariants}>
                <Card className={`group hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 border-l-4 ${getStatusBorderColor(project.statut)} h-full`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        {/* Status icon */}
                        <div className="mt-0.5 shrink-0">
                          {getStatusIcon(project.statut)}
                        </div>
                        <CardTitle className="text-base font-semibold leading-snug line-clamp-2">
                          {project.titre}
                        </CardTitle>
                      </div>
                      {canManage && (
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(project)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => openDeleteDialog(project)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      <Badge className={`text-xs ${getStatusBadgeClass(project.statut)} gap-1`}>
                        <span className={`inline-block h-1.5 w-1.5 rounded-full ${getStatusDotColor(project.statut)}`} />
                        {getStatusLabel(project.statut)}
                      </Badge>
                      {/* Priority pill badge */}
                      <Badge className={`text-xs rounded-full px-2.5 ${getPriorityBadgeClass(project.priorite)}`}>
                        {getPriorityLabel(project.priorite)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Description */}
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    {/* Progress bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progression</span>
                        <span className="font-semibold tabular-nums">{progress}%</span>
                      </div>
                      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${progressGradient}`}
                          style={{ width: `${progress}%` }}
                        ></div>
                        {/* Shimmer for in-progress projects */}
                        {isInProgress && (
                          <div
                            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{
                              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                              animation: 'shimmer 2s infinite',
                            }}
                          />
                        )}
                      </div>
                      {canManage && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={progress}
                            onChange={(e) => handleProgressUpdate(project, parseInt(e.target.value))}
                            className="h-1.5 cursor-pointer accent-emerald-600"
                          />
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Budget info */}
                    {project.budget > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs">
                            <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">Budget :</span>
                            <span className={`font-semibold ${budgetColor}`}>{formatBudget(project.budgetUtilise || 0)}</span>
                            <span className="text-muted-foreground">/</span>
                            <span className="font-medium">{formatBudget(project.budget)}</span>
                          </div>
                        </div>
                        {/* Mini budget bar */}
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              budgetPercent > 100 ? 'bg-red-500' : budgetPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, budgetPercent)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Dates & Responsable */}
                    <div className="space-y-1">
                      {project.dateDebut && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Début : {formatDate(project.dateDebut)}</span>
                        </div>
                      )}
                      {project.dateEcheance && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Échéance : {formatDate(project.dateEcheance)}</span>
                        </div>
                      )}
                      {project.responsableNom && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{project.responsableNom}</span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {tags.map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs font-normal">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau projet</DialogTitle>
            <DialogDescription>
              Remplissez les informations pour créer un nouveau projet.
            </DialogDescription>
          </DialogHeader>
          <ProjectFormFields />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier le projet</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations du projet.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <ProjectFormFields />
            {/* Progress update in edit */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-semibold text-foreground">Progression</span>
                <Badge className={`ml-auto text-[10px] px-1.5 py-0 ${getStatusBadgeClass(formStatut)}`}>
                  {getStatusLabel(formStatut)}
                </Badge>
              </div>
              <Separator />
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Progression</Label>
                  <span className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{formProgression}%</span>
                </div>
                <Input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={formProgression}
                  onChange={(e) => setFormProgression(parseInt(e.target.value))}
                  className="h-2 cursor-pointer accent-emerald-600"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le projet</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le projet &quot;{selectedProject?.titre}&quot; ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
