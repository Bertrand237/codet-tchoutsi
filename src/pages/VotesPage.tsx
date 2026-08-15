'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { COLLECTIONS } from '@/lib/appwrite';
import {
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
} from '@/lib/db';
import { voteSchema, formatZodErrors } from '@/lib/validations';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Vote,
  Plus,
  Loader2,
  Calendar,
  User,
  BarChart3,
  Clock,
  X,
  Users,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import EmptyState from '@/components/EmptyState';

// ==================== Types ====================

interface PollOption {
  id: string;
  texte: string;
  votes: number;
}

interface Poll {
  $id: string;
  question: string;
  description: string;
  options: string;
  creePar: string;
  creeParNom: string;
  dateDebut: string;
  dateFin: string;
  actif: boolean;
  votants: string;
  createdAt: string;
}

// ==================== Poll Status Helpers ====================

function getPollStatus(poll: Poll): 'active' | 'expired' | 'closed' {
  if (!poll.actif) return 'closed';
  const now = new Date();
  const fin = poll.dateFin ? new Date(poll.dateFin) : null;
  if (fin && now > fin) return 'expired';
  return 'active';
}

function getStatusBorderClass(status: 'active' | 'expired' | 'closed'): string {
  switch (status) {
    case 'active': return 'border-l-4 border-l-emerald-500';
    case 'expired': return 'border-l-4 border-l-amber-500';
    case 'closed': return 'border-l-4 border-l-gray-400 dark:border-l-gray-600';
  }
}

function getStatusBadgeClass(status: 'active' | 'expired' | 'closed'): string {
  switch (status) {
    case 'active': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-0 px-3 py-0.5 rounded-full text-xs font-semibold';
    case 'expired': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-0 px-3 py-0.5 rounded-full text-xs font-semibold';
    case 'closed': return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border-0 px-3 py-0.5 rounded-full text-xs font-semibold';
  }
}

// ==================== Component ====================

