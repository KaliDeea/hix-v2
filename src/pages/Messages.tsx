import React, { useState, useEffect, useRef } from "react";
import { useAuth, db, onSnapshot, collection, query, where, orderBy, doc, addDoc, serverTimestamp, handleFirestoreError, OperationType, updateDoc } from "@/lib/firebase";
import { Chat, Message } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Search, Building2, Image as ImageIcon, Loader2, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import { analyzeMessage } from "@/lib/gemini";
import { toast } from "sonner";
import { ShieldAlert, Info } from "lucide-react";
import { Link } from "react-router-dom";

export default function Messages() {
  const { user, profile } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const chatsPath = "chats";
    const q = query(
      collection(db, chatsPath),
      where("participants", "array-contains", user.uid),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chat[];
      setChats(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, chatsPath);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!selectedChat) {
      setMessages([]);
      return;
    }

    const messagesPath = `chats/${selectedChat.id}/messages`;
    const q = query(
      collection(db, messagesPath),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(data);

      // Mark as read when messages are loaded for the selected chat
      if (user && selectedChat) {
        updateDoc(doc(db, "chats", selectedChat.id), {
          [`lastRead.${user.uid}`]: serverTimestamp()
        }).catch(console.error);
      }

      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, messagesPath);
    });

    return () => unsubscribe();
  }, [selectedChat]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedChat || !newMessage.trim()) return;

    setSending(true);
    const text = newMessage.trim();

    // AI Moderation Analysis
    const moderation = await analyzeMessage(text);
    
    if (moderation.flagged && moderation.action === 'block') {
      toast.error("Message Blocked", {
        description: moderation.reason || "External trading attempts are not permitted for security reasons.",
        icon: <ShieldAlert className="h-4 w-4 text-destructive" />,
        duration: 5000,
      });
      setSending(false);
      return;
    }

    if (moderation.action === 'warn') {
      toast.warning("Heads up", {
        description: "Please remember that all trades must happen through our secure platform.",
        icon: <Info className="h-4 w-4 text-amber-500" />
      });
    }

    setNewMessage("");

    try {
      const messagesPath = `chats/${selectedChat.id}/messages`;
      await addDoc(collection(db, messagesPath), {
        chatId: selectedChat.id,
        senderId: user.uid,
        text,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, "chats", selectedChat.id), {
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
        updatedAt: serverTimestamp(),
        [`lastRead.${user.uid}`]: serverTimestamp()
      });

      // Create notification for the other participant
      const otherId = selectedChat.participants.find(p => p !== user.uid);
      if (otherId) {
        await addDoc(collection(db, "notifications"), {
          userId: otherId,
          title: `New message from ${profile?.companyName || "a user"}`,
          message: text,
          type: 'message',
          link: `/messages`,
          read: false,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "messages");
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return <div className="container py-20 text-center">Please log in to view your messages.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 h-[calc(100vh-120px)]">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">
        {/* Chat List */}
        <Card className="md:col-span-4 glass overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b border-border">
            <h2 className="text-xl font-bold mb-4">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search chats..." className="pl-10 rounded-full bg-muted/20 border-border" />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : chats.length === 0 ? (
                <div className="text-center py-20 px-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-4 border border-primary/10">
                    <MessageSquare className="h-6 w-6 text-primary/40" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-1">Silence is Golden</h3>
                  <p className="text-[10px] text-muted-foreground font-medium mb-6 uppercase tracking-tighter">No active transmissions detected</p>
                  <Button variant="outline" size="sm" className="rounded-full text-[10px] uppercase font-black tracking-widest h-8" asChild>
                    <Link to="/marketplace">Start Negotiating</Link>
                  </Button>
                </div>
              ) : (
                chats.map((chat) => {
                  const otherId = chat.participants.find(p => p !== user.uid) || "";
                  const otherName = chat.participantNames[otherId] || "Unknown User";
                  const otherLogo = chat.participantLogos[otherId];
                  const isSelected = selectedChat?.id === chat.id;
                  
                  const lastRead = chat.lastRead?.[user.uid];
                  const lastMessageTime = chat.lastMessageTime;
                  const isUnread = !isSelected && lastMessageTime && (!lastRead || (lastMessageTime.toDate ? lastMessageTime.toDate() : new Date(lastMessageTime)) > (lastRead.toDate ? lastRead.toDate() : new Date(lastRead)));

                  return (
                    <button
                      key={`chat-item-${chat.id}`}
                      onClick={() => setSelectedChat(chat)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all relative ${
                        isSelected ? "bg-primary/20 border border-primary/20" : "hover:bg-muted/20 border border-transparent"
                      }`}
                    >
                      <Avatar className="h-12 w-12 border border-border">
                        <AvatarImage src={otherLogo} />
                        <AvatarFallback><Building2 className="h-6 w-6" /></AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left overflow-hidden">
                        <div className="flex justify-between items-start">
                          <span className={`font-semibold truncate ${isUnread ? "text-primary" : "text-foreground"}`}>{otherName}</span>
                          {chat.lastMessageTime && (
                            <span className={`text-[10px] ${isUnread ? "text-primary font-bold" : "text-muted-foreground"}`}>
                              {format(chat.lastMessageTime.toDate ? chat.lastMessageTime.toDate() : new Date(chat.lastMessageTime), "HH:mm")}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs truncate ${isUnread ? "text-foreground font-bold" : "text-muted-foreground font-medium"}`}>
                          {chat.lastMessage || "No messages yet"}
                        </p>
                      </div>
                      {isUnread && (
                        <div className="absolute top-1/2 -translate-y-1/2 right-2 h-2 w-2 rounded-full bg-primary shadow-md shadow-primary/30" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat Area */}
        <Card className="md:col-span-8 glass overflow-hidden flex flex-col h-full relative">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center gap-3 bg-muted/10">
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarImage src={selectedChat.participantLogos[selectedChat.participants.find(p => p !== user.uid) || ""]} />
                  <AvatarFallback><Building2 className="h-5 w-5" /></AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-foreground">
                    {selectedChat.participantNames[selectedChat.participants.find(p => p !== user.uid) || ""]}
                  </h3>
                  <p className="text-[10px] text-primary flex items-center gap-1 font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
                    ONLINE
                  </p>
                </div>
              </div>

              {/* Messages Area */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
              >
                {messages.map((msg, idx) => {
                  const isMe = msg.senderId === user.uid;
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={msg.id ? `msg-${msg.id}` : `msg-idx-${idx}`}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[70%] p-3 rounded-2xl ${
                        isMe ? "bg-primary text-primary-foreground rounded-tr-none shadow-md shadow-primary/10" : "bg-muted/20 border border-border rounded-tl-none"
                      }`}>
                        <p className="text-sm font-medium">{msg.text}</p>
                        <div className={`text-[9px] mt-1 font-bold ${isMe ? "text-primary-foreground/70" : "text-muted-foreground/80"}`}>
                          {msg.createdAt ? format(msg.createdAt.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt), "HH:mm") : "SENDING..."}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-border bg-muted/10">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Button type="button" variant="ghost" size="icon" className="rounded-full">
                    <ImageIcon className="h-5 w-5" />
                  </Button>
                  <Input 
                    placeholder="Type a message..." 
                    className="rounded-full bg-background border-border"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <Button type="submit" size="icon" className="rounded-full" disabled={sending || !newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-primary/[0.01]">
              <div className="h-24 w-24 rounded-full bg-primary/5 flex items-center justify-center mb-8 border border-primary/10 shadow-[0_0_40px_rgba(33,197,94,0.05)]">
                <Send className="h-10 w-10 text-primary opacity-40 animate-pulse" />
              </div>
              <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter mb-4 italic">Secure Trade Line</h3>
              <div className="space-y-2 max-w-sm">
                <p className="text-sm font-bold text-primary tracking-widest uppercase mb-4">Select a partner to initialize protocol</p>
                <div className="text-xs font-medium space-y-3 opacity-60">
                   <p className="flex items-center gap-2">
                     <span className="h-1 w-1 rounded-full bg-primary"></span>
                     All chats are high-bandwidth and end-to-end encrypted
                   </p>
                   <p className="flex items-center gap-2">
                     <span className="h-1 w-1 rounded-full bg-primary"></span>
                     AI moderation protects you against external trade risks
                   </p>
                   <p className="flex items-center gap-2">
                     <span className="h-1 w-1 rounded-full bg-primary"></span>
                     Share technical specifications and logistics notes instantly
                   </p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
