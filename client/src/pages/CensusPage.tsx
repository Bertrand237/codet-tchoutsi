import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, Trash2, Edit } from "lucide-react";
import type { Family, FamilyMember } from "@shared/schema";

export default function CensusPage() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    adresse: "",
    telephone: "",
    membres: [] as FamilyMember[],
  });
  const [currentMember, setCurrentMember] = useState({
    nom: "",
    prenom: "",
    dateNaissance: "",
    relation: "",
  });

  useEffect(() => {
    fetchFamilies();
  }, [userProfile]);

  async function fetchFamilies() {
    try {
      const familiesRef = collection(db, "families");
      let q = query(familiesRef);
      
      if (userProfile?.role === "membre") {
        q = query(familiesRef, where("membreId", "==", userProfile.id));
      }

      const snapshot = await getDocs(q);
      const familiesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        membres: doc.data().membres?.map((m: any) => ({
          ...m,
          dateNaissance: m.dateNaissance ? new Date(m.dateNaissance) : undefined,
        })) || [],
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Family[];

      setFamilies(familiesData);
    } catch (error) {
      console.error("Error fetching families:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les familles",
      });
    } finally {
      setLoading(false);
    }
  }

  function addMemberToForm() {
    if (!currentMember.nom || !currentMember.prenom || !currentMember.relation) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez remplir tous les champs du membre",
      });
      return;
    }

    const newMember: FamilyMember = {
      nom: currentMember.nom,
      prenom: currentMember.prenom,
      dateNaissance: currentMember.dateNaissance ? new Date(currentMember.dateNaissance) : undefined,
      relation: currentMember.relation,
    };

    setFormData({
      ...formData,
      membres: [...formData.membres, newMember],
    });

    setCurrentMember({ nom: "", prenom: "", dateNaissance: "", relation: "" });
  }

  function removeMemberFromForm(index: number) {
    setFormData({
      ...formData,
      membres: formData.membres.filter((_, i) => i !== index),
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userProfile) return;

    if (formData.membres.length === 0) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Ajoutez au moins un membre de la famille",
      });
      return;
    }

    setSubmitting(true);

    try {
      const familyData = {
        membreId: userProfile.id,
        membreNom: userProfile.displayName,
        adresse: formData.adresse,
        telephone: formData.telephone,
        membres: formData.membres.map((m) => ({
          ...m,
          dateNaissance: m.dateNaissance?.toISOString(),
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "families"), familyData);

      toast({
        title: "Famille enregistrée",
        description: "Les informations familiales ont été sauvegardées",
      });

      setDialogOpen(false);
      setFormData({ adresse: "", telephone: "", membres: [] });
      fetchFamilies();
    } catch (error) {
      console.error("Error submitting family:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'enregistrer la famille",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteFamily(familyId: string) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette famille ?")) return;

    try {
      await deleteDoc(doc(db, "families", familyId));
      toast({
        title: "Famille supprimée",
        description: "La famille a été supprimée avec succès",
      });
      fetchFamilies();
    } catch (error) {
      console.error("Error deleting family:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer la famille",
      });
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Recensement Familial</h1>
          <p className="text-muted-foreground">Enregistrement des familles du comité</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-family">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Famille
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Enregistrer une famille</DialogTitle>
              <DialogDescription>
                Ajoutez les informations de votre famille
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adresse">Adresse</Label>
                  <Input
                    id="adresse"
                    type="text"
                    placeholder="123 Rue Example"
                    value={formData.adresse}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                    required
                    data-testid="input-adresse"
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    type="tel"
                    placeholder="+237 6XX XX XX XX"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    required
                    data-testid="input-telephone"
                    className="h-12"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Membres de la famille</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom</Label>
                    <Input
                      id="nom"
                      type="text"
                      placeholder="Nom"
                      value={currentMember.nom}
                      onChange={(e) => setCurrentMember({ ...currentMember, nom: e.target.value })}
                      data-testid="input-membre-nom"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prenom">Prénom</Label>
                    <Input
                      id="prenom"
                      type="text"
                      placeholder="Prénom"
                      value={currentMember.prenom}
                      onChange={(e) => setCurrentMember({ ...currentMember, prenom: e.target.value })}
                      data-testid="input-membre-prenom"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateNaissance">Date de naissance</Label>
                    <Input
                      id="dateNaissance"
                      type="date"
                      value={currentMember.dateNaissance}
                      onChange={(e) => setCurrentMember({ ...currentMember, dateNaissance: e.target.value })}
                      data-testid="input-membre-date"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="relation">Relation</Label>
                    <Input
                      id="relation"
                      type="text"
                      placeholder="Père, Mère, Enfant..."
                      value={currentMember.relation}
                      onChange={(e) => setCurrentMember({ ...currentMember, relation: e.target.value })}
                      data-testid="input-membre-relation"
                      className="h-10"
                    />
                  </div>

                  <div className="col-span-2">
                    <Button
                      type="button"
                      onClick={addMemberToForm}
                      variant="outline"
                      className="w-full"
                      data-testid="button-add-member"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter ce membre
                    </Button>
                  </div>
                </div>

                {formData.membres.length > 0 && (
                  <div className="space-y-2">
                    {formData.membres.map((membre, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-card border border-border rounded-lg"
                        data-testid={`membre-item-${index}`}
                      >
                        <div>
                          <p className="font-medium">
                            {membre.prenom} {membre.nom}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {membre.relation}
                            {membre.dateNaissance &&
                              ` • ${membre.dateNaissance.toLocaleDateString("fr-FR")}`}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMemberFromForm(index)}
                          data-testid={`button-remove-member-${index}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="submit" disabled={submitting} data-testid="button-submit-family">
                  {submitting ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {families.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">Aucune famille enregistrée</p>
            </CardContent>
          </Card>
        ) : (
          families.map((family) => (
            <Card key={family.id} className="hover-elevate" data-testid={`card-family-${family.id}`}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg">{family.membreNom}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{family.adresse}</p>
                  <p className="text-sm text-muted-foreground">{family.telephone}</p>
                </div>
                {userProfile?.id === family.membreId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteFamily(family.id)}
                    data-testid="button-delete-family"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Membres ({family.membres.length})
                  </p>
                  {family.membres.map((membre, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {membre.prenom.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {membre.prenom} {membre.nom}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {membre.relation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
