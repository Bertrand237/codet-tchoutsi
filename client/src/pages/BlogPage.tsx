import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Newspaper, Upload, Calendar, Pencil, Trash2, Video, Play, Pause } from "lucide-react";
import type { BlogPost, BlogVideo } from "@shared/schema";
import { addDoc, db, doc, getDocs, getDownloadURL, query, ref, storage, toDate, updateDoc, uploadBytes, uploadBytesResumable, orderBy, where, deleteDoc } from '@/lib/firebase-compat';
import AdsCarousel from "@/components/AdsCarousel";

export default function BlogPage() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    isPublished: false,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [videos, setVideos] = useState<BlogVideo[]>([]);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [videoEditDialogOpen, setVideoEditDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<BlogVideo | null>(null);
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoFormData, setVideoFormData] = useState({
    title: "",
    description: "",
    isPublished: false,
  });

  const canManageBlog = userProfile && (userProfile.role === "admin" || userProfile.role === "président" || userProfile.role === "secretaire" || userProfile.role === "celcom");

  useEffect(() => {
    fetchPosts();
    fetchVideos();
  }, [canManageBlog]);

  async function fetchPosts() {
    try {
      const postsRef = "blog-posts";
      let q = query(postsRef, orderBy("createdAt", "desc"));
      
      if (!canManageBlog) {
        q = query(postsRef, where("isPublished", "==", true), orderBy("createdAt", "desc"));
      }

      const snapshot = await getDocs(q);
      const postsData = snapshot.documents.map((doc) => ({
        id: doc.$id,
        title: doc.title,
        content: doc.content,
        excerpt: doc.excerpt,
        imageUrl: doc.imageUrl || doc.imageURL,
        authorId: doc.authorId,
        authorName: doc.authorName,
        isPublished: doc.isPublished !== undefined ? doc.isPublished : doc.published,
        publishedAt: toDate(doc.publishedAt),
        createdAt: toDate(doc.createdAt) || new Date(),
        updatedAt: toDate(doc.updatedAt) || new Date(),
      })) as BlogPost[];

      setPosts(postsData);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les articles",
      });
    } finally {
      setLoading(false);
    }
  }

  async function fetchVideos() {
    try {
      const videosRef = "blog-videos";
      let q = query(videosRef, orderBy("createdAt", "desc"));

      if (!canManageBlog) {
        q = query(videosRef, where("isPublished", "==", true), orderBy("createdAt", "desc"));
      }

      const snapshot = await getDocs(q);
      const videosData = snapshot.documents.map((document) => ({
        id: document.$id,
        title: document.title,
        description: document.description || "",
        videoUrl: document.videoUrl,
        authorId: document.authorId,
        authorName: document.authorName,
        isPublished: document.isPublished === true,
        publishedAt: document.publishedAt ? toDate(document.publishedAt) : undefined,
        createdAt: toDate(document.createdAt) || new Date(),
        updatedAt: toDate(document.updatedAt) || new Date(),
      })) as BlogVideo[];

      setVideos(videosData);
    } catch (error) {
      console.error("Error fetching blog videos:", error);
      toast({
        variant: "destructive",
        title: "Vidéos indisponibles",
        description: "La collection des vidéos longues n'est pas encore configurée dans Appwrite.",
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userProfile) return;

    setSubmitting(true);

    try {
      let imageURL = "";
      
      if (imageFile) {
        const storageRef = ref(storage, `blog/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageURL = await getDownloadURL(storageRef);
      }

      const postData = {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt,
        imageUrl: imageURL,
        author: userProfile.displayName,
        authorId: userProfile.id,
        authorName: userProfile.displayName,
        isPublished: formData.isPublished,
        publishedAt: formData.isPublished ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDoc("blog-posts", postData);

      toast({
        title: "Article créé",
        description: formData.isPublished ? "L'article a été publié" : "L'article a été enregistré en brouillon",
      });

      setDialogOpen(false);
      setFormData({ title: "", content: "", excerpt: "", isPublished: false });
      setImageFile(null);
      fetchPosts();
    } catch (error) {
      console.error("Error creating blog post:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de créer l'article",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function togglePublishStatus(postId: string, currentStatus: boolean) {
    try {
      await updateDoc({ collectionId: "blog-posts", id: postId }, {
        isPublished: !currentStatus,
        publishedAt: !currentStatus ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: !currentStatus ? "Article publié" : "Article dépublié",
        description: "Le statut de l'article a été mis à jour",
      });

      fetchPosts();
    } catch (error) {
      console.error("Error toggling publish status:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
      });
    }
  }

  function handleEditPost(post: BlogPost) {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || "",
      isPublished: post.isPublished,
    });
    setImageFile(null);
    setEditDialogOpen(true);
  }

  async function handleUpdatePost(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPost || !userProfile) return;

    setSubmitting(true);

    try {
      let imageURL = editingPost.imageUrl;
      
      if (imageFile) {
        const storageRef = ref(storage, `blog/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageURL = await getDownloadURL(storageRef);
      }

      const updateData: any = {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt,
        isPublished: formData.isPublished,
        updatedAt: new Date().toISOString(),
      };

      if (imageFile) {
        updateData.imageUrl = imageURL;
      }

      if (formData.isPublished && !editingPost.isPublished) {
        updateData.publishedAt = new Date().toISOString();
      }

      await updateDoc({ collectionId: "blog-posts", id: editingPost.id }, updateData);

      toast({
        title: "Article modifié",
        description: "L'article a été mis à jour avec succès",
      });

      setEditDialogOpen(false);
      setEditingPost(null);
      setFormData({ title: "", content: "", excerpt: "", isPublished: false });
      setImageFile(null);
      fetchPosts();
    } catch (error) {
      console.error("Error updating blog post:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de modifier l'article",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeletePost() {
    if (!deletingPostId) return;

    try {
      await deleteDoc({ collectionId: "blog-posts", id: deletingPostId });

      toast({
        title: "Article supprimé",
        description: "L'article a été supprimé avec succès",
      });

      setDeletingPostId(null);
      fetchPosts();
    } catch (error) {
      console.error("Error deleting blog post:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer l'article",
      });
    }
  }

  function resetVideoForm() {
    setVideoFormData({ title: "", description: "", isPublished: false });
    setVideoFile(null);
    setVideoUploadProgress(0);
    setEditingVideo(null);
  }

  async function handleSubmitVideo(event: React.FormEvent) {
    event.preventDefault();
    if (!userProfile || !videoFile) {
      toast({
        variant: "destructive",
        title: "Vidéo requise",
        description: "Sélectionnez un fichier vidéo avant de continuer.",
      });
      return;
    }

    setSubmitting(true);
    setVideoUploadProgress(0);

    try {
      const storageRef = ref(storage, `blog-videos/${Date.now()}_${videoFile.name}`);
      const uploadTask = uploadBytesResumable(storageRef, videoFile);

      uploadTask.on(
        "state_changed",
        (snapshot) => setVideoUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
        () => {
          setSubmitting(false);
          setVideoUploadProgress(0);
          toast({ variant: "destructive", title: "Erreur", description: "Impossible de télécharger la vidéo." });
        },
        async () => {
          try {
            const snapshot = await uploadTask;
            const videoUrl = await getDownloadURL(snapshot.ref);
            await addDoc("blog-videos", {
              title: videoFormData.title,
              description: videoFormData.description,
              videoUrl,
              authorId: userProfile.id,
              authorName: userProfile.displayName,
              isPublished: videoFormData.isPublished,
              publishedAt: videoFormData.isPublished ? new Date().toISOString() : null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            toast({
              title: "Vidéo ajoutée",
              description: videoFormData.isPublished ? "La vidéo est maintenant visible dans le blog." : "La vidéo a été enregistrée en brouillon.",
            });
            setVideoDialogOpen(false);
            resetVideoForm();
            fetchVideos();
          } catch (error) {
            console.error("Error creating blog video:", error);
            toast({ variant: "destructive", title: "Erreur", description: "Impossible d'enregistrer la vidéo." });
          } finally {
            setSubmitting(false);
            setVideoUploadProgress(0);
          }
        },
      );
    } catch (error) {
      console.error("Error uploading blog video:", error);
      setSubmitting(false);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'ajouter la vidéo." });
    }
  }

  function handleEditVideo(video: BlogVideo) {
    setEditingVideo(video);
    setVideoFormData({
      title: video.title,
      description: video.description || "",
      isPublished: video.isPublished,
    });
    setVideoFile(null);
    setVideoEditDialogOpen(true);
  }

  async function handleUpdateVideo(event: React.FormEvent) {
    event.preventDefault();
    if (!editingVideo) return;
    setSubmitting(true);

    try {
      const updateData: Record<string, unknown> = {
        title: videoFormData.title,
        description: videoFormData.description,
        isPublished: videoFormData.isPublished,
        updatedAt: new Date().toISOString(),
      };

      if (videoFormData.isPublished && !editingVideo.isPublished) {
        updateData.publishedAt = new Date().toISOString();
      }

      if (videoFile) {
        const storageRef = ref(storage, `blog-videos/${Date.now()}_${videoFile.name}`);
        await uploadBytes(storageRef, videoFile);
        updateData.videoUrl = await getDownloadURL(storageRef);
      }

      await updateDoc({ collectionId: "blog-videos", id: editingVideo.id }, updateData);
      toast({ title: "Vidéo modifiée", description: "Les informations de la vidéo ont été mises à jour." });
      setVideoEditDialogOpen(false);
      resetVideoForm();
      fetchVideos();
    } catch (error) {
      console.error("Error updating blog video:", error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de modifier la vidéo." });
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleVideoPublishStatus(video: BlogVideo) {
    try {
      await updateDoc({ collectionId: "blog-videos", id: video.id }, {
        isPublished: !video.isPublished,
        publishedAt: !video.isPublished ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
      });
      toast({ title: !video.isPublished ? "Vidéo publiée" : "Vidéo dépubliée", description: "Le statut de la vidéo a été mis à jour." });
      fetchVideos();
    } catch (error) {
      console.error("Error toggling blog video:", error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de modifier le statut de la vidéo." });
    }
  }

  async function handleDeleteVideo() {
    if (!deletingVideoId) return;
    try {
      await deleteDoc({ collectionId: "blog-videos", id: deletingVideoId });
      toast({ title: "Vidéo supprimée", description: "La vidéo a été supprimée du blog." });
      setDeletingVideoId(null);
      fetchVideos();
    } catch (error) {
      console.error("Error deleting blog video:", error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer la vidéo." });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Carrousel de publicités vidéo visible par tous (y compris visiteurs) */}
      <AdsCarousel />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Blog CODET</h1>
          <p className="text-muted-foreground">Actualités et annonces du comité</p>
        </div>
        {canManageBlog && (
          <div className="flex flex-wrap gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-post">
                <Plus className="h-4 w-4 mr-2" />
                Nouvel Article
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer un article</DialogTitle>
                <DialogDescription>
                  Rédigez un nouvel article pour le blog du comité
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre</Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="Titre de l'article"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    data-testid="input-title"
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Extrait</Label>
                  <Input
                    id="excerpt"
                    type="text"
                    placeholder="Résumé court de l'article"
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    required
                    data-testid="input-excerpt"
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Contenu</Label>
                  <Textarea
                    id="content"
                    placeholder="Contenu de l'article..."
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    required
                    rows={8}
                    data-testid="input-content"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Image (optionnel)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      data-testid="input-image"
                      className="h-12"
                    />
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="published"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    data-testid="checkbox-published"
                    className="h-4 w-4"
                  />
                  <Label htmlFor="published" className="cursor-pointer">
                    Publier immédiatement
                  </Label>
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={submitting} data-testid="button-submit-post">
                    {submitting ? "Création..." : "Créer l'article"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={videoDialogOpen} onOpenChange={(open) => {
            setVideoDialogOpen(open);
            if (!open) resetVideoForm();
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-add-blog-video">
                <Video className="mr-2 h-4 w-4" />
                Nouvelle vidéo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Ajouter une vidéo longue</DialogTitle>
                <DialogDescription>
                  Ajoutez une vidéo au format chaîne vidéo, visible dans l'espace Vidéos du blog.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitVideo} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="video-title">Titre</Label>
                  <Input
                    id="video-title"
                    value={videoFormData.title}
                    onChange={(event) => setVideoFormData({ ...videoFormData, title: event.target.value })}
                    placeholder="Titre de la vidéo"
                    required
                    className="h-12"
                    data-testid="input-blog-video-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video-description">Description</Label>
                  <Textarea
                    id="video-description"
                    value={videoFormData.description}
                    onChange={(event) => setVideoFormData({ ...videoFormData, description: event.target.value })}
                    placeholder="Présentez cette vidéo..."
                    rows={4}
                    data-testid="input-blog-video-description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blog-video-file">Fichier vidéo</Label>
                  <Input
                    id="blog-video-file"
                    type="file"
                    accept="video/*"
                    onChange={(event) => setVideoFile(event.target.files?.[0] || null)}
                    required
                    className="h-12"
                    data-testid="input-blog-video-file"
                  />
                </div>
                {submitting && videoUploadProgress > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Téléchargement : {Math.round(videoUploadProgress)}%
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="video-published"
                    checked={videoFormData.isPublished}
                    onChange={(event) => setVideoFormData({ ...videoFormData, isPublished: event.target.checked })}
                    className="h-4 w-4"
                    data-testid="checkbox-blog-video-published"
                  />
                  <Label htmlFor="video-published" className="cursor-pointer">Publier immédiatement</Label>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={submitting} data-testid="button-submit-blog-video">
                    {submitting ? `Téléchargement... ${Math.round(videoUploadProgress)}%` : "Ajouter la vidéo"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        )}
      </div>

      <div className="grid gap-6">
        {posts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Newspaper className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">Aucun article publié</p>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="hover-elevate" data-testid={`card-post-${post.id}`}>
              <div className="grid md:grid-cols-3 gap-6">
                {post.imageUrl && (
                  <div className="md:col-span-1">
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full h-48 md:h-full object-cover rounded-l-lg"
                    />
                  </div>
                )}
                <div className={post.imageUrl ? "md:col-span-2" : "md:col-span-3"}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-2xl mb-2">{post.title}</CardTitle>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>Par {post.authorName}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {post.publishedAt?.toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {post.isPublished ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                            Publié
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Brouillon</Badge>
                        )}
                        {canManageBlog && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => togglePublishStatus(post.id, post.isPublished)}
                              data-testid="button-toggle-publish"
                            >
                              {post.isPublished ? "Dépublier" : "Publier"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditPost(post)}
                              data-testid={`button-edit-post-${post.id}`}
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              Modifier
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeletingPostId(post.id)}
                              data-testid={`button-delete-post-${post.id}`}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Supprimer
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{post.excerpt}</p>
                    <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
                  </CardContent>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4 border-b pb-3">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <Video className="h-6 w-6 text-primary" />
              Vidéos longues
            </h2>
            <p className="text-muted-foreground">Retrouvez les émissions, reportages et rencontres du comité.</p>
          </div>
          <Badge variant="secondary">{videos.length} vidéo{videos.length > 1 ? "s" : ""}</Badge>
        </div>

        {videos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Video className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-center text-muted-foreground">Aucune vidéo longue publiée pour le moment.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {videos.map((video) => (
              <Card key={video.id} className="overflow-hidden hover-elevate" data-testid={`card-blog-video-${video.id}`}>
                <div className="aspect-video bg-black">
                  <video
                    src={video.videoUrl}
                    controls
                    preload="metadata"
                    className="h-full w-full object-cover"
                    data-testid={`video-blog-${video.id}`}
                  >
                    Votre navigateur ne supporte pas la lecture vidéo.
                  </video>
                </div>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="line-clamp-2 text-lg font-semibold">{video.title}</h3>
                    {canManageBlog && (
                      video.isPublished ? (
                        <Badge className="shrink-0 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                          Publiée
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="shrink-0">Brouillon</Badge>
                      )
                    )}
                  </div>
                  {video.description && <p className="line-clamp-3 text-sm text-muted-foreground">{video.description}</p>}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Par {video.authorName}</span>
                    <span>{video.createdAt.toLocaleDateString("fr-FR")}</span>
                  </div>
                  {canManageBlog && (
                    <div className="flex flex-wrap gap-2 border-t pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleVideoPublishStatus(video)}
                        data-testid={`button-toggle-blog-video-${video.id}`}
                      >
                        {video.isPublished ? <Pause className="mr-1 h-4 w-4" /> : <Play className="mr-1 h-4 w-4" />}
                        {video.isPublished ? "Dépublier" : "Publier"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditVideo(video)}
                        data-testid={`button-edit-blog-video-${video.id}`}
                      >
                        <Pencil className="mr-1 h-4 w-4" />
                        Modifier
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeletingVideoId(video.id)}
                        data-testid={`button-delete-blog-video-${video.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Dialog open={videoEditDialogOpen} onOpenChange={(open) => {
        setVideoEditDialogOpen(open);
        if (!open) resetVideoForm();
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier la vidéo</DialogTitle>
            <DialogDescription>Modifiez les informations ou remplacez le fichier vidéo.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateVideo} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-video-title">Titre</Label>
              <Input
                id="edit-video-title"
                value={videoFormData.title}
                onChange={(event) => setVideoFormData({ ...videoFormData, title: event.target.value })}
                required
                className="h-12"
                data-testid="input-edit-blog-video-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-video-description">Description</Label>
              <Textarea
                id="edit-video-description"
                value={videoFormData.description}
                onChange={(event) => setVideoFormData({ ...videoFormData, description: event.target.value })}
                rows={4}
                data-testid="input-edit-blog-video-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-blog-video-file">Remplacer la vidéo (optionnel)</Label>
              <Input
                id="edit-blog-video-file"
                type="file"
                accept="video/*"
                onChange={(event) => setVideoFile(event.target.files?.[0] || null)}
                className="h-12"
                data-testid="input-edit-blog-video-file"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-video-published"
                checked={videoFormData.isPublished}
                onChange={(event) => setVideoFormData({ ...videoFormData, isPublished: event.target.checked })}
                className="h-4 w-4"
                data-testid="checkbox-edit-blog-video-published"
              />
              <Label htmlFor="edit-video-published" className="cursor-pointer">Publier la vidéo</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setVideoEditDialogOpen(false)} disabled={submitting}>
                Annuler
              </Button>
              <Button type="submit" disabled={submitting} data-testid="button-save-blog-video">
                {submitting ? "Mise à jour..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingVideoId} onOpenChange={(open) => !open && setDeletingVideoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette vidéo ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible. La vidéo sera retirée du blog.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteVideo}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-blog-video"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) {
          setEditingPost(null);
          setFormData({ title: "", content: "", excerpt: "", isPublished: false });
          setImageFile(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier l'article</DialogTitle>
            <DialogDescription>
              Modifiez les informations de votre article
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePost} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Titre</Label>
              <Input
                id="edit-title"
                type="text"
                placeholder="Titre de l'article"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                data-testid="input-edit-title"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-excerpt">Extrait</Label>
              <Input
                id="edit-excerpt"
                type="text"
                placeholder="Résumé court de l'article"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                required
                data-testid="input-edit-excerpt"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-content">Contenu</Label>
              <Textarea
                id="edit-content"
                placeholder="Contenu de l'article..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
                rows={8}
                data-testid="input-edit-content"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-image">Nouvelle image (optionnel)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="edit-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  data-testid="input-edit-image"
                  className="h-12"
                />
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              {editingPost?.imageUrl && !imageFile && (
                <p className="text-sm text-muted-foreground">Image actuelle conservée si aucune nouvelle image n'est uploadée</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-published"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                data-testid="checkbox-edit-published"
                className="h-4 w-4"
              />
              <Label htmlFor="edit-published" className="cursor-pointer">
                Publier l'article
              </Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={submitting}
                data-testid="button-cancel-edit-post"
              >
                Annuler
              </Button>
              <Button type="submit" disabled={submitting} data-testid="button-save-edit-post">
                {submitting ? "Mise à jour..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingPostId} onOpenChange={(open) => !open && setDeletingPostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet article ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'article sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-post">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-post"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
