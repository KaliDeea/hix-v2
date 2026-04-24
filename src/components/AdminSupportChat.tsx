import React, { useState, useEffect, useRef } from "react";
import { 
  Send, 
  User, 
  ShieldCheck, 
  Headphones,
  Loader2,
  ChevronLeft,
  Bot,
  UserCheck
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  useAuth, 
  db, 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  orderBy, 
  serverTimestamp, 
  doc, 
  updateDoc 
} from "@/lib/firebase";
import { Chat, Message } from "@/types";
import { format } from "date-fns";

interface AdminSupportChatProps {
  chat: Chat;
  onBack: () => void;
}

export default function AdminSupportChat({ chat, onBack }: AdminSupportChatProps) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const messagesRef = collection(db, `chats/${chat.id}/messages`);
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];
      setMessages(msgs);
      
      // Auto scroll
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    });

    return () => unsubscribe();
  }, [chat.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const text = input.trim();
    setInput("");
    setLoading(true);

    try {
      const messagesRef = collection(db, `chats/${chat.id}/messages`);
      
      // Add admin message
      await addDoc(messagesRef, {
        chatId: chat.id,
        senderId: user.uid,
        senderName: profile?.companyName || user.email || "Support Agent",
        text: text,
        createdAt: serverTimestamp()
      });

      // Update chat last message
      await updateDoc(doc(db, "chats", chat.id), {
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Automatically switch to agent mode if admin sends a message
        supportMode: "agent"
      });

    } catch (err) {
      console.error("Error sending admin message:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAI = async () => {
    const newMode = chat.supportMode === 'ai' ? 'agent' : 'ai';
    try {
      await updateDoc(doc(db, "chats", chat.id), {
        supportMode: newMode
      });
      
      // Add system message about the switch
      await addDoc(collection(db, `chats/${chat.id}/messages`), {
        chatId: chat.id,
        senderId: "SYSTEM",
        text: newMode === 'agent' 
          ? "A human agent has joined the chat. AI assistance paused." 
          : "Human agent has left. AI Assistant is now active.",
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error toggling AI mode:", err);
    }
  };

  return (
    <Card className="glass border-primary/20 flex flex-col h-[600px] overflow-hidden">
      <CardHeader className="bg-white/5 border-b border-primary/10 p-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {chat.participantNames?.[Object.keys(chat.participantNames).find(id => id !== 'HIX_SUPPORT') || ""]?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-sm font-bold tracking-tight">
                  {chat.participantNames?.[Object.keys(chat.participantNames).find(id => id !== 'HIX_SUPPORT') || ""] || "User"}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={`text-[8px] uppercase font-black tracking-widest ${
                    chat.supportMode === 'ai' ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' : 'border-blue-500/20 text-blue-500 bg-blue-500/5'
                  }`}>
                    {chat.supportMode === 'ai' ? "AI Mode" : "Agent Mode"}
                  </Badge>
                  <span className="text-[8px] opacity-40 uppercase font-mono">Chat ID: {chat.id.slice(0, 8)}</span>
                </div>
              </div>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleAI}
            className="rounded-xl font-bold uppercase tracking-widest text-[10px] h-9 gap-2"
          >
            {chat.supportMode === 'ai' ? (
              <><UserCheck className="h-3.5 w-3.5" /> Take Over</>
            ) : (
              <><Bot className="h-3.5 w-3.5" /> Hand back to AI</>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0 bg-background/20">
        <ScrollArea className="h-full">
          <div ref={scrollRef} className="p-4 space-y-4">
            {messages.map((msg, idx) => {
              const isSupport = msg.senderId === user?.uid || msg.senderId === "HIX_SUPPORT_AI" || msg.senderId === "SYSTEM";
              const isAI = msg.senderId === "HIX_SUPPORT_AI";
              const isSystem = msg.senderId === "SYSTEM";
              
              if (isSystem) {
                return (
                 <div key={idx} className="flex justify-center">
                    <span className="text-[9px] uppercase font-black tracking-widest text-muted-foreground bg-muted/20 px-3 py-1 rounded-full border border-white/5">
                      {msg.text}
                    </span>
                 </div>
                );
              }

              return (
                <div
                  key={`admin-msg-${idx}`}
                  className={`flex ${isSupport ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[75%] space-y-1`}>
                    <div className={`p-3 rounded-2xl text-xs font-medium ${
                      isSupport 
                        ? isAI ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold" : "bg-primary text-primary-foreground rounded-tr-none" 
                        : "bg-muted/30 border border-primary/10 rounded-tl-none"
                    }`}>
                      {msg.text}
                    </div>
                    <p className={`text-[8px] font-mono opacity-50 uppercase ${isSupport ? "text-right" : "text-left"}`}>
                      {msg.senderName || (isAI ? "AI Assistant" : "User")} • {msg.createdAt ? format(msg.createdAt.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt), "HH:mm") : "Sending..."}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-4 border-t border-primary/10 bg-background/40">
        <form onSubmit={handleSendMessage} className="flex w-full gap-2">
          <Input 
            placeholder="Type your response..."
            className="rounded-xl glass border-primary/10 focus:ring-1 focus:ring-primary h-12 text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="rounded-xl h-12 w-12 shrink-0 shadow-lg shadow-primary/20"
            disabled={loading || !input.trim()}
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
