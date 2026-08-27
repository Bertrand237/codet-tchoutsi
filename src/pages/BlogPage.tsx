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

// Fonction de vérification pour les membres du bureau
function canManageBlog(user: CodetUser | null): boolean {
  if (!user) return false;
  const officeRoles = [
    'admin',
    'président',
    'secretaire',
    'secretaire_general',
    'trésorier',
    'commissaire',
    'celcom',
    'responsable_communication'
  ];
  return officeRoles.includes(user.role);
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

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [currentIndex]);

  if (ads.length === 0) return null;

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-black mb-8 shadow-md">
      {videoSrc && (
        <video
          ref={videoRef}
          key={currentIndex}
          src={videoSrc}
          muted
          autoPlay
          playsInline
          onEnded={handleVideoEnded}
          className="w-full aspect-video object-contain bg-black"
        ></video>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
      {currentAd?.titre && (
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3">
          <p className="text-white text-xs font-semibold truncate uppercase tracking-wider opacity-90">
            Sponsorisé — {currentAd.titre}
          </p>
        </div>
      )}
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
      className={`overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full cursor-pointer group ${!post.isPublished ? 'opacity-70 border-dashed' : ''}`}
      onClick={() => onView(post)}
    >
      {imgUrl ? (
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          <img
            src={imgUrl}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {!post.isPublished && (
            <Badge variant="secondary" className="absolute top-2 right-2 text-[10px]">Brouillon</Badge>
          )}
        </div>
      ) : (
        <div className="aspect-[16/10] bg-muted flex items-center justify-center">
          <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
        </div>
      )}

      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base font-bold leading-tight line-clamp-2">{post.title}</CardTitle>
        <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground uppercase font-semibold">
          <span className="text-emerald-600">{authorName}</span>
          <span>•</span>
          <span>{relativeDate}</span>
        </div>
      </CardHeader>

      <CardFooter className="p-4 pt-0 mt-auto flex justify-between items-center">
        <span className="text-[10px] font-medium text-muted-foreground">{readingTime}</span>
        {canManage && (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(post)}><Pencil className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(post)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full">
      <div className="relative aspect-video w-full bg-black group">
        <video
          src={video.videoUrl}
          controls
          className="w-full h-full object-contain"
        ></video>
        {!video.isPublished && (
          <Badge variant="secondary" className="absolute top-2 right-2 text-[10px]">Brouillon</Badge>
        )}
      </div>

      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base font-bold leading-tight line-clamp-2">{video.title}</CardTitle>
        <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground uppercase font-semibold">
          <span className="text-emerald-600">{authorName}</span>
          <span>•</span>
          <span>{relativeDate}</span>
        </div>
      </CardHeader>

      {canManage && (
        <CardFooter className="p-4 pt-0 mt-auto flex justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(video)}><Pencil className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(video)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: BlogPost | null;
}) {
  if (!post) return null;
  const imgUrl = getImageUrl(post);
  const authorName = post.authorName || 'Anonyme';
  const fullDate = formatDate(post.isPublished ? post.publishedAt : post.createdAt);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden bg-background">
        <ScrollArea className="max-h-[90vh]">
          {imgUrl && <img src={imgUrl} alt={post.title} className="w-full aspect-video object-cover" />}
          <div className="p-6 md:p-8 space-y-4">
            <div className="text-[10px] uppercase tracking-widest font-bold text-emerald-600">{authorName} — {fullDate}</div>
            <h1 className="text-2xl md:text-4xl font-extrabold leading-tight">{post.title}</h1>
            <Separator />
            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {post.content}
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
  const [content, setContent] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (open && post) {
      setTitle(post.title);
      setContent(post.content);
      setIsPublished(post.isPublished);
    } else if (open) {
      setTitle('');
      setContent('');
      setIsPublished(false);
    }
  }, [open, post]);

  const handleSubmit = async () => {
    if (!title || !content) return;
    setSaving(true);
    try {
      let imageUrl = post ? getImageUrl(post) : '';
      if (imageFile) {
        const fileRef = ref(storageObj, `blog/${Date.now()}-${imageFile.name}`);
        await uploadBytes(fileRef, imageFile);
        imageUrl = await getDownloadURL(fileRef);
      }
      const now = new Date().toISOString();
      if (post) {
        await updateDoc(doc(COLLECTIONS.BLOG_POSTS, post.$id), { title, content, isPublished, imageUrl, updatedAt: now });
      } else {
        await addDoc(COLLECTIONS.BLOG_POSTS, { title, content, imageUrl, isPublished, authorId: user?.id, authorName: user?.displayName, createdAt: now, updatedAt: now });
      }
      onSave();
      onOpenChange(false);
      toast({ title: "Succès", description: "L'article a été sauvegardé." });
    } catch (e) {
      toast({ variant: "destructive", title: "Erreur", description: "Erreur lors de la sauvegarde." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>{post ? 'Modifier' : 'Nouveau'} l'article</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1"><Label>Titre</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div className="space-y-1"><Label>Contenu</Label><Textarea rows={8} value={content} onChange={e => setContent(e.target.value)} /></div>
          <div className="space-y-1"><Label>Image</Label><Input type="file" onChange={e => setImageFile(e.target.files?.[0] || null)} /></div>
          <div className="flex items-center gap-2"><Checkbox checked={isPublished} onCheckedChange={c => setIsPublished(!!c)} /><Label>Publier</Label></div>
        </div>
        <DialogFooter><Button onClick={handleSubmit} disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : 'Sauvegarder'}</Button></DialogFooter>
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
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (open && video) setTitle(video.title);
    else if (open) setTitle('');
  }, [open, video]);

  const handleSubmit = async () => {
    if (!title || (!video && !videoFile)) return;
    setSaving(true);
    try {
      let videoUrl = video?.videoUrl || '';
      if (videoFile) {
        const fileRef = ref(storageObj, `blog-videos/${Date.now()}-${videoFile.name}`);
        await new Promise<void>((resolve, reject) => {
          uploadBytesResumable(fileRef, videoFile).on('state_changed', (s: any) => setProgress(Math.round((s.bytesTransferred/s.totalBytes)*100)), reject, async () => {
            videoUrl = await getDownloadURL(fileRef);
            resolve();
          });
        });
      }
      const now = new Date().toISOString();
      if (video) await updateDoc(doc(COLLECTIONS.BLOG_VIDEOS, video.$id), { title, videoUrl, updatedAt: now });
      else await addDoc(COLLECTIONS.BLOG_VIDEOS, { title, videoUrl, authorId: user?.id, authorName: user?.displayName, isPublished: true, createdAt: now, updatedAt: now });
      onSave();
      onOpenChange(false);
      toast({ title: "Succès", description: "Vidéo ajoutée." });
    } catch (e) {
      toast({ variant: "destructive", title: "Erreur", description: "Erreur upload." });
    } finally {
      setSaving(false); setProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Ajouter une vidéo</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1"><Label>Titre</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div className="space-y-1"><Label>Fichier vidéo</Label><Input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files?.[0] || null)} /></div>
          {progress > 0 && <div className="space-y-1"><Progress value={progress} /><p className="text-[10px] text-center font-bold">{progress}%</p></div>}
        </div>
        <DialogFooter><Button onClick={handleSubmit} disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : 'Sauvegarder'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Main BlogPage ====================

export default function BlogPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const manageable = canManageBlog(user);

  const [ads, setAds] = useState<AdItem[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [videos, setVideos] = useState<BlogVideo[]>([]);
  const [loading, setLoading] = useState(true);

  const [postOpen, setPostOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [viewingPost, setViewingPost] = useState<BlogPost | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [adsRes, postsRes, videosRes] = await Promise.all([
        getDocs(query(COLLECTIONS.ADS, where('isActive', '==', true))),
        getDocs(query(COLLECTIONS.BLOG_POSTS, orderBy('createdAt', 'desc'))),
        getDocs(query(COLLECTIONS.BLOG_VIDEOS, orderBy('createdAt', 'desc')))
      ]);
      setAds(adsRes.documents as AdItem[]);
      setPosts(postsRes.documents as BlogPost[]);
      setVideos(videosRes.documents as BlogVideo[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (col: string, id: string) => {
    if (!confirm("Supprimer ?")) return;
    await deleteDoc(doc(col, id));
    fetchData();
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <AdsCarousel ads={ads} />

      <Tabs defaultValue="articles" className="w-full">
        <div className="flex justify-between items-center border-b pb-2 mb-4">
          <TabsList className="bg-transparent gap-4">
            <TabsTrigger value="articles" className="data-[state=active]:text-emerald-600 border-b-2 border-transparent data-[state=active]:border-emerald-600 rounded-none pb-2">Articles</TabsTrigger>
            <TabsTrigger value="videos" className="data-[state=active]:text-emerald-600 border-b-2 border-transparent data-[state=active]:border-emerald-600 rounded-none pb-2">Vidéos</TabsTrigger>
          </TabsList>
          {manageable && (
            <div className="flex gap-2">
              <Button size="sm" className="bg-emerald-600" onClick={() => { setEditTarget(null); setPostOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Article</Button>
              <Button size="sm" variant="outline" onClick={() => { setEditTarget(null); setVideoOpen(true); }}><VideoIcon className="h-4 w-4 mr-1" /> Vidéo</Button>
            </div>
          )}
        </div>

        <TabsContent value="articles">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(p => <BlogPostCard key={p.$id} post={p} canManage={manageable} onEdit={p => { setEditTarget(p); setPostOpen(true); }} onDelete={p => handleDelete(COLLECTIONS.BLOG_POSTS, p.$id)} onTogglePublish={()=>{}} onView={p => setViewingPost(p)} />)}
          </div>
        </TabsContent>

        <TabsContent value="videos">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map(v => <BlogVideoCard key={v.$id} video={v} canManage={manageable} onEdit={v => { setEditTarget(v); setVideoOpen(true); }} onDelete={v => handleDelete(COLLECTIONS.BLOG_VIDEOS, v.$id)} onTogglePublish={()=>{}} />)}
          </div>
        </TabsContent>
      </Tabs>

      <BlogPostDialog open={postOpen} onOpenChange={setPostOpen} post={editTarget} user={user} onSave={fetchData} />
      <BlogVideoDialog open={videoOpen} onOpenChange={setVideoOpen} video={editTarget} user={user} onSave={fetchData} />
      <BlogArticleDetailDialog open={!!viewingPost} onOpenChange={() => setViewingPost(null)} post={viewingPost} />
    </div>
  );
}
