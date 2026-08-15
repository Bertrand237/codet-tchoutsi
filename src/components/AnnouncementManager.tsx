'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Megaphone, Plus, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { COLLECTIONS } from '@/lib/appwrite';
import {
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  where,
  orderBy,
  toDate,
} from '@/lib/db';
import { useToast } from '@/hooks/use-toast';

interface Announcement {
  $id: string;
  title: string;
  content?: string;
  isPublished: boolean;
  author?: string;
  createdAt: string;
}

interface AnnouncementManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDate(dateStr: string): string {
  try {
    const d = toDate(dateStr);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Date inconnue';
  }
}

export default function AnnouncementManager({
  open,
  onOpenChange,
}: AnnouncementManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Create form
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  // Delete confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      let docs: Announcement[] = [];
      try {
        const result = await getDocs(
          query(
            COLLECTIONS.BLOG_POSTS,
            where('type', '==', 'announcement'),
            orderBy('createdAt', 'desc')
          )
        );
        docs = result.documents as unknown as Announcement[];
      } catch {
        const allResult = await getDocs(COLLECTIONS.BLOG_POSTS);
        docs = (allResult.documents as unknown as Announcement[])
          .filter((d) => d.type === 'announcement')
          .sort((a, b) => {
            try {
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            } catch {
              return 0;
            }
          });
      }
      setAnnouncements(docs);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les annonces.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (open) {
      fetchAnnouncements();
      setNewTitle('');
      setNewContent('');
    }
  }, [open, fetchAnnouncements]);

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      toast({
        title: 'Titre requis',
        description: 'Veuillez saisir un titre pour l\'annonce.',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    try {
      await addDoc(COLLECTIONS.BLOG_POSTS, {
        title: newTitle.trim(),
        content: newContent.trim(),
        type: 'announcement',
        isPublished: true,
        author: user?.displayName || '',
        createdAt: serverTimestamp(),
      });
      setNewTitle('');
      setNewContent('');
      toast({
        title: 'Annonce créée',
        description: 'L\'annonce a été publiée avec succès.',
      });
      await fetchAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer l\'annonce.',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleTogglePublished = async (announcement: Announcement) => {
    setTogglingId(announcement.$id);
    try {
      await updateDoc(doc(COLLECTIONS.BLOG_POSTS, announcement.$id), {
        isPublished: !announcement.isPublished,
      });
      toast({
        title: announcement.isPublished ? 'Annonce dépubliée' : 'Annonce publiée',
      });
      await fetchAnnouncements();
    } catch (error) {
      console.error('Error toggling announcement:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut.',
        variant: 'destructive',
      });
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDelete = (id: string) => {
    setPendingDeleteId(id);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!pendingDeleteId) return;
    setDeletingId(pendingDeleteId);
    try {
      await deleteDoc(doc(COLLECTIONS.BLOG_POSTS, pendingDeleteId));
      toast({
        title: 'Annonce supprimée',
      });
      await fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'annonce.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
      setPendingDeleteId(null);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-amber-500" />
              Gestion des annonces
            </DialogTitle>
            <DialogDescription>
              Créez et gérez les annonces qui apparaissent en haut du tableau de bord.
            </DialogDescription>
          </DialogHeader>

          {/* Create form */}
          <div className="space-y-3 py-2">
            <Input
              placeholder="Titre de l'annonce"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              disabled={creating}
            />
            <Textarea
              placeholder="Contenu de l'annonce (optionnel)"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={3}
              disabled={creating}
            />
            <Button
              onClick={handleCreate}
              disabled={creating || !newTitle.trim()}
              className="w-full"
              size="sm"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Publier l'annonce
            </Button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto -mx-6 px-6 max-h-60">
            <div className="space-y-2">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-48 rounded" />
                      <Skeleton className="h-3 w-24 rounded" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                ))
              ) : announcements.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Aucune annonce pour le moment.
                </p>
              ) : (
                announcements.map((a) => (
                  <div
                    key={a.$id}
                    className="flex items-start gap-3 py-3 border-b last:border-0"
                  >
                    <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0 mt-0.5">
                      <Megaphone className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">
                          {formatDate(a.createdAt)}
                        </p>
                        {a.isPublished ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-400 text-emerald-700 dark:border-emerald-600 dark:text-emerald-400 text-[10px] px-1.5 py-0"
                          >
                            Publiée
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0"
                          >
                            Brouillon
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleTogglePublished(a)}
                        disabled={togglingId === a.$id}
                        aria-label={
                          a.isPublished
                            ? "Dépublier l'annonce"
                            : "Publier l'annonce"
                        }
                      >
                        {togglingId === a.$id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : a.isPublished ? (
                          <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:text-red-600 dark:hover:text-red-400"
                        onClick={() => confirmDelete(a.$id)}
                        disabled={deletingId === a.$id}
                        aria-label="Supprimer l'annonce"
                      >
                        {deletingId === a.$id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l\'annonce ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L\'annonce sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
