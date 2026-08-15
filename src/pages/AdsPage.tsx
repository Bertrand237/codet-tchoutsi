'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { COLLECTIONS } from '@/lib/appwrite';
import {
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  ref,
  storageObj,
  uploadBytesResumable,
  getDownloadURL,
} from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import {
  Plus,
  Pencil,
  Trash2,
  Download,
  MonitorPlay,
  Eye,
  EyeOff,
  Upload,
  Loader2,
  Tv,
  ChevronLeft,
  ChevronRight,
  Film,
  Play,
  Image as ImageIcon,
  Link,
  Repeat,
  Megaphone,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import EmptyState from '@/components/EmptyState';

// ==================== Helpers ====================

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v', '.ogg', '.ogv'];
const VIDEO_HOSTS = ['youtube.com', 'youtu.be', 'vimeo.com', 'dailymotion.com', 'twitch.tv'];

function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext))) return true;
  try {
    const parsed = new URL(url);
    return VIDEO_HOSTS.some((host) => parsed.hostname.includes(host));
  } catch {
    return false;
  }
}

function isImageUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'].some((ext) => lower.endsWith(ext));
}

function detectMediaType(url: string): 'video' | 'image' | 'unknown' {
  if (isVideoUrl(url)) return 'video';
  if (isImageUrl(url)) return 'image';
  return 'unknown';
}

function formatFrenchDate(isoString: string): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

function getVideoThumbnailUrl(url: string): string {
  if (!url) return '';
  const lower = url.toLowerCase();
  // For YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (ytMatch) {
    return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  }
  // For Vimeo (public thumbnail API)
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://vumbnail.com/${vimeoMatch[1]}.jpg`;
  }
  // For direct video URLs, we can't get a thumbnail — return empty
  return '';
}

// ==================== Types ====================

interface Ad {
  $id: string;
  title: string;
  videoUrl: string;
  videoURL?: string;
  isActive: boolean;
  active?: boolean;
  order: number;
  createdAt: string;
}

// ==================== Main Component ====================

