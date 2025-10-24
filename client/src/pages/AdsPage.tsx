import { useEffect, useState } from "react";
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Video, Upload, Trash2, Play, Pause } from "lucide-react";
import type { Advertisement } from "@shared/schema";

export default function AdsPage() {
  const { toast } = useToast();
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    active: true,
    order: 0,
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);

  useEffect(() => {
    fetchAds();
  }, []);

  async function fetchAds() {
    try {
      const adsRef = collection(db, "advertisements");
      const q = query(adsRef, orderBy("order", "asc"));

      const snapshot = await getDocs(q);
      const adsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Advertisement[];

      setAds(adsData);
    } catch (error) {
      console.error("Error fetching ads:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les publicités",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!videoFile) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez sélectionner une vidéo",
      });
      return;
    }

    setSubmitting(true);

    try {
      const storageRef = ref(storage, `ads/${Date.now()}_${videoFile.name}`);
      await uploadBytes(storageRef, videoFile);
      const videoURL = await getDownloadURL(storageRef);

      const adData = {
        title: formData.title,
        videoURL,
        active: formData.active,
        order: formData.order,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "advertisements"), adData);

      toast({
        title: "Publicité ajoutée",
        description: "La vidéo publicitaire a été enregistrée",
      });

      setDialogOpen(false);
      setFormData({ title: "", active: true, order: 0 });
      setVideoFile(null);
      fetchAds();
    } catch (error) {
      console.error("Error creating ad:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'ajouter la publicité",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleAdStatus(adId: string, currentStatus: boolean) {
    try {
      await updateDoc(doc(db, "advertisements", adId), {
        active: !currentStatus,
      });

      toast({
        title: !currentStatus ? "Publicité activée" : "Publicité désactivée",
        description: "Le statut a été mis à jour",
      });

      fetchAds();
    } catch (error) {
      console.error("Error toggling ad status:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
      });
    }
  }

  async function deleteAd(adId: string) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette publicité ?")) return;

    try {
      await deleteDoc(doc(db, "advertisements", adId));
      toast({
        title: "Publicité supprimée",
        description: "La publicité a été supprimée avec succès",
      });
      fetchAds();
    } catch (error) {
      console.error("Error deleting ad:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer la publicité",
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
          <h1 className="text-3xl font-bold text-foreground">Publicités</h1>
          <p className="text-muted-foreground">Gestion des vidéos publicitaires</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-ad">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Publicité
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Ajouter une publicité</DialogTitle>
              <DialogDescription>
                Téléchargez une vidéo publicitaire pour l'affichage
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Titre de la publicité"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  data-testid="input-title"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="video">Fichier vidéo</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="video"
                    type="file"
                    accept="video/*"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                    required
                    data-testid="input-video"
                    className="h-12"
                  />
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Ordre d'affichage</Label>
                <Input
                  id="order"
                  type="number"
                  min="0"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  data-testid="input-order"
                  className="h-12"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  data-testid="checkbox-active"
                  className="h-4 w-4"
                />
                <Label htmlFor="active" className="cursor-pointer">
                  Activer immédiatement
                </Label>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={submitting} data-testid="button-submit-ad">
                  {submitting ? "Téléchargement..." : "Ajouter"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {ads.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Video className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">Aucune publicité enregistrée</p>
            </CardContent>
          </Card>
        ) : (
          ads.map((ad) => (
            <Card key={ad.id} className="hover-elevate" data-testid={`card-ad-${ad.id}`}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg">{ad.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Ordre: {ad.order}</p>
                </div>
                {ad.active ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                    <Play className="h-3 w-3 mr-1" />
                    Actif
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <Pause className="h-3 w-3 mr-1" />
                    Inactif
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
                  <video
                    src={ad.videoURL}
                    controls
                    className="w-full h-full object-cover"
                    data-testid="video-preview"
                  >
                    Votre navigateur ne supporte pas la lecture vidéo.
                  </video>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAdStatus(ad.id, ad.active)}
                    data-testid="button-toggle-status"
                  >
                    {ad.active ? "Désactiver" : "Activer"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteAd(ad.id)}
                    data-testid="button-delete-ad"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
