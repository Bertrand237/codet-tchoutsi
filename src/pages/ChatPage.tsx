'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { client, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { getDocs, addDoc, query, orderBy, toDate, ref, storageObj, uploadBytes, getDownloadURL } from '@/lib/db';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Camera,
  MessageCircle,
  Loader2,
  Image as ImageIcon,
  X,
  Smile,
  ArrowDown,
  ZoomIn,
  Reply,
} from 'lucide-react';
import EmptyState from '@/components/EmptyState';

// ==================== Types ====================

interface ReplyTo {
  id: string;
  sender: string;
  text: string;
}

interface Message {
  $id: string;
  userId: string;
  userName: string;
  text: string;
  messageType: 'text' | 'image';
  imageUrl: string;
  createdAt: string;
  replyTo?: ReplyTo;
}

// ==================== Emojis ====================

const COMMON_EMOJIS = [
  '😀','😂','🥰','😍','🤩','😎','🤔','😏',
  '😢','😭','😤','🤯','🥳','😴','🤮','👍',
  '👎','❤️','🔥','💯','✨','🎉','🙏','👏',
  '💪','🤝','👋','😎','💡','📌','✅','❌',
  '⚡','⭐','🌟','🎯','🚀','💻','📱','💬',
];

// ==================== Helper ====================

function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (date.toDateString() === yesterday.toDateString()) return 'Hier';
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-amber-500',
    'bg-rose-500', 'bg-fuchsia-500', 'bg-orange-500', 'bg-pink-500',
    'bg-violet-500', 'bg-lime-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// ==================== Reply Quote (own message - on emerald bg) ====================

function ReplyQuoteOwn({ replyTo, onClick }: { replyTo: ReplyTo; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start gap-2 text-left w-full mb-1 px-2 py-1 rounded-md bg-white/10 dark:bg-white/5 hover:bg-white/15 dark:hover:bg-white/10 transition-colors cursor-pointer"
    >
      <div className="w-0.5 self-stretch rounded-full bg-emerald-300 shrink-0 mt-0.5 mb-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold text-emerald-200 truncate">{replyTo.sender}</p>
        <p className="text-[11px] text-white/70 truncate">{replyTo.text}</p>
      </div>
    </button>
  );
}

// ==================== Reply Quote (other message - on card bg) ====================

function ReplyQuoteOther({ replyTo, onClick }: { replyTo: ReplyTo; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start gap-2 text-left w-full mb-1.5 pb-1.5 border-b border-border/50 cursor-pointer"
    >
      <div className="w-0.5 self-stretch rounded-full bg-emerald-500 shrink-0 mt-0.5 mb-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 truncate">{replyTo.sender}</p>
        <p className="text-[11px] text-muted-foreground truncate">{replyTo.text}</p>
      </div>
    </button>
  );
}

// ==================== Message Bubble ====================

