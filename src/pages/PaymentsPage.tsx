'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { COLLECTIONS, STORAGE_FOLDERS } from '@/lib/appwrite';
import {
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  ref,
  storageObj,
  uploadBytesResumable,
  getDownloadURL,
  toDate,
} from '@/lib/db';
import { paymentSchema, formatZodErrors } from '@/lib/validations';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CreditCard,
  Plus,
  Loader2,
  Search,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  FileText,
  Download,
  Calendar,
  Banknote,
  Smartphone,
  ArrowLeftRight,
  FileCheck,
} from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { notifyPaymentReceived, notifyAllMembers } from '@/lib/notification-triggers';

// ==================== Types ====================

interface Payment {
  $id: string;
  membreId: string;
  membreNom: string;
  montant: number;
  date: string;
  mode: string;
  preuveURL: string;
  statut: string;
  commentaire: string;
  validePar: string;
  dateValidation: string;
  createdAt: string;
}

// ==================== Mode Options ====================

const MODE_OPTIONS = [
  { value: 'espèces', label: 'Espèces', icon: Banknote, color: 'border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30' },
  { value: 'mobile_money', label: 'Mobile Money', icon: Smartphone, color: 'border-sky-500 text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30' },
  { value: 'virement', label: 'Virement', icon: ArrowLeftRight, color: 'border-violet-500 text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30' },
  { value: 'chèque', label: 'Chèque', icon: FileCheck, color: 'border-amber-500 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30' },
] as const;

// ==================== Avatar Helpers ====================

const AVATAR_COLORS = [
  'bg-emerald-500', 'bg-teal-500', 'bg-amber-500', 'bg-rose-500',
  'bg-violet-500', 'bg-cyan-500', 'bg-orange-500', 'bg-pink-500',
];

function getHashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  return parts[0].charAt(0).toUpperCase();
}

// ==================== Helpers ====================

function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function getModeBadge(mode: string) {
  switch (mode) {
    case 'espèces':
      return (
        <Badge variant="outline" className="border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-400">
          Espèces
        </Badge>
      );
    case 'mobile_money':
      return (
        <Badge variant="outline" className="border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400">
          Mobile Money
        </Badge>
      );
    case 'virement':
      return (
        <Badge variant="outline" className="border-sky-300 text-sky-700 dark:border-sky-700 dark:text-sky-400">
          Virement
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-400">
          {mode || 'Autre'}
        </Badge>
      );
  }
}

function getStatusBadge(statut: string) {
  switch (statut) {
    case 'en_attente':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
          <Clock className="h-3 w-3" /> En attente
        </span>
      );
    case 'validé':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
          <CheckCircle2 className="h-3 w-3" /> Confirmé
        </span>
      );
    case 'rejeté':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400">
          <XCircle className="h-3 w-3" /> Rejeté
        </span>
      );
    default:
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">{statut}</span>;
  }
}

// ==================== Component ====================

