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
import { eventSchema, formatZodErrors } from '@/lib/validations';
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
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  User,
  Clock,
  CalendarDays,
  ArrowRight,
  Check,
} from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { notifyEventCreated } from '@/lib/notification-triggers';

// ==================== Types ====================

interface CalendarEvent {
  $id: string;
  titre: string;
  description: string;
  type: string;
  couleur: string;
  dateDebut: string;
  dateFin: string;
  lieu: string;
  organisateurId: string;
  organisateurNom: string;
  createdAt: string;
  updatedAt: string;
}

const EVENT_TYPE_OPTIONS = [
  { value: 'réunion', label: 'Réunion' },
  { value: 'événement', label: 'Événement' },
  { value: 'formation', label: 'Formation' },
  { value: 'cérémonie', label: 'Cérémonie' },
  { value: 'autre', label: 'Autre' },
];

const EVENT_COLOR_PRESETS = [
  { value: 'emerald', label: 'Emeraude', dotClass: 'bg-emerald-500' },
  { value: 'blue', label: 'Bleu', dotClass: 'bg-blue-500' },
  { value: 'amber', label: 'Ambre', dotClass: 'bg-amber-500' },
  { value: 'violet', label: 'Violet', dotClass: 'bg-violet-500' },
  { value: 'rose', label: 'Rose', dotClass: 'bg-rose-500' },
  { value: 'cyan', label: 'Cyan', dotClass: 'bg-cyan-500' },
];

const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

// ==================== Helpers ====================

function getEventTypeColor(type: string): string {
  switch (type) {
    case 'réunion': return 'bg-blue-500';
    case 'événement': return 'bg-emerald-500';
    case 'formation': return 'bg-amber-500';
    case 'cérémonie': return 'bg-violet-500';
    default: return 'bg-gray-500';
  }
}

function getEventDotColor(event: CalendarEvent): string {
  // Use custom color if set, otherwise fallback to type-based color
  if (event.couleur) {
    const preset = EVENT_COLOR_PRESETS.find(c => c.value === event.couleur);
    if (preset) return preset.dotClass;
  }
  return getEventTypeColor(event.type);
}

function getEventTypeDotColor(type: string): string {
  return getEventTypeColor(type);
}

function getEventTypeBadgeClass(type: string): string {
  switch (type) {
    case 'réunion': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-0';
    case 'événement': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-0';
    case 'formation': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-0';
    case 'cérémonie': return 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300 border-0';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300 border-0';
  }
}

function getEventTypeLabel(type: string): string {
  const found = EVENT_TYPE_OPTIONS.find((t) => t.value === type);
  return found ? found.label : type;
}

function getEventBorderColor(type: string): string {
  switch (type) {
    case 'réunion': return 'border-l-blue-500';
    case 'événement': return 'border-l-emerald-500';
    case 'formation': return 'border-l-amber-500';
    case 'cérémonie': return 'border-l-violet-500';
    default: return 'border-l-gray-400';
  }
}

function formatDateTime(dateStr: string) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateStr;
  }
}

function formatTime(dateStr: string) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

// Calendar grid helpers
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  // Convert Sunday=0 to Monday-based (0=Mon, 6=Sun)
  return day === 0 ? 6 : day - 1;
}

function isSameDay(dateStr: string, year: number, month: number, day: number) {
  if (!dateStr) return false;
  try {
    const d = new Date(dateStr);
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
  } catch {
    return false;
  }
}

// ==================== Component ====================

interface EventFormFieldsProps {
  formTitre: string;
  setFormTitre: (v: string) => void;
  formDescription: string;
  setFormDescription: (v: string) => void;
  formType: string;
  setFormType: (v: string) => void;
  formCouleur: string;
  setFormCouleur: (v: string) => void;
  formDateDebut: string;
  setFormDateDebut: (v: string) => void;
  formDateFin: string;
  setFormDateFin: (v: string) => void;
  formLieu: string;
  setFormLieu: (v: string) => void;
}

