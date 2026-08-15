'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth, CodetUser } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { COLLECTIONS } from '@/lib/appwrite';
import {
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  doc,
  ref,
  storageObj,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  toDate,
} from '@/lib/db';
import { blogSchema, formatZodErrors } from '@/lib/validations';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Newspaper,
  VideoIcon,
  ImageIcon,
  Calendar,
  Loader2,
  Play,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import EmptyState from '@/components/EmptyState';
import { notifyBlogPublished } from '@/lib/notification-triggers';

// ==================== Types ====================

interface AdItem {
  $id: string;
  titre: string;
  videoUrl?: string;
  videoURL?: string;
  isActive: boolean;
}

interface BlogPost {
  $id: string;
  title: string;
  content: string;
  excerpt?: string;
  imageUrl?: string;
  imageURL?: string;
  authorId: string;
  authorName: string;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface BlogVideo {
  $id: string;
  title: string;
  description: string;
  videoUrl: string;
  authorId: string;
  authorName: string;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== Helpers ====================

const AVATAR_COLORS = [
  'bg-emerald-500', 'bg-teal-500', 'bg-amber-500', 'bg-rose-500',
  'bg-violet-500', 'bg-cyan-500', 'bg-orange-500', 'bg-pink-500',
];

function getHashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  return parts[0].charAt(0).toUpperCase();
}

function getReadingTime(content: string): string {
  if (!content) return '1 min de lecture';
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min de lecture`;
}

function getRelativeDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  try {
    const d = toDate(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 30) {
      return d.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
      });
    }
    if (diffDays > 0) return `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    if (diffMinutes > 0) return `il y a ${diffMinutes} min`;
    return 'À l\'instant';
  } catch (_e) {
    return '';
  }
}

function canManageBlog(user: CodetUser | null): boolean {
  if (!user) return false;
  return ['admin', 'président', 'secretaire', 'celcom'].includes(user.role);
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  try {
    const d = toDate(dateStr);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch (_e) {
    return '';
  }
}

function getImageUrl(post: BlogPost): string {
  return post.imageUrl || post.imageURL || '';
}

// ==================== Ads Carousel ====================

function AdsCarousel({ ads }: { ads: AdItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentAd = ads[currentIndex];
  const videoSrc = currentAd?.videoUrl || currentAd?.videoURL || '';

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % ads.length);
  }, [ads.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
  }, [ads.length]);

  const handleVideoEnded = useCallback(() => {
    goToNext();
  }, [goToNext]);

  // Reset video when index changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        // autoplay may be blocked
      });
    }
  }, [currentIndex]);

  if (ads.length === 0) return null;

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-black mb-8 hover:shadow-lg transition-shadow duration-200">
      {/* Video element */}
      {videoSrc && (
        <video
          ref={videoRef}
          key={currentIndex}
          src={videoSrc}
          muted
          autoPlay
          loop={false}
          playsInline
          onEnded={handleVideoEnded}
          className="w-full aspect-video object-contain bg-black"
        ></video>
      )}

      {/* Gradient overlay at bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>

      {/* Title overlay with gradient */}
      {currentAd?.titre && (
        <div className="absolute bottom-0 left-0 right-0 px-5 py-4">
          <p className="text-white text-sm font-semibold truncate drop-shadow-md">
            {currentAd.titre}
          </p>
        </div>
      )}

      {/* Navigation arrows */}
      {ads.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors"
            aria-label="Publicité précédente"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors"
            aria-label="Publicité suivante"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Current/Total indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5">
        <span className="text-white text-xs font-semibold bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-sm">
          {currentIndex + 1} / {ads.length}
        </span>
      </div>
    </div>
  );
}

// ==================== Blog Post Card ====================

