import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Vote, Plus, Users, CheckCircle, Calendar } from "lucide-react";
import type { Poll, PollOption } from "@shared/schema";
import { Timestamp, addDoc, arrayUnion, db, doc, getDocs, query, serverTimestamp, toDate, updateDoc, orderBy } from '@/lib/firebase-compat';

export default function VotesPage() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    question: "",
    description: "",
    dateDebut: new Date().toISOString().split('T')[0],
    dateFin: "",
    options: ["", ""],
  });

  const canManagePolls = userProfile?.role === "admin" || userProfile?.role === "président";

  useEffect(() => {
    fetchPolls();
  }, []);

  async function fetchPolls() {
    try {
      const pollsRef = "polls";
      const q = query(pollsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);      const pollsData = snapshot.documents.map((doc) => {
        const data = doc;
        return {
          id: doc.$id,
          ...data,
          dateDebut: toDate(data.dateDebut),
          dateFin: toDate(data.dateFin),
          createdAt: toDate(data.createdAt),
        };
      }) as Poll[];

      setPolls(pollsData);
    } catch (error) {
      console.error("Error fetching polls:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les sondages",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!canManagePolls) {
      toast({
        variant: "destructive",
        title: "Permission refusée",
        description: "Vous n'avez pas les permissions pour créer des sondages",
      });
      return;
    }

    const validOptions = formData.options.filter((o) => o.trim() !== "");
    if (validOptions.length < 2) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez ajouter au moins 2 options",
      });
      return;
    }

    setSubmitting(true);

    try {
      const pollData = {
        question: formData.question,
        description: formData.description,
        options: validOptions.map((texte, index) => ({
          id: `option-${index}`,
          texte,
          votes: 0,
        })),
        creePar: userProfile.id,
        creeParNom: userProfile.displayName,
        dateDebut: new Date(new Date(formData.dateDebut).toISOString()),
        dateFin: new Date(new Date(formData.dateFin).toISOString()),
        actif: true,
        votants: [],
        createdAt: serverTimestamp(),
      };

      await addDoc("polls", pollData);

      toast({
        title: "Sondage créé",
        description: "Le sondage a été créé avec succès",
      });

      setDialogOpen(false);
      setFormData({
        question: "",
        description: "",
        dateDebut: new Date().toISOString().split('T')[0],
        dateFin: "",
        options: ["", ""],
      });
      fetchPolls();
    } catch (error) {
      console.error("Error creating poll:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de créer le sondage",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVote(pollId: string, optionId: string) {
    if (!userProfile) return;

    const poll = polls.find((p) => p.id === pollId);
    if (!poll) return;

    if (poll.votants?.includes(userProfile.id)) {
      toast({
        variant: "destructive",
        title: "Déjà voté",
        description: "Vous avez déjà voté pour ce sondage",
      });
      return;
    }

    if (!poll.actif || poll.dateFin < new Date()) {
      toast({
        variant: "destructive",
        title: "Sondage fermé",
        description: "Ce sondage est terminé",
      });
      return;
    }

    try {
      const pollRef = doc(db, "polls", pollId);
      const updatedOptions = poll.options.map((opt) =>
        opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
      );

      await updateDoc(pollRef, {
        options: updatedOptions,
        votants: arrayUnion(userProfile.id),
      });

      toast({
        title: "Vote enregistré",
        description: "Votre vote a été enregistré avec succès",
      });

      fetchPolls();
    } catch (error) {
      console.error("Error voting:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'enregistrer votre vote",
      });
    }
  }

  function addOption() {
    setFormData({ ...formData, options: [...formData.options, ""] });
  }

  function removeOption(index: number) {
    if (formData.options.length > 2) {
      setFormData({
        ...formData,
        options: formData.options.filter((_, i) => i !== index),
      });
    }
  }

  function updateOption(index: number, value: string) {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  }

  const activePolls = polls.filter((p) => p.actif && p.dateFin >= new Date());
  const closedPolls = polls.filter((p) => !p.actif || p.dateFin < new Date());

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
          <h1 className="text-3xl font-bold text-foreground">Votes & Sondages</h1>
          <p className="text-muted-foreground">Participez aux décisions du comité</p>
        </div>
        {canManagePolls && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-poll">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau Sondage
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer un sondage</DialogTitle>
                <DialogDescription>
                  Posez une question aux membres du comité
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="question">Question *</Label>
                    <Input
                      id="question"
                      required
                      value={formData.question}
                      onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                      placeholder="Ex: Quel jour pour la prochaine réunion?"
                      className="h-12"
                      data-testid="input-question"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Détails supplémentaires..."
                      rows={2}
                      data-testid="input-description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateDebut">Date début *</Label>
                      <Input
                        id="dateDebut"
                        type="date"
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
                        type="date"
                        required
                        value={formData.dateFin}
                        onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
                        className="h-12"
                        data-testid="input-date-fin"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Options de réponse *</Label>
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="h-12"
                          data-testid={`input-option-${index}`}
                        />
                        {formData.options.length > 2 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeOption(index)}
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addOption}
                      className="w-full"
                    >
                      + Ajouter une option
                    </Button>
                  </div>
                </div>

                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={submitting} data-testid="button-submit-poll">
                    {submitting ? "Création..." : "Créer"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sondages</CardTitle>
            <Vote className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{polls.length}</div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actifs</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activePolls.length}</div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminés</CardTitle>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{closedPolls.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Polls */}
      {activePolls.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Sondages actifs</h2>
          {activePolls.map((poll) => {
            const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
            const hasVoted = poll.votants?.includes(userProfile?.id || "");

            return (
              <Card key={poll.id} data-testid={`card-poll-${poll.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{poll.question}</CardTitle>
                      {poll.description && (
                        <p className="text-sm text-muted-foreground mt-1">{poll.description}</p>
                      )}
                    </div>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                      Actif
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Jusqu'au {poll.dateFin.toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {poll.options.map((option) => {
                      const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;

                      return (
                        <div key={option.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{option.texte}</span>
                            <span className="text-sm text-muted-foreground">
                              {option.votes} ({percentage.toFixed(0)}%)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={percentage} className="flex-1" />
                            {!hasVoted && (
                              <Button
                                size="sm"
                                onClick={() => handleVote(poll.id, option.id)}
                                data-testid={`button-vote-${option.id}`}
                              >
                                Voter
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {hasVoted && (
                      <div className="flex items-center gap-2 text-sm text-green-600 mt-4">
                        <CheckCircle className="h-4 w-4" />
                        Vous avez voté
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Closed Polls */}
      {closedPolls.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Sondages terminés</h2>
          {closedPolls.map((poll) => {
            const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);

            return (
              <Card key={poll.id} className="opacity-75">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">{poll.question}</CardTitle>
                      {poll.description && (
                        <p className="text-sm text-muted-foreground mt-1">{poll.description}</p>
                      )}
                    </div>
                    <Badge variant="outline">Terminé</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <Users className="h-4 w-4" />
                    {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {poll.options.map((option) => {
                      const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;

                      return (
                        <div key={option.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{option.texte}</span>
                            <span className="text-sm text-muted-foreground">
                              {option.votes} ({percentage.toFixed(0)}%)
                            </span>
                          </div>
                          <Progress value={percentage} />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {polls.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <Vote className="h-12 w-12 mb-4 opacity-50" />
              <p>Aucun sondage disponible</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
