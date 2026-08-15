'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  Heart,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Trash2,
  Loader2,
  ImagePlus,
  Image as ImageIcon,
  Search,
  Download,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogOverlay,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { COLLECTIONS, GALLERY_BUCKET_ID } from '@/lib/appwrite';
import {
  storageObj,
  uploadBytes,
  getDownloadURL,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  orderBy,
  where,
  query,
} from '@/lib/db';
import EmptyState from '@/components/EmptyState';

// ==================== Types ====================

interface GalleryItem {
  $id: string;
  title: string;
  description: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl: string;
  videoUrl?: string;
  uploaderId: string;
  uploaderName: string;
  likes: string[];
  createdAt: string;
}

interface UploadForm {
  title: string;
  description: string;
  file: File | null;
  videoUrl: string;
  type: 'image' | 'video';
}

// ==================== Helper: Format Date ====================

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

// ==================== Helper: Format File Size ====================

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

// ==================== Helper: Get Initials ====================

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// ==================== Skeleton Grid ====================

function SkeletonGrid() {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="break-inside-avoid">
          <Skeleton className="w-full rounded-xl aspect-[4/3]" />
          <div className="pt-3 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== Gallery Page ====================

export default function GalleryPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Data state
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Dialog state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Upload form state
  const [uploadForm, setUploadForm] = useState<UploadForm>({
    title: '',
    description: '',
    file: null,
    videoUrl: '',
    type: 'image',
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');

  // Admin check
  const isAdmin =
    user?.role === 'admin' ||
    user?.role === 'président' ||
    user?.role === 'secretaire' ||
    user?.role === 'secretaire_general' ||
    user?.role === 'celcom' ||
    user?.role === 'responsable_communication';

  // ==================== Computed Stats ====================

  const stats = {
    total: items.length,
    photos: items.filter((i) => i.type === 'image').length,
    videos: items.filter((i) => i.type === 'video').length,
  };

  // ==================== Computed Filtered Items ====================

  const filteredItems = items.filter((item) => {
    const matchesFilter = filterType === 'all' || item.type === filterType;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  // ==================== Fetch Gallery Items ====================

  const fetchGalleryItems = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getDocs(
        query(COLLECTIONS.GALLERY, orderBy('createdAt', 'desc'))
      );
      const galleryItems: GalleryItem[] = result.documents.map((d: Record<string, unknown>) => ({
        $id: d.$id as string,
        title: (d.title as string) || 'Sans titre',
        description: (d.description as string) || '',
        type: (d.type as 'image' | 'video') || 'image',
        url: (d.url as string) || '',
        thumbnailUrl: (d.thumbnailUrl as string) || (d.url as string) || '',
        videoUrl: (d.videoUrl as string) || undefined,
        uploaderId: (d.uploaderId as string) || '',
        uploaderName: (d.uploaderName as string) || 'Anonyme',
        likes: (Array.isArray(d.likes) ? d.likes : []) as string[],
        createdAt: (d.createdAt as string) || new Date().toISOString(),
      }));
      setItems(galleryItems);
    } catch (error) {
      console.error('Erreur lors du chargement de la galerie:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger la galerie.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchGalleryItems();
  }, [fetchGalleryItems]);

  // ==================== Upload Handler ====================

  const handleUpload = async () => {
    if (uploadForm.type === 'image' && !uploadForm.file) {
      toast({ title: 'Erreur', description: 'Veuillez sélectionner une image.', variant: 'destructive' });
      return;
    }
    if (uploadForm.type === 'video' && !uploadForm.videoUrl) {
      toast({ title: 'Erreur', description: 'Veuillez entrer une URL vidéo.', variant: 'destructive' });
      return;
    }
    if (!uploadForm.title.trim()) {
      toast({ title: 'Erreur', description: 'Le titre est requis.', variant: 'destructive' });
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 15, 90));
      }, 300);

      let imageUrl = '';
      if (uploadForm.type === 'image' && uploadForm.file) {
        const fileRef = storageObj.ref(`gallery/${Date.now()}_${uploadForm.file.name}`);
        fileRef.bucket = GALLERY_BUCKET_ID;
        await uploadBytes(fileRef, uploadForm.file);
        imageUrl = await getDownloadURL(fileRef);
      }

      await addDoc(COLLECTIONS.GALLERY, {
        title: uploadForm.title.trim(),
        description: uploadForm.description.trim(),
        type: uploadForm.type,
        url: uploadForm.type === 'image' ? imageUrl : uploadForm.videoUrl,
        thumbnailUrl: uploadForm.type === 'image' ? imageUrl : '',
        videoUrl: uploadForm.type === 'video' ? uploadForm.videoUrl : '',
        uploaderId: user?.id || '',
        uploaderName: user?.displayName || 'Anonyme',
        likes: [],
        createdAt: new Date().toISOString(),
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast({ title: 'Succès', description: 'Média ajouté à la galerie avec succès.' });
      setUploadDialogOpen(false);
      resetUploadForm();
      fetchGalleryItems();
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      toast({ title: 'Erreur', description: 'Impossible d\'ajouter le média.', variant: 'destructive' });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // ==================== Like Handler ====================

  const handleLike = async (item: GalleryItem) => {
    if (!user) return;
    const userId = user.id;
    const alreadyLiked = item.likes.includes(userId);
    try {
      const updatedLikes = alreadyLiked
        ? item.likes.filter((id) => id !== userId)
        : [...item.likes, userId];
      await updateDoc(doc(COLLECTIONS.GALLERY, item.$id), { likes: updatedLikes });
      setItems((prev) =>
        prev.map((i) => (i.$id === item.$id ? { ...i, likes: updatedLikes } : i))
      );
    } catch (error) {
      console.error('Erreur lors du like:', error);
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour le like.', variant: 'destructive' });
    }
  };

  // ==================== Delete Handler ====================

  const handleDelete = async (itemId: string) => {
    try {
      await deleteDoc(doc(COLLECTIONS.GALLERY, itemId));
      toast({ title: 'Succès', description: 'Média supprimé de la galerie.' });
      setDeleteConfirmId(null);
      fetchGalleryItems();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({ title: 'Erreur', description: 'Impossible de supprimer le média.', variant: 'destructive' });
    }
  };

  // ==================== Lightbox Navigation ====================

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setLightboxIndex(0);
  };

  const navigateLightbox = (direction: -1 | 1) => {
    setLightboxIndex((prev) => {
      let next = prev + direction;
      if (next < 0) next = filteredItems.length - 1;
      if (next >= filteredItems.length) next = 0;
      return next;
    });
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
      else if (e.key === 'ArrowRight') navigateLightbox(1);
      else if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // ==================== Upload Form Helpers ====================

  const resetUploadForm = () => {
    setUploadForm({ title: '', description: '', file: null, videoUrl: '', type: 'image' });
    setPreviewUrl(null);
    setUploadProgress(0);
    setDragActive(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Erreur', description: 'Veuillez sélectionner un fichier image.', variant: 'destructive' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Erreur', description: 'L\'image ne doit pas dépasser 10 Mo.', variant: 'destructive' });
      return;
    }
    setUploadForm((prev) => ({ ...prev, file }));
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const clearFile = () => {
    setUploadForm((prev) => ({ ...prev, file: null }));
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  // ==================== Render ====================

  const currentLightboxItem = filteredItems[lightboxIndex];

  return (
    <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Camera className="h-7 w-7 text-emerald-500" />
            Souvenirs
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Galerie photos et vidéos de la communauté
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => {
              resetUploadForm();
              setUploadDialogOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white self-start sm:self-auto"
          >
            <Upload className="h-4 w-4 mr-2" />
            Ajouter un média
          </Button>
        )}
      </div>

      {/* ==================== Stats Bar ==================== */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Total médias */}
          <Card className="group p-4 relative overflow-hidden ring-1 ring-border hover:ring-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5 transition-all duration-200">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 pointer-events-none rounded-lg dark:from-emerald-500/10 dark:to-teal-500/10" />
            <div className="relative flex items-start justify-between">
              <div className="space-y-1 flex-1 min-w-0 pt-0.5">
                <p className="text-xs text-muted-foreground font-medium">Total médias</p>
                <p className="text-2xl md:text-3xl font-bold text-foreground tracking-tight tabular-nums">{stats.total}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0 ml-3 group-hover:scale-110 transition-transform duration-200 shadow-md dark:opacity-80">
                <Camera className="h-5 w-5 text-white" />
              </div>
            </div>
          </Card>

          {/* Photos */}
          <Card className="group p-4 relative overflow-hidden ring-1 ring-border hover:ring-sky-500/50 hover:shadow-lg hover:shadow-sky-500/5 hover:-translate-y-0.5 transition-all duration-200">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-cyan-500/5 pointer-events-none rounded-lg dark:from-sky-500/10 dark:to-cyan-500/10" />
            <div className="relative flex items-start justify-between">
              <div className="space-y-1 flex-1 min-w-0 pt-0.5">
                <p className="text-xs text-muted-foreground font-medium">Photos</p>
                <p className="text-2xl md:text-3xl font-bold text-foreground tracking-tight tabular-nums">{stats.photos}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shrink-0 ml-3 group-hover:scale-110 transition-transform duration-200 shadow-md dark:opacity-80">
                <ImageIcon className="h-5 w-5 text-white" />
              </div>
            </div>
          </Card>

          {/* Vidéos */}
          <Card className="group p-4 relative overflow-hidden ring-1 ring-border hover:ring-violet-500/50 hover:shadow-lg hover:shadow-violet-500/5 hover:-translate-y-0.5 transition-all duration-200">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5 pointer-events-none rounded-lg dark:from-violet-500/10 dark:to-purple-500/10" />
            <div className="relative flex items-start justify-between">
              <div className="space-y-1 flex-1 min-w-0 pt-0.5">
                <p className="text-xs text-muted-foreground font-medium">Vidéos</p>
                <p className="text-2xl md:text-3xl font-bold text-foreground tracking-tight tabular-nums">{stats.videos}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shrink-0 ml-3 group-hover:scale-110 transition-transform duration-200 shadow-md dark:opacity-80">
                <Play className="h-5 w-5 text-white" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ==================== Search Bar + Filter ==================== */}
      {!loading && items.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par titre ou description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 h-10"
            />
          </div>

          {/* Filter Toggle Group */}
          <ToggleGroup
            type="single"
            value={filterType}
            onValueChange={(val) => {
              if (val) setFilterType(val as 'all' | 'image' | 'video');
            }}
            className="shrink-0"
          >
            <ToggleGroupItem value="all" aria-label="Tous">
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              Tous
            </ToggleGroupItem>
            <ToggleGroupItem value="image" aria-label="Photos">
              <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
              Photos
            </ToggleGroupItem>
            <ToggleGroupItem value="video" aria-label="Vidéos">
              <Play className="h-3.5 w-3.5 mr-1.5" />
              Vidéos
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}

      {/* Gallery Content */}
      {loading ? (
        <SkeletonGrid />
      ) : filteredItems.length === 0 ? (
        items.length === 0 ? (
          <EmptyState
            icon={Camera}
            title="Aucun souvenir partagé"
            description="La galerie est vide. Commencez par ajouter des photos ou vidéos de vos moments communautaires."
            action={
              isAdmin
                ? {
                    label: 'Ajouter un média',
                    onClick: () => {
                      resetUploadForm();
                      setUploadDialogOpen(true);
                    },
                  }
                : undefined
            }
          />
        ) : (
          <EmptyState
            icon={Search}
            title="Aucun résultat"
            description="Aucun média ne correspond à votre recherche ou filtre."
          />
        )
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 [column-gap:1rem] space-y-4">
          {filteredItems.map((item, index) => (
            <GalleryCard
              key={item.$id}
              item={item}
              index={index}
              userId={user?.id || ''}
              isAdmin={isAdmin}
              onLike={handleLike}
              onClick={() => openLightbox(index)}
              onDelete={(id) => setDeleteConfirmId(id)}
            />
          ))}
        </div>
      )}

      {/* ==================== Upload Dialog ==================== */}
      <Dialog open={uploadDialogOpen} onOpenChange={(open) => { setUploadDialogOpen(open); if (!open) resetUploadForm(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImagePlus className="h-5 w-5 text-emerald-500" />
              Ajouter un média
            </DialogTitle>
            <DialogDescription>
              Partagez un souvenir avec la communauté CODET.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Type Toggle */}
            <div className="flex gap-2">
              <Button
                variant={uploadForm.type === 'image' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUploadForm((prev) => ({ ...prev, type: 'image' }))}
                className={uploadForm.type === 'image' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              >
                <Camera className="h-4 w-4 mr-1.5" />
                Photo
              </Button>
              <Button
                variant={uploadForm.type === 'video' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUploadForm((prev) => ({ ...prev, type: 'video' }))}
                className={uploadForm.type === 'video' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              >
                <Play className="h-4 w-4 mr-1.5" />
                Vidéo (URL)
              </Button>
            </div>

            {/* Image Upload with Drag-and-Drop */}
            {uploadForm.type === 'image' && (
              <div className="space-y-3">
                <div
                  className={[
                    'relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 transition-colors cursor-pointer',
                    dragActive
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                      : 'hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20',
                  ].join(' ')}
                  onClick={() => document.getElementById('gallery-upload-input')?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {previewUrl ? (
                    <div className="w-full space-y-3">
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                        <img
                          src={previewUrl}
                          alt="Aperçu"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {uploadForm.file && formatFileSize(uploadForm.file.size)}
                        </span>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearFile();
                          }}
                          className="h-7 text-xs"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Effacer le fichier
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="h-8 w-8" />
                      <p className="text-sm font-medium">
                        {dragActive ? 'Déposez le fichier ici' : 'Cliquez ou glissez pour sélectionner'}
                      </p>
                      <p className="text-xs">PNG, JPG, WEBP (max 10 Mo)</p>
                    </div>
                  )}
                  <input
                    id="gallery-upload-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
              </div>
            )}

            {/* Video URL Input */}
            {uploadForm.type === 'video' && (
              <div className="space-y-2">
                <Label htmlFor="video-url-input">URL de la vidéo</Label>
                <Input
                  id="video-url-input"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={uploadForm.videoUrl}
                  onChange={(e) => setUploadForm((prev) => ({ ...prev, videoUrl: e.target.value }))}
                />
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="gallery-title-input">Titre *</Label>
              <Input
                id="gallery-title-input"
                type="text"
                placeholder="Ex: Assemblée générale 2025"
                value={uploadForm.title}
                onChange={(e) => setUploadForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="gallery-desc-input">Description</Label>
              <Textarea
                id="gallery-desc-input"
                placeholder="Décrivez ce souvenir..."
                rows={3}
                value={uploadForm.description}
                onChange={(e) => setUploadForm((prev) => ({ ...prev, description: e.target.value }))}
                className="resize-none"
              />
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Envoi en cours...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {uploading ? 'Envoi en cours...' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== Lightbox ==================== */}
      <Dialog open={lightboxOpen} onOpenChange={(open) => { if (!open) closeLightbox(); }}>
        <DialogOverlay className="bg-black/80 backdrop-blur-sm" />
        <DialogContent
          className="fixed inset-0 z-50 w-[100vw] h-[100vh] max-w-none max-h-none p-0 border-0 bg-transparent flex items-center justify-center"
          onPointerDownOutside={closeLightbox}
          onEscapeKeyDown={closeLightbox}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-50 h-10 w-10 rounded-full bg-black/40 text-white hover:bg-black/70 flex items-center justify-center transition-all duration-200 cursor-pointer backdrop-blur-sm"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Previous button */}
          {filteredItems.length > 1 && (
            <button
              type="button"
              onClick={() => navigateLightbox(-1)}
              className="absolute left-4 z-50 h-10 w-10 rounded-full bg-black/40 text-white hover:bg-black/70 flex items-center justify-center transition-all duration-200 cursor-pointer backdrop-blur-sm"
              aria-label="Précédent"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          {/* Next button */}
          {filteredItems.length > 1 && (
            <button
              type="button"
              onClick={() => navigateLightbox(1)}
              className="absolute right-4 z-50 h-10 w-10 rounded-full bg-black/40 text-white hover:bg-black/70 flex items-center justify-center transition-all duration-200 cursor-pointer backdrop-blur-sm"
              aria-label="Suivant"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          {/* Content */}
          {currentLightboxItem && (
            <div className="flex flex-col items-center gap-4 max-w-[90vw] max-h-[85vh]">
              {/* Image or Video */}
              {currentLightboxItem.type === 'image' ? (
                <div className="relative rounded-xl overflow-hidden shadow-2xl">
                  <img
                    src={currentLightboxItem.url}
                    alt={currentLightboxItem.title}
                    className="max-w-[90vw] max-h-[75vh] object-contain"
                  />
                </div>
              ) : (
                <div className="w-full max-w-4xl aspect-video rounded-xl overflow-hidden shadow-2xl">
                  <iframe
                    src={currentLightboxItem.videoUrl || currentLightboxItem.url}
                    className="w-full h-full"
                    allowFullScreen
                    allow="autoplay; encrypted-media"
                    title={currentLightboxItem.title}
                  />
                </div>
              )}

              {/* Info bar */}
              <div className="bg-black/50 backdrop-blur-sm rounded-xl px-5 py-4 text-white max-w-md w-full">
                {/* Title */}
                <h3 className="font-semibold text-base">{currentLightboxItem.title}</h3>

                {/* Uploader info */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-6 w-6 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    {getInitials(currentLightboxItem.uploaderName)}
                  </div>
                  <span className="text-xs text-white/70">{currentLightboxItem.uploaderName}</span>
                </div>

                {/* Description */}
                {currentLightboxItem.description && (
                  <p className="text-sm text-white/60 mt-1.5">{currentLightboxItem.description}</p>
                )}

                {/* Bottom row: date, count, actions */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <span>{formatDate(currentLightboxItem.createdAt)}</span>
                    <span>•</span>
                    <span>{lightboxIndex + 1} / {filteredItems.length}</span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    {/* Like button */}
                    {user && (
                      <button
                        type="button"
                        onClick={() => handleLike(currentLightboxItem)}
                        className={[
                          'h-8 px-3 rounded-full flex items-center gap-1.5 text-xs transition-all duration-200 cursor-pointer',
                          currentLightboxItem.likes.includes(user.id)
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                            : 'bg-white/10 text-white/80 hover:bg-white/20 backdrop-blur-sm',
                        ].join(' ')}
                      >
                        <Heart
                          className="h-3.5 w-3.5"
                          fill={currentLightboxItem.likes.includes(user.id) ? 'currentColor' : 'none'}
                        />
                        {currentLightboxItem.likes.length > 0 && currentLightboxItem.likes.length}
                      </button>
                    )}

                    {/* Download button */}
                    <a
                      href={currentLightboxItem.type === 'image' ? currentLightboxItem.url : (currentLightboxItem.videoUrl || currentLightboxItem.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={currentLightboxItem.type === 'image' ? currentLightboxItem.title : undefined}
                      className="h-8 px-3 rounded-full bg-white/10 text-white/80 hover:bg-white/20 flex items-center gap-1.5 text-xs transition-all duration-200 backdrop-blur-sm"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Télécharger
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ==================== Delete Confirmation Dialog ==================== */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer ce média ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Le média sera définitivement supprimé de la galerie.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== Gallery Card ====================

function GalleryCard({
  item,
  index,
  userId,
  isAdmin,
  onLike,
  onClick,
  onDelete,
}: {
  item: GalleryItem;
  index: number;
  userId: string;
  isAdmin: boolean;
  onLike: (item: GalleryItem) => void;
  onClick: () => void;
  onDelete: (id: string) => void;
}) {
  const isLiked = item.likes.includes(userId);

  return (
    <div
      className="break-inside-avoid group animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
      style={{ animationDelay: `${Math.min(index * 50, 300)}ms`, animationFillMode: 'both' }}
    >
      <div className="relative rounded-xl overflow-hidden bg-muted cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 hover:scale-[1.02]">
        {/* Image or Video Thumbnail */}
        <div
          className="relative w-full"
          onClick={onClick}
        >
          {item.type === 'image' ? (
            <div className="relative">
              <img
                src={item.url}
                alt={item.title}
                className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
          ) : (
            <div className="relative w-full aspect-video bg-muted">
              <img
                src={item.thumbnailUrl || item.url}
                alt={item.title}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.classList.add('flex', 'items-center', 'justify-center');
                    const playIcon = document.createElement('div');
                    playIcon.className = 'h-16 w-16 rounded-full bg-emerald-600 flex items-center justify-center';
                    playIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
                    parent.appendChild(playIcon);
                  }
                }}
              />
              {/* Play icon overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="h-14 w-14 rounded-full bg-emerald-600/90 flex items-center justify-center shadow-lg shadow-emerald-600/30">
                  <Play className="h-7 w-7 text-white ml-1" fill="white" />
                </div>
              </div>
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Type badge */}
        <div className="absolute bottom-2 left-2 z-10">
          <Badge
            className={[
              'backdrop-blur-sm border-0 text-[10px] font-medium px-1.5 py-0.5 rounded-md',
              item.type === 'video'
                ? 'bg-violet-500/70 text-white'
                : 'bg-black/40 text-white/90 dark:bg-black/50 dark:text-white',
            ].join(' ')}
          >
            {item.type === 'video' ? 'Vidéo' : 'Photo'}
          </Badge>
        </div>

        {/* Like button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onLike(item);
          }}
          className={[
            'absolute top-2 right-2 z-10 h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer',
            isLiked
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 scale-110'
              : 'bg-black/40 text-white/80 hover:bg-black/60 hover:text-white backdrop-blur-sm',
          ].join(' ')}
          aria-label={isLiked ? 'Retirer le like' : 'Ajouter un like'}
        >
          <Heart className="h-4 w-4" fill={isLiked ? 'currentColor' : 'none'} />
        </button>

        {/* Like count badge */}
        {item.likes.length > 0 && (
          <div className="absolute top-2 left-2 z-10">
            <Badge className="bg-black/40 text-white/90 hover:bg-black/60 backdrop-blur-sm border-0 text-xs px-2 py-0.5 rounded-full">
              <Heart className="h-3 w-3 mr-1 text-emerald-400" fill="currentColor" />
              {item.likes.length}
            </Badge>
          </div>
        )}

        {/* Delete button for admins */}
        {isAdmin && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.$id);
            }}
            className="absolute bottom-2 right-2 z-10 h-8 w-8 rounded-full bg-black/40 text-white/70 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all duration-200 backdrop-blur-sm cursor-pointer opacity-0 group-hover:opacity-100"
            aria-label="Supprimer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Metadata */}
      <div className="pt-2.5 pb-1 px-0.5">
        <h3 className="text-sm font-semibold truncate">{item.title}</h3>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
          <span className="truncate">{item.uploaderName}</span>
          <span>•</span>
          <span className="shrink-0">{formatDate(item.createdAt)}</span>
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.description}</p>
        )}
      </div>
    </div>
  );
}