export default function PaymentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const canManage = user && ['admin', 'président', 'secretaire', 'secretaire_general', 'trésorier', 'commissaire', 'membre'].includes(user.role);
  const canValidate = user && ['admin', 'président', 'secretaire', 'secretaire_general', 'trésorier', 'commissaire'].includes(user.role);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [formMembreNom, setFormMembreNom] = useState('');
  const [formMontant, setFormMontant] = useState('');
  const [formMode, setFormMode] = useState('');
  const [formDate, setFormDate] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Validate/Reject dialog
  const [actionOpen, setActionOpen] = useState(false);
  const [actionPayment, setActionPayment] = useState<Payment | null>(null);
  const [actionType, setActionType] = useState<'valider' | 'rejeter'>('valider');
  const [actionCommentaire, setActionCommentaire] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Proof lightbox dialog
  const [proofDialogOpen, setProofDialogOpen] = useState(false);
  const [proofImageUrl, setProofImageUrl] = useState('');

  // ==================== Fetch Payments ====================

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getDocs(
        query(COLLECTIONS.PAYMENTS, orderBy('createdAt', 'desc'))
      );
      setPayments(result.documents as unknown as Payment[]);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({ title: 'Erreur', description: 'Impossible de charger les paiements.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // ==================== Stats ====================

  const stats = useMemo(() => {
    const total = payments.reduce((sum, p) => sum + (p.montant || 0), 0);
    const pending = payments
      .filter(p => p.statut === 'en_attente')
      .reduce((sum, p) => sum + (p.montant || 0), 0);
    const validated = payments
      .filter(p => p.statut === 'validé')
      .reduce((sum, p) => sum + (p.montant || 0), 0);
    const now = new Date();
    const thisMonth = payments
      .filter(p => {
        const d = new Date(p.date || p.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, p) => sum + (p.montant || 0), 0);
    const pctConfirmed = total > 0 ? Math.round((validated / total) * 100) : 0;
    return { total, pending, validated, thisMonth, pctConfirmed };
  }, [payments]);

  // Status counts for filter pills
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: payments.length };
    for (const p of payments) {
      const s = p.statut || 'autre';
      counts[s] = (counts[s] || 0) + 1;
    }
    return counts;
  }, [payments]);

  // ==================== Monthly progress per member ====================

  const memberMonthlyProgress = useMemo(() => {
    const now = new Date();
    const thisMonthPayments = payments.filter(p => {
      const d = new Date(p.date || p.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && p.statut === 'validé';
    });
    const map: Record<string, number> = {};
    for (const p of thisMonthPayments) {
      const key = p.membreId || p.membreNom;
      map[key] = (map[key] || 0) + (p.montant || 0);
    }
    const TARGET = 5000;
    return (membreId: string, membreNom: string) => {
      const key = membreId || membreNom;
      const paid = map[key] || 0;
      return { paid, target: TARGET, pct: Math.min(100, Math.round((paid / TARGET) * 100)) };
    };
  }, [payments]);

  // ==================== Filtered Payments ====================

  const filteredPayments = useMemo(() => {
    let filtered = payments;
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.statut === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        (p.membreNom || '').toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [payments, statusFilter, searchQuery]);

  // ==================== Proof Lightbox ====================

  const openProofDialog = (url: string) => {
    setProofImageUrl(url);
    setProofDialogOpen(true);
  };

  // ==================== File Handling ====================

  const handleFileSelect = (file: File | null) => {
    if (!file) {
      setProofFile(null);
      setProofPreview(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Fichier trop volumineux', description: 'La taille maximale est de 5 Mo.', variant: 'destructive' });
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Format invalide', description: 'Veuillez sélectionner une image.', variant: 'destructive' });
      return;
    }
    setProofFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setProofPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0] || null;
    handleFileSelect(file);
  }, []);

  // ==================== Create Payment ====================

  const handleCreatePayment = async () => {
    const formData = {
      montant: formMontant,
      mode: formMode,
      description: '',
      membreNom: formMembreNom.trim(),
    };
    const result = paymentSchema.safeParse(formData);
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      const firstError = Object.values(errors)[0];
      toast({ title: 'Validation', description: firstError, variant: 'destructive' });
      return;
    }

    setCreateLoading(true);
    try {
      let preuveURL = '';
      if (proofFile) {
        setUploading(true);
        const fileRef = ref(storageObj, STORAGE_FOLDERS.PAYMENT_PROOFS + Date.now() + '_' + proofFile.name);
        await new Promise<void>((resolve, reject) => {
          uploadBytesResumable(fileRef, proofFile)
            .on(
              'state_changed',
              (snapshot: any) => {
                const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                setUploadProgress(progress);
              },
              (error: any) => {
                console.error('Upload error:', error);
                setUploading(false);
                reject(error);
              },
              async () => {
                try {
                  preuveURL = await getDownloadURL(fileRef);
                  setUploading(false);
                  resolve();
                } catch (err) {
                  setUploading(false);
                  reject(err);
                }
              }
            );
        });
      }

      await addDoc(COLLECTIONS.PAYMENTS, {
        membreId: user?.id || '',
        membreNom: formMembreNom.trim(),
        montant: Number(formMontant),
        date: formDate || new Date().toISOString(),
        mode: formMode,
        preuveURL: preuveURL,
        statut: 'en_attente',
        commentaire: '',
        validePar: '',
        dateValidation: '',
        createdAt: new Date().toISOString(),
      });

      toast({ title: 'Paiement soumis', description: 'Le paiement a été enregistré avec succès.' });
      notifyPaymentReceived(formMembreNom.trim(), formatFCFA(Number(formMontant))).catch(() => {});
      setCreateOpen(false);
      resetForm();
      fetchPayments();
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({ title: 'Erreur', description: 'Impossible de soumettre le paiement.', variant: 'destructive' });
    } finally {
      setCreateLoading(false);
    }
  };

  const resetForm = () => {
    setFormMembreNom('');
    setFormMontant('');
    setFormMode('');
    setFormDate('');
    setProofFile(null);
    setProofPreview(null);
    setUploadProgress(0);
    setIsDragOver(false);
  };

  // ==================== Validate / Reject ====================

  const openActionDialog = (payment: Payment, type: 'valider' | 'rejeter') => {
    setActionPayment(payment);
    setActionType(type);
    setActionCommentaire('');
    setActionOpen(true);
  };

  const handleAction = async () => {
    if (!actionPayment) return;
    setActionLoading(true);
    try {
      await updateDoc(doc(COLLECTIONS.PAYMENTS, actionPayment.$id), {
        statut: actionType === 'valider' ? 'validé' : 'rejeté',
        validePar: user?.displayName || '',
        dateValidation: new Date().toISOString(),
        commentaire: actionCommentaire.trim(),
      });

      toast({
        title: actionType === 'valider' ? 'Paiement validé' : 'Paiement rejeté',
        description: `Le paiement de ${actionPayment.membreNom} a été ${actionType === 'valider' ? 'validé' : 'rejeté'}.`,
      });
      if (actionType === 'valider') {
        notifyAllMembers({
          title: 'Paiement confirmé',
          message: `Le paiement de ${actionPayment.membreNom} (${formatFCFA(actionPayment.montant || 0)}) a été confirmé.`,
          type: 'payment',
          link: '/payments',
        }).catch(() => {});
      }
      setActionOpen(false);
      fetchPayments();
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour le paiement.', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  // ==================== CSV Export ====================

  const handleExportCSV = useCallback(() => {
    const headers = ['Membre', 'Montant (FCFA)', 'Mode', 'Statut', 'Date', 'Description'];
    const rows = filteredPayments.map(p => [
      p.membreNom || '',
      (p.montant || 0).toLocaleString('fr-FR'),
      p.mode || '',
      p.statut || '',
      p.date ? toDate(p.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
      p.commentaire || '',
    ]);
    const csvContent = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""') }"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'paiements_codet.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: 'Liste des paiements exportée avec succès' });
  }, [filteredPayments, toast]);

  // ==================== Filter pill config ====================

  const filterPills = [
    { key: 'all', label: 'Tous', icon: Filter },
    { key: 'validé', label: 'Confirmé', icon: CheckCircle2 },
    { key: 'en_attente', label: 'En attente', icon: Clock },
    { key: 'rejeté', label: 'Rejeté', icon: XCircle },
  ];

  // ==================== Render ====================

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
            <CreditCard className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">Paiements</h2>
              <Badge variant="outline" className="font-normal">
                {payments.length} paiement{payments.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">
              Suivi des cotisations et paiements
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-sm"
            disabled={loading || filteredPayments.length === 0}
            onClick={handleExportCSV}
          >
            <Download className="h-4 w-4 mr-1.5" />
            Exporter CSV
          </Button>
          {canManage && (
            <Button onClick={() => setCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau paiement
            </Button>
          )}
        </div>
      </div>

      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total encaissé */}
        <Card className="border-l-4 border-l-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                <CreditCard className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total encaissé</p>
                <p className="text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400 mt-0.5">{formatFCFA(stats.validated)}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-12 h-1.5 bg-emerald-200 dark:bg-emerald-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: stats.pctConfirmed + '%' }} />
                  </div>
                  <span className="text-[11px] text-muted-foreground tabular-nums">{stats.pctConfirmed}% confirmé</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* En attente */}
        <Card className="border-l-4 border-l-amber-500 bg-amber-50/40 dark:bg-amber-950/20 hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">En attente</p>
                <p className="text-xl font-bold tabular-nums text-amber-700 dark:text-amber-400 mt-0.5">{formatFCFA(stats.pending)}</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {statusCounts['en_attente'] || 0} paiement{statusCounts['en_attente'] !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ce mois */}
        <Card className="border-l-4 border-l-sky-500 bg-sky-50/40 dark:bg-sky-950/20 hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5 text-sky-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ce mois</p>
                <p className="text-xl font-bold tabular-nums text-sky-700 dark:text-sky-400 mt-0.5">{formatFCFA(stats.thisMonth)}</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Badge variant="outline" className="h-10 shrink-0 flex items-center px-3 font-normal">
            {filteredPayments.length} résultat{filteredPayments.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Status Filter Pills */}
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-1">
            {filterPills.map((pill) => {
              const Icon = pill.icon;
              const isActive = statusFilter === pill.key;
              const count = pill.key === 'all' ? statusCounts.all : (statusCounts[pill.key] || 0);
              return (
                <Button
                  key={pill.key}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  className={"h-8 text-xs gap-1.5 shrink-0 " + (isActive ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : '')}
                  onClick={() => setStatusFilter(isActive ? 'all' : pill.key)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {pill.label}
                  <Badge variant="secondary" className="ml-0.5 h-5 min-w-[20px] flex items-center justify-center px-1.5 text-[10px]">
                    {count}
                  </Badge>
                </Button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="border-l-4 border-l-gray-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-5 w-24 rounded-full" />
                      </div>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-5 w-28" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filteredPayments.length === 0 && (
        <EmptyState
          icon={CreditCard}
          title="Aucun paiement"
          description={
            canManage
              ? 'Soumettez le premier paiement de cotisation.'
              : searchQuery || statusFilter !== 'all'
                ? 'Aucun résultat trouvé. Essayez de modifier vos filtres.'
                : 'Aucun paiement enregistré.'
          }
          action={
            canManage
              ? { label: 'Nouveau paiement', onClick: () => setCreateOpen(true) }
              : (searchQuery || statusFilter !== 'all')
                ? { label: 'Réinitialiser les filtres', onClick: () => { setSearchQuery(''); setStatusFilter('all'); }, variant: 'outline' as const }
                : undefined
          }
        />
      )}

      {/* Payment List */}
      {!loading && filteredPayments.length > 0 && (
        <div className="space-y-0 rounded-lg border overflow-hidden">
          {filteredPayments.map((payment, index) => {
            const progress = memberMonthlyProgress(payment.membreId, payment.membreNom);
            const isConfirmed = payment.statut === 'validé';
            const isEven = index % 2 === 0;
            return (
              <div
                key={payment.$id}
                className={
                  "flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 py-3 border-b last:border-b-0 " +
                  (isEven ? 'bg-background' : 'bg-muted/30') +
                  " hover:bg-accent/50 transition-colors"
                }
              >
                {/* Left: Avatar + Member info */}
                <div className="flex-1 min-w-0 flex items-start gap-3">
                  {/* Member avatar */}
                  <div
                    className={
                      "h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold text-white shadow-sm ring-2 ring-background " +
                      getHashColor(payment.membreNom || '')
                    }
                  >
                    {getInitials(payment.membreNom || '')}
                  </div>

                  {/* Member info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold truncate">{payment.membreNom}</span>
                      {getModeBadge(payment.mode)}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">{formatDate(payment.date || payment.createdAt)}</span>
                      {/* Monthly progress bar */}
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={"h-full rounded-full transition-all " + (progress.pct >= 100 ? 'bg-emerald-500' : 'bg-amber-400')}
                            style={{ width: progress.pct + '%' }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground tabular-nums">{progress.pct}%</span>
                      </div>
                    </div>
                    {payment.commentaire && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        {payment.commentaire}
                      </p>
                    )}
                  </div>
                </div>

                {/* Proof thumbnail */}
                <div className="shrink-0">
                  {payment.preuveURL ? (
                    <button
                      type="button"
                      onClick={() => openProofDialog(payment.preuveURL)}
                      className="h-12 w-12 rounded-lg overflow-hidden border border-border hover:border-emerald-500 hover:shadow-sm transition-all group"
                      aria-label="Voir la preuve de paiement"
                    >
                      <img
                        src={payment.preuveURL}
                        alt="Preuve"
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </button>
                  ) : (
                    <div className="h-12 w-12 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/20">
                      <Upload className="h-3.5 w-3.5 text-muted-foreground/40" />
                    </div>
                  )}
                </div>

                {/* Right: Amount + Status + Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right min-w-[100px]">
                    <p className={"font-bold tabular-nums text-sm " + (isConfirmed ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground')}>
                      {formatFCFA(payment.montant || 0)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(payment.statut)}
                    {canValidate && payment.statut === 'en_attente' && (
                      <React.Fragment>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => openActionDialog(payment, 'valider')}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Valider</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openActionDialog(payment, 'rejeter')}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Rejeter</span>
                        </Button>
                      </React.Fragment>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Proof Lightbox Dialog */}
      <Dialog open={proofDialogOpen} onOpenChange={setProofDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-emerald-600" />
              Preuve de paiement
            </DialogTitle>
            <DialogDescription>
              Aperçu de la preuve téléchargée. Cliquez sur le bouton ci-dessous pour ouvrir en plein écran.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center bg-muted/30 dark:bg-muted/10 rounded-xl border p-4 min-h-[240px]">
            <img
              src={proofImageUrl}
              alt="Preuve de paiement"
              className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-sm"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setProofDialogOpen(false)}>Fermer</Button>
            <Button variant="outline" onClick={() => window.open(proofImageUrl, '_blank')}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Payment Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { if (!open) { setCreateOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau paiement</DialogTitle>
            <DialogDescription>
              Enregistrez un paiement de cotisation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Section: Membre */}
            <div className="space-y-2.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Membre</Label>
              <Input
                placeholder="Nom complet du membre"
                value={formMembreNom}
                onChange={e => setFormMembreNom(e.target.value)}
                className="h-11"
              />
            </div>

            {/* Section: Montant */}
            <div className="space-y-2.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Montant</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0"
                    value={formMontant}
                    onChange={e => setFormMontant(e.target.value)}
                    className="pr-14 h-11 tabular-nums"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">FCFA</span>
                </div>
                <Input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            <Separator />

            {/* Section: Détails - Mode selector as visual cards */}
            <div className="space-y-2.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Détails</Label>
              <p className="text-xs text-muted-foreground">Sélectionnez le mode de paiement</p>
              <div className="grid grid-cols-2 gap-2.5">
                {MODE_OPTIONS.map((mode) => {
                  const Icon = mode.icon;
                  const isActive = formMode === mode.value;
                  return (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => setFormMode(isActive ? '' : mode.value)}
                      className={
                        "flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left text-sm transition-all duration-200 " +
                        (isActive
                          ? mode.color + " border-current shadow-sm scale-[1.02]"
                          : "border-border hover:border-muted-foreground/40 text-muted-foreground bg-background hover:bg-muted/30")
                      }
                    >
                      <div className={"h-8 w-8 rounded-lg flex items-center justify-center shrink-0 " + (isActive ? 'bg-current/10' : 'bg-muted')}>
                        <Icon className={"h-4 w-4 shrink-0 " + (isActive ? '' : 'text-muted-foreground')} />
                      </div>
                      <span className={"font-medium truncate " + (isActive ? '' : '')}>{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Section: Preuve de paiement */}
            <div className="space-y-2.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preuve de paiement</Label>
              <p className="text-xs text-muted-foreground">Ajoutez une capture d'écran ou une photo du reçu</p>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={
                  "relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 " +
                  (isDragOver
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 scale-[1.01]'
                    : proofPreview
                      ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/10'
                      : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/30')
                }
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={e => handleFileSelect(e.target.files?.[0] || null)}
                  className="hidden"
                  id="proof-upload"
                />
                {proofPreview ? (
                  <div className="space-y-3">
                    <div className="relative inline-block">
                      <img
                        src={proofPreview}
                        alt="Aperçu"
                        className="max-h-36 rounded-lg object-contain shadow-sm"
                      />
                      <div className="absolute -top-1.5 -right-1.5">
                        <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">{proofFile?.name}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive text-xs h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProofFile(null);
                        setProofPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      Supprimer
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className={"h-10 w-10 mx-auto rounded-full flex items-center justify-center " + (isDragOver ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-muted')}>
                      <Upload className={"h-5 w-5 " + (isDragOver ? 'text-emerald-500' : 'text-muted-foreground')} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      Glissez-déposez une image ou{' '}
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">parcourir</span>
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG — max 5 Mo</p>
                  </>
                )}
              </div>
              {uploading && uploadProgress > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Téléchargement en cours...</span>
                    <span className="text-xs font-medium tabular-nums">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm(); }}>
              Annuler
            </Button>
            <Button
              onClick={handleCreatePayment}
              disabled={createLoading || uploading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {createLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Soumettre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Validate / Reject Dialog */}
      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'valider' ? 'Valider le paiement' : 'Rejeter le paiement'}
            </DialogTitle>
            <DialogDescription>
              Paiement de <strong>{actionPayment?.membreNom}</strong> — <span className="font-mono tabular-nums">{actionPayment ? formatFCFA(actionPayment.montant || 0) : ''}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {actionPayment?.preuveURL && (
              <div className="space-y-2">
                <Label>Preuve de paiement</Label>
                <button
                  type="button"
                  onClick={() => {
                    setProofDialogOpen(true);
                    setProofImageUrl(actionPayment.preuveURL);
                  }}
                  className="flex items-center gap-2 text-sm text-emerald-600 hover:underline"
                >
                  <FileText className="h-4 w-4" />
                  Voir la preuve
                </button>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="action-comment">Commentaire (optionnel)</Label>
              <Textarea
                id="action-comment"
                placeholder={actionType === 'valider' ? 'Commentaire de validation...' : 'Raison du rejet...'}
                value={actionCommentaire}
                onChange={e => setActionCommentaire(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleAction}
              disabled={actionLoading}
              variant={actionType === 'valider' ? 'default' : 'destructive'}
              className={actionType === 'valider' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {actionType === 'valider' ? 'Valider' : 'Rejeter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
