import { useEffect, useState } from "react";
import { collection, query, getDocs, addDoc, orderBy, where, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Plus, MapPin, Clock, Users, Download } from "lucide-react";
import type { Event as CalendarEvent, EventType } from "@shared/schema";
import { Calendar, momentLocalizer, View, Views } from "react-big-calendar";
import moment from "moment";
import "moment/locale/fr";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { exportToCSV } from "@/lib/pdfUtils";

moment.locale("fr");
const localizer = momentLocalizer(moment);

export default function CalendarPage() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [calendarView, setCalendarView] = useState<View>(Views.MONTH);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false);

  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    type: "réunion" as EventType,
    dateDebut: "",
    dateFin: "",
    lieu: "",
  });

  const canManageEvents = userProfile?.role === "admin" || userProfile?.role === "président";

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      const eventsRef = collection(db, "events");
      const q = query(eventsRef, orderBy("dateDebut", "desc"));
      const snapshot = await getDocs(q);

      const convertToDate = (field: any): Date => {
        if (field instanceof Timestamp) {
          return field.toDate();
        } else if (typeof field === 'string') {
          return new Date(field);
        }
        return new Date();
      };

      const eventsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dateDebut: convertToDate(data.dateDebut),
          dateFin: convertToDate(data.dateFin),
          createdAt: convertToDate(data.createdAt),
          updatedAt: convertToDate(data.updatedAt),
        };
      }) as CalendarEvent[];

      setEvents(eventsData);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les événements",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!canManageEvents) {
      toast({
        variant: "destructive",
        title: "Permission refusée",
        description: "Vous n'avez pas les permissions pour créer des événements",
      });
      return;
    }

    setSubmitting(true);

    try {
      const eventData = {
        titre: formData.titre,
        description: formData.description,
        type: formData.type,
        dateDebut: Timestamp.fromDate(new Date(formData.dateDebut)),
        dateFin: Timestamp.fromDate(new Date(formData.dateFin)),
        lieu: formData.lieu,
        organisateurId: userProfile.id,
        organisateurNom: userProfile.displayName,
        participantsIds: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "events"), eventData);

      toast({
        title: "Événement créé",
        description: "L'événement a été ajouté au calendrier",
      });

      setDialogOpen(false);
      setFormData({
        titre: "",
        description: "",
        type: "réunion",
        dateDebut: "",
        dateFin: "",
        lieu: "",
      });
      fetchEvents();
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de créer l'événement",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const now = new Date();

  const getEventTypeColor = (type: EventType) => {
    switch (type) {
      case "réunion": return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "événement": return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300";
      case "formation": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "cérémonie": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      case "autre": return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  const calendarEvents = events.map((event) => ({
    id: event.id,
    title: event.titre,
    start: event.dateDebut,
    end: event.dateFin,
    resource: event,
  }));

  const eventStyleGetter = (event: any) => {
    const eventType = event.resource.type;
    let backgroundColor = "#0A7D33";
    
    switch (eventType) {
      case "réunion":
        backgroundColor = "#3b82f6";
        break;
      case "événement":
        backgroundColor = "#a855f7";
        break;
      case "formation":
        backgroundColor = "#0A7D33";
        break;
      case "cérémonie":
        backgroundColor = "#ef4444";
        break;
      case "autre":
        backgroundColor = "#6b7280";
        break;
    }
    
    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.9,
        color: "white",
        border: "0px",
        display: "block",
      },
    };
  };

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event.resource);
    setEventDetailsOpen(true);
  };

  function handleExportCSV() {
    exportToCSV(events, "CODET_Evenements", {
      titre: "Titre",
      type: "Type",
      dateDebut: "Date Début",
      dateFin: "Date Fin",
      lieu: "Lieu",
      organisateurNom: "Organisateur"
    });

    toast({
      title: "Export réussi",
      description: `${events.length} événements exportés en CSV`,
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Calendrier</h1>
          <p className="text-muted-foreground">Gestion des événements et réunions du comité</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={events.length === 0}
            data-testid="button-export-csv"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          {canManageEvents && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-event">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvel Événement
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un événement</DialogTitle>
                  <DialogDescription>
                    Ajoutez un nouvel événement au calendrier du comité
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="titre">Titre *</Label>
                      <Input
                        id="titre"
                        required
                        value={formData.titre}
                        onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                        placeholder="Ex: Réunion mensuelle"
                        className="h-12"
                        data-testid="input-titre"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">Type *</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value: EventType) => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger data-testid="select-type" className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="réunion">Réunion</SelectItem>
                          <SelectItem value="événement">Événement</SelectItem>
                          <SelectItem value="formation">Formation</SelectItem>
                          <SelectItem value="cérémonie">Cérémonie</SelectItem>
                          <SelectItem value="autre">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dateDebut">Date début *</Label>
                        <Input
                          id="dateDebut"
                          type="datetime-local"
                          required
                          value={formData.dateDebut}
                          onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                          className="h-12"
                          data-testid="input-date-debut"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dateFin">Date fin *</Label>
                        <Input
                          id="dateFin"
                          type="datetime-local"
                          required
                          value={formData.dateFin}
                          onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
                          className="h-12"
                          data-testid="input-date-fin"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lieu">Lieu</Label>
                      <Input
                        id="lieu"
                        value={formData.lieu}
                        onChange={(e) => setFormData({ ...formData, lieu: e.target.value })}
                        placeholder="Ex: Salle communale"
                        className="h-12"
                        data-testid="input-lieu"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        required
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Détails de l'événement..."
                        rows={3}
                        data-testid="input-description"
                      />
                    </div>
                  </div>

                  <DialogFooter className="mt-6">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={submitting} data-testid="button-submit-event">
                      {submitting ? "Création..." : "Créer"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Événements</CardTitle>
            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">À venir</CardTitle>
            <Clock className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {events.filter((e) => e.dateFin >= now).length}
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ce mois</CardTitle>
            <CalendarIcon className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {events.filter((e) => {
                const month = new Date().getMonth();
                const year = new Date().getFullYear();
                return e.dateDebut.getMonth() === month && e.dateDebut.getFullYear() === year;
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Big Calendar View */}
      <Card className="p-6">
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          view={calendarView}
          onView={setCalendarView}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          messages={{
            next: "Suivant",
            previous: "Précédent",
            today: "Aujourd'hui",
            month: "Mois",
            week: "Semaine",
            day: "Jour",
            agenda: "Agenda",
            date: "Date",
            time: "Heure",
            event: "Événement",
            noEventsInRange: "Aucun événement dans cette période",
            showMore: (total: number) => `+ ${total} événement(s) supplémentaire(s)`,
          }}
          formats={{
            monthHeaderFormat: "MMMM YYYY",
            dayHeaderFormat: "dddd D MMMM",
            dayRangeHeaderFormat: ({ start, end }: any, culture: any, localizer: any) =>
              localizer?.format(start, "D MMMM", culture) + " - " + localizer?.format(end, "D MMMM YYYY", culture),
            agendaHeaderFormat: ({ start, end }: any, culture: any, localizer: any) =>
              localizer?.format(start, "D MMMM", culture) + " - " + localizer?.format(end, "D MMMM YYYY", culture),
          }}
        />
      </Card>

      {/* Event Details Dialog */}
      <Dialog open={eventDetailsOpen} onOpenChange={setEventDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.titre}</DialogTitle>
            <DialogDescription>Détails de l'événement</DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <Badge className={getEventTypeColor(selectedEvent.type)}>
                  {selectedEvent.type}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                <p className="text-foreground">{selectedEvent.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Début</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>
                      {selectedEvent.dateDebut.toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Fin</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>
                      {selectedEvent.dateFin.toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
              {selectedEvent.lieu && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Lieu</p>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedEvent.lieu}</span>
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Organisateur</p>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  <span>{selectedEvent.organisateurNom}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventDetailsOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