function BlogPostCard({
  post,
  canManage,
  onEdit,
  onDelete,
  onTogglePublish,
  onView,
}: {
  post: BlogPost;
  canManage: boolean;
  onEdit: (post: BlogPost) => void;
  onDelete: (post: BlogPost) => void;
  onTogglePublish: (post: BlogPost) => void;
  onView: (post: BlogPost) => void;
}) {
  const imgUrl = getImageUrl(post);
  const authorName = post.authorName || 'Anonyme';
  const relativeDate = getRelativeDate(post.isPublished ? post.publishedAt : post.createdAt);
  const readingTime = getReadingTime(post.content || post.excerpt || '');

  return (
    <Card
      className={`overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-full cursor-pointer group ${!post.isPublished ? 'border-2 border-dashed border-muted-foreground/40' : ''}`}
      onClick={() => onView(post)}
    >
      {/* Image */}
      {imgUrl ? (
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
          <img
            src={imgUrl}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {/* Gradient overlay bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
          {!post.isPublished && (
            <Badge variant="secondary" className="absolute top-3 right-3 text-xs bg-white/90 dark:bg-black/70 backdrop-blur-sm">
              Brouillon
            </Badge>
          )}
        </div>
      ) : (
        <div className={`aspect-[16/10] w-full bg-muted flex items-center justify-center ${!post.isPublished ? 'border-b-2 border-dashed border-muted-foreground/40' : ''}`}>
          <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold leading-snug line-clamp-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
            {post.title}
          </CardTitle>
        </div>
        {/* Author row: avatar + name + date + reading time */}
        <CardDescription className="flex items-center gap-2.5 text-xs pt-1">
          <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${getHashColor(authorName)}`}>
            {getInitials(authorName)}
          </span>
          <span className="font-medium text-foreground/80 truncate">{authorName}</span>
          <span className="text-muted-foreground">·</span>
          <span className="flex items-center gap-1 text-muted-foreground shrink-0">
            <Calendar className="h-3 w-3" />
            {relativeDate}
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="flex items-center gap-1 text-muted-foreground shrink-0">
            <Clock className="h-3 w-3" />
            {readingTime}
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        {post.excerpt ? (
          <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
        ) : (
          <p className="text-sm text-muted-foreground line-clamp-3">{post.content}</p>
        )}
      </CardContent>

      {/* Lire plus link + admin actions */}
      <CardFooter className="pt-0 pb-4 gap-2 flex-wrap">
        <button
          className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors group/link"
          onClick={(e) => {
            e.stopPropagation();
            onView(post);
          }}
        >
          Lire plus
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5" />
        </button>
        {canManage && (
          <div className="ml-auto flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onTogglePublish(post)}
              className="h-8 text-xs"
            >
              {post.isPublished ? (
                <>
                  <EyeOff className="h-3.5 w-3.5 mr-1" />
                  Dépublier
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  Publier
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(post)}
              className="h-8 text-xs"
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Modifier
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(post)}
              className="h-8 text-xs text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Supprimer
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

// ==================== Blog Video Card ====================

function BlogVideoCard({
  video,
  canManage,
  onEdit,
  onDelete,
  onTogglePublish,
}: {
  video: BlogVideo;
  canManage: boolean;
  onEdit: (video: BlogVideo) => void;
  onDelete: (video: BlogVideo) => void;
  onTogglePublish: (video: BlogVideo) => void;
}) {
  const authorName = video.authorName || 'Anonyme';
  const relativeDate = getRelativeDate(video.isPublished ? video.publishedAt : video.createdAt);

  return (
    <Card className="overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
      {/* Video Player with emerald hover overlay */}
      <div className="relative aspect-video w-full bg-black group">
        <video
          src={video.videoUrl}
          controls
          playsInline
          className="w-full h-full object-contain"
          preload="metadata"
        ></video>
        {/* Emerald hover overlay with centered play icon */}
        <div className="absolute inset-0 bg-emerald-600/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="h-16 w-16 rounded-full bg-emerald-500/80 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-emerald-500/40">
            <Play className="h-8 w-8 text-white ml-1" fill="white" />
          </div>
        </div>
        {/* Video badge */}
        <Badge className="absolute top-3 left-3 text-xs bg-black/60 text-white border-0 backdrop-blur-sm">
          <Play className="h-3 w-3 mr-1" fill="currentColor" />
          Vidéo
        </Badge>
        {!video.isPublished && (
          <Badge variant="secondary" className="absolute top-3 right-3 text-xs bg-white/90 dark:bg-black/70 backdrop-blur-sm">
            Brouillon
          </Badge>
        )}
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold leading-snug line-clamp-2">
          {video.title}
        </CardTitle>
        <CardDescription className="flex items-center gap-2.5 text-xs pt-1">
          <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${getHashColor(authorName)}`}>
            {getInitials(authorName)}
          </span>
          <span className="font-medium text-foreground/80 truncate">{authorName}</span>
          <span className="text-muted-foreground">·</span>
          <span className="flex items-center gap-1 text-muted-foreground shrink-0">
            <Calendar className="h-3 w-3" />
            {relativeDate}
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {video.description}
        </p>
      </CardContent>

      {canManage && (
        <CardFooter className="border-t pt-3 gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTogglePublish(video)}
            className="h-8 text-xs"
          >
            {video.isPublished ? (
              <>
                <EyeOff className="h-3.5 w-3.5 mr-1" />
                Dépublier
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5 mr-1" />
                Publier
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(video)}
            className="h-8 text-xs"
          >
            <Pencil className="h-3.5 w-3.5 mr-1" />
            Modifier
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(video)}
            className="h-8 text-xs text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Supprimer
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

// ==================== Blog Article Detail Dialog ====================

function BlogArticleDetailDialog({
  open,
  onOpenChange,
  post,
  canManage,
  onEdit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: BlogPost | null;
  canManage: boolean;
  onEdit: (post: BlogPost) => void;
}) {
  if (!post) return null;

  const imgUrl = getImageUrl(post);
  const authorName = post.authorName || 'Anonyme';
  const fullDate = formatDate(post.isPublished ? post.publishedAt : post.createdAt);
  const readingTime = getReadingTime(post.content || post.excerpt || '');
  const paragraphs = (post.content || '').split(/\n{2,}/).filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        <ScrollArea className="max-h-[90vh]">
          {/* Hero image */}
          {imgUrl && (
            <div className="relative w-full aspect-[2/1] overflow-hidden">
              <img src={imgUrl} alt={post.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            </div>
          )}

          <div className="p-6 md:p-8 space-y-6">
            {/* Header: title + actions */}
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl md:text-3xl font-bold leading-tight">
                {post.title}
              </h1>
              {canManage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onEdit(post);
                  }}
                  className="shrink-0"
                >
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Modifier
                </Button>
              )}
            </div>

            {/* Author info bar */}
            <div className="flex items-center gap-3 text-sm">
              <span className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${getHashColor(authorName)}`}>
                {getInitials(authorName)}
              </span>
              <div className="flex flex-col">
                <span className="font-medium">{authorName}</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {fullDate}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {readingTime}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Full content */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {paragraphs.map((p, i) => (
                <p key={i} className="mb-4 leading-relaxed text-foreground/90">
                  {p}
                </p>
              ))}
              {paragraphs.length === 0 && (
                <p className="text-muted-foreground">Aucun contenu.</p>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Blog Post Dialog ====================

function BlogPostDialog({
  open,
  onOpenChange,
  post,
  user,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: BlogPost | null;
  user: CodetUser | null;
  onSave: () => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);

  const isEditing = !!post;

  useEffect(() => {
    if (open) {
      if (post) {
        setTitle(post.title || '');
        setExcerpt(post.excerpt || '');
        setContent(post.content || '');
        setIsPublished(post.isPublished);
        setImagePreview(getImageUrl(post));
        setImageFile(null);
      } else {
        setTitle('');
        setExcerpt('');
        setContent('');
        setIsPublished(false);
        setImagePreview('');
        setImageFile(null);
      }
    }
  }, [open, post]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          variant: 'destructive',
          title: 'Fichier invalide',
          description: 'Veuillez sélectionner un fichier image.',
        });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    const result = blogSchema.safeParse({ titre: title.trim(), contenu: content.trim() });
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      const firstError = Object.values(errors)[0];
      toast({ variant: 'destructive', title: 'Validation', description: firstError });
      return;
    }

    setSaving(true);
    try {
      let imageUrl = isEditing ? getImageUrl(post!) : '';

      if (imageFile) {
        setUploading(true);
        const fileName = `blog-images/${Date.now()}-${imageFile.name}`;
        const storageRef = ref(storageObj, fileName);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
        setUploading(false);
      }

      const now = new Date().toISOString();

      if (isEditing && post) {
        const updateData: Record<string, unknown> = {
          title: title.trim(),
          excerpt: excerpt.trim(),
          content: content.trim(),
          isPublished,
          updatedAt: now,
        };
        if (imageUrl) updateData.imageUrl = imageUrl;
        if (isPublished && !post.isPublished) {
          updateData.publishedAt = now;
        } else if (!isPublished) {
          updateData.publishedAt = '';
        }
        await updateDoc(doc(COLLECTIONS.BLOG_POSTS, post.$id), updateData);
      } else {
        await addDoc(COLLECTIONS.BLOG_POSTS, {
          title: title.trim(),
          excerpt: excerpt.trim(),
          content: content.trim(),
          imageUrl,
          authorId: user?.id || '',
          authorName: user?.displayName || 'Anonyme',
          isPublished,
          publishedAt: isPublished ? now : '',
          createdAt: now,
          updatedAt: now,
        });
      }

      toast({
        title: isEditing ? 'Article modifié' : 'Article créé',
        description: isEditing
          ? 'L\'article a été mis à jour avec succès.'
          : 'Le nouvel article a été créé avec succès.',
      });
      if (!isEditing && isPublished) {
        notifyBlogPublished(title.trim(), user?.displayName || 'Anonyme').catch(() => {});
      }
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving blog post:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de sauvegarder l\'article. Veuillez réessayer.',
      });
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier l\'article' : 'Nouvel article'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifiez les informations de l\'article ci-dessous.'
              : 'Renseignez les informations pour créer un nouvel article.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="post-title">Titre *</Label>
            <Input
              id="post-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de l\'article"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="post-excerpt">Résumé</Label>
            <Textarea
              id="post-excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Un bref résumé de l\'article..."
              rows={2}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="post-content">Contenu *</Label>
            <Textarea
              id="post-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Contenu de l\'article..."
              rows={6}
            />
          </div>

          <div className="grid gap-2">
            <Label>Image</Label>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 rounded-lg border-2 border-dashed overflow-hidden bg-muted flex items-center justify-center shrink-0">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Aperçu"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                )}
              </div>
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, WEBP (max 5 Mo)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="post-published"
              checked={isPublished}
              onCheckedChange={(checked) => setIsPublished(checked === true)}
            />
            <Label htmlFor="post-published" className="cursor-pointer">
              Publier immédiatement
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={saving || uploading}>
            {saving || uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {uploading ? 'Téléchargement...' : 'Enregistrement...'}
              </>
            ) : isEditing ? (
              'Modifier'
            ) : (
              'Créer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Blog Video Dialog ====================

function BlogVideoDialog({
  open,
  onOpenChange,
  video,
  user,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: BlogVideo | null;
  user: CodetUser | null;
  onSave: () => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const isEditing = !!video;

  useEffect(() => {
    if (open) {
      if (video) {
        setTitle(video.title || '');
        setDescription(video.description || '');
        setIsPublished(video.isPublished);
        setVideoFile(null);
        setUploadProgress(0);
        setUploading(false);
      } else {
        setTitle('');
        setDescription('');
        setIsPublished(false);
        setVideoFile(null);
        setUploadProgress(0);
        setUploading(false);
      }
    }
  }, [open, video]);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        toast({
          variant: 'destructive',
          title: 'Fichier invalide',
          description: 'Veuillez sélectionner un fichier vidéo.',
        });
        return;
      }
      setVideoFile(file);
    }
  };

  const handleSubmit = async () => {
    const result = blogSchema.safeParse({ titre: title.trim(), contenu: description.trim() });
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      const firstError = Object.values(errors)[0];
      toast({ variant: 'destructive', title: 'Validation', description: firstError });
      return;
    }

    if (!isEditing && !videoFile) {
      toast({
        variant: 'destructive',
        title: 'Vidéo requise',
        description: 'Veuillez sélectionner un fichier vidéo.',
      });
      return;
    }

    setSaving(true);
    try {
      let videoUrl = isEditing ? video!.videoUrl : '';

      if (videoFile) {
        setUploading(true);
        setUploadProgress(0);
        const fileName = `blog-videos/${Date.now()}-${videoFile.name}`;
        const storageRef = ref(storageObj, fileName);

        await new Promise<void>((resolve, reject) => {
          const uploadTask = uploadBytesResumable(storageRef, videoFile);
          uploadTask.on(
            'state_changed',
            (snapshot: { bytesTransferred: number; totalBytes: number }) => {
              const progress = Math.round(
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              );
              setUploadProgress(progress);
            },
            (error: unknown) => {
              console.error('Upload error:', error);
              reject(error);
            },
            async () => {
              videoUrl = await getDownloadURL(storageRef);
              resolve();
            }
          );
        });
        setUploading(false);
      }

      const now = new Date().toISOString();

      if (isEditing && video) {
        const updateData: Record<string, unknown> = {
          title: title.trim(),
          description: description.trim(),
          isPublished,
          updatedAt: now,
        };
        if (videoUrl) updateData.videoUrl = videoUrl;
        if (isPublished && !video.isPublished) {
          updateData.publishedAt = now;
        } else if (!isPublished) {
          updateData.publishedAt = '';
        }
        await updateDoc(doc(COLLECTIONS.BLOG_VIDEOS, video.$id), updateData);
      } else {
        await addDoc(COLLECTIONS.BLOG_VIDEOS, {
          title: title.trim(),
          description: description.trim(),
          videoUrl,
          authorId: user?.id || '',
          authorName: user?.displayName || 'Anonyme',
          isPublished,
          publishedAt: isPublished ? now : '',
          createdAt: now,
          updatedAt: now,
        });
      }

      toast({
        title: isEditing ? 'Vidéo modifiée' : 'Vidéo ajoutée',
        description: isEditing
          ? 'La vidéo a été mise à jour avec succès.'
          : 'La nouvelle vidéo a été ajoutée avec succès.',
      });
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving blog video:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de sauvegarder la vidéo. Veuillez réessayer.',
      });
    } finally {
      setSaving(false);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier la vidéo' : 'Ajouter une vidéo'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifiez les informations de la vidéo ci-dessous.'
              : 'Renseignez les informations pour ajouter une nouvelle vidéo.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="video-title">Titre *</Label>
            <Input
              id="video-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de la vidéo"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="video-description">Description</Label>
            <Textarea
              id="video-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description de la vidéo..."
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="video-file">
              {isEditing ? 'Remplacer la vidéo (optionnel)' : 'Fichier vidéo *'}
            </Label>
            <Input
              id="video-file"
              type="file"
              accept="video/*"
              onChange={handleVideoChange}
              className="cursor-pointer"
            />
            {videoFile && (
              <p className="text-xs text-muted-foreground">
                Fichier sélectionné : {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(1)} Mo)
              </p>
            )}

            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Téléchargement en cours...</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="video-published"
              checked={isPublished}
              onCheckedChange={(checked) => setIsPublished(checked === true)}
            />
            <Label htmlFor="video-published" className="cursor-pointer">
              Publier immédiatement
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={saving || uploading}>
            {saving || uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {uploading ? 'Téléchargement...' : 'Enregistrement...'}
              </>
            ) : isEditing ? (
              'Modifier'
            ) : (
              'Ajouter'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Delete Confirmation Dialog ====================

function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
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
}

// ==================== Main BlogPage ====================

export default function BlogPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const manageable = canManageBlog(user);

  // ---- Ads State ----
  const [ads, setAds] = useState<AdItem[]>([]);
  const [adsLoading, setAdsLoading] = useState(true);

  // ---- Blog Posts State ----
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [deletePostTarget, setDeletePostTarget] = useState<BlogPost | null>(null);
  const [deletingPost, setDeletingPost] = useState(false);

  // ---- Blog Videos State ----
  const [videos, setVideos] = useState<BlogVideo[]>([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<BlogVideo | null>(null);
  const [deleteVideoTarget, setDeleteVideoTarget] = useState<BlogVideo | null>(null);
  const [deletingVideo, setDeletingVideo] = useState(false);

  // ---- Article Detail View State ----
  const [viewingPost, setViewingPost] = useState<BlogPost | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // ---- Fetch Ads ----
  const fetchAds = useCallback(async () => {
    try {
      setAdsLoading(true);
      const result = await getDocs(
        query(COLLECTIONS.ADS, where('isActive', '==', true))
      );
      setAds(result.documents as AdItem[]);
    } catch (error) {
      console.error('Error fetching ads:', error);
      toast({ title: 'Erreur', description: 'Impossible de charger les publicités.', variant: 'destructive' });
    } finally {
      setAdsLoading(false);
    }
  }, []);

  // ---- Fetch Blog Posts ----
  const fetchPosts = useCallback(async () => {
    try {
      setPostsLoading(true);
      let result;
      if (manageable) {
        result = await getDocs(
          query(COLLECTIONS.BLOG_POSTS, orderBy('createdAt', 'desc'))
        );
      } else {
        result = await getDocs(
          query(
            COLLECTIONS.BLOG_POSTS,
            where('isPublished', '==', true),
            orderBy('publishedAt', 'desc')
          )
        );
      }
      setPosts(result.documents as BlogPost[]);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      toast({ title: 'Erreur', description: 'Impossible de charger les articles.', variant: 'destructive' });
    } finally {
      setPostsLoading(false);
    }
  }, [manageable]);

  // ---- Fetch Blog Videos ----
  const fetchVideos = useCallback(async () => {
    try {
      setVideosLoading(true);
      let result;
      if (manageable) {
        result = await getDocs(
          query(COLLECTIONS.BLOG_VIDEOS, orderBy('createdAt', 'desc'))
        );
      } else {
        result = await getDocs(
          query(
            COLLECTIONS.BLOG_VIDEOS,
            where('isPublished', '==', true),
            orderBy('publishedAt', 'desc')
          )
        );
      }
      setVideos(result.documents as BlogVideo[]);
    } catch (error) {
      console.error('Error fetching blog videos:', error);
      toast({ title: 'Erreur', description: 'Impossible de charger les vidéos.', variant: 'destructive' });
    } finally {
      setVideosLoading(false);
    }
  }, [manageable]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // ---- Post Handlers ----
  const handleCreatePost = () => {
    setEditingPost(null);
    setPostDialogOpen(true);
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setPostDialogOpen(true);
  };

  const handleDeletePost = (post: BlogPost) => {
    setDeletePostTarget(post);
  };

  const confirmDeletePost = async () => {
    if (!deletePostTarget) return;
    setDeletingPost(true);
    try {
      await deleteDoc(doc(COLLECTIONS.BLOG_POSTS, deletePostTarget.$id));
      toast({
        title: 'Article supprimé',
        description: 'L\'article a été supprimé avec succès.',
      });
      fetchPosts();
      setDeletePostTarget(null);
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de supprimer l\'article.',
      });
    } finally {
      setDeletingPost(false);
    }
  };

  const handleTogglePostPublish = async (post: BlogPost) => {
    try {
      const now = new Date().toISOString();
      await updateDoc(doc(COLLECTIONS.BLOG_POSTS, post.$id), {
        isPublished: !post.isPublished,
        publishedAt: !post.isPublished ? now : '',
        updatedAt: now,
      });
      toast({
        title: post.isPublished ? 'Article dépublié' : 'Article publié',
        description: post.isPublished
          ? 'L\'article n\'est plus visible publiquement.'
          : 'L\'article est maintenant visible publiquement.',
      });
      fetchPosts();
    } catch (error) {
      console.error('Error toggling post publish:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de modifier le statut de publication.',
      });
    }
  };

  // ---- Video Handlers ----
  const handleCreateVideo = () => {
    setEditingVideo(null);
    setVideoDialogOpen(true);
  };

  const handleEditVideo = (video: BlogVideo) => {
    setEditingVideo(video);
    setVideoDialogOpen(true);
  };

  const handleDeleteVideo = (video: BlogVideo) => {
    setDeleteVideoTarget(video);
  };

  const confirmDeleteVideo = async () => {
    if (!deleteVideoTarget) return;
    setDeletingVideo(true);
    try {
      await deleteDoc(doc(COLLECTIONS.BLOG_VIDEOS, deleteVideoTarget.$id));
      toast({
        title: 'Vidéo supprimée',
        description: 'La vidéo a été supprimée avec succès.',
      });
      fetchVideos();
      setDeleteVideoTarget(null);
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de supprimer la vidéo.',
      });
    } finally {
      setDeletingVideo(false);
    }
  };

  const handleToggleVideoPublish = async (video: BlogVideo) => {
    try {
      const now = new Date().toISOString();
      await updateDoc(doc(COLLECTIONS.BLOG_VIDEOS, video.$id), {
        isPublished: !video.isPublished,
        publishedAt: !video.isPublished ? now : '',
        updatedAt: now,
      });
      toast({
        title: video.isPublished ? 'Vidéo dépubliée' : 'Vidéo publiée',
        description: video.isPublished
          ? 'La vidéo n\'est plus visible publiquement.'
          : 'La vidéo est maintenant visible publiquement.',
      });
      fetchVideos();
    } catch (error) {
      console.error('Error toggling video publish:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de modifier le statut de publication.',
      });
    }
  };

  // ---- View Post Handler ----
  const handleViewPost = (post: BlogPost) => {
    setViewingPost(post);
    setDetailOpen(true);
  };

  // ---- Render ----

  const publishedPosts = posts;
  const publishedVideos = videos;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ===== PART 1: Ads Carousel ===== */}
        {adsLoading ? (
          <Skeleton className="w-full aspect-video rounded-xl" />
        ) : ads.length > 0 ? (
          <AdsCarousel ads={ads} />
        ) : null}

        {/* ===== PART 2: Blog Tabs ===== */}
        <Tabs defaultValue="articles" className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <TabsList className="relative h-auto p-0 bg-transparent rounded-none border-b border-border w-full sm:w-auto">
              <TabsTrigger
                value="articles"
                className="relative rounded-none border-0 bg-transparent px-4 pb-3 pt-2 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors hover:text-foreground"
              >
                <Newspaper className="h-4 w-4 mr-2" />
                Articles
                <Badge variant="secondary" className="ml-2 font-normal text-xs">
                  {posts.length}
                </Badge>
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 scale-x-0 data-[state=active]:scale-x-100 transition-transform duration-300 origin-left" />
              </TabsTrigger>
              <TabsTrigger
                value="videos"
                className="relative rounded-none border-0 bg-transparent px-4 pb-3 pt-2 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors hover:text-foreground"
              >
                <VideoIcon className="h-4 w-4 mr-2" />
                Vidéos
                <Badge variant="secondary" className="ml-2 font-normal text-xs">
                  {publishedVideos.length}
                </Badge>
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 scale-x-0 data-[state=active]:scale-x-100 transition-transform duration-300 origin-left" />
              </TabsTrigger>
            </TabsList>
            {manageable && (
              <div className="flex items-center gap-2">
                <Button onClick={handleCreatePost} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvel article
                </Button>
                <Button onClick={handleCreateVideo} size="sm" variant="outline">
                  <VideoIcon className="h-4 w-4 mr-2" />
                  Ajouter une vidéo
                </Button>
              </div>
            )}
          </div>

          {/* ---- Articles Tab ---- */}
          <TabsContent value="articles">
            {postsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-[16/10] w-full" />
                    <CardHeader>
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full mt-2" />
                      <Skeleton className="h-4 w-2/3 mt-2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : publishedPosts.length === 0 ? (
              <EmptyState
                icon={Newspaper}
                title="Aucun article"
                description={
                  manageable
                    ? 'Commencez par créer votre premier article de blog.'
                    : 'Aucun article publié pour le moment. Revenez bientôt !'
                }
                action={manageable ? { label: 'Créer un article', onClick: handleCreatePost } : undefined}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {publishedPosts.map((post) => (
                  <BlogPostCard
                    key={post.$id}
                    post={post}
                    canManage={manageable}
                    onEdit={handleEditPost}
                    onDelete={handleDeletePost}
                    onTogglePublish={handleTogglePostPublish}
                    onView={handleViewPost}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ---- Videos Tab ---- */}
          <TabsContent value="videos">
            {videosLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-video w-full bg-black" />
                    <CardHeader>
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3 mt-2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : publishedVideos.length === 0 ? (
              <EmptyState
                icon={VideoIcon}
                title="Aucune vidéo"
                description={
                  manageable
                    ? 'Ajoutez votre première vidéo longue pour enrichir le blog.'
                    : 'Aucune vidéo publiée pour le moment. Revenez bientôt !'
                }
                action={manageable ? { label: 'Ajouter une vidéo', onClick: handleCreateVideo } : undefined}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {publishedVideos.map((video) => (
                  <BlogVideoCard
                    key={video.$id}
                    video={video}
                    canManage={manageable}
                    onEdit={handleEditVideo}
                    onDelete={handleDeleteVideo}
                    onTogglePublish={handleToggleVideoPublish}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ===== Post Dialog ===== */}
      <BlogPostDialog
        open={postDialogOpen}
        onOpenChange={setPostDialogOpen}
        post={editingPost}
        user={user}
        onSave={fetchPosts}
      />

      {/* ===== Video Dialog ===== */}
      <BlogVideoDialog
        open={videoDialogOpen}
        onOpenChange={setVideoDialogOpen}
        video={editingVideo}
        user={user}
        onSave={fetchVideos}
      />

      {/* ===== Delete Post Confirmation ===== */}
      <DeleteConfirmDialog
        open={!!deletePostTarget}
        onOpenChange={(open) => {
          if (!open) setDeletePostTarget(null);
        }}
        title="Supprimer l\'article"
        description={
          deletePostTarget
            ? `Êtes-vous sûr de vouloir supprimer l\'article « ${deletePostTarget.title} » ? Cette action est irréversible.`
            : ''
        }
        onConfirm={confirmDeletePost}
        loading={deletingPost}
      />

      {/* ===== Delete Video Confirmation ===== */}
      <DeleteConfirmDialog
        open={!!deleteVideoTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteVideoTarget(null);
        }}
        title="Supprimer la vidéo"
        description={
          deleteVideoTarget
            ? `Êtes-vous sûr de vouloir supprimer la vidéo « ${deleteVideoTarget.title} » ? Cette action est irréversible.`
            : ''
        }
        onConfirm={confirmDeleteVideo}
        loading={deletingVideo}
      />

      {/* ===== Article Detail Dialog ===== */}
      <BlogArticleDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        post={viewingPost}
        canManage={manageable}
        onEdit={handleEditPost}
      />
    </div>
  );
}