export default function VotesPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const canManage = user && ['admin', 'président', 'secretaire', 'secretaire_general', 'trésorier', 'commissaire', 'membre'].includes(user.role);

  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState<string | null>(null);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDateDebut, setNewDateDebut] = useState('');
  const [newDateFin, setNewDateFin] = useState('');
  const [newOptions, setNewOptions] = useState<{ id: string; texte: string }[]>([
    { id: 'opt_1', texte: '' },
    { id: 'opt_2', texte: '' },
  ]);

  // ==================== Fetch Polls ====================

  const fetchPolls = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getDocs(
        query(COLLECTIONS.POLLS, orderBy('createdAt', 'desc'))
      );
      setPolls(result.documents as unknown as Poll[]);
    } catch (error) {
      console.error('Error fetching polls:', error);
      toast({ title: 'Erreur', description: 'Impossible de charger les sondages.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  // ==================== Helpers ====================

  const parseOptions = (jsonStr: string): PollOption[] => {
    try {
      return JSON.parse(jsonStr);
    } catch {
      return [];
    }
  };

  const parseVotants = (jsonStr: string): string[] => {
    try {
      return JSON.parse(jsonStr);
    } catch {
      return [];
    }
  };

  const isPollActive = (poll: Poll): boolean => {
    return getPollStatus(poll) === 'active';
  };

  const hasVoted = (poll: Poll): boolean => {
    if (!user) return false;
    const votants = parseVotants(poll.votants);
    return votants.includes(user.id);
  };

  const getTotalVotes = (poll: Poll): number => {
    const options = parseOptions(poll.options);
    return options.reduce((sum, opt) => sum + (opt.votes || 0), 0);
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  // ==================== Vote Handler ====================

  const handleVote = async (poll: Poll, optionId: string) => {
    if (!user || !isPollActive(poll) || hasVoted(poll)) return;

    setVotingId(poll.$id);
    try {
      const options = parseOptions(poll.options);
      const votants = parseVotants(poll.votants);

      const updatedOptions = options.map(opt =>
        opt.id === optionId ? { ...opt, votes: (opt.votes || 0) + 1 } : opt
      );
      const updatedVotants = [...votants, user.id];

      const now = new Date();
      const fin = poll.dateFin ? new Date(poll.dateFin) : null;
      const stillActive = fin ? now <= fin : true;

      await updateDoc(doc(COLLECTIONS.POLLS, poll.$id), {
        options: JSON.stringify(updatedOptions),
        votants: JSON.stringify(updatedVotants),
        actif: stillActive,
      });

      toast({ title: 'Vote enregistré', description: 'Votre vote a été pris en compte.' });
      fetchPolls();
    } catch (error) {
      console.error('Error voting:', error);
      toast({ title: 'Erreur', description: 'Impossible d\'enregistrer votre vote.', variant: 'destructive' });
    } finally {
      setVotingId(null);
    }
  };

  // ==================== Create Poll ====================

  const handleCreatePoll = async () => {
    const validOptions = newOptions.filter(o => o.texte.trim());
    const formData = {
      titre: newQuestion.trim(),
      description: newDescription.trim(),
      options: validOptions.map(o => o.texte.trim()),
    };
    const result = voteSchema.safeParse(formData);
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      const firstError = Object.values(errors)[0];
      toast({ title: 'Validation', description: firstError, variant: 'destructive' });
      return;
    }

    setCreateLoading(true);
    try {
      const optionsData = validOptions.map(o => ({ id: o.id, texte: o.texte.trim(), votes: 0 }));
      await addDoc(COLLECTIONS.POLLS, {
        question: newQuestion.trim(),
        description: newDescription.trim(),
        options: JSON.stringify(optionsData),
        creePar: user?.id || '',
        creeParNom: user?.displayName || '',
        dateDebut: newDateDebut || new Date().toISOString(),
        dateFin: newDateFin || '',
        actif: true,
        votants: JSON.stringify([]),
        createdAt: new Date().toISOString(),
      });

      toast({ title: 'Sondage créé', description: 'Le sondage a été publié avec succès.' });
      setCreateOpen(false);
      setNewQuestion('');
      setNewDescription('');
      setNewDateDebut('');
      setNewDateFin('');
      setNewOptions([
        { id: 'opt_1', texte: '' },
        { id: 'opt_2', texte: '' },
      ]);
      fetchPolls();
    } catch (error) {
      console.error('Error creating poll:', error);
      toast({ title: 'Erreur', description: 'Impossible de créer le sondage.', variant: 'destructive' });
    } finally {
      setCreateLoading(false);
    }
  };

  // ==================== Option Management ====================

  const addOption = () => {
    const newId = 'opt_' + (newOptions.length + 1) + '_' + Date.now();
    setNewOptions([...newOptions, { id: newId, texte: '' }]);
  };

  const removeOption = (id: string) => {
    if (newOptions.length <= 2) return;
    setNewOptions(newOptions.filter(o => o.id !== id));
  };

  const updateOptionText = (id: string, texte: string) => {
    setNewOptions(newOptions.map(o => o.id === id ? { ...o, texte } : o));
  };

  // ==================== Sort Polls ====================

  const sortedPolls = useMemo(() => {
    const active = polls.filter(p => isPollActive(p));
    const expired = polls.filter(p => !isPollActive(p));
    return [...active, ...expired];
  }, [polls]);

  const activeCount = useMemo(() => polls.filter(p => isPollActive(p)).length, [polls]);

  // ==================== Preview data for create dialog ====================

  const validPreviewOptions = newOptions.filter(o => o.texte.trim());

  // ==================== Render ====================

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
            <Vote className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">Votes et Sondages</h2>
              <Badge variant="outline" className="font-normal">
                {polls.length} sondage{polls.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">
              Participez aux consultations de la communauté
            </p>
          </div>
        </div>
        {canManage && (
          <Button onClick={() => setCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau sondage
          </Button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3.5 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="flex gap-4">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-11 w-full rounded-lg" />
                <Skeleton className="h-11 w-full rounded-lg" />
                <Skeleton className="h-11 w-4/5 rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && sortedPolls.length === 0 && (
        <EmptyState
          icon={BarChart3}
          title="Aucun sondage"
          description={
            canManage
              ? 'Créez le premier sondage pour consulter la communauté.'
              : 'Aucun sondage disponible pour le moment.'
          }
          action={canManage ? { label: 'Créer un sondage', onClick: () => setCreateOpen(true) } : undefined}
        />
      )}

      {/* Poll Cards */}
      {!loading && sortedPolls.map(poll => {
        const active = isPollActive(poll);
        const voted = hasVoted(poll);
        const options = parseOptions(poll.options);
        const totalVotes = getTotalVotes(poll);
        const maxVotes = Math.max(...options.map(o => o.votes || 0), 0);
        const winningOptionId = maxVotes > 0 ? options.find(o => (o.votes || 0) === maxVotes)?.id : null;
        const status = getPollStatus(poll);

        return (
          <Card
            key={poll.$id}
            className={`hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 ${getStatusBorderClass(status)}`}
          >
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold leading-tight">{poll.question}</CardTitle>
                  {poll.description && (
                    <CardDescription className="text-sm">{poll.description}</CardDescription>
                  )}
                </div>
                <Badge className={getStatusBadgeClass(status)}>
                  {status === 'active' ? (
                    <span className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      En cours
                    </span>
                  ) : status === 'expired' ? (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Expiré
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Fermé
                    </span>
                  )}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {poll.creeParNom}
                </span>
                {poll.dateFin && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Fin : {formatDate(poll.dateFin)}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-2.5">
              {/* Vote Results (already voted) */}
              {voted && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" />
                    Résultats ({totalVotes} vote{totalVotes !== 1 ? 's' : ''})
                  </p>
                  {options.map(opt => {
                    const pct = totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0;
                    const isWinner = opt.id === winningOptionId;
                    return (
                      <div key={opt.id} className="space-y-1.5">
                        <div className="h-8 w-full bg-muted rounded-full overflow-hidden relative">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ease-out ${
                              isWinner
                                ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                                : 'bg-gradient-to-r from-emerald-300 to-emerald-400 dark:from-emerald-600 dark:to-emerald-700'
                            }`}
                            style={{ width: `${pct}%` }}
                          >
                            {pct >= 15 && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-white">
                                {pct}%
                              </span>
                            )}
                          </div>
                          {pct < 15 && (
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                              {pct}%
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className={isWinner ? 'font-semibold text-emerald-700 dark:text-emerald-400' : 'font-medium'}>{opt.texte}</span>
                          <span className="text-muted-foreground text-xs font-mono">{opt.votes || 0} vote{opt.votes !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Vote Buttons (not voted and active) */}
              {!voted && active && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Choisissez une option :
                  </p>
                  {options.map(opt => (
                    <Button
                      key={opt.id}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-3 px-4 hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-950/30 dark:hover:border-emerald-700 active:scale-[0.98] transition-all duration-150"
                      disabled={votingId === poll.$id}
                      onClick={() => handleVote(poll, opt.id)}
                    >
                      {votingId === poll.$id && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      {opt.texte}
                    </Button>
                  ))}
                </div>
              )}

              {/* Expired and not voted */}
              {!voted && !active && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" />
                    Résultats finaux ({totalVotes} vote{totalVotes !== 1 ? 's' : ''})
                  </p>
                  {options.map(opt => {
                    const pct = totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0;
                    const isWinner = opt.id === winningOptionId;
                    return (
                      <div key={opt.id} className="space-y-1.5">
                        <div className="h-8 w-full bg-muted rounded-full overflow-hidden relative">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ease-out ${
                              isWinner
                                ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                                : 'bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700'
                            }`}
                            style={{ width: `${pct}%` }}
                          >
                            {pct >= 15 && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-white">
                                {pct}%
                              </span>
                            )}
                          </div>
                          {pct < 15 && (
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                              {pct}%
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className={isWinner ? 'font-semibold text-emerald-700 dark:text-emerald-400' : 'font-medium'}>{opt.texte}</span>
                          <span className="text-muted-foreground text-xs font-mono">{opt.votes || 0} vote{opt.votes !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* ==================== Create Poll Dialog ==================== */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un sondage</DialogTitle>
            <DialogDescription>
              Ajoutez une question et au moins 2 options de réponse.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Question Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Question</h4>
              <div className="space-y-2">
                <Label htmlFor="poll-question">Question *</Label>
                <Input
                  id="poll-question"
                  placeholder="Entrez la question du sondage"
                  value={newQuestion}
                  onChange={e => setNewQuestion(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="poll-desc">Description</Label>
                <Textarea
                  id="poll-desc"
                  placeholder="Description optionnelle"
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            {/* Dates Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Durée</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="poll-start">Date de début</Label>
                  <Input
                    id="poll-start"
                    type="datetime-local"
                    value={newDateDebut}
                    onChange={e => setNewDateDebut(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="poll-end">Date de fin</Label>
                  <Input
                    id="poll-end"
                    type="datetime-local"
                    value={newDateFin}
                    onChange={e => setNewDateFin(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Options Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">Options *</h4>
                <Button variant="ghost" size="sm" onClick={addOption} className="text-emerald-600">
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>
              {newOptions.map((opt, idx) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-6">{idx + 1}.</span>
                  <Input
                    placeholder={`Option ${idx + 1}`}
                    value={opt.texte}
                    onChange={e => updateOptionText(opt.id, e.target.value)}
                  />
                  {newOptions.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive hover:text-destructive"
                      onClick={() => removeOption(opt.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Preview Section */}
            {newQuestion.trim() && validPreviewOptions.length >= 2 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    Aperçu
                  </h4>
                  <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                    <p className="font-medium text-sm">{newQuestion.trim()}</p>
                    {newDescription.trim() && (
                      <p className="text-xs text-muted-foreground">{newDescription.trim()}</p>
                    )}
                    <div className="space-y-2">
                      {validPreviewOptions.map((opt, idx) => (
                        <div
                          key={opt.id}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-background text-sm"
                        >
                          <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                          <span>{opt.texte.trim()}</span>
                          <span className="ml-auto text-xs text-muted-foreground">Option {idx + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreatePoll}
              disabled={createLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {createLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Publier le sondage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
