import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Send, MessageSquare } from "lucide-react";
import type { Message } from "@shared/schema";
import { Timestamp, addDoc, limit, onSnapshot, query, serverTimestamp, toDate } from '@/lib/firebase-compat';

export default function ChatPage() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
            ...data,
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
        senderId: userProfile.id,
        senderName: userProfile.displayName,
        senderPhotoURL: userProfile.photoURL || "",
        content: messageInput.trim(),
        timestamp: serverTimestamp(),
        readBy: [],
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
                  const isOwnMessage = message.senderId === userProfile?.id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}
                      data-testid={`message-${message.id}`}
                    >
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={message.senderPhotoURL} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {message.senderName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div
                        className={`flex-1 max-w-[70%] ${
                          isOwnMessage ? "items-end" : "items-start"
                        } flex flex-col gap-1`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {isOwnMessage ? "Vous" : message.senderName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {message.timestamp.toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <div
                          className={`p-3 rounded-lg ${
                            isOwnMessage
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
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
    </div>
  );
}