function EventFormFields({
  formTitre,
  setFormTitre,
  formDescription,
  setFormDescription,
  formType,
  setFormType,
  formCouleur,
  setFormCouleur,
  formDateDebut,
  setFormDateDebut,
  formDateFin,
  setFormDateFin,
  formLieu,
  setFormLieu,
}: EventFormFieldsProps) {
  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="event-titre">Titre *</Label>
        <Input
          id="event-titre"
          value={formTitre}
          onChange={(e) => setFormTitre(e.target.value)}
          placeholder="Nom de l'événement"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="event-description">Description</Label>
        <Textarea
          id="event-description"
          value={formDescription}
          onChange={(e) => setFormDescription(e.target.value)}
          placeholder="Détails de l'événement"
          rows={3}
        />
      </div>
      <div className="grid gap-2">
        <Label>Type</Label>
        <Select value={formType} onValueChange={setFormType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EVENT_TYPE_OPTIONS.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* Color picker */}
      <div className="grid gap-2">
        <Label>Couleur</Label>
        <div className="flex items-center gap-2 flex-wrap">
          {EVENT_COLOR_PRESETS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setFormCouleur(c.value)}
              className={`h-7 w-7 rounded-full ${c.dotClass} transition-all duration-150 flex items-center justify-center ${
                formCouleur === c.value
                  ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110'
                  : 'hover:scale-110'
              }`}
              title={c.label}
              aria-label={`Couleur ${c.label}`}
            >
              {formCouleur === c.value && (
                <Check className="h-3.5 w-3.5 text-white" />
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="event-start">Date de début *</Label>
          <Input
            id="event-start"
            type="datetime-local"
            value={formDateDebut}
            onChange={(e) => setFormDateDebut(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="event-end">Date de fin</Label>
          <Input
            id="event-end"
            type="datetime-local"
            value={formDateFin}
            onChange={(e) => setFormDateFin(e.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="event-lieu">Lieu</Label>
        <Input
          id="event-lieu"
          value={formLieu}
          onChange={(e) => setFormLieu(e.target.value)}
          placeholder="Lieu de l'événement"
        />
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar navigation
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  // Day detail panel
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [formTitre, setFormTitre] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState('événement');
  const [formCouleur, setFormCouleur] = useState('emerald');
  const [formDateDebut, setFormDateDebut] = useState('');
  const [formDateFin, setFormDateFin] = useState('');
  const [formLieu, setFormLieu] = useState('');

  const canManage = user && ['admin', 'président', 'secretaire', 'secretaire_general', 'trésorier', 'commissaire', 'responsable_communication', 'membre'].includes(user.role);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getDocs(COLLECTIONS.EVENTS);
      setEvents(result.documents as CalendarEvent[]);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les événements.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Navigation
  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDay(today.getDate());
    setDayDialogOpen(true);
  };

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days: (number | null)[] = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Day numbers
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  }, [currentYear, currentMonth]);

  // Get events for a specific day
  const getEventsForDay = useCallback((day: number) => {
    const dayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((e) => {
      const start = e.dateDebut ? e.dateDebut.substring(0, 10) : '';
      const end = e.dateFin ? e.dateFin.substring(0, 10) : start;
      return start <= dayStr && end >= dayStr;
    });
  }, [events, currentYear, currentMonth]);

  // Events for selected day
  const selectedDayEvents = useMemo(() => {
    if (selectedDay === null) return [];
    return getEventsForDay(selectedDay);
  }, [selectedDay, getEventsForDay]);

  // Upcoming events (all future events, sorted)
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((e) => {
        if (!e.dateDebut) return false;
        const start = new Date(e.dateDebut);
        return start >= now;
      })
      .sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime())
      .slice(0, 5);
  }, [events]);

  // Open day detail
  const openDayDetail = (day: number) => {
    setSelectedDay(day);
    setDayDialogOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormTitre('');
    setFormDescription('');
    setFormType('événement');
    setFormCouleur('emerald');
    setFormDateDebut('');
    setFormDateFin('');
    setFormLieu('');
  };

  // Open create dialog
  const openCreateDialog = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setFormTitre(event.titre || '');
    setFormDescription(event.description || '');
    setFormType(event.type || 'événement');
    setFormCouleur(event.couleur || 'emerald');
    setFormDateDebut(event.dateDebut ? event.dateDebut.slice(0, 16) : '');
    setFormDateFin(event.dateFin ? event.dateFin.slice(0, 16) : '');
    setFormLieu(event.lieu || '');
    setEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setDeleteDialogOpen(true);
  };

  // Create event
  const handleCreate = async () => {
    const formData = {
      titre: formTitre.trim(),
      description: formDescription.trim(),
      dateDebut: formDateDebut || '',
      dateFin: formDateFin || '',
      lieu: formLieu.trim(),
      couleur: formCouleur,
    };
    const result = eventSchema.safeParse(formData);
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      const firstError = Object.values(errors)[0];
      toast({ title: 'Validation', description: firstError, variant: 'destructive' });
      return;
    }
    try {
      setSaving(true);
      await addDoc(COLLECTIONS.EVENTS, {
        titre: formTitre.trim(),
        description: formDescription.trim(),
        type: formType,
        couleur: formCouleur,
        dateDebut: new Date(formDateDebut).toISOString(),
        dateFin: formDateFin ? new Date(formDateFin).toISOString() : new Date(formDateDebut).toISOString(),
        lieu: formLieu.trim(),
        organisateurId: user?.id || '',
        organisateurNom: user?.displayName || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast({ title: 'Succès', description: 'Événement créé avec succès.' });
      notifyEventCreated(formTitre.trim(), formatDateTime(formDateDebut)).catch(() => {});
      setCreateDialogOpen(false);
      resetForm();
      fetchEvents();
    } catch (error: any) {
      console.error('Error creating event:', error);
      toast({ title: 'Erreur', description: 'Impossible de créer l\'événement.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Edit event
  const handleEdit = async () => {
    if (!selectedEvent) return;
    const formData = {
      titre: formTitre.trim(),
      description: formDescription.trim(),
      dateDebut: formDateDebut || selectedEvent.dateDebut,
      dateFin: formDateFin || '',
      lieu: formLieu.trim(),
      couleur: formCouleur,
    };
    const result = eventSchema.safeParse(formData);
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      const firstError = Object.values(errors)[0];
      toast({ title: 'Validation', description: firstError, variant: 'destructive' });
      return;
    }
    try {
      setSaving(true);
      await updateDoc(doc(COLLECTIONS.EVENTS, selectedEvent.$id), {
        titre: formTitre.trim(),
        description: formDescription.trim(),
        type: formType,
        couleur: formCouleur,
        dateDebut: formDateDebut ? new Date(formDateDebut).toISOString() : selectedEvent.dateDebut,
        dateFin: formDateFin ? new Date(formDateFin).toISOString() : selectedEvent.dateFin,
        lieu: formLieu.trim(),
        updatedAt: new Date().toISOString(),
      });
      toast({ title: 'Succès', description: 'Événement mis à jour.' });
      setEditDialogOpen(false);
      setSelectedEvent(null);
      fetchEvents();
    } catch (error: any) {
      console.error('Error updating event:', error);
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour l\'événement.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Delete event
  const handleDelete = async () => {
    if (!selectedEvent) return;
    try {
      setDeleting(true);
      await deleteDoc(doc(COLLECTIONS.EVENTS, selectedEvent.$id));
      toast({ title: 'Succès', description: 'Événement supprimé.' });
      setDeleteDialogOpen(false);
      setSelectedEvent(null);
      fetchEvents();
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast({ title: 'Erreur', description: 'Impossible de supprimer l\'événement.', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  // Check if a day is today
  const isToday = (day: number) => {
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
            <CalendarDays className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">Calendrier</h2>
              {!loading && events.length > 0 && (
                <Badge variant="secondary" className="text-xs font-normal">
                  {events.length} événement{events.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Événements et planning du CODET
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Aujourd&apos;hui
          </Button>
          {canManage && (
            <Button onClick={openCreateDialog} className="shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              Nouvel événement
            </Button>
          )}
        </div>
      </div>

      {/* Calendar grid */}
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4">
          {loading ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 mx-auto w-10" />
                ))}
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={`d-${i}`} className="min-h-[80px]">
                    <Skeleton className="h-full w-full rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          ) : events.length === 0 && !loading ? (
            <EmptyState
              icon={CalendarDays}
              title="Aucun événement"
              description="Aucun événement n'a encore été programmé. Commencez par créer votre premier événement."
              action={canManage ? { label: 'Créer un événement', onClick: openCreateDialog } : undefined}
            />
          ) : (
            <>
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon" onClick={goToPrevMonth} className="h-9 w-9 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400 transition-colors duration-150">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-lg font-semibold">
                  {MONTHS_FR[currentMonth]} {currentYear}
                </h3>
                <Button variant="ghost" size="icon" onClick={goToNextMonth} className="h-9 w-9 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400 transition-colors duration-150">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Day of week headers */}
              <div className="grid grid-cols-7 gap-0 mb-0">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2 border-b border-border">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-0">
                {calendarDays.map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="min-h-[80px] border-b border-r border-border/50 last:border-r-0" />;
                  }

                  const dayEvents = getEventsForDay(day);
                  const todayHighlight = isToday(day);
                  const hasEvents = dayEvents.length > 0;
                  const isLastCol = (index + 1) % 7 === 0;

                  return (
                    <button
                      key={`day-${day}`}
                      onClick={() => openDayDetail(day)}
                      className={`relative min-h-[80px] p-1.5 text-left border-b border-r border-border/50 transition-all duration-150 hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 ${isLastCol ? 'border-r-0' : ''} ${
                        todayHighlight
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 ring-2 ring-emerald-500 ring-inset'
                          : ''
                      }`}
                    >
                      <span className={`text-sm block ${
                        todayHighlight
                          ? 'inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs'
                          : 'font-medium'
                      }`}>
                        {day}
                      </span>
                      {/* Event dots */}
                      {hasEvents && (
                        <div className="absolute bottom-1.5 left-1.5 right-1.5 flex gap-1 flex-wrap">
                          {dayEvents.slice(0, 3).map((event) => (
                            <div
                              key={event.$id}
                              className={`w-2.5 h-2.5 rounded-sm shadow-sm ${getEventDotColor(event)}`}
                              title={event.titre}
                            />
                          ))}
                          {dayEvents.length > 3 && (
                            <span className="text-[9px] text-muted-foreground leading-none">+{dayEvents.length - 3}</span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 px-1">
        {EVENT_TYPE_OPTIONS.map((t) => (
          <div key={t.value} className="flex items-center gap-1.5">
            <div className={`h-2.5 w-2.5 rounded-full ${getEventTypeColor(t.value)}`} />
            <span className="text-xs text-muted-foreground">{t.label}</span>
          </div>
        ))}
      </div>

      {/* Upcoming events - Événements à venir */}
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Événements à venir
            {upcomingEvents.length > 0 && (
              <Badge variant="secondary" className="ml-1">{upcomingEvents.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>Prochains événements programmés</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ))}
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <CalendarDays className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Aucun événement à venir.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map((event) => (
                <div
                  key={event.$id}
                  className="group rounded-xl border p-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                  onClick={() => {
                    // Parse date to navigate to the right month/day
                    const start = new Date(event.dateDebut);
                    setCurrentYear(start.getFullYear());
                    setCurrentMonth(start.getMonth());
                    setSelectedDay(start.getDate());
                    setDayDialogOpen(true);
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`h-2.5 w-2.5 rounded-sm shrink-0 ${getEventDotColor(event)}`} />
                        <Badge className={`text-[10px] ${getEventTypeBadgeClass(event.type)}`}>
                          {getEventTypeLabel(event.type)}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium truncate mb-1">{event.titre}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3 shrink-0" />
                        {formatDateTime(event.dateDebut)}
                      </p>
                      {event.lieu && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{event.lieu}</span>
                        </p>
                      )}
                    </div>
                    {canManage && (
                      <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => { e.stopPropagation(); openEditDialog(event); }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-600"
                          onClick={(e) => { e.stopPropagation(); openDeleteDialog(event); }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Day Detail Dialog */}
      <Dialog open={dayDialogOpen} onOpenChange={setDayDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedDay !== null && (
                <>
                  {selectedDay} {MONTHS_FR[currentMonth]} {currentYear}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Événements du jour
            </DialogDescription>
          </DialogHeader>
          {selectedDayEvents.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">Aucun événement ce jour.</p>
              {canManage && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setDayDialogOpen(false);
                    openCreateDialog();
                  }}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Ajouter un événement
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {selectedDayEvents.map((event) => (
                <div key={event.$id} className={`p-3 rounded-lg border border-l-4 ${getEventBorderColor(event.type)}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getEventTypeBadgeClass(event.type)}`}>
                        {getEventTypeLabel(event.type)}
                      </Badge>
                      <h4 className="font-medium text-sm">{event.titre}</h4>
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setDayDialogOpen(false);
                            openEditDialog(event);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-600"
                          onClick={() => {
                            setDayDialogOpen(false);
                            openDeleteDialog(event);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {event.description && (
                    <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(event.dateDebut)}
                      {event.dateFin && event.dateFin !== event.dateDebut && (
                        <React.Fragment> — {formatTime(event.dateFin)}</React.Fragment>
                      )}
                    </span>
                    {event.lieu && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.lieu}
                      </span>
                    )}
                    {event.organisateurNom && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {event.organisateurNom}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Event Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouvel événement</DialogTitle>
            <DialogDescription>
              Créez un nouvel événement pour le calendrier.
            </DialogDescription>
          </DialogHeader>
          <EventFormFields
            formTitre={formTitre}
            setFormTitre={setFormTitre}
            formDescription={formDescription}
            setFormDescription={setFormDescription}
            formType={formType}
            setFormType={setFormType}
            formCouleur={formCouleur}
            setFormCouleur={setFormCouleur}
            formDateDebut={formDateDebut}
            setFormDateDebut={setFormDateDebut}
            formDateFin={formDateFin}
            setFormDateFin={setFormDateFin}
            formLieu={formLieu}
            setFormLieu={setFormLieu}
          />
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

      {/* Edit Event Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier l&apos;événement</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations de l&apos;événement.
            </DialogDescription>
          </DialogHeader>
          <EventFormFields
            formTitre={formTitre}
            setFormTitre={setFormTitre}
            formDescription={formDescription}
            setFormDescription={setFormDescription}
            formType={formType}
            setFormType={setFormType}
            formCouleur={formCouleur}
            setFormCouleur={setFormCouleur}
            formDateDebut={formDateDebut}
            setFormDateDebut={setFormDateDebut}
            formDateFin={formDateFin}
            setFormDateFin={setFormDateFin}
            formLieu={formLieu}
            setFormLieu={setFormLieu}
          />
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

      {/* Delete Event Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l&apos;événement</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l&apos;événement &quot;{selectedEvent?.titre}&quot; ? Cette action est irréversible.
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