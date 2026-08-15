'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { COLLECTIONS } from '@/lib/appwrite';
import {
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from '@/lib/db';
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  Minus,
  Trash2,
  Loader2,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronRight,
  Banknote,
  Users,
  Gift,
  FolderKanban,
  Calendar,
  MoreHorizontal,
  Package,
  Megaphone,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ==================== Types ====================

interface Transaction {
  $id: string;
  type: string;
  montant: number;
  categorie: string;
  description: string;
  date: string;
  projetId: string;
  projetNom: string;
  creePar: string;
  creeParNom: string;
  createdAt: string;
}

const TYPE_OPTIONS = [
  { value: 'revenu', label: 'Revenu' },
  { value: 'dépense', label: 'Dépense' },
];

const CATEGORY_OPTIONS = [
  { value: 'cotisations', label: 'Cotisations' },
  { value: 'dons', label: 'Dons' },
  { value: 'événements', label: 'Événements' },
  { value: 'projets', label: 'Projets' },
  { value: 'fonctionnement', label: 'Fonctionnement' },
  { value: 'salaires', label: 'Salaires' },
  { value: 'fournitures', label: 'Fournitures' },
  { value: 'communication', label: 'Communication' },
  { value: 'autre', label: 'Autre' },
];

// ==================== Helpers ====================

function formatMontant(amount: number) {
  if (!amount && amount !== 0) return '0 FCFA';
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
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

function getCategoryBadgeClass(categorie: string) {
  switch (categorie) {
    case 'cotisations': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-0';
    case 'dons': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300 border-0';
    case 'événements': return 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300 border-0';
    case 'projets': return 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border-0';
    case 'fonctionnement': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-0';
    case 'salaires': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-0';
    case 'fournitures': return 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border-0';
    case 'communication': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-0';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300 border-0';
  }
}

function getCategoryLabel(categorie: string) {
  const found = CATEGORY_OPTIONS.find((c) => c.value === categorie);
  return found ? found.label : categorie;
}

function getCategoryIcon(categorie: string): LucideIcon {
  switch (categorie) {
    case 'salaires': return Banknote;
    case 'cotisations': return Users;
    case 'dons': return Gift;
    case 'projets': return FolderKanban;
    case 'événements': return Calendar;
    case 'fournitures': return Package;
    case 'communication': return Megaphone;
    default: return MoreHorizontal;
  }
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getPreviousMonthKey(): string {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// ==================== Monthly Trends Chart Helpers ====================

const FRENCH_MONTHS_ABBR = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];

interface TrendDataPoint {
  month: string;
  revenus: number;
  depenses: number;
}

interface TrendTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

function TrendTooltip({ active, payload, label }: TrendTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-muted-foreground mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">
            {entry.dataKey === 'revenus' ? 'Revenus' : 'Dépenses'}:
          </span>
          <span className="font-semibold tabular-nums">
            {formatMontant(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function abbreviateFCFA(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(value);
}

// ==================== Component ====================

export default function BudgetPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const montantInputRef = useRef<HTMLInputElement>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortField, setSortField] = useState<'date' | 'montant'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Collapsed state for month groups
  const [collapsedMonths, setCollapsedMonths] = useState<Record<string, boolean>>({});

  // Form state
  const [formType, setFormType] = useState('revenu');
  const [formMontant, setFormMontant] = useState('');
  const [formCategorie, setFormCategorie] = useState('autre');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formProjetNom, setFormProjetNom] = useState('');

  const canManage = user && ['admin', 'président', 'secretaire', 'secretaire_general', 'trésorier'].includes(user.role);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getDocs(COLLECTIONS.BUDGET);
      setTransactions(result.documents as Transaction[]);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les transactions.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Monthly summary calculations
  const currentMonthKey = getCurrentMonthKey();
  const previousMonthKey = getPreviousMonthKey();

  const monthlyStats = useMemo(() => {
    const now = new Date();
    const cmYear = now.getFullYear();
    const cmMonth = now.getMonth();

    const currentMonthTx = transactions.filter((t) => {
      const d = new Date(t.date || t.createdAt);
      return d.getFullYear() === cmYear && d.getMonth() === cmMonth;
    });

    const prevDate = new Date(now);
    prevDate.setMonth(prevDate.getMonth() - 1);
    const pmYear = prevDate.getFullYear();
    const pmMonth = prevDate.getMonth();

    const prevMonthTx = transactions.filter((t) => {
      const d = new Date(t.date || t.createdAt);
      return d.getFullYear() === pmYear && d.getMonth() === pmMonth;
    });

    const cmRevenus = currentMonthTx.filter((t) => t.type === 'revenu').reduce((s, t) => s + (t.montant || 0), 0);
    const cmDepenses = currentMonthTx.filter((t) => t.type === 'dépense').reduce((s, t) => s + (t.montant || 0), 0);
    const cmSolde = cmRevenus - cmDepenses;

    const pmRevenus = prevMonthTx.filter((t) => t.type === 'revenu').reduce((s, t) => s + (t.montant || 0), 0);
    const pmDepenses = prevMonthTx.filter((t) => t.type === 'dépense').reduce((s, t) => s + (t.montant || 0), 0);

    return {
      currentMonth: { revenus: cmRevenus, depenses: cmDepenses, solde: cmSolde },
      prevMonth: { revenus: pmRevenus, depenses: pmDepenses },
      currentMonthLabel: now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
    };
  }, [transactions]);

  // Monthly trends data (last 6 months)
  const monthlyTrendsData = useMemo((): TrendDataPoint[] => {
    const now = new Date();
    const months: TrendDataPoint[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthTx = transactions.filter((t) => {
        const td = new Date(t.date || t.createdAt);
        return td.getFullYear() === year && td.getMonth() === month;
      });
      const revenus = monthTx.filter((t) => t.type === 'revenu').reduce((s, t) => s + (t.montant || 0), 0);
      const depenses = monthTx.filter((t) => t.type === 'dépense').reduce((s, t) => s + (t.montant || 0), 0);
      months.push({
        month: FRENCH_MONTHS_ABBR[month],
        revenus,
        depenses,
      });
    }

    return months;
  }, [transactions]);

  // Count how many months have actual data (at least one transaction)
  const monthsWithData = useMemo(() => {
    return monthlyTrendsData.filter((m) => m.revenus > 0 || m.depenses > 0).length;
  }, [monthlyTrendsData]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.forEach((t) => {
      counts[t.categorie] = (counts[t.categorie] || 0) + 1;
    });
    return counts;
  }, [transactions]);

  // Total summary (keep for reference)
  const totalRevenus = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'revenu')
      .reduce((sum, t) => sum + (t.montant || 0), 0);
  }, [transactions]);

  const totalDepenses = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'dépense')
      .reduce((sum, t) => sum + (t.montant || 0), 0);
  }, [transactions]);

  // Filter & sort
  const filteredTransactions = useMemo(() => {
    const filtered = transactions.filter((t) => {
      const matchSearch = !searchTerm ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.projetNom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.creeParNom?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = typeFilter === 'all' || t.type === typeFilter;
      const matchCategory = categoryFilter === 'all' || t.categorie === categoryFilter;
      return matchSearch && matchType && matchCategory;
    });

    filtered.sort((a, b) => {
      let aVal: number;
      let bVal: number;
      if (sortField === 'date') {
        aVal = new Date(a[sortField] || '').getTime() || 0;
        bVal = new Date(b[sortField] || '').getTime() || 0;
      } else {
        aVal = Number(a[sortField]) || 0;
        bVal = Number(b[sortField]) || 0;
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  }, [transactions, searchTerm, typeFilter, categoryFilter, sortField, sortDir]);

  // Group transactions by month
  const groupedByMonth = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach((t) => {
      const key = getMonthKey(t.date || t.createdAt);
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    // Sort month keys descending
    const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    return sortedKeys.map((key) => {
      const txs = groups[key];
      const monthRevenus = txs.filter((t) => t.type === 'revenu').reduce((s, t) => s + (t.montant || 0), 0);
      const monthDepenses = txs.filter((t) => t.type === 'dépense').reduce((s, t) => s + (t.montant || 0), 0);
      return { key, label: getMonthLabel(key), transactions: txs, subtotal: monthRevenus - monthDepenses };
    });
  }, [filteredTransactions]);

  // Reset form
  const resetForm = () => {
    setFormType('revenu');
    setFormMontant('');
    setFormCategorie('autre');
    setFormDescription('');
    setFormDate('');
    setFormProjetNom('');
  };

  // Open add dialog
  const openAddDialog = () => {
    resetForm();
    setAddDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDeleteDialogOpen(true);
  };

  // Toggle sort
  const toggleSort = (field: 'date' | 'montant') => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: 'date' | 'montant' }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3" />;
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  // Handle type change with auto-focus
  const handleFormTypeChange = (value: string) => {
    setFormType(value);
    setTimeout(() => montantInputRef.current?.focus(), 100);
  };

  // Toggle month collapse
  const toggleMonthCollapse = (monthKey: string) => {
    setCollapsedMonths((prev) => ({ ...prev, [monthKey]: !prev[monthKey] }));
  };

  // Add transaction
  const handleAdd = async () => {
    if (!formMontant || parseFloat(formMontant) <= 0) {
      toast({ title: 'Erreur', description: 'Le montant doit être supérieur à 0.', variant: 'destructive' });
      return;
    }
    if (!formDescription.trim()) {
      toast({ title: 'Erreur', description: 'La description est requise.', variant: 'destructive' });
      return;
    }
    try {
      setSaving(true);
      await addDoc(COLLECTIONS.BUDGET, {
        type: formType,
        montant: parseFloat(formMontant),
        categorie: formCategorie,
        description: formDescription.trim(),
        date: formDate || new Date().toISOString(),
        projetId: '',
        projetNom: formProjetNom.trim(),
        creePar: user?.id || '',
        creeParNom: user?.displayName || '',
        createdAt: new Date().toISOString(),
      });
      toast({ title: 'Succès', description: 'Transaction ajoutée avec succès.' });
      setAddDialogOpen(false);
      resetForm();
      fetchTransactions();
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      toast({ title: 'Erreur', description: 'Impossible d\'ajouter la transaction.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Delete transaction
  const handleDelete = async () => {
    if (!selectedTransaction) return;
    try {
      setDeleting(true);
      await deleteDoc(doc(COLLECTIONS.BUDGET, selectedTransaction.$id));
      toast({ title: 'Succès', description: 'Transaction supprimée.' });
      setDeleteDialogOpen(false);
      setSelectedTransaction(null);
      fetchTransactions();
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      toast({ title: 'Erreur', description: 'Impossible de supprimer la transaction.', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
            <Wallet className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">Budget</h2>
              {!loading && transactions.length > 0 && (
                <Badge variant="secondary" className="text-xs font-normal">
                  {transactions.length} transaction{transactions.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Suivi financier et budget du CODET
            </p>
          </div>
        </div>
        {canManage && (
          <Button onClick={openAddDialog} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une transaction
          </Button>
        )}
      </div>

      {/* Monthly Summary Cards + Trends Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Summary cards stacked */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
          {/* Revenus du mois */}
          <Card className="hover:shadow-md transition-shadow duration-200 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-900/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Revenus du mois</p>
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums tracking-tight">
                      {formatMontant(monthlyStats.currentMonth.revenus)}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-0 shrink-0">
                  +5%
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 capitalize">{monthlyStats.currentMonthLabel}</p>
            </CardContent>
          </Card>

          {/* Dépenses du mois */}
          <Card className="hover:shadow-md transition-shadow duration-200 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 border-rose-200 dark:border-rose-900/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center shrink-0">
                    <TrendingDown className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Dépenses du mois</p>
                    <p className="text-2xl font-bold text-rose-700 dark:text-rose-400 tabular-nums tracking-tight">
                      {formatMontant(monthlyStats.currentMonth.depenses)}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 border-0 shrink-0">
                  -3%
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 capitalize">{monthlyStats.currentMonthLabel}</p>
            </CardContent>
          </Card>

          {/* Solde */}
          <Card className={`hover:shadow-md transition-shadow duration-200 bg-gradient-to-br ${
                monthlyStats.currentMonth.solde >= 0
                  ? 'from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-amber-200 dark:border-amber-900/50'
                  : 'from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-red-200 dark:border-red-900/50'
              }`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full ${
                    monthlyStats.currentMonth.solde >= 0
                      ? 'bg-amber-100 dark:bg-amber-900/40'
                      : 'bg-red-100 dark:bg-red-900/40'
                  } flex items-center justify-center shrink-0`}>
                    <Wallet className={`h-5 w-5 ${
                      monthlyStats.currentMonth.solde >= 0
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-red-600 dark:text-red-400'
                    }`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Solde</p>
                    <p className={`text-2xl font-bold tabular-nums tracking-tight ${
                      monthlyStats.currentMonth.solde >= 0
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-red-700 dark:text-red-400'
                    }`}>
                      {formatMontant(monthlyStats.currentMonth.solde)}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className={`text-xs font-medium shrink-0 border-0 ${
                  monthlyStats.currentMonth.solde >= 0
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                }`}>
                  {monthlyStats.currentMonth.solde >= 0 ? '▲' : '▼'}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 capitalize">{monthlyStats.currentMonthLabel}</p>
            </CardContent>
          </Card>
        </div>

        {/* Right: Monthly Trends Chart */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-base">Tendances mensuelles</CardTitle>
                <CardDescription className="text-xs">Revenus vs dépenses sur 6 mois</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <Skeleton className="h-[220px] w-full rounded-lg" />
            ) : monthsWithData < 2 ? (
              <div className="flex flex-col items-center justify-center h-[220px] text-center">
                <TrendingUp className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Pas assez de données</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Les tendances apparaîtront avec au moins 2 mois de transactions</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyTrendsData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradientRevenus" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradientDepenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={abbreviateFCFA}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    width={45}
                  />
                  <Tooltip content={<TrendTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenus"
                    stroke="#059669"
                    strokeWidth={2}
                    fill="url(#gradientRevenus)"
                    name="Revenus"
                  />
                  <Area
                    type="monotone"
                    dataKey="depenses"
                    stroke="#e11d48"
                    strokeWidth={2}
                    fill="url(#gradientDepenses)"
                    name="Dépenses"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filter bar */}
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une transaction..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category filter pills with icons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={categoryFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setCategoryFilter('all')}
              >
                <Filter className="h-3.5 w-3.5" />
                Toutes
              </Button>
              {CATEGORY_OPTIONS.map((cat) => {
                const Icon = getCategoryIcon(cat.value);
                const count = categoryCounts[cat.value] || 0;
                return (
                  <Button
                    key={cat.value}
                    variant={categoryFilter === cat.value ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => setCategoryFilter(categoryFilter === cat.value ? 'all' : cat.value)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {cat.label}
                    {count > 0 && (
                      <Badge variant="secondary" className="ml-0.5 h-5 min-w-[20px] flex items-center justify-center px-1.5 text-[10px]">
                        {count}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>

            {filteredTransactions.length < transactions.length && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Filter className="h-3 w-3" />
                <span>{filteredTransactions.length} résultat(s) sur {transactions.length}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transaction list grouped by month */}
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Transactions</CardTitle>
              <CardDescription>{filteredTransactions.length} transaction(s)</CardDescription>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="hidden sm:inline">Trier :</span>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toggleSort('date')}>
                Date <SortIcon field="date" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toggleSort('montant')}>
                Montant <SortIcon field="montant" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-0 divide-y">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-4">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 flex-1 max-w-xs" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-28 rounded" />
                </div>
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title={transactions.length === 0 ? 'Aucune transaction' : 'Aucun résultat'}
              description={
                transactions.length === 0
                  ? 'Aucune transaction enregistrée. Commencez par ajouter votre première transaction.'
                  : 'Aucune transaction ne correspond à vos filtres.'
              }
              action={
                transactions.length === 0 && canManage
                  ? { label: 'Ajouter une transaction', onClick: openAddDialog }
                  : transactions.length > 0
                    ? { label: 'Réinitialiser les filtres', onClick: () => { setSearchTerm(''); setTypeFilter('all'); setCategoryFilter('all'); }, variant: 'outline' }
                    : undefined
              }
            />
          ) : (
            <div className="space-y-3">
              {groupedByMonth.map((group) => {
                const isCollapsed = collapsedMonths[group.key] ?? false;
                return (
                  <Collapsible
                    key={group.key}
                    open={!isCollapsed}
                    onOpenChange={(open) => {
                      if (!open) setCollapsedMonths((prev) => ({ ...prev, [group.key]: true }));
                      else setCollapsedMonths((prev) => ({ ...prev, [group.key]: false }));
                    }}
                  >
                    {/* Month header */}
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group/month">
                        <div className="flex items-center gap-2.5">
                          {isCollapsed ? (
                            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
                          )}
                          <span className="text-sm font-semibold capitalize">{group.label}</span>
                          <Badge variant="secondary" className="text-[10px] font-normal">
                            {group.transactions.length}
                          </Badge>
                        </div>
                        <span className={`text-sm font-semibold tabular-nums ${
                          group.subtotal >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {group.subtotal >= 0 ? '+' : ''}{formatMontant(group.subtotal)}
                        </span>
                      </button>
                    </CollapsibleTrigger>

                    {/* Month transactions */}
                    <CollapsibleContent>
                      <div className="mt-2 rounded-lg border divide-y overflow-hidden">
                        {group.transactions.map((transaction, idx) => {
                          const isIncome = transaction.type === 'revenu';
                          const CatIcon = getCategoryIcon(transaction.categorie);
                          const isEven = idx % 2 === 0;
                          return (
                            <div
                              key={transaction.$id}
                              className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-3 px-4 group/tr hover:bg-accent/50 transition-colors border-l-4 ${
                                isIncome
                                  ? 'border-l-emerald-500'
                                  : 'border-l-rose-500'
                              } ${
                                isEven ? 'bg-background' : 'bg-muted/20'
                              }`}
                            >
                              {/* Category icon + type indicator */}
                              <div className="flex items-center gap-2.5 shrink-0">
                                <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center ${
                                  isIncome
                                    ? 'bg-emerald-100 dark:bg-emerald-900/40'
                                    : 'bg-rose-100 dark:bg-rose-900/40'
                                }`}>
                                  {isIncome ? (
                                    <Plus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                  ) : (
                                    <Minus className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                                  )}
                                </div>
                                <div className={`h-7 w-7 rounded-md shrink-0 flex items-center justify-center ${
                                  isIncome
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20'
                                    : 'bg-rose-50 dark:bg-rose-900/20'
                                }`}>
                                  <CatIcon className={`h-3.5 w-3.5 ${
                                    isIncome
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-rose-600 dark:text-rose-400'
                                  }`} />
                                </div>
                              </div>

                              {/* Description + badges */}
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-medium truncate">{transaction.description || '—'}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge className={getCategoryBadgeClass(transaction.categorie)}>
                                    {getCategoryLabel(transaction.categorie)}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">{formatDate(transaction.date || transaction.createdAt)}</span>
                                  {transaction.projetNom && (
                                    <span className="text-xs text-muted-foreground">· {transaction.projetNom}</span>
                                  )}
                                </div>
                              </div>

                              {/* Montant */}
                              <div className="shrink-0 text-right">
                                <span className={`text-sm font-semibold tabular-nums ${
                                  isIncome
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : 'text-rose-700 dark:text-rose-400'
                                }`}>
                                  {isIncome ? '+' : '-'}{formatMontant(transaction.montant)}
                                </span>
                              </div>

                              {/* Delete button */}
                              {canManage && (
                                <div className="shrink-0 opacity-0 group-hover/tr:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:text-red-600"
                                    onClick={() => openDeleteDialog(transaction)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Transaction Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter une transaction</DialogTitle>
            <DialogDescription>
              Enregistrez un revenu ou une dépense.
            </DialogDescription>
          </DialogHeader>

          {/* Type visual indicator */}
          <div className={`flex items-center gap-3 rounded-lg px-4 py-3 ${
            formType === 'revenu'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50'
              : 'bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50'
          }`}>
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
              formType === 'revenu'
                ? 'bg-emerald-100 dark:bg-emerald-900/40'
                : 'bg-rose-100 dark:bg-rose-900/40'
            }`}>
              {formType === 'revenu' ? (
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <TrendingDown className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              )}
            </div>
            <div>
              <p className={`text-sm font-semibold ${
                formType === 'revenu'
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-rose-700 dark:text-rose-400'
              }`}>
                {formType === 'revenu' ? '→ Revenu (entrée d\'argent)' : '→ Dépense (sortie d\'argent)'}
              </p>
              <p className="text-xs text-muted-foreground">Le type détermine la couleur de la transaction</p>
            </div>
          </div>

          <div className="grid gap-0 py-2">
            {/* Section: Type & Montant */}
            <div className="pb-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Type & Montant</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="budget-type">Type *</Label>
                  <Select value={formType} onValueChange={handleFormTypeChange}>
                    <SelectTrigger id="budget-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="budget-montant">Montant (FCFA) *</Label>
                  <Input
                    id="budget-montant"
                    ref={montantInputRef}
                    type="number"
                    value={formMontant}
                    onChange={(e) => setFormMontant(e.target.value)}
                    placeholder="0"
                    min={0}
                  />
                </div>
              </div>
            </div>

            <Separator className="my-3" />

            {/* Section: Catégorie */}
            <div className="pb-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Catégorie</p>
              <div className="grid gap-2">
                <Label htmlFor="budget-categorie">Catégorie *</Label>
                <Select value={formCategorie} onValueChange={setFormCategorie}>
                  <SelectTrigger id="budget-categorie">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator className="my-3" />

            {/* Section: Détails */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Détails</p>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="budget-description">Description *</Label>
                  <Textarea
                    id="budget-description"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Description de la transaction"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="budget-date">Date</Label>
                    <Input
                      id="budget-date"
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="budget-projet">Projet (optionnel)</Label>
                    <Input
                      id="budget-projet"
                      value={formProjetNom}
                      onChange={(e) => setFormProjetNom(e.target.value)}
                      placeholder="Nom du projet"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette transaction de {formatMontant(selectedTransaction?.montant || 0)} ? Cette action est irréversible.
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
