import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Send, MessageSquare, Pencil, Trash2, Image as ImageIcon, Mic, MicOff, Smile } from "lucide-react";
import type { Message } from "@shared/schema";
import { Timestamp, addDoc, limit, onSnapshot, query, orderBy, serverTimestamp, toDate, updateDoc, deleteDoc } from '@/lib/firebase-compat';
import { uploadFile, getFileUrl } from '@/lib/firebase-compat';
import EmojiPicker from 'emoji-picker-react';
import { Progress } from "@/components/ui/progress";

export default function ChatPage() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editText, setEditText] = useState("");
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Media states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const messagesRef = "messages";
    const q = query(messagesRef, orderBy("timestamp", "desc"), limit(100));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.documents
        .map((doc) => {
          const data = doc;
          let timestamp = new Date();
          
          if (data.timestamp) {
            if (new Date(data.timestamp)) {
              timestamp = toDate(data.timestamp);
            } else if (typeof data.timestamp === 'string') {
              timestamp = new Date(data.timestamp);
            }
          }
          
          return {
            id: doc.$id,
            userId: data.userId || data.senderId,
            userName: data.userName || data.senderName,
            text: data.text || data.content || "",
            messageType: data.messageType || "text",
            imageUrl: data.imageUrl,
            audioUrl: data.audioUrl,
            timestamp,
          };
        })
        .reverse() as Message[];

      setMessages(messagesData);
      
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    return () => unsubscribe();
  }, []);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!userProfile || !messageInput.trim()) return;

    setSending(true);

    try {
      await addDoc("messages", {
        userId: userProfile.id,
        userName: userProfile.displayName,
        text: messageInput.trim(),
        messageType: "text",
        timestamp: new Date().toISOString(),
      });

      setMessageInput("");
      setShowEmojiPicker(false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'envoyer le message",
      });
    } finally {
      setSending(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userProfile) return;

    // Validate image
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez sélectionner une image",
      });
      return;
    }

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "L'image ne doit pas dépasser 5 Mo",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // Declare intervals/timeouts at function scope for proper cleanup
    let progressInterval: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    // Set 60 second timeout
    timeoutId = setTimeout(() => {
      if (progressInterval) clearInterval(progressInterval);
      setUploading(false);
      setUploadProgress(0);
      toast({
        variant: "destructive",
        title: "Timeout",
        description: "L'upload a pris trop de temps. Veuillez réessayer.",
      });
    }, 60000);

    try {
      const uploadTask = uploadFile(`messages/${Date.now()}_${file.name}`, file);
      
      // Simulate progress
      progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            if (progressInterval) clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      const fileId = await uploadTask;
      
      if (progressInterval) clearInterval(progressInterval);
      if (timeoutId) clearTimeout(timeoutId);
      setUploadProgress(100);

      const imageUrl = await getFileUrl(fileId);

      // Send message with image
      await addDoc("messages", {
        userId: userProfile.id,
        userName: userProfile.displayName,
        text: messageInput.trim() || "Photo",
        messageType: "image",
        imageUrl,
        timestamp: new Date().toISOString(),
      });

      setMessageInput("");
      toast({
        title: "Photo envoyée",
        description: "Votre photo a été envoyée avec succès",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'envoyer la photo",
      });
    } finally {
      if (progressInterval) clearInterval(progressInterval);
      if (timeoutId) clearTimeout(timeoutId);
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await sendAudioMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
      setAudioChunks([]);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'accéder au microphone",
      });
    }
  }

  function stopRecording() {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
      setRecording(false);
      setMediaRecorder(null);
    }
  }

  async function sendAudioMessage(audioBlob: Blob) {
    if (!userProfile) return;

    setUploading(true);
    setUploadProgress(0);

    // Declare intervals/timeouts at function scope for proper cleanup
    let progressInterval: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    // Set 60 second timeout
    timeoutId = setTimeout(() => {
      if (progressInterval) clearInterval(progressInterval);
      setUploading(false);
      setUploadProgress(0);
      toast({
        variant: "destructive",
        title: "Timeout",
        description: "L'upload a pris trop de temps. Veuillez réessayer.",
      });
    }, 60000);

    try {
      const audioFile = new File([audioBlob], `audio_${Date.now()}.webm`, { type: 'audio/webm' });
      
      const uploadTask = uploadFile(`messages/${audioFile.name}`, audioFile);
      
      // Simulate progress
      progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            if (progressInterval) clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      const fileId = await uploadTask;
      
      if (progressInterval) clearInterval(progressInterval);
      if (timeoutId) clearTimeout(timeoutId);
      setUploadProgress(100);

      const audioUrl = await getFileUrl(fileId);

      // Send message with audio
      await addDoc("messages", {
        userId: userProfile.id,
        userName: userProfile.displayName,
        text: messageInput.trim() || "Message vocal",
        messageType: "audio",
        audioUrl,
        timestamp: new Date().toISOString(),
      });

      setMessageInput("");
      toast({
        title: "Message vocal envoyé",
        description: "Votre message vocal a été envoyée avec succès",
      });
    } catch (error) {
      console.error("Error uploading audio:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'envoyer le message vocal",
      });
    } finally {
      if (progressInterval) clearInterval(progressInterval);
      if (timeoutId) clearTimeout(timeoutId);
      setUploading(false);
      setUploadProgress(0);
    }
  }

  function handleEmojiClick(emojiData: any) {
    setMessageInput((prev) => prev + emojiData.emoji);
  }

  function handleEditMessage(message: Message) {
    setEditingMessage(message);
    setEditText(message.text);
  }

  async function handleUpdateMessage() {
    if (!editingMessage || !editText.trim()) return;

    setUpdating(true);

    try {
      await updateDoc({ collectionId: "messages", id: editingMessage.id }, {
        text: editText.trim(),
        edited: true,
        editedAt: new Date().toISOString(),
      });

      toast({
        title: "Message modifié",
        description: "Le message a été mis à jour avec succès",
      });

      setEditingMessage(null);
      setEditText("");
    } catch (error) {
      console.error("Error updating message:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de modifier le message",
      });
    } finally {
      setUpdating(false);
    }
  }

  async function handleDeleteMessage() {
    if (!deletingMessageId) return;

    try {
      await deleteDoc({ collectionId: "messages", id: deletingMessageId });

      toast({
        title: "Message supprimé",
        description: "Le message a été supprimé avec succès",
      });

      setDeletingMessageId(null);
    } catch (error) {
      console.error("Error deleting message:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer le message",
      });
    }
  }

  function canEditOrDelete(message: Message): boolean {
    if (!userProfile) return false;
    
    // Admins and présidents can edit/delete any message
    if (userProfile.role === "admin" || userProfile.role === "président" || userProfile.role === "secretaire_general") {
      return true;
    }
    
    // Users can only edit/delete their own messages within 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return message.userId === userProfile.id && message.timestamp > fiveMinutesAgo;
  }

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-6">
          <p>Vous devez être connecté pour accéder au chat</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      <Card className="flex-1 flex flex-col h-full">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messagerie du Comité
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Discussion en temps réel avec tous les membres
          </p>
        </CardHeader>

        <CardContent className="flex-1 p-0 flex flex-col min-h-0">
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                  <p>Aucun message pour le moment</p>
                  <p className="text-sm">Soyez le premier à envoyer un message !</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwnMessage = message.userId === userProfile?.id;
                  const canEdit = canEditOrDelete(message);
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 group ${isOwnMessage ? "flex-row-reverse" : ""}`}
                      data-testid={`message-${message.id}`}
                    >
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {message.userName?.charAt(0).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>

                      <div
                        className={`flex-1 max-w-[70%] ${
                          isOwnMessage ? "items-end" : "items-start"
                        } flex flex-col gap-1`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {isOwnMessage ? "Vous" : message.userName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {message.timestamp.toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <div className="relative">
                          <div
                            className={`p-3 rounded-lg ${
                              isOwnMessage
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            {message.messageType === "image" && message.imageUrl && (
                              <img
                                src={message.imageUrl}
                                alt="Image"
                                className="max-w-full max-h-64 rounded-md mb-2 object-contain"
                                data-testid={`image-${message.id}`}
                              />
                            )}
                            
                            {message.messageType === "audio" && message.audioUrl && (
                              <audio
                                controls
                                src={message.audioUrl}
                                className="max-w-full mb-2"
                                data-testid={`audio-${message.id}`}
                              >
                                Votre navigateur ne supporte pas l'audio.
                              </audio>
                            )}
                            
                            {message.text && (
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {message.text}
                              </p>
                            )}
                          </div>
                          
                          {canEdit && (
                            <div className={`absolute top-0 ${isOwnMessage ? "left-0" : "right-0"} -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1`}>
                              <Button
                                size="icon"
                                variant="secondary"
                                className="h-6 w-6"
                                onClick={() => handleEditMessage(message)}
                                data-testid={`button-edit-message-${message.id}`}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="destructive"
                                className="h-6 w-6"
                                onClick={() => setDeletingMessageId(message.id)}
                                data-testid={`button-delete-message-${message.id}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
        </CardContent>

        <div className="border-t p-4">
          {/* Upload Progress */}
          {uploading && (
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-muted-foreground">
                  {uploadProgress < 100 ? "Téléchargement..." : "Envoi..."}
                </span>
                <span className="text-sm font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Recording Indicator */}
          {recording && (
            <div className="mb-3 flex items-center gap-2 text-destructive animate-pulse">
              <MicOff className="h-4 w-4" />
              <span className="text-sm font-medium">Enregistrement en cours...</span>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              data-testid="input-image-upload"
            />

            {/* Image Upload Button */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-12 w-12 flex-shrink-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || recording || sending}
              data-testid="button-upload-image"
            >
              <ImageIcon className="h-5 w-5" />
            </Button>

            {/* Voice Recording Button */}
            <Button
              type="button"
              variant={recording ? "destructive" : "outline"}
              size="icon"
              className="h-12 w-12 flex-shrink-0"
              onClick={recording ? stopRecording : startRecording}
              disabled={uploading || sending}
              data-testid="button-voice-record"
            >
              {recording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>

            {/* Emoji Picker Button */}
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-12 w-12 flex-shrink-0"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={uploading || recording || sending}
                data-testid="button-emoji-picker"
              >
                <Smile className="h-5 w-5" />
              </Button>

              {showEmojiPicker && (
                <div className="absolute bottom-full mb-2 right-0 z-50">
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    width={320}
                    height={400}
                  />
                </div>
              )}
            </div>

            <Input
              type="text"
              placeholder="Écrire un message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              disabled={sending || uploading || recording}
              data-testid="input-message"
              className="flex-1 h-12"
            />
            
            <Button
              type="submit"
              disabled={sending || !messageInput.trim() || uploading || recording}
              data-testid="button-send-message"
              size="icon"
              className="h-12 w-12 flex-shrink-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </Card>

      <Dialog open={!!editingMessage} onOpenChange={(open) => {
        if (!open) {
          setEditingMessage(null);
          setEditText("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le message</DialogTitle>
            <DialogDescription>
              Modifiez votre message ci-dessous
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder="Texte du message..."
              data-testid="input-edit-message"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingMessage(null)}
              disabled={updating}
              data-testid="button-cancel-edit"
            >
              Annuler
            </Button>
            <Button
              onClick={handleUpdateMessage}
              disabled={updating || !editText.trim()}
              data-testid="button-save-edit"
            >
              {updating ? "Modification..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingMessageId} onOpenChange={(open) => !open && setDeletingMessageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce message ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le message sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMessage}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
