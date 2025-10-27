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
import { Send, MessageSquare, Pencil, Trash2 } from "lucide-react";
import type { Message } from "@shared/schema";
import { Timestamp, addDoc, limit, onSnapshot, query, orderBy, serverTimestamp, toDate, updateDoc, deleteDoc } from '@/lib/firebase-compat';

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
            text: data.text || data.content,
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
        timestamp: new Date().toISOString(),
      });

      setMessageInput("");
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
    return message.userId === userProfile.id || userProfile.role === "admin";
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-foreground">Messagerie CODET</h1>
        <p className="text-muted-foreground">Groupe de discussion du comité</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Groupe CODET
            <span className="text-sm font-normal text-muted-foreground">
              ({messages.length} messages)
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full p-6">
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
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.text}
                            </p>
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
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              type="text"
              placeholder="Écrire un message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              disabled={sending}
              data-testid="input-message"
              className="flex-1 h-12"
            />
            <Button
              type="submit"
              disabled={sending || !messageInput.trim()}
              data-testid="button-send-message"
              size="icon"
              className="h-12 w-12"
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
