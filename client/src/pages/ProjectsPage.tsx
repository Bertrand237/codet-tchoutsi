import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, FolderKanban, Calendar, DollarSign, Users as UsersIcon, TrendingUp, Clock, FileDown, FileText } from "lucide-react";
import type { Project, ProjectStatus, ProjectPriority } from "@shared/schema";
import { exportProjectsPDF, exportToCSV } from "@/lib/pdfUtils";

export default function ProjectsPage() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("tous");
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    statut: "planifié" as ProjectStatus,
    priorite: "moyenne" as ProjectPriority,
    budget: "",
    dateDebut: new Date().toISOString().split("T")[0],
    dateEcheance: "",
    progression: "0",
  });

  const canManageProjects = userProfile?.role === "admin" || userProfile?.role === "président";

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const projectsRef = collection(db, "projects");
      const q = query(projectsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      
      const projectsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        
        const convertToDate = (field: any): Date => {
          if (field instanceof Timestamp) {
            return field.toDate();
          } else if (typeof field === 'string') {
            return new Date(field);
          }
          return new Date();
        };

        return {
          id: doc.id,
          ...data,
          dateDebut: convertToDate(data.dateDebut),
          dateEcheance: convertToDate(data.dateEcheance),
          dateAchevement: data.dateAchevement ? convertToDate(data.dateAchevement) : undefined,
          createdAt: convertToDate(data.createdAt),
          updatedAt: convertToDate(data.updatedAt),
        };
      }) as Project[];

      setProjects(projectsData);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les projets",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userProfile) return;

    setSubmitting(true);

    try {
      const projectData = {
        titre: formData.titre,
        description: formData.description,
        statut: formData.statut,
        priorite: formData.priorite,
        budget: formData.budget ? parseFloat(formData.budget) : 0,
        budgetUtilise: 0,
        responsableId: userProfile.id,
        responsableNom: userProfile.displayName,
        dateDebut: Timestamp.fromDate(new Date(formData.dateDebut)),
        dateEcheance: Timestamp.fromDate(new Date(formData.dateEcheance)),
        membresAssignes: [],
        tags: [],
        progression: parseInt(formData.progression),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "projects"), projectData);

      toast({
        title: "Projet créé",
        description: "Le projet a été créé avec succès",
      });

      setDialogOpen(false);
      setFormData({
        titre: "",
        description: "",
        statut: "planifié",
        priorite: "moyenne",
        budget: "",
        dateDebut: new Date().toISOString().split("T")[0],
        dateEcheance: "",
        progression: "0",
      });
      fetchProjects();
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de créer le projet",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function updateProjectStatus(projectId: string, newStatus: ProjectStatus) {
    try {
      const updateData: any = {
        statut: newStatus,
        updatedAt: serverTimestamp(),
      };

      if (newStatus === "terminé") {
        updateData.dateAchevement = serverTimestamp();
        updateData.progression = 100;
      }

      await updateDoc(doc(db, "projects", projectId), updateData);

      toast({
        title: "Statut mis à jour",
        description: `Le projet est maintenant ${newStatus}`,
      });

      fetchProjects();
    } catch (error) {
      console.error("Error updating project status:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
      });
    }
  }

  const filteredProjects = selectedStatus === "tous"
    ? projects
    : projects.filter((p) => p.statut === selectedStatus);

  const stats = {
    total: projects.length,
    enCours: projects.filter((p) => p.statut === "en_cours").length,
    planifies: projects.filter((p) => p.statut === "planifié").length,
    termines: projects.filter((p) => p.statut === "terminé").length,
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case "planifié": return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "en_cours": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "en_pause": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "terminé": return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300";
      case "archivé": return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  const getPriorityColor = (priority: ProjectPriority) => {
    switch (priority) {
      case "basse": return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
      case "moyenne": return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "haute": return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300";
      case "urgente": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
    }
  };

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
          <h1 className="text-3xl font-bold text-foreground">Gestion des Projets</h1>
          <p className="text-muted-foreground">Suivi et gestion des projets du comité</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => exportProjectsPDF(filteredProjects)}
            disabled={filteredProjects.length === 0}
            data-testid="button-export-pdf"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => exportToCSV(filteredProjects, "CODET_Projets", {
              titre: "Titre",
              statut: "Statut",
              priorite: "Priorité",
              budget: "Budget",
              budgetUtilise: "Budget Utilisé",
              progression: "Progression",
              responsableNom: "Responsable",
              dateDebut: "Date début",
              dateEcheance: "Date échéance"
            })}
            disabled={filteredProjects.length === 0}
            data-testid="button-export-csv"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          {canManageProjects && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-project">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Projet
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer un nouveau projet</DialogTitle>
                <DialogDescription>
                  Définissez les détails du projet du comité
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="titre">Titre du projet</Label>
                    <Input
                      id="titre"
                      type="text"
                      placeholder="Ex: Rénovation de l'école"
                      value={formData.titre}
                      onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                      required
                      data-testid="input-titre"
                      className="h-12"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Description détaillée du projet..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      rows={4}
                      data-testid="input-description"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="statut">Statut</Label>
                    <Select value={formData.statut} onValueChange={(value) => setFormData({ ...formData, statut: value as ProjectStatus })}>
                      <SelectTrigger data-testid="select-statut" className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planifié">Planifié</SelectItem>
                        <SelectItem value="en_cours">En cours</SelectItem>
                        <SelectItem value="en_pause">En pause</SelectItem>
                        <SelectItem value="terminé">Terminé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priorite">Priorité</Label>
                    <Select value={formData.priorite} onValueChange={(value) => setFormData({ ...formData, priorite: value as ProjectPriority })}>
                      <SelectTrigger data-testid="select-priorite" className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basse">Basse</SelectItem>
                        <SelectItem value="moyenne">Moyenne</SelectItem>
                        <SelectItem value="haute">Haute</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget (FCFA)</Label>
                    <Input
                      id="budget"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      data-testid="input-budget"
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="progression">Progression (%)</Label>
                    <Input
                      id="progression"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.progression}
                      onChange={(e) => setFormData({ ...formData, progression: e.target.value })}
                      data-testid="input-progression"
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateDebut">Date de début</Label>
                    <Input
                      id="dateDebut"
                      type="date"
                      value={formData.dateDebut}
                      onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                      required
                      data-testid="input-dateDebut"
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateEcheance">Date d'échéance</Label>
                    <Input
                      id="dateEcheance"
                      type="date"
                      value={formData.dateEcheance}
                      onChange={(e) => setFormData({ ...formData, dateEcheance: e.target.value })}
                      required
                      data-testid="input-dateEcheance"
                      className="h-12"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={submitting} data-testid="button-submit-project">
                    {submitting ? "Création..." : "Créer le projet"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projets</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.enCours}</div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planifiés</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.planifies}</div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminés</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.termines}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
        <TabsList>
          <TabsTrigger value="tous">Tous</TabsTrigger>
          <TabsTrigger value="planifié">Planifiés</TabsTrigger>
          <TabsTrigger value="en_cours">En cours</TabsTrigger>
          <TabsTrigger value="en_pause">En pause</TabsTrigger>
          <TabsTrigger value="terminé">Terminés</TabsTrigger>
          <TabsTrigger value="archivé">Archivés</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Projects List */}
      <div className="grid gap-4">
        {filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">Aucun projet dans cette catégorie</p>
            </CardContent>
          </Card>
        ) : (
          filteredProjects.map((project) => (
            <Card key={project.id} className="hover-elevate" data-testid={`card-project-${project.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl">{project.titre}</CardTitle>
                      <Badge className={getPriorityColor(project.priorite)}>
                        {project.priorite}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <UsersIcon className="h-4 w-4" />
                        <span>{project.responsableNom}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {project.dateDebut.toLocaleDateString("fr-FR")} -{" "}
                          {project.dateEcheance.toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      {project.budget && project.budget > 0 && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>{project.budget.toLocaleString()} FCFA</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {canManageProjects ? (
                      <Select value={project.statut} onValueChange={(value) => updateProjectStatus(project.id, value as ProjectStatus)}>
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planifié">Planifié</SelectItem>
                          <SelectItem value="en_cours">En cours</SelectItem>
                          <SelectItem value="en_pause">En pause</SelectItem>
                          <SelectItem value="terminé">Terminé</SelectItem>
                          <SelectItem value="archivé">Archivé</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={getStatusColor(project.statut)}>
                        {project.statut}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progression</span>
                    <span className="font-medium">{project.progression || 0}%</span>
                  </div>
                  <Progress value={project.progression || 0} className="h-2" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