export default function AdsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  // Sequential playback state
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);

  // Create form states
  const [createTitle, setCreateTitle] = useState('');
  const [createVideoFile, setCreateVideoFile] = useState<File | null>(null);
  const [createVideoUrl, setCreateVideoUrl] = useState('');
  const [createOrder, setCreateOrder] = useState(1);
  const [createActive, setCreateActive] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [createMediaType, setCreateMediaType] = useState<'video' | 'image'>('video');

  // Edit form states
  const [editTitle, setEditTitle] = useState('');
  const [editOrder, setEditOrder] = useState(1);
  const [editActive, setEditActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canManageAds = !!user && ['admin', 'président', 'secretaire', 'celcom'].includes(user.role);

  // ==================== Stats ====================

  const totalAds = ads.length;
  const activeAdsCount = ads.filter((ad) => ad.isActive).length;
  const inactiveAdsCount = totalAds - activeAdsCount;

  // ==================== Fetch Ads ====================

  const fetchAds = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getDocs(
        query(COLLECTIONS.ADS, orderBy('order', 'asc'))
      );
      const adsList: Ad[] = result.documents.map(
        (doc: Record<string, unknown>) => ({
          $id: doc.$id as string,
          title: (doc.title as string) || '',
          videoUrl:
            (doc.videoUrl as string) || (doc.videoURL as string) || '',
          isActive:
            (doc.isActive as boolean) ?? (doc.active as boolean) ?? false,
          order: (doc.order as number) || 0,
          createdAt: (doc.createdAt as string) || '',
        })
      );
      setAds(adsList);
    } catch (error) {
      console.error('Error fetching ads:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les publicités.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  // ==================== Active Ads for Player ====================

  const activeAds = ads.filter((ad) => ad.isActive);

  // Reset index when active ads list changes
  useEffect(() => {
    setCurrentAdIndex(0);
  }, [activeAds.length]);

  const currentActiveAd = activeAds[currentAdIndex];

  // ==================== Sequential Playback ====================

  const handleVideoEnded = useCallback(() => {
    if (autoplay && activeAds.length > 0) {
      const nextIndex = (currentAdIndex + 1) % activeAds.length;
      setCurrentAdIndex(nextIndex);
    }
  }, [autoplay, activeAds.length, currentAdIndex]);

  // Auto-play when currentAdIndex changes
  useEffect(() => {
    if (videoRef.current && currentActiveAd) {
      videoRef.current.load();
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay blocked by browser — user interaction needed
        });
      }
    }
  }, [currentAdIndex, currentActiveAd?.$id]);

  // Video progress tracking
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current && videoRef.current.duration) {
      const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setVideoProgress(pct);
    }
  }, []);

  const goToPrev = () => {
    if (activeAds.length > 0) {
      setCurrentAdIndex((prev) =>
        prev === 0 ? activeAds.length - 1 : prev - 1
      );
    }
  };

  const goToNext = () => {
    if (activeAds.length > 0) {
      setCurrentAdIndex((prev) =>
        prev === activeAds.length - 1 ? 0 : prev + 1
      );
    }
  };

  // ==================== Create Ad ====================

  const handleCreateAd = async () => {
    if (!createTitle.trim()) {
      toast({
        title: 'Champ requis',
        description: 'Veuillez saisir un titre pour la publicité.',
        variant: 'destructive',
      });
      return;
    }

    // Allow either file upload OR URL
    const hasUrl = createVideoUrl.trim().length > 0;
    const hasFile = !!createVideoFile;

    if (!hasUrl && !hasFile) {
      toast({
        title: 'Fichier requis',
        description: 'Veuillez sélectionner un fichier ou saisir une URL.',
        variant: 'destructive',
      });
      return;
    }

    if (hasUrl && createMediaType === 'video') {
      if (!isVideoUrl(createVideoUrl.trim())) {
        toast({
          title: 'URL invalide',
          description: 'Veuillez saisir une URL vidéo valide (YouTube, Vimeo, MP4, WebM, MOV).',
          variant: 'destructive',
        });
        return;
      }
    }

    if (hasFile && !createVideoFile.type.startsWith('video/') && !createVideoFile.type.startsWith('image/')) {
      toast({
        title: 'Type de fichier invalide',
        description: 'Seuls les fichiers vidéo et image sont acceptés.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      let finalUrl = createVideoUrl.trim();

      if (hasFile) {
        const fileName = `ads/${Date.now()}_${createVideoFile.name}`;
        const storageRef = ref(storageObj, fileName);

        await new Promise<void>((resolve, reject) => {
          uploadBytesResumable(storageRef, createVideoFile).on(
            'state_changed',
            (snapshot: { bytesTransferred: number; totalBytes: number }) => {
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(Math.round(progress));
            },
            (error: unknown) => {
              reject(error);
            },
            async () => {
              resolve();
            }
          );
        });

        finalUrl = await getDownloadURL(storageRef);
      } else {
        // Simulate progress for URL input
        setUploadProgress(50);
      }

      await addDoc(COLLECTIONS.ADS, {
        title: createTitle.trim(),
        videoUrl: finalUrl,
        isActive: createActive,
        order: createOrder,
        createdAt: new Date().toISOString(),
      });

      toast({
        title: 'Publicité créée',
        description: `« ${createTitle.trim()} » a été ajoutée avec succès.`,
      });

      // Reset form
      setCreateTitle('');
      setCreateVideoFile(null);
      setCreateVideoUrl('');
      setCreateOrder(ads.length + 1);
      setCreateActive(true);
      setUploadProgress(0);
      setIsUploading(false);
      setCreateMediaType('video');
      setCreateDialogOpen(false);

      await fetchAds();
    } catch (error) {
      console.error('Error creating ad:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la publicité. Vérifiez le fichier et réessayez.',
        variant: 'destructive',
      });
      setIsUploading(false);
    }
  };

  // ==================== Toggle Active ====================

  const handleToggleActive = async (ad: Ad) => {
    try {
      const newActive = !ad.isActive;
      const updatePayload: Record<string, unknown> = {
        isActive: newActive,
      };
      // Also write 'active' for compatibility
      updatePayload.active = newActive;

      await updateDoc(
        { collectionId: COLLECTIONS.ADS, id: ad.$id },
        updatePayload
      );

      toast({
        title: newActive ? 'Publicité activée' : 'Publicité désactivée',
        description: `« ${ad.title} » est maintenant ${newActive ? 'active' : 'inactive'}.`,
      });

      await fetchAds();
    } catch (error) {
      console.error('Error toggling ad:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut de la publicité.',
        variant: 'destructive',
      });
    }
  };

  // ==================== Edit Ad ====================

  const openEditDialog = (ad: Ad) => {
    setSelectedAd(ad);
    setEditTitle(ad.title);
    setEditOrder(ad.order);
    setEditActive(ad.isActive);
    setEditDialogOpen(true);
  };

  const handleEditAd = async () => {
    if (!selectedAd || !editTitle.trim()) {
      toast({
        title: 'Champ requis',
        description: 'Veuillez saisir un titre.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      const updatePayload: Record<string, unknown> = {
        title: editTitle.trim(),
        order: editOrder,
        isActive: editActive,
      };
      updatePayload.active = editActive;

      await updateDoc(
        { collectionId: COLLECTIONS.ADS, id: selectedAd.$id },
        updatePayload
      );

      toast({
        title: 'Publicité modifiée',
        description: `« ${editTitle.trim()} » a été mise à jour.`,
      });

      setEditDialogOpen(false);
      setSelectedAd(null);
      await fetchAds();
    } catch (error) {
      console.error('Error updating ad:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier la publicité.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ==================== Delete Ad ====================

  const openDeleteDialog = (ad: Ad) => {
    setSelectedAd(ad);
    setDeleteDialogOpen(true);
  };

  const handleDeleteAd = async () => {
    if (!selectedAd) return;

    try {
      setIsDeleting(true);
      await deleteDoc({ collectionId: COLLECTIONS.ADS, id: selectedAd.$id });

      toast({
        title: 'Publicité supprimée',
        description: `« ${selectedAd.title} » a été supprimée.`,
      });

      setDeleteDialogOpen(false);
      setSelectedAd(null);
      await fetchAds();
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la publicité.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // ==================== Download Video ====================

  const handleDownload = (ad: Ad) => {
    const url = ad.videoUrl || ad.videoURL || '';
    if (!url) {
      toast({
        title: 'Erreur',
        description: 'Aucune vidéo disponible pour le téléchargement.',
        variant: 'destructive',
      });
      return;
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ad.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ==================== Render: Stats Bar ====================

  const renderStatsBar = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-muted/50 p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-7 w-12" />
            </div>
          ))}
        </div>
      );
    }

    const stats = [
      {
        label: 'Total publicités',
        value: totalAds,
        icon: Megaphone,
        color: 'text-emerald-600 dark:text-emerald-400',
      },
      {
        label: 'Actives',
        value: activeAdsCount,
        icon: CheckCircle2,
        color: 'text-emerald-600 dark:text-emerald-400',
      },
      {
        label: 'Inactives',
        value: inactiveAdsCount,
        icon: XCircle,
        color: 'text-gray-500 dark:text-gray-400',
      },
    ];

    return (
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl bg-muted/50 p-4 flex items-center gap-3"
          >
            <div className={`rounded-lg bg-background p-2 ${stat.color}`}>
              <stat.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ==================== Render: Main Video Player ====================

  const renderVideoPlayer = () => {
    if (loading) {
      return (
        <Card className="overflow-hidden border-2 border-dashed">
          <div className="relative w-full aspect-video bg-muted">
            <Skeleton className="absolute inset-0 rounded-none" />
          </div>
          <CardContent className="p-4">
            <Skeleton className="h-5 w-48" />
          </CardContent>
        </Card>
      );
    }

    if (activeAds.length === 0) {
      return (
        <EmptyState
          icon={Tv}
          title="Aucune publicité active"
          description={
            canManageAds
              ? 'Ajoutez une publicité et activez-la pour la voir ici.'
              : "Aucune publicité n'est en cours de diffusion."
          }
          action={canManageAds ? { label: 'Créer une publicité', onClick: () => { setCreateOrder(ads.length + 1); setCreateDialogOpen(true); } } : undefined}
        />
      );
    }

    return (
      <Card className="overflow-hidden">
        <div className="relative w-full bg-black">
          {/* Vignette effect */}
          <div className="pointer-events-none absolute inset-0 z-10"
            style={{
              boxShadow: 'inset 0 0 80px 20px rgba(0,0,0,0.4)',
            }}
          />

          <div className="relative w-full aspect-video">
            <video
              ref={videoRef}
              key={currentActiveAd.$id}
              src={currentActiveAd.videoUrl || currentActiveAd.videoURL}
              autoPlay
              muted
              playsInline
              loop={false}
              onEnded={handleVideoEnded}
              onTimeUpdate={handleTimeUpdate}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Title overlay with gradient */}
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-12 pb-3 px-4">
            <p className="text-white text-sm font-medium truncate">
              {currentActiveAd.title}
            </p>
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 z-30 h-1 bg-white/20">
            <div
              className="h-full bg-emerald-500 transition-[width] duration-150 ease-linear"
              style={{ width: `${videoProgress}%` }}
            />
          </div>

          {/* Navigation arrows — emerald accent */}
          {activeAds.length > 1 && (
            <>
              <button
                onClick={goToPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-emerald-600/80 hover:bg-emerald-500 text-white flex items-center justify-center transition-colors z-20"
                aria-label="Publicité précédente"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-emerald-600/80 hover:bg-emerald-500 text-white flex items-center justify-center transition-colors z-20"
                aria-label="Publicité suivante"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Top-right controls */}
          <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
            {/* Autoplay toggle */}
            <button
              onClick={() => setAutoplay((prev) => !prev)}
              className={`h-8 rounded-full px-2.5 flex items-center gap-1.5 text-xs font-medium transition-colors ${
                autoplay
                  ? 'bg-emerald-600/90 text-white hover:bg-emerald-500'
                  : 'bg-black/60 text-white/70 hover:bg-black/70 hover:text-white'
              }`}
              aria-label={autoplay ? 'Désactiver la lecture automatique' : 'Activer la lecture automatique'}
            >
              <Repeat className={`h-3.5 w-3.5 ${autoplay ? '' : 'opacity-60'}`} />
              Auto
            </button>

            {/* Counter badge */}
            <Badge
              variant="secondary"
              className="bg-black/70 text-white hover:bg-black/70 text-xs px-2.5 py-1"
            >
              {currentAdIndex + 1} / {activeAds.length}
            </Badge>
          </div>
        </div>
      </Card>
    );
  };

  // ==================== Render: Ad Card ====================

  const renderAdCard = (ad: Ad) => {
    const videoSrc = ad.videoUrl || ad.videoURL || '';
    const mediaType = detectMediaType(videoSrc);
    const isVideo = mediaType === 'video';
    const thumbnailUrl = isVideo ? getVideoThumbnailUrl(videoSrc) : '';
    const showVideoThumbnail = isVideo && thumbnailUrl;

    return (
      <Card
        key={ad.$id}
        className={`group overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 ${
          ad.isActive
            ? 'border-l-4 border-l-emerald-500'
            : 'border-l-4 border-l-gray-400 dark:border-l-gray-600'
        }`}
      >
        {/* Thumbnail / preview */}
        <div className="relative w-full aspect-video bg-muted">
          {showVideoThumbnail ? (
            <>
              <img
                src={thumbnailUrl}
                alt={ad.title}
                className="w-full h-full object-cover"
              />
              {/* Play overlay icon */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="h-12 w-12 rounded-full bg-white/90 dark:bg-black/70 flex items-center justify-center shadow-lg">
                  <Play className="h-5 w-5 text-emerald-600 dark:text-emerald-400 ml-0.5" fill="currentColor" />
                </div>
              </div>
            </>
          ) : videoSrc ? (
            isVideo ? (
              <div className="w-full h-full flex items-center justify-center">
                <Film className="h-10 w-10 text-muted-foreground" />
              </div>
            ) : (
              <img
                src={videoSrc}
                alt={ad.title}
                className="w-full h-full object-cover"
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film className="h-10 w-10 text-muted-foreground" />
            </div>
          )}

          {/* Order badge */}
          <div className="absolute top-2 left-2">
            <Badge
              variant="secondary"
              className="bg-black/70 text-white hover:bg-black/70 text-xs"
            >
              #{ad.order}
            </Badge>
          </div>

          {/* Status pill badge */}
          <div className="absolute top-2 right-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                ad.isActive
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
            >
              {ad.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <CardHeader className="pb-2 pt-3 px-4">
          <p className="font-medium text-sm leading-tight line-clamp-2">
            {ad.title}
          </p>
          {ad.createdAt && (
            <p className="text-xs text-muted-foreground mt-1">
              {formatFrenchDate(ad.createdAt)}
            </p>
          )}
        </CardHeader>

        {/* Admin actions — visible on hover */}
        {canManageAds && (
          <CardFooter className="px-4 pb-3 pt-0 flex flex-wrap gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs px-2"
              onClick={() => handleToggleActive(ad)}
            >
              {ad.isActive ? (
                <>
                  <EyeOff className="h-3.5 w-3.5 mr-1" />
                  Désactiver
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  Activer
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs px-2"
              onClick={() => openEditDialog(ad)}
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Modifier
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs px-2"
              onClick={() => handleDownload(ad)}
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              Télécharger
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
              onClick={() => openDeleteDialog(ad)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Supprimer
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  };

  // ==================== Render: Create Dialog ====================

  const renderCreateDialog = () => {
    // Determine detected type for preview
    const previewUrl = createVideoUrl.trim();
    const previewType = createVideoFile
      ? (createVideoFile.type.startsWith('video/') ? 'video' : 'image')
      : (previewUrl ? detectMediaType(previewUrl) : 'unknown');
    const previewThumbnail = previewType === 'video' ? getVideoThumbnailUrl(previewUrl) : '';
    const isUrlInvalid = previewUrl.length > 0 && createMediaType === 'video' && !isVideoUrl(previewUrl);

    return (
      <Dialog open={createDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setCreateVideoUrl('');
          setCreateMediaType('video');
        }
        setCreateDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nouvelle publicité
            </DialogTitle>
            <DialogDescription>
              Ajoutez une nouvelle publicité avec une vidéo ou une image.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* === Section 1: Type de publicité === */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Type de publicité</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCreateMediaType('video')}
                  className={`flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-colors ${
                    createMediaType === 'video'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                      : 'border-transparent bg-muted/50 hover:bg-muted'
                  }`}
                >
                  <div className={`rounded-lg p-2 ${createMediaType === 'video' ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-background'}`}>
                    <Film className={`h-5 w-5 ${createMediaType === 'video' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${createMediaType === 'video' ? 'text-emerald-700 dark:text-emerald-300' : ''}`}>Vidéo</p>
                    <p className="text-xs text-muted-foreground">MP4, WebM, YouTube…</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setCreateMediaType('image')}
                  className={`flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-colors ${
                    createMediaType === 'image'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                      : 'border-transparent bg-muted/50 hover:bg-muted'
                  }`}
                >
                  <div className={`rounded-lg p-2 ${createMediaType === 'image' ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-background'}`}>
                    <ImageIcon className={`h-5 w-5 ${createMediaType === 'image' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${createMediaType === 'image' ? 'text-emerald-700 dark:text-emerald-300' : ''}`}>Image</p>
                    <p className="text-xs text-muted-foreground">JPG, PNG, WebP…</p>
                  </div>
                </button>
              </div>
            </div>

            {/* === Section 2: Informations === */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Informations</Label>

              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="create-title" className="text-xs text-muted-foreground">Titre</Label>
                <Input
                  id="create-title"
                  placeholder="Titre de la publicité"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                />
              </div>

              {/* File upload or URL */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Fichier ou URL
                </Label>
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="video-upload"
                    className="flex items-center gap-2 cursor-pointer rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors shrink-0"
                  >
                    <Upload className="h-4 w-4" />
                    Fichier
                  </label>
                  <span className="text-xs text-muted-foreground">ou</span>
                  <Input
                    placeholder={createMediaType === 'video' ? 'https://youtube.com/watch?v=…' : 'https://exemple.com/image.jpg'}
                    value={createVideoUrl}
                    onChange={(e) => setCreateVideoUrl(e.target.value)}
                    className="flex-1"
                  />
                  <input
                    id="video-upload"
                    type="file"
                    accept={createMediaType === 'video' ? 'video/*' : 'image/*'}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setCreateVideoFile(file);
                      if (file) setCreateVideoUrl('');
                    }}
                  />
                </div>
                {createVideoFile && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 truncate">
                    ✓ {createVideoFile.name}
                  </p>
                )}
                {isUrlInvalid && (
                  <p className="text-xs text-red-500">
                    URL invalide. Vérifiez le lien et réessayez.
                  </p>
                )}
                {!createVideoFile && !createVideoUrl && (
                  <p className="text-xs text-muted-foreground">
                    Formats acceptés : {createMediaType === 'video' ? 'MP4, WebM, MOV, YouTube, Vimeo' : 'JPG, PNG, GIF, WebP'}
                  </p>
                )}
              </div>

              {/* Order */}
              <div className="space-y-1.5">
                <Label htmlFor="create-order" className="text-xs text-muted-foreground">Ordre d'affichage</Label>
                <Input
                  id="create-order"
                  type="number"
                  min={1}
                  value={createOrder}
                  onChange={(e) => setCreateOrder(parseInt(e.target.value) || 1)}
                  className="w-24"
                />
              </div>

              {/* Active checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="create-active"
                  checked={createActive}
                  onCheckedChange={(checked) => setCreateActive(checked === true)}
                />
                <Label htmlFor="create-active" className="cursor-pointer">
                  Publicité active
                </Label>
              </div>
            </div>

            {/* === Section 3: Aperçu === */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Aperçu</Label>
              <div className="rounded-lg border bg-muted/30 p-3">
                {/* Mini ad card preview */}
                <div className={`rounded-md border overflow-hidden ${createActive ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-gray-400'}`}>
                  <div className="relative w-full aspect-video bg-muted rounded-t-sm">
                    {previewThumbnail ? (
                      <>
                        <img
                          src={previewThumbnail}
                          alt="Aperçu"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="h-8 w-8 rounded-full bg-white/90 dark:bg-black/70 flex items-center justify-center">
                            <Play className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 ml-0.5" fill="currentColor" />
                          </div>
                        </div>
                      </>
                    ) : previewType === 'image' && previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Aperçu"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {createMediaType === 'video' ? (
                          <Film className="h-6 w-6 text-muted-foreground/50" />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                        )}
                      </div>
                    )}
                    <span className={`absolute top-1.5 right-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      createActive
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {createActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="px-3 py-2">
                    <p className="text-xs font-medium truncate">
                      {createTitle || 'Titre de la publicité'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upload progress */}
          {isUploading && (
            <div className="space-y-2 -mt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Téléchargement...</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={isUploading}
            >
              Annuler
            </Button>
            <Button onClick={handleCreateAd} disabled={isUploading || isUrlInvalid}>
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                'Créer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // ==================== Render: Edit Dialog ====================

  const renderEditDialog = () => (
    <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Modifier la publicité
          </DialogTitle>
          <DialogDescription>
            Modifiez les informations de la publicité.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-title">Titre</Label>
            <Input
              id="edit-title"
              placeholder="Titre de la publicité"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
          </div>

          {/* Order */}
          <div className="space-y-2">
            <Label htmlFor="edit-order">Ordre d'affichage</Label>
            <Input
              id="edit-order"
              type="number"
              min={1}
              value={editOrder}
              onChange={(e) => setEditOrder(parseInt(e.target.value) || 1)}
            />
          </div>

          {/* Active checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit-active"
              checked={editActive}
              onCheckedChange={(checked) => setEditActive(checked === true)}
            />
            <Label htmlFor="edit-active" className="cursor-pointer">
              Publicité active
            </Label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setEditDialogOpen(false)}
            disabled={isSaving}
          >
            Annuler
          </Button>
          <Button onClick={handleEditAd} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Enregistrer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // ==================== Render: Delete Dialog ====================

  const renderDeleteDialog = () => (
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer la publicité</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer «{' '}
            <span className="font-semibold">{selectedAd?.title}</span> » ?
            Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel disabled={isDeleting}>
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAd}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Suppression...
              </>
            ) : (
              'Supprimer'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // ==================== Main Render ====================

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-6xl mx-auto w-full">
      {/* Main Video Player — Sequential Playback */}
      <section aria-label="Lecteur de publicités">
        {renderVideoPlayer()}
      </section>

      {/* Stats Bar */}
      {!loading && ads.length > 0 && (
        <section aria-label="Statistiques">
          {renderStatsBar()}
        </section>
      )}

      <Separator />

      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Tv className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="text-lg font-semibold">Toutes les publicités</h2>
            <p className="text-sm text-muted-foreground">
              {ads.length} publicité{ads.length !== 1 ? 's' : ''} au total
            </p>
          </div>
        </div>
        {canManageAds && (
          <Button
            onClick={() => {
              setCreateOrder(ads.length + 1);
              setCreateDialogOpen(true);
            }}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        )}
      </div>

      {/* Ads Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-video" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : ads.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Aucune publicité pour le moment"
          description={
            canManageAds
              ? 'Commencez par créer votre première publicité pour la diffuser auprès de la communauté.'
              : 'Aucune publicité n\'a encore été ajoutée. Revenez plus tard !'
          }
          action={canManageAds ? { label: 'Créer une publicité', onClick: () => { setCreateOrder(1); setCreateDialogOpen(true); } } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ads.map(renderAdCard)}
        </div>
      )}

      {/* Dialogs */}
      {renderCreateDialog()}
      {renderEditDialog()}
      {renderDeleteDialog()}
    </div>
  );
}
