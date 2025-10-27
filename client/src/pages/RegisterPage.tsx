import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [profession, setProfession] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères",
      });
      return;
    }

    setLoading(true);

    try {
      // Tout le monde est "membre" par défaut (sauf le premier qui devient admin automatiquement)
      await signUp(email, password, displayName, "membre", profession);
      toast({
        title: "Bienvenue !",
        description: "Votre compte a été créé avec succès",
      });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur d'inscription",
        description: error.message || "Une erreur est survenue lors de la création du compte",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary mb-4">
            <span className="text-3xl font-bold text-primary-foreground">C</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">CODET</h1>
          <p className="text-muted-foreground">Comité de Développement Tchoutsi</p>
        </div>

        <Card className="border-2">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Inscription</CardTitle>
            <CardDescription>
              Créez votre compte pour rejoindre le comité
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Nom complet</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Jean Dupont"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  data-testid="input-displayname"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profession">Profession</Label>
                <Input
                  id="profession"
                  type="text"
                  placeholder="Ingénieur, Médecin, Étudiant..."
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  data-testid="input-profession"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="exemple@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-email"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    data-testid="input-password"
                    className="h-12 pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-10 w-10"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  data-testid="input-confirm-password"
                  className="h-12"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12"
                disabled={loading}
                data-testid="button-register"
              >
                {loading ? "Création du compte..." : "S'inscrire"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Déjà un compte ?{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary hover:underline cursor-pointer"
                  data-testid="link-login"
                >
                  Se connecter
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
