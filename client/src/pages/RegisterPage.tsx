import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Check, Search } from "lucide-react";
import { directoryMembers, type DirectoryMember } from "@shared/directory";

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [profession, setProfession] = useState("");
  const [selectedMember, setSelectedMember] = useState<DirectoryMember | null>(null);
  const [loading, setLoading] = useState(false);
  const { signUpFromDirectory } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMember) {
      toast({
        variant: "destructive",
        title: "Choisissez votre nom",
        description: "Sélectionnez votre nom dans les propositions de l'annuaire.",
      });
      return;
    }

    setLoading(true);

    try {
      await signUpFromDirectory(selectedMember);
      toast({
        title: "Bienvenue !",
        description: "Votre compte a été créé. Vous allez choisir un nouveau mot de passe.",
      });
      setLocation("/change-password");
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
                <Label htmlFor="displayName">Recherchez votre nom dans l'annuaire</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Commencez à saisir votre nom"
                    value={displayName}
                    onChange={(e) => {
                      setDisplayName(e.target.value);
                      setSelectedMember(null);
                    }}
                    required
                    autoComplete="off"
                    data-testid="input-displayname"
                    className="h-12 pl-10"
                  />
                  {displayName.trim() && !selectedMember && (
                    <div className="absolute left-0 right-0 top-14 z-20 max-h-64 overflow-y-auto rounded-md border bg-popover p-1 shadow-lg">
                      {directoryMembers
                        .filter((member) =>
                          member.fullName.toLocaleLowerCase("fr-FR").includes(displayName.trim().toLocaleLowerCase("fr-FR")),
                        )
                        .map((member) => (
                          <button
                            key={member.id}
                            type="button"
                            className="flex w-full items-center justify-between rounded-sm px-3 py-3 text-left hover:bg-accent"
                            onClick={() => {
                              setSelectedMember(member);
                              setDisplayName(member.fullName);
                            }}
                          >
                            <span>
                              <span className="block font-medium">{member.fullName}</span>
                              <span className="text-xs text-muted-foreground">
                                {member.delegation}{member.phone ? ` • ${member.phone}` : ""}
                              </span>
                            </span>
                          </button>
                        ))}
                      {directoryMembers.filter((member) =>
                        member.fullName.toLocaleLowerCase("fr-FR").includes(displayName.trim().toLocaleLowerCase("fr-FR")),
                      ).length === 0 && (
                        <p className="px-3 py-3 text-sm text-muted-foreground">Aucune correspondance dans l'annuaire.</p>
                      )}
                    </div>
                  )}
                </div>
                {selectedMember && (
                  <p className="flex items-center gap-1 text-sm text-primary">
                    <Check className="h-4 w-4" />
                    Nom sélectionné : {selectedMember.fullName}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Le compte sera créé automatiquement avec le mot de passe provisoire 123456.
                </p>
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
