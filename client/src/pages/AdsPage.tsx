import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Plus, Video, Upload, Trash2, Play, Pause, Pencil, Download } from "lucide-react";
import type { Advertisement } from "@shared/schema";
import { addDoc, db, deleteDoc, doc, getDocs, getDownloadURL, query, ref, storage, toDate, updateDoc, uploadBytesResumable, orderBy } from '@/lib/firebase-compat';

export default function AdsPage() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const canManageAds = userProfile && (userProfile.role === "admin" || userProfile.role === "président");
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deletingAdId, setDeletingAdId] = useState<string | null>(null);

  useEffect(() => {
    fetchAds();
  }, []);

  async function fetchAds() {
    try {
      const adsRef = "ads";
      const q = query(adsRef, orderBy("createdAt", "desc"));

      const snapshot = await getDocs(q);
      const adsData = snapshot.documents.map((doc) => ({
        id: doc.$id,
        title: doc.title,
        videoUrl: doc.videoUrl || doc.videoURL,
        isActive: doc.isActive !== undefined ? doc.isActive : doc.active,
        order: doc.order || 0,
        createdAt: toDate(doc.createdAt) || new Date(),
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
    setUploadProgress(0);

    try {
      const storageRef = ref(storage, `ads/${Date.now()}_${videoFile.name}`);
      const uploadTask = uploadBytesResumable(storageRef, videoFile);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Upload error:", error);
          toast({
            variant: "destructive",
            title: "Erreur de téléchargement",
            description: "Impossible de télécharger la vidéo",
          });
          setSubmitting(false);
          setUploadProgress(0);
        },
        async () => {
          try {
            const snapshot = await uploadTask;
            const videoURL = await getDownloadURL(snapshot.ref);

            const adData = {
              title: formData.title,
              description: "",
              videoUrl: videoURL,
              isActive: formData.active,
              createdBy: "admin",
              createdAt: new Date().toISOString(),
            };

            await addDoc("ads", adData);

            toast({
              title: "Publicité ajoutée",
              description: "La vidéo publicitaire a été enregistrée",
            });

            setDialogOpen(false);
            setFormData({ title: "", active: true, order: 0 });
            setVideoFile(null);
            setUploadProgress(0);
            setSubmitting(false);
            fetchAds();
          } catch (error) {
            console.error("Error after upload:", error);
            toast({
              variant: "destructive",
              title: "Erreur",
              description: "Impossible de finaliser l'ajout de la publicité",
            });
            setSubmitting(false);
            setUploadProgress(0);
          }
        }
      );
    } catch (error) {
      console.error("Error creating ad:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'ajouter la publicité",
      });
      setSubmitting(false);
      setUploadProgress(0);
    }
  }

  async function toggleAdStatus(adId: string, currentStatus: boolean) {
    try {
      await updateDoc({ collectionId: "ads", id: adId }, {
        isActive: !currentStatus,
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

  async function downloadVideo(videoUrl: string, title: string) {
    try {
      toast({
        title: "Téléchargement en cours...",
        description: "Le téléchargement de la vidéo va commencer",
      });

      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/[^a-z0-9]/gi, '_')}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Téléchargement réussi",
        description: "La vidéo a été téléchargée",
      });
    } catch (error) {
      console.error("Error downloading video:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de télécharger la vidéo",
      });
    }
  }

  function handleEditAd(ad: Advertisement) {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      active: ad.isActive,
      order: ad.order,
    });
    setVideoFile(null);
    setEditDialogOpen(true);
  }

  async function handleUpdateAd(e: React.FormEvent) {
    e.preventDefault();
    if (!editingAd) return;

    setSubmitting(true);

    try {
      const updateData: any = {
        title: formData.title,
        isActive: formData.active,
        order: formData.order,
      };

      await updateDoc({ collectionId: "ads", id: editingAd.id }, updateData);

      toast({
        title: "Publicité modifiée",
        description: "La publicité a été mise à jour avec succès",
      });

      setEditDialogOpen(false);
      setEditingAd(null);
      setFormData({ title: "", active: true, order: 0 });
      fetchAds();
    } catch (error) {
      console.error("Error updating ad:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de modifier la publicité",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteAd() {
    if (!deletingAdId) return;

    try {
      await deleteDoc({ collectionId: "ads", id: deletingAdId });
      toast({
        title: "Publicité supprimée",
        description: "La publicité a été supprimée avec succès",
      });
      setDeletingAdId(null);
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
        {canManageAds && (
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setFormData({ title: "", active: true, order: 0 });
              setVideoFile(null);
              setUploadProgress(0);
            }
          }}>
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

                {submitting && uploadProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Téléchargement en cours...</span>
                      <span className="font-medium">{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" data-testid="upload-progress" />
                  </div>
                )}

                <DialogFooter>
                  <Button type="submit" disabled={submitting} data-testid="button-submit-ad">
                    {submitting ? `Téléchargement... ${Math.round(uploadProgress)}%` : "Ajouter"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
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
                {ad.isActive ? (
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
                    src={ad.videoUrl}
                    controls
                    className="w-full h-full object-cover"
                    data-testid="video-preview"
                  >
                    Votre navigateur ne supporte pas la lecture vidéo.
                  </video>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadVideo(ad.videoUrl, ad.title)}
                    data-testid={`button-download-ad-${ad.id}`}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Télécharger
                  </Button>
                  {canManageAds && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAdStatus(ad.id, ad.isActive)}
                        data-testid={`button-toggle-status-${ad.id}`}
                      >
                        {ad.isActive ? "Désactiver" : "Activer"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditAd(ad)}
                        data-testid={`button-edit-ad-${ad.id}`}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeletingAdId(ad.id)}
                        data-testid={`button-delete-ad-${ad.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) {
          setEditingAd(null);
          setFormData({ title: "", active: true, order: 0 });
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier la publicité</DialogTitle>
            <DialogDescription>
              Modifiez les informations de la publicité
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateAd} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Titre</Label>
              <Input
                id="edit-title"
                type="text"
                placeholder="Titre de la publicité"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                data-testid="input-edit-title"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-order">Ordre d'affichage</Label>
              <Input
                id="edit-order"
                type="number"
                min="0"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                data-testid="input-edit-order"
                className="h-12"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                data-testid="checkbox-edit-active"
                className="h-4 w-4"
              />
              <Label htmlFor="edit-active" className="cursor-pointer">
                Activer la publicité
              </Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={submitting}
                data-testid="button-cancel-edit-ad"
              >
                Annuler
              </Button>
              <Button type="submit" disabled={submitting} data-testid="button-save-edit-ad">
                {submitting ? "Mise à jour..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingAdId} onOpenChange={(open) => !open && setDeletingAdId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette publicité ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La publicité sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-ad">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAd}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-ad"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
