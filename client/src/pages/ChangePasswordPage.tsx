import { useState } from "react";
import { useLocation } from "wouter";
import { account } from "@/lib/appwrite";
import { updateDoc } from "@/lib/firebase-compat";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LockKeyhole } from "lucide-react";

export default function ChangePasswordPage() {
  const { userProfile } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("123456");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Mot de passe trop court",
        description: "Le nouveau mot de passe doit contenir au moins 6 caractères.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Confirmation incorrecte",
        description: "Les deux nouveaux mots de passe ne correspondent pas.",
      });
      return;
    }

    if (!userProfile) return;
    setLoading(true);

    try {
      await account.updatePassword(newPassword, currentPassword);
      await updateDoc(
        { collectionId: "users", id: userProfile.id },
        { mustChangePassword: false },
      );
      toast({
        title: "Mot de passe mis à jour",
        description: "Votre compte est maintenant sécurisé.",
      });
      window.location.href = "/dashboard";
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Impossible de modifier le mot de passe",
        description: error?.message || "Vérifiez le mot de passe actuel et réessayez.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4">
      <Card className="w-full max-w-md border-2">
        <CardHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <CardTitle>Choisissez votre mot de passe</CardTitle>
          <CardDescription>
            Pour votre première connexion, remplacez le mot de passe provisoire par un mot de passe personnel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Mot de passe provisoire</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
                className="h-12"
                data-testid="input-current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                minLength={6}
                className="h-12"
                data-testid="input-new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Confirmer le nouveau mot de passe</Label>
              <Input
                id="confirm-new-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={6}
                className="h-12"
                data-testid="input-confirm-new-password"
              />
            </div>
            <Button type="submit" className="h-12 w-full" disabled={loading} data-testid="button-change-password">
              {loading ? "Mise à jour..." : "Enregistrer mon mot de passe"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}