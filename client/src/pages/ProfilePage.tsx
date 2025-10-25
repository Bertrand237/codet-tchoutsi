import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Shield, Calendar, Edit, Save, X, Upload } from "lucide-react";
import { updateDoc, ref, storage, uploadBytesResumable, getDownloadURL } from '@/lib/firebase-compat';
import { Progress } from "@/components/ui/progress";

export default function ProfilePage() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    displayName: userProfile?.displayName || "",
    photoURL: userProfile?.photoURL || "",
  });

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Chargement du profil...</p>
      </div>
    );
  }

  async function handlePhotoUpload(file: File) {
    if (!userProfile) return;
    
    setUploading(true);
    setUploadProgress(0);

    try {
      const storageRef = ref(storage, `profiles/${userProfile.id}_${Date.now()}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

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
            title: "Erreur",
            description: "Impossible de télécharger la photo",
          });
          setUploading(false);
        },
        async () => {
          const snapshot = await uploadTask;
          const photoURL = await getDownloadURL(snapshot.ref);
          setFormData({ ...formData, photoURL });
          setUploading(false);
          setUploadProgress(0);
          
          toast({
            title: "Photo téléchargée",
            description: "N'oubliez pas de sauvegarder les modifications",
          });
        }
      );
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de télécharger la photo",
      });
      setUploading(false);
      setUploadProgress(0);
    }
  }

  async function handleSave() {
    if (!userProfile) return;
    
    try {
      await updateDoc(
        { collectionId: "users", id: userProfile.id },
        {
          displayName: formData.displayName,
          photoURL: formData.photoURL,
        }
      );

      toast({
        title: "Profil mis à jour",
        description: "Vos modifications ont été enregistrées",
      });

      setIsEditing(false);
      window.location.reload(); // Recharger pour mettre à jour le contexte
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour le profil",
      });
    }
  }

  function handleCancel() {
    if (!userProfile) return;
    
    setFormData({
      displayName: userProfile.displayName,
      photoURL: userProfile.photoURL || "",
    });
    setIsEditing(false);
  }

  const roleColors: Record<string, string> = {
    admin: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
    président: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300",
    trésorier: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
    commissaire: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
    membre: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
    visiteur: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300",
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mon Profil</h1>
        <p className="text-muted-foreground">Gérez vos informations personnelles</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Informations du profil</CardTitle>
            <CardDescription>Vos informations personnelles CODET</CardDescription>
          </div>
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              data-testid="button-edit-profile"
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                data-testid="button-cancel-edit"
              >
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={uploading}
                data-testid="button-save-profile"
              >
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-6">
            <div className="space-y-2">
              <Avatar className="h-24 w-24">
                <AvatarImage src={isEditing ? formData.photoURL : userProfile.photoURL} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {userProfile.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <div>
                  <Label htmlFor="photo-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                      <Upload className="h-4 w-4" />
                      Changer la photo
                    </div>
                  </Label>
                  <Input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoUpload(file);
                    }}
                    className="hidden"
                    data-testid="input-photo-upload"
                  />
                  {uploading && uploadProgress > 0 && (
                    <div className="mt-2 space-y-1">
                      <Progress value={uploadProgress} className="h-1" />
                      <p className="text-xs text-muted-foreground">{Math.round(uploadProgress)}%</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">
                  <User className="h-4 w-4 inline mr-2" />
                  Nom d'affichage
                </Label>
                {isEditing ? (
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    data-testid="input-display-name"
                    className="h-12"
                  />
                ) : (
                  <p className="text-lg font-medium" data-testid="text-display-name">
                    {userProfile.displayName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  <Mail className="h-4 w-4 inline mr-2" />
                  Email
                </Label>
                <p className="text-lg text-muted-foreground" data-testid="text-email">
                  {userProfile.email}
                </p>
                <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié</p>
              </div>

              <div className="space-y-2">
                <Label>
                  <Shield className="h-4 w-4 inline mr-2" />
                  Rôle
                </Label>
                <div>
                  <Badge className={roleColors[userProfile.role]} data-testid="badge-role">
                    {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Contactez un administrateur pour modifier votre rôle
                </p>
              </div>

              {userProfile.createdAt && (
                <div className="space-y-2">
                  <Label>
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Membre depuis
                  </Label>
                  <p className="text-muted-foreground" data-testid="text-created-at">
                    {new Date(userProfile.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations sur le rôle</CardTitle>
          <CardDescription>Privilèges et autorisations de votre rôle</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {userProfile.role === "admin" && (
              <div className="space-y-2">
                <p className="font-medium text-primary">Administrateur</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Accès complet à toutes les fonctionnalités</li>
                  <li>Gestion des utilisateurs et des rôles</li>
                  <li>Validation des paiements</li>
                  <li>Gestion du blog et des publicités</li>
                  <li>Gestion des projets et du budget</li>
                </ul>
              </div>
            )}
            {userProfile.role === "président" && (
              <div className="space-y-2">
                <p className="font-medium text-primary">Président</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Validation des paiements</li>
                  <li>Gestion du blog et des publicités</li>
                  <li>Création et gestion des projets</li>
                  <li>Création de sondages</li>
                </ul>
              </div>
            )}
            {userProfile.role === "trésorier" && (
              <div className="space-y-2">
                <p className="font-medium text-primary">Trésorier</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Validation des paiements</li>
                  <li>Gestion du budget et des transactions</li>
                  <li>Consultation des rapports financiers</li>
                </ul>
              </div>
            )}
            {(userProfile.role === "commissaire" || userProfile.role === "membre") && (
              <div className="space-y-2">
                <p className="font-medium text-primary">
                  {userProfile.role === "commissaire" ? "Commissaire" : "Membre"}
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Enregistrement des paiements</li>
                  <li>Participation aux votes</li>
                  <li>Lecture du blog public</li>
                  <li>Accès au chat du comité</li>
                </ul>
              </div>
            )}
            {userProfile.role === "visiteur" && (
              <div className="space-y-2">
                <p className="font-medium text-muted-foreground">Visiteur</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Accès en lecture seule</li>
                  <li>Consultation du blog public</li>
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