function MessageBubble({ message, isOwn, onReply }: { message: Message; isOwn: boolean; onReply: (msg: Message) => void }) {
  const msgDate = toDate(message.createdAt);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const scrollToOriginal = () => {
    if (!message.replyTo) return;
    const el = document.getElementById(`msg-${message.replyTo.id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Reply button shown on hover
  const replyBtn = (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onReply(message);
      }}
      className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200 p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10"
      aria-label="Répondre"
    >
      <Reply className="h-3.5 w-3.5 text-muted-foreground" />
    </button>
  );

  if (isOwn) {
    // Right-aligned (current user)
    return (
      <div className="flex justify-end gap-2 max-w-[80%] ml-auto animate-in fade-in-0 slide-in-from-bottom-2 duration-300 group">
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            {replyBtn}
            <span className="text-[10px] text-muted-foreground">
              {formatTime(msgDate)}
            </span>
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              Vous
            </span>
          </div>
          {message.messageType === 'image' && message.imageUrl ? (
            <div className="chat-bubble-own relative rounded-xl rounded-tr-sm overflow-hidden bg-emerald-600 dark:bg-emerald-700 p-1 shadow-sm group/bubble">
              {!imageError ? (
                <div className="relative min-w-[200px] min-h-[150px]">
                  {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-emerald-600/50 dark:bg-emerald-700/50 rounded-xl">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                  <img
                    src={message.imageUrl}
                    alt="Image"
                    className="max-w-[280px] max-h-[300px] rounded-xl object-cover"
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                    style={{ display: imageLoaded ? 'block' : 'none' }}
                  />
                  {imageLoaded && (
                    <div className="absolute inset-0 rounded-xl bg-black/0 group-hover/bubble:bg-black/20 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover/bubble:opacity-100">
                      <ZoomIn className="h-8 w-8 text-white drop-shadow-lg" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-3 text-white text-sm">
                  <ImageIcon className="h-4 w-4" />
                  <span>Image indisponible</span>
                </div>
              )}
              {message.replyTo && <ReplyQuoteOwn replyTo={message.replyTo} onClick={scrollToOriginal} />}
              {message.text && message.text.trim() && (
                <p className="px-2 py-1 text-white text-sm">{message.text}</p>
              )}
            </div>
          ) : (
            <div className="chat-bubble-own relative bg-emerald-600 dark:bg-emerald-700 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-sm">
              {message.replyTo && <ReplyQuoteOwn replyTo={message.replyTo} onClick={scrollToOriginal} />}
              <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
            </div>
          )}
        </div>
        <div id={`msg-${message.$id}`} className={`${getAvatarColor(message.userName)} h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-5`}>{message.userName.charAt(0).toUpperCase()}</div>
      </div>
    );
  }

  // Left-aligned (other users)
  return (
    <div className="flex gap-2 max-w-[80%] mr-auto animate-in fade-in-0 slide-in-from-bottom-2 duration-300 group">
      <div id={`msg-${message.$id}`} className={`${getAvatarColor(message.userName)} h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-5`}>{message.userName.charAt(0).toUpperCase()}</div>
      <div className="flex flex-col items-start gap-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">{message.userName}</span>
          <span className="text-[10px] text-muted-foreground">{formatTime(msgDate)}</span>
          {replyBtn}
        </div>
        {message.messageType === 'image' && message.imageUrl ? (
          <div className="relative rounded-xl rounded-tl-sm overflow-hidden border bg-card p-1 shadow-sm group/bubble">
            {!imageError ? (
              <div className="relative min-w-[200px] min-h-[150px]">
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-xl">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
                <img
                  src={message.imageUrl}
                  alt="Image"
                  className="max-w-[280px] max-h-[300px] rounded-xl object-cover"
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                  style={{ display: imageLoaded ? 'block' : 'none' }}
                />
                {imageLoaded && (
                  <div className="absolute inset-0 rounded-xl bg-black/0 group-hover/bubble:bg-black/20 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover/bubble:opacity-100">
                    <ZoomIn className="h-8 w-8 text-white drop-shadow-lg" />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-3 text-muted-foreground text-sm">
                <ImageIcon className="h-4 w-4" />
                <span>Image indisponible</span>
              </div>
            )}
            {message.replyTo && <ReplyQuoteOwn replyTo={message.replyTo} onClick={scrollToOriginal} />}
            {message.text && message.text.trim() && (
              <p className="px-2 py-1 text-sm">{message.text}</p>
            )}
          </div>
        ) : (
          <div className="bg-card border px-4 py-2.5 rounded-2xl rounded-tl-sm shadow-sm">
            {message.replyTo && <ReplyQuoteOther replyTo={message.replyTo} onClick={scrollToOriginal} />}
            <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== Date Separator ====================

function DateSeparator({ date }: { date: Date }) {
  return (
    <div className="flex justify-center my-3 px-4">
      <span className="text-xs text-muted-foreground bg-muted/50 rounded-full px-3 py-1 mx-auto w-fit">
        {formatDate(date)}
      </span>
    </div>
  );
}

// ==================== Loading Skeleton ====================

function ChatSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={`flex gap-2 max-w-[80%] ${i % 2 === 0 ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-48 rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== Main ChatPage ====================

export default function ChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'realtime' | 'polling' | 'disconnected'>('disconnected');

  // Emoji picker
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Reply
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);

  // Typing indicator
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastMessageCountRef = useRef<number>(0);
  const isFirstLoadRef = useRef<boolean>(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ==================== Emoji Picker: click outside ====================

  useEffect(() => {
    if (!emojiPickerOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setEmojiPickerOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEmojiPickerOpen(false);
        inputRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [emojiPickerOpen]);

  // ==================== Fetch Messages ====================

  const fetchMessages = useCallback(async () => {
    try {
      const q = query(
        COLLECTIONS.MESSAGES,
        orderBy('createdAt', 'asc')
      );
      const result = await getDocs(q);
      const fetched: Message[] = result.documents.map((doc: any) => ({
        $id: doc.$id,
        userId: doc.userId || '',
        userName: doc.userName || 'Anonyme',
        text: doc.text || '',
        messageType: doc.messageType || 'text',
        imageUrl: doc.imageUrl || '',
        createdAt: doc.createdAt || new Date().toISOString(),
        replyTo: doc.replyTo ? (typeof doc.replyTo === 'string' ? JSON.parse(doc.replyTo) : doc.replyTo) : undefined,
      }));
      setMessages(fetched);
      lastMessageCountRef.current = fetched.length;
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      if (isFirstLoadRef.current) {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les messages.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
      isFirstLoadRef.current = false;
    }
  }, [toast]);

  // ==================== Polling Fallback ====================

  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;
    setConnectionStatus('polling');
    pollingIntervalRef.current = setInterval(() => {
      fetchMessages();
    }, 3000);
  }, [fetchMessages]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // ==================== Realtime Subscription ====================

  const setupRealtimeRef = useRef<() => void>();

  setupRealtimeRef.current = () => {
    if (!user) return;

    // Clean up any existing subscription or polling
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    stopPolling();
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    try {
      const channel = `databases.${DATABASE_ID}.collections.${COLLECTIONS.MESSAGES}.documents`;
      const unsubscribe = client.subscribe(channel, (_response) => {
        fetchMessages();
      });

      unsubscribeRef.current = () => {
        try {
          unsubscribe();
        } catch {
          // ignore unsubscribe errors
        }
        unsubscribeRef.current = null;
      };

      setConnectionStatus('realtime');
    } catch (error) {
      console.warn('Appwrite realtime subscription failed, falling back to polling:', error);
      startPolling();
      // Re-attempt subscription every 10s
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = setTimeout(() => {
        setupRealtimeRef.current?.();
      }, 10000);
    }
  };

  // Initial fetch + realtime subscription (with polling fallback)
  useEffect(() => {
    if (!user) {
      setConnectionStatus('disconnected');
      stopPolling();
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      return;
    }

    fetchMessages();
    setupRealtimeRef.current?.();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      stopPolling();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [user, fetchMessages, stopPolling]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Track scroll position for scroll-to-bottom button
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    setShowScrollBtn(distanceFromBottom > 120);
  }, []);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ==================== Send Text Message ====================

  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text && !uploadFile) return;
    if (!user) return;

    setSending(true);

    try {
      const docData: Record<string, unknown> = {
        userId: user.id,
        userName: user.displayName || 'Anonyme',
        text: text || '',
        messageType: uploadFile ? 'image' : 'text',
        imageUrl: '',
        createdAt: new Date().toISOString(),
      };

      if (uploadFile) {
        const fileRef = ref(storageObj, `chat/${Date.now()}_${uploadFile.name}`);
        const result = await uploadBytes(fileRef, uploadFile);
        const imageUrl = await getDownloadURL(result.ref);
        docData.messageType = 'image';
        docData.imageUrl = imageUrl;
      }

      if (replyTo) {
        docData.replyTo = JSON.stringify(replyTo);
      }

      await addDoc(COLLECTIONS.MESSAGES, docData);

      setNewMessage('');
      setUploadPreview(null);
      setUploadFile(null);
      setReplyTo(null);
      setIsTyping(false);
      await fetchMessages();
      inputRef.current?.focus();
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'envoyer le message.",
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  // ==================== Image Upload ====================

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Fichier invalide',
        description: 'Veuillez sélectionner une image.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Fichier trop volumineux',
        description: 'La taille maximale est de 5 Mo.',
        variant: 'destructive',
      });
      return;
    }

    setUploadFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const cancelImageUpload = () => {
    setUploadPreview(null);
    setUploadFile(null);
  };

  // ==================== Typing handler ====================

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    // Show typing indicator when user starts typing
    if (value.length > 0) {
      setIsTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 2000);
    } else {
      setIsTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  // ==================== Keyboard Handler ====================

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape' && replyTo) {
      setReplyTo(null);
    }
  };

  // ==================== Reply handler ====================

  const handleReply = useCallback((msg: Message) => {
    setReplyTo({
      id: msg.$id,
      sender: msg.userName,
      text: msg.text ? msg.text.substring(0, 100) : (msg.messageType === 'image' ? '📷 Image' : ''),
    });
    inputRef.current?.focus();
  }, []);

  // ==================== Group messages by date ====================

  const messageGroups: { date: Date; messages: Message[] }[] = [];
  let currentDate: string | null = null;

  for (const msg of messages) {
    const msgDate = toDate(msg.createdAt);
    const dateStr = msgDate.toDateString();
    if (dateStr !== currentDate) {
      messageGroups.push({ date: msgDate, messages: [msg] });
      currentDate = dateStr;
    } else {
      messageGroups[messageGroups.length - 1].messages.push(msg);
    }
  }

  // ==================== Render ====================

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-4xl mx-auto w-full relative">
      {/* Header bar with online indicator */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
            <MessageCircle className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">Messagerie</h2>
            <span className={`inline-flex h-2.5 w-2.5 rounded-full ${
              connectionStatus === 'realtime'
                ? 'bg-emerald-500'
                : connectionStatus === 'polling'
                  ? 'bg-amber-500'
                  : 'bg-red-500'
            } ${connectionStatus === 'realtime' ? 'relative' : ''}`}>
              {connectionStatus === 'realtime' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
            </span>
            <span className={`text-xs font-medium ${
              connectionStatus === 'realtime'
                ? 'text-emerald-600 dark:text-emerald-400'
                : connectionStatus === 'polling'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-red-600 dark:text-red-400'
            }`}>
              {connectionStatus === 'realtime'
                ? 'En direct'
                : connectionStatus === 'polling'
                  ? 'Reconnexion...'
                  : 'Hors ligne'
              }
            </span>
          </div>
          {!loading && (
            <Badge variant="secondary" className="text-xs font-normal">
              {messages.length} message{messages.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 min-h-0 relative">
        {loading ? (
          <div className="h-full">
            <ChatSkeleton />
          </div>
        ) : messages.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="Aucun message"
            description="Commencez la conversation !"
            action={{ label: 'Envoyer un message', onClick: () => inputRef.current?.focus(), variant: 'outline' }}
            className="h-full"
          />
        ) : (
          <ScrollArea className="h-full" onScrollCapture={handleScroll}>
            <div className="p-4 flex flex-col gap-1">
              {messageGroups.map((group, groupIdx) => (
                <div key={groupIdx}>
                  <DateSeparator date={group.date} />
                  {group.messages.map((msg) => (
                    <MessageBubble
                      key={msg.$id}
                      message={msg}
                      isOwn={msg.userId === user?.id}
                      onReply={handleReply}
                    />
                  ))}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>
        )}

        {/* Floating scroll to bottom button */}
        {showScrollBtn && !loading && messages.length > 0 && (
          <Button
            size="icon"
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 h-10 w-10 rounded-full shadow-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800 z-10 transition-all duration-200"
            aria-label="Défiler vers le bas"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Image preview */}
      {uploadPreview && (
        <div className="px-4 py-2 border-t bg-card/50 shrink-0">
          <div className="relative inline-block">
            <img
              src={uploadPreview}
              alt="Aperçu"
              className="h-20 w-20 object-cover rounded-lg border"
            />
            <button
              type="button"
              onClick={cancelImageUpload}
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Reply preview bar */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 overflow-hidden"
          >
            <div className="bg-muted/50 rounded-lg p-2 mx-4 mb-1 border-l-2 border-l-emerald-500 flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 truncate">{replyTo.sender}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{replyTo.text}</p>
              </div>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="shrink-0 p-1 rounded-md hover:bg-muted transition-colors"
                aria-label="Annuler la réponse"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="shrink-0">
        <div className="h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
        <div className="px-4 py-3 bg-card/50 backdrop-blur-sm">
          {/* Typing indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1.5 px-1 pb-1.5"
              >
                <span className="text-[10px] text-muted-foreground italic">Écrit</span>
                <span className="flex items-center gap-0.5">
                  <span className="typing-dot h-1 w-1 rounded-full bg-emerald-500" style={{ animationDelay: '0ms' }} />
                  <span className="typing-dot h-1 w-1 rounded-full bg-emerald-500" style={{ animationDelay: '150ms' }} />
                  <span className="typing-dot h-1 w-1 rounded-full bg-emerald-500" style={{ animationDelay: '300ms' }} />
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2">
            {/* Emoji picker button */}
            <div className="relative" ref={emojiPickerRef}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`shrink-0 h-11 w-11 rounded-xl ${emojiPickerOpen ? 'text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20' : 'text-muted-foreground hover:text-amber-500 dark:hover:text-amber-400'}`}
                aria-label="Émojis"
                disabled={sending}
                onClick={() => setEmojiPickerOpen((prev) => !prev)}
              >
                <Smile className="h-5 w-5" />
              </Button>

              {/* Emoji picker popover */}
              <AnimatePresence>
                {emojiPickerOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 8 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute bottom-full left-0 mb-2 rounded-xl border bg-card shadow-lg z-50 w-[320px]"
                  >
                    <div className="grid grid-cols-8 gap-1 p-2 max-h-48 overflow-y-auto">
                      {COMMON_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setNewMessage((prev) => prev + emoji);
                            inputRef.current?.focus();
                          }}
                          className="h-8 w-8 text-lg flex items-center justify-center rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Image upload button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 h-11 w-11 rounded-xl"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
              aria-label="Envoyer une image"
            >
              <Camera className="h-5 w-5" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />

            {/* Text input */}
            <Input
              ref={inputRef}
              type="text"
              placeholder="Écrire un message..."
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={sending}
              className="flex-1 h-11 rounded-xl focus-visible:border-emerald-300/50 focus-visible:ring-emerald-300/20"
              aria-label="Message"
            />

            {/* Send button */}
            <Button
              type="button"
              size="icon"
              onClick={handleSend}
              disabled={sending || (!newMessage.trim() && !uploadFile)}
              className={`shrink-0 h-11 w-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800 ${sending ? 'animate-pulse' : ''}`}
              aria-label="Envoyer"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Typing indicator keyframes */}
      <style jsx global>{`
        @keyframes typing-bounce {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }
        .typing-dot {
          animation: typing-bounce 1.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
