'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { COLLECTIONS } from '@/lib/appwrite';
import {
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  toDate,
} from '@/lib/db';
import { memberSchema, formatZodErrors } from '@/lib/validations';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import MemberProfileDialog from '@/components/MemberProfileDialog';
import EmptyState from '@/components/EmptyState';
import { Progress } from '@/components/ui/progress';
import { notifyNewMember } from '@/lib/notification-triggers';
import {
  Search,
  Pencil,
  Trash2,
  Users,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Phone,
  Mail,
  Briefcase,
  Download,
  Upload,
  LayoutList,
  LayoutGrid,
  UserPlus,
  FileDown,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

// ==================== Types ====================

interface Member {
  $id: string;
  email?: string;
  displayName: string;
  gender?: string;
  phoneNumber?: string;
  role: string;
  profession?: string;
  photoURL?: string;
  createdAt: string;
}

type SortField = 'displayName' | 'createdAt';
type SortDir = 'asc' | 'desc';
type ViewMode = 'table' | 'grid';

const ALL_ROLES: UserRole[] = [
  'admin',
  'président',
  'secretaire',
  'secretaire_general',
  'trésorier',
  'commissaire',
  'celcom',
  'responsable_communication',
  'membre',
  'visiteur',
];

const MANAGE_ROLES = ['admin', 'président', 'secretaire', 'secretaire_general', 'trésorier', 'commissaire'];

// ==================== Helpers ====================

function formatDate(dateStr: string): string {
  try {
    const d = toDate(dateStr);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
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

function getRoleBadgeClass(role: string): string {
  const r = role.toLowerCase();
  if (r === 'admin') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-0';
  if (r === 'président') return 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border-0';
  if (r === 'secretaire' || r === 'secretaire_general') return 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300 border-0';
  if (r === 'trésorier') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-0';
  if (r === 'commissaire') return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-0';
  if (r === 'celcom' || r === 'responsable_communication') return 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300 border-0';
  return 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300 border-0';
}

// ==================== CSV Helpers ====================

const CSV_EXPECTED_COLUMNS = ['displayName', 'email', 'phoneNumber', 'gender', 'role', 'profession', 'ville', 'pays'];
const CSV_REQUIRED_COLUMNS = ['displayName', 'email', 'role'];

interface CsvParsedRow {
  data: Record<string, string>;
  errors: string[];
  isValid: boolean;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsvFile(text: string): { headers: string[]; rows: string[][] } {
  // Strip BOM
  let cleaned = text.replace(/^\uFEFF/, '');
  // Split by newlines (handle \r\n, \r, \n)
  const lines = cleaned.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map(parseCsvLine);
  return { headers, rows };
}

function validateCsvRow(
  headers: string[],
  values: string[]
): CsvParsedRow {
  const data: Record<string, string> = {};
  headers.forEach((h, i) => {
    data[h] = values[i] || '';
  });
  const errors: string[] = [];
  for (const req of CSV_REQUIRED_COLUMNS) {
    if (!data[req] || !data[req].trim()) {
      errors.push(req);
    }
  }
  return { data, errors, isValid: errors.length === 0 };
}

function downloadCsvTemplate() {
  const headers = CSV_EXPECTED_COLUMNS.join(',');
  const blob = new Blob(['\uFEFF' + headers + '\n'], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'modele_import_membres.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ==================== Main Component ====================

export default function MembersPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const canManageMembers = user && MANAGE_ROLES.includes(user.role);

  // State
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('displayName');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('codet-members-view');
      if (saved === 'grid' || saved === 'table') return saved;
    }
    return 'table';
  });

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editForm, setEditForm] = useState({
    displayName: '',
    phoneNumber: '',
    profession: '',
    role: '',
  });
  const [editLoading, setEditLoading] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Profile quick-view dialog state
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  // CSV import dialog state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [csvPreview, setCsvPreview] = useState<CsvParsedRow[] | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvTotalRows, setCsvTotalRows] = useState(0);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // ==================== View Mode Persistence ====================

  useEffect(() => {
    localStorage.setItem('codet-members-view', viewMode);
  }, [viewMode]);

  // ==================== Role Counts & Stats ====================

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    members.forEach((m) => {
      const r = m.role || 'membre';
      counts[r] = (counts[r] || 0) + 1;
    });
    return counts;
  }, [members]);

  const newThisMonth = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return members.filter((m) => {
      try {
        return new Date(m.createdAt).getTime() >= monthStart;
      } catch {
        return false;
      }
    }).length;
  }, [members]);

  // ==================== Fetch Members ====================

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getDocs(COLLECTIONS.USERS);
      const docs = result.documents as unknown as Member[];
      setMembers(docs);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger la liste des membres.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // ==================== Filtered & Sorted Members ====================

  const filteredMembers = useMemo(() => {
    let list = [...members];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (m) =>
          (m.displayName || '').toLowerCase().includes(q) ||
          (m.email || '').toLowerCase().includes(q) ||
          (m.role || '').toLowerCase().includes(q)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      list = list.filter((m) => m.role === roleFilter);
    }

    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'displayName') {
        cmp = (a.displayName || '').localeCompare(b.displayName || '', 'fr');
      } else {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        cmp = dateA - dateB;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [members, searchQuery, roleFilter, sortField, sortDir]);

  // ==================== Sort Toggle ====================

  function handleSortToggle(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 ml-1 opacity-40" />;
    }
    return sortDir === 'asc'
      ? <ArrowUp className="h-3.5 w-3.5 ml-1" />
      : <ArrowDown className="h-3.5 w-3.5 ml-1" />;
  }

  // ==================== Edit Member ====================

  function openEditDialog(member: Member) {
    setEditingMember(member);
    setEditForm({
      displayName: member.displayName || '',
      phoneNumber: member.phoneNumber || '',
      profession: member.profession || '',
      role: member.role || 'membre',
    });
    setEditDialogOpen(true);
  }

  async function handleSaveEdit() {
    if (!editingMember) return;

    const result = memberSchema.safeParse(editForm);
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      const firstError = Object.values(errors)[0];
      toast({ title: 'Validation', description: firstError, variant: 'destructive' });
      return;
    }

    setEditLoading(true);
    try {
      await updateDoc(doc(COLLECTIONS.USERS, editingMember.$id), {
        displayName: editForm.displayName.trim(),
        phoneNumber: editForm.phoneNumber.trim(),
        profession: editForm.profession.trim(),
        role: editForm.role,
      });

      toast({
        title: 'Membre mis à jour',
        description: `Les informations de ${editForm.displayName} ont été mises à jour.`,
      });
      setEditDialogOpen(false);
      setEditingMember(null);
      await fetchMembers();
    } catch (error) {
      console.error('Error updating member:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le membre.',
        variant: 'destructive',
      });
    } finally {
      setEditLoading(false);
    }
  }

  // ==================== Delete Member ====================

  function openDeleteDialog(member: Member) {
    setDeletingMember(member);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteMember() {
    if (!deletingMember) return;

    // Prevent self-deletion
    if (deletingMember.$id === user?.id) {
      toast({
        title: 'Action non autorisée',
        description: 'Vous ne pouvez pas supprimer votre propre compte.',
        variant: 'destructive',
      });
      return;
    }

    setDeleteLoading(true);
    try {
      await deleteDoc(doc(COLLECTIONS.USERS, deletingMember.$id));

      toast({
        title: 'Membre supprimé',
        description: `${deletingMember.displayName} a été supprimé.`,
      });
      setDeleteDialogOpen(false);
      setDeletingMember(null);
      await fetchMembers();
    } catch (error) {
      console.error('Error deleting member:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le membre.',
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(false);
    }
  }

  // ==================== CSV Export ====================

  const handleExportCSV = useCallback(() => {
    const headers = ['Nom', 'Email', 'Téléphone', 'Genre', 'Rôle', 'Ville', 'Pays', 'Profession', 'Sous-comité'];
    const rows = filteredMembers.map(m => [
      m.displayName || '',
      m.email || '',
      m.phoneNumber || '',
      m.gender || '',
      m.role || '',
      '',
      '',
      m.profession || '',
      '',
    ]);
    const csvContent = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""') }"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'membres_codet.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: 'Liste des membres exportée avec succès' });
  }, [filteredMembers, toast]);

  // ==================== CSV Import ====================

  const handleCsvFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if (!text) return;

        const { headers, rows } = parseCsvFile(text);

        if (headers.length === 0 || rows.length === 0) {
          toast({
            title: 'Fichier invalide',
            description: 'Le fichier CSV est vide ou mal formaté.',
            variant: 'destructive',
          });
          return;
        }

        const validatedRows = rows.map((r) => validateCsvRow(headers, r));
        setCsvHeaders(headers);
        setCsvTotalRows(rows.length);
        setCsvPreview(validatedRows);
        setImportDialogOpen(true);
      };
      reader.readAsText(file, 'utf-8');

      // Reset input so re-selecting same file works
      e.target.value = '';
    },
    [toast]
  );

  const handleImportMembers = useCallback(async () => {
    if (!csvPreview) return;
    const validRows = csvPreview.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    setImporting(true);
    setImportProgress({ current: 0, total: validRows.length });
    let imported = 0;
    let failed = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        await addDoc(COLLECTIONS.USERS, {
          displayName: row.data.displayName?.trim() || '',
          email: row.data.email?.trim() || '',
          phoneNumber: row.data.phoneNumber?.trim() || '',
          gender: row.data.gender?.trim() || '',
          role: row.data.role?.trim() || 'membre',
          profession: row.data.profession?.trim() || '',
          ville: row.data.ville?.trim() || '',
          pays: row.data.pays?.trim() || '',
          accountId: '',
          photoURL: '',
          createdAt: new Date().toISOString(),
        });
        imported++;
        notifyNewMember(row.data.displayName?.trim() || '').catch(() => {});
      } catch (err) {
        console.error(`Erreur import ligne ${i + 1}:`, err);
        failed++;
      }
      setImportProgress({ current: i + 1, total: validRows.length });
    }

    setImporting(false);
    setImportDialogOpen(false);
    setCsvPreview(null);
    setCsvHeaders([]);
    setCsvTotalRows(0);

    toast({
      title: 'Import terminé',
      description: `${imported} membre${imported !== 1 ? 's' : ''} importé${imported !== 1 ? 's' : ''}${failed > 0 ? `, ${failed} erreur${failed !== 1 ? 's' : ''}` : ''}.`,
      variant: failed > 0 ? 'destructive' : 'default',
    });

    await fetchMembers();
  }, [csvPreview, toast, fetchMembers]);

  const csvValidCount = csvPreview?.filter((r) => r.isValid).length ?? 0;
  const csvErrorCount = csvTotalRows - csvValidCount;
  const csvPreviewRows = csvPreview?.slice(0, 5) ?? [];

  // ==================== Render ====================

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">Annuaire des membres</h2>
              {!loading && (
                <Badge variant="secondary" className="text-xs font-normal">
                  {filteredMembers.length}{roleFilter !== 'all' || searchQuery ? ` / ${members.length}` : ''}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Répertoire et gestion des membres du CODET
            </p>
          </div>
        </div>
      </div>

      {/* Role Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
        <button
          type="button"
          onClick={() => setRoleFilter('all')}
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ${
            roleFilter === 'all'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
          }`}
        >
          Tous
          <span className={`text-xs ${roleFilter === 'all' ? 'text-emerald-100' : 'text-muted-foreground/70'}`}>
            ({members.length})
          </span>
        </button>
        {ALL_ROLES.map((role) => {
          const count = roleCounts[role] || 0;
          if (count === 0 && roleFilter !== role) return null;
          return (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ${
                roleFilter === role
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              {role.replace(/_/g, ' ')}
              <span className={`text-xs ${roleFilter === role ? 'text-emerald-100' : 'text-muted-foreground/70'}`}>
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Filter Bar */}
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email ou rôle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
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
                    <ToggleGroupItem value="grid" aria-label="Vue grille">
                      <LayoutGrid className="h-4 w-4" />
                    </ToggleGroupItem>
                  </ToggleGroup>
                </TooltipTrigger>
                <TooltipContent>
                  {viewMode === 'table' ? 'Vue tableau' : 'Vue grille'}
                </TooltipContent>
              </Tooltip>
              <Button
                variant="outline"
                size="sm"
                className="text-sm"
                disabled={loading || filteredMembers.length === 0}
                onClick={handleExportCSV}
              >
                <Download className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Exporter CSV</span>
                <span className="sm:hidden">CSV</span>
              </Button>
              {canManageMembers && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-1.5" />
                      <span className="hidden sm:inline">Importer CSV</span>
                      <span className="sm:hidden">CSV</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Importer des membres depuis un fichier CSV</TooltipContent>
                </Tooltip>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleCsvFileSelect}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Member Stats Bar */}
      {!loading && members.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground px-1">
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{members.length}</span> membre{members.length !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1.5">
            <UserPlus className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{newThisMonth}</span> ce mois
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {Object.entries(roleCounts)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([role, count]) => (
                <Badge
                  key={role}
                  variant="secondary"
                  className={`text-xs font-normal ${getRoleBadgeClass(role)}`}
                >
                  {role.replace(/_/g, ' ')}
                  <span className="ml-1 opacity-60">{count}</span>
                </Badge>
              ))}
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        viewMode === 'grid' ? (
          /* Grid skeleton */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="p-5">
                <div className="flex flex-col items-center gap-3">
                  <Skeleton className="h-14 w-14 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <div className="w-full space-y-2 mt-1">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
            {/* Desktop skeleton table */}
            <div className="hidden md:block">
              <div className="flex items-center gap-4 px-4 py-3 border-b bg-muted/30">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`flex items-center gap-4 px-4 py-3 ${i % 2 === 1 ? 'bg-muted/20' : ''}`}>
                  <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
            {/* Mobile skeleton cards */}
            <div className="md:hidden space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                    <div className="flex gap-2">
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )
      ) : filteredMembers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun membre trouvé"
          description={
            searchQuery || roleFilter !== 'all'
              ? 'Essayez de modifier vos critères de recherche.'
              : "Aucun membre n'a encore été inscrit."
          }
          action={
            (searchQuery || roleFilter !== 'all')
              ? { label: 'Réinitialiser les filtres', onClick: () => { setSearchQuery(''); setRoleFilter('all'); }, variant: 'outline' }
              : undefined
          }
        />
      ) : (
        <>
          {/* ========== Grid View (Desktop) ========== */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredMembers.map((member) => (
                <Card
                  key={member.$id}
                  className="group relative p-5 hover:shadow-lg hover:-translate-y-0.5 hover:ring-2 hover:ring-emerald-500/30 transition-all duration-200 cursor-pointer"
                  onClick={() => setProfileUserId(member.$id)}
                >
                  {/* Admin actions top-right */}
                  {canManageMembers && (
                    <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => { e.stopPropagation(); openEditDialog(member); }}
                        title="Modifier"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
                        onClick={(e) => { e.stopPropagation(); openDeleteDialog(member); }}
                        title="Supprimer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {/* Avatar */}
                  <div className="flex flex-col items-center gap-3">
                    <div
                      className={`h-14 w-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0 text-white ring-2 ring-background shadow-sm ${getHashColor(member.displayName || '')}`}
                    >
                      {(member.displayName || '?').charAt(0).toUpperCase()}
                    </div>

                    {/* Name */}
                    <div className="text-center">
                      <p className="font-semibold text-sm leading-tight truncate max-w-full">
                        {member.displayName}
                      </p>
                    </div>

                    {/* Role Badge */}
                    <Badge
                      className={`capitalize text-xs ${getRoleBadgeClass(member.role)}`}
                    >
                      {(member.role || 'membre').replace(/_/g, ' ')}
                    </Badge>

                    {/* Info items */}
                    <div className="w-full space-y-1.5 mt-1">
                      {member.profession && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                          <Briefcase className="h-3 w-3 shrink-0" />
                          {member.profession}
                        </p>
                      )}
                      {member.phoneNumber && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Phone className="h-3 w-3 shrink-0" />
                          {member.phoneNumber}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* ========== Table View (Desktop) ========== */}
          {viewMode === 'table' && (
            <Card className="hidden md:block overflow-hidden hover:shadow-md transition-shadow duration-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-12">Avatar</TableHead>
                    <TableHead>
                      <button
                        type="button"
                        onClick={() => handleSortToggle('displayName')}
                        className="flex items-center font-medium hover:text-foreground transition-colors"
                      >
                        Nom
                        <SortIcon field="displayName" />
                      </button>
                    </TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>
                      <button
                        type="button"
                        onClick={() => handleSortToggle('createdAt')}
                        className="flex items-center font-medium hover:text-foreground transition-colors"
                      >
                        Inscription
                        <SortIcon field="createdAt" />
                      </button>
                    </TableHead>
                    {canManageMembers && <TableHead className="w-24 text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member, idx) => (
                    <TableRow
                      key={member.$id}
                      className={`${idx % 2 === 1 ? 'bg-muted/20' : ''} hover:bg-accent/50 transition-colors`}
                    >
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => setProfileUserId(member.$id)}
                          className="cursor-pointer hover:ring-2 hover:ring-emerald-500/40 rounded-full transition-all duration-200"
                        >
                          <div
                            className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white ${getHashColor(member.displayName || '')}`}
                          >
                            {(member.displayName || '?').charAt(0).toUpperCase()}
                          </div>
                        </button>
                      </TableCell>
                      <TableCell>
                        <div>
                          <button
                            type="button"
                            onClick={() => setProfileUserId(member.$id)}
                            className="cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors hover:underline underline-offset-2 decoration-emerald-500/40"
                          >
                            <p className="font-medium text-left">{member.displayName}</p>
                          </button>
                          {member.profession && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Briefcase className="h-3 w-3" />
                              {member.profession}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {member.email ? (
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3 shrink-0" />
                            {member.email}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {member.phoneNumber ? (
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3 shrink-0" />
                            {member.phoneNumber}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`capitalize text-xs ${getRoleBadgeClass(member.role)}`}
                        >
                          {(member.role || 'membre').replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(member.createdAt)}
                        </span>
                      </TableCell>
                      {canManageMembers && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(member)}
                              title="Modifier"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
                              onClick={() => openDeleteDialog(member)}
                              title="Supprimer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* ========== Mobile Card View (always on small screens) ========== */}
          <div className="md:hidden space-y-3">
            {filteredMembers.map((member) => (
              <Card key={member.$id} className="p-4 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setProfileUserId(member.$id)}
                    className="cursor-pointer hover:ring-2 hover:ring-emerald-500/40 rounded-full transition-all duration-200 shrink-0"
                  >
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 text-white ${getHashColor(member.displayName || '')}`}
                    >
                      {(member.displayName || '?').charAt(0).toUpperCase()}
                    </div>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => setProfileUserId(member.$id)}
                          className="cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        >
                          <p className="font-medium truncate text-left">{member.displayName}</p>
                        </button>
                        {member.profession && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Briefcase className="h-3 w-3" />
                            {member.profession}
                          </p>
                        )}
                      </div>
                      <Badge
                        className={`capitalize text-xs shrink-0 ${getRoleBadgeClass(member.role)}`}
                      >
                        {(member.role || 'membre').replace(/_/g, ' ')}
                      </Badge>
                    </div>

                    <div className="mt-2 space-y-1">
                      {member.email && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                          <Mail className="h-3 w-3 shrink-0" />
                          {member.email}
                        </p>
                      )}
                      {member.phoneNumber && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Phone className="h-3 w-3 shrink-0" />
                          {member.phoneNumber}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Inscrit le {formatDate(member.createdAt)}
                      </p>
                    </div>

                    {canManageMembers && (
                      <>
                        <Separator className="my-3" />
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs h-8"
                            onClick={() => openEditDialog(member)}
                          >
                            <Pencil className="h-3 w-3 mr-1.5" />
                            Modifier
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs h-8 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:hover:bg-red-950/50"
                            onClick={() => openDeleteDialog(member)}
                          >
                            <Trash2 className="h-3 w-3 mr-1.5" />
                            Supprimer
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* ==================== Edit Dialog ==================== */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le membre</DialogTitle>
            <DialogDescription>
              Modifiez les informations de {editingMember?.displayName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-displayName">Nom complet</Label>
              <Input
                id="edit-displayName"
                value={editForm.displayName}
                onChange={(e) => setEditForm((f) => ({ ...f, displayName: e.target.value }))}
                placeholder="Nom complet"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role">Rôle</Label>
              <Select
                value={editForm.role}
                onValueChange={(v) => setEditForm((f) => ({ ...f, role: v }))}
              >
                <SelectTrigger className="w-full" id="edit-role">
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Téléphone</Label>
              <Input
                id="edit-phone"
                value={editForm.phoneNumber}
                onChange={(e) => setEditForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                placeholder="Numéro de téléphone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-profession">Profession</Label>
              <Input
                id="edit-profession"
                value={editForm.profession}
                onChange={(e) => setEditForm((f) => ({ ...f, profession: e.target.value }))}
                placeholder="Profession"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={editLoading}
            >
              Annuler
            </Button>
            <Button onClick={handleSaveEdit} disabled={editLoading}>
              {editLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== Delete Confirmation Dialog ==================== */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce membre ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le compte de{' '}
              <span className="font-semibold">{deletingMember?.displayName}</span>{' '}
              sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMember}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ==================== CSV Import Preview Dialog ==================== */}
      <Dialog open={importDialogOpen} onOpenChange={(open) => { if (!open && !importing) { setImportDialogOpen(false); setCsvPreview(null); setCsvHeaders([]); setCsvTotalRows(0); } }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-emerald-600" />
              Importer des membres
            </DialogTitle>
            <DialogDescription>
              Vérifiez les données avant d'importer.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-2">
            {/* Validation Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold text-foreground">{csvTotalRows}</p>
                <p className="text-xs text-muted-foreground">Lignes totales</p>
              </div>
              <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 p-3 text-center">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{csvValidCount}</p>
                <p className="text-xs text-muted-foreground">Lignes valides</p>
              </div>
              <div className={`rounded-lg border p-3 text-center ${csvErrorCount > 0 ? 'border-red-200 dark:border-red-800' : ''}`}>
                <p className={`text-2xl font-bold ${csvErrorCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>{csvErrorCount}</p>
                <p className="text-xs text-muted-foreground">Lignes avec erreurs</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              {csvValidCount} ligne{csvValidCount !== 1 ? 's' : ''} valide{csvValidCount !== 1 ? 's' : ''} sur {csvTotalRows} total{csvTotalRows !== 1 ? 's' : ''}
            </p>

            {/* Column Mapping */}
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Colonnes détectées :</p>
              <div className="flex flex-wrap gap-1.5">
                {csvHeaders.map((h) => {
                  const isRequired = CSV_REQUIRED_COLUMNS.includes(h);
                  const isExpected = CSV_EXPECTED_COLUMNS.includes(h);
                  return (
                    <Badge
                      key={h}
                      variant="outline"
                      className={`text-xs ${
                        isExpected
                          ? 'border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                          : 'border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {isRequired && <span className="text-red-500 mr-0.5">*</span>}
                      {h}
                    </Badge>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground/70 mt-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1 align-middle" />
                Reconnue{' '}
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1 ml-2 align-middle" />
                Inconnue{' '}
                <span className="text-red-500">*</span> Obligatoire
              </p>
            </div>

            {/* Preview Table (max 5 rows) */}
            <div>
              <p className="text-sm font-medium mb-2">
                Aperçu {csvPreviewRows.length < csvTotalRows ? `(5 premières lignes sur ${csvTotalRows})` : ''} :
              </p>
              <div className="rounded-lg border overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="w-8">#</TableHead>
                        {CSV_EXPECTED_COLUMNS.map((col) => {
                          const matched = csvHeaders.includes(col);
                          return (
                            <TableHead key={col} className={`text-xs ${matched ? '' : 'text-muted-foreground/50 italic'}`}>
                              {col.replace(/([A-Z])/g, ' $1').trim()}
                            </TableHead>
                          );
                        })}
                        <TableHead className="w-10">État</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvPreviewRows.map((row, idx) => (
                        <TableRow
                          key={idx}
                          className={!row.isValid ? 'bg-red-50 dark:bg-red-950/20' : ''}
                        >
                          <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                          {CSV_EXPECTED_COLUMNS.map((col) => (
                            <TableCell key={col} className="text-xs max-w-[120px] truncate">
                              {row.data[col] || <span className="text-muted-foreground/40">—</span>}
                            </TableCell>
                          ))}
                          <TableCell>
                            {row.isValid ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertCircle className="h-4 w-4 text-red-500 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[200px]">
                                  Champs manquants : {row.errors.join(', ')}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Import Progress */}
            {importing && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  Importation... {importProgress.current}/{importProgress.total}
                </p>
                <Progress value={(importProgress.current / importProgress.total) * 100} className="h-2" />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row items-stretch">
            <button
              type="button"
              className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:underline underline-offset-2"
              onClick={downloadCsvTemplate}
            >
              <FileDown className="h-3 w-3 inline mr-1" />
              Télécharger le modèle CSV
            </button>
            <div className="flex gap-2 sm:ml-auto">
              <Button
                variant="outline"
                onClick={() => { if (!importing) { setImportDialogOpen(false); setCsvPreview(null); setCsvHeaders([]); setCsvTotalRows(0); } }}
                disabled={importing}
              >
                Annuler
              </Button>
              <Button
                onClick={handleImportMembers}
                disabled={importing || csvValidCount === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {importing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Importer {csvValidCount} membre{csvValidCount !== 1 ? 's' : ''}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== Profile Quick-View Dialog ==================== */}
      <MemberProfileDialog
        open={!!profileUserId}
        onOpenChange={(open) => !open && setProfileUserId(null)}
        userId={profileUserId}
      />
    </div>
  );
}
