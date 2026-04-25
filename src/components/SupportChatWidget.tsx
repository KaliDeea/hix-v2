import React, { useState, useEffect, useRef } from "react";
import { 
  MessageCircle, 
  X, 
  Send, 
  User, 
  ShieldCheck, 
  Headphones,
  Loader2,
  Minimize2,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  useAuth, 
  db, 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  serverTimestamp, 
  doc, 
  updateDoc,
  handleFirestoreError,
  OperationType,
  limit
} from "@/lib/firebase";
import { Chat, Message } from "@/types";
import { generateSupportResponse } from "@/services/supportAIService";
import { format } from "date-fns";

export default function SupportChatWidget() {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  // Load or create support chat for the user
  useEffect(() => {
    if (!user || !isOpen) return;

    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef,
      where("participants", "array-contains", user.uid),
      where("isSupport", "==", true),
      where("status", "==", "open"),
      orderBy("updatedAt", "desc"),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        // Create new support chat
        const newChatData = {
          participants: [user.uid, "HIX_SUPPORT"],
          participantNames: {
            [user.uid]: profile?.companyName || user.email || "Anonymous",
            "HIX_SUPPORT": "HIX Support Center"
          },
          participantLogos: {
            [user.uid]: profile?.logoUrl || "",
            "HIX_SUPPORT": "/hix-support-logo.png"
          },
          isSupport: true,
          supportMode: "ai",
          status: "open",
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          lastMessage: "How can we help you today?",
          lastRead: { [user.uid]: serverTimestamp() }
        };
        
        try {
          const docRef = await addDoc(chatsRef, newChatData);
          // Add initial welcome message
          await addDoc(collection(db, `chats/${docRef.id}/messages`), {
            chatId: docRef.id,
            senderId: "HIX_SUPPORT_AI",
            senderName: "HIX AI Assistant",
            text: "Hello! I'm the HIX Support AI. How can I assist you with your industrial asset trading today?",
            createdAt: serverTimestamp()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, "chats/support");
        }
      } else {
        const chat = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Chat;
        setActiveChat(chat);
      }
    });

    return () => unsubscribe();
  }, [user, isOpen, profile]);

  // Listen for messages
  useEffect(() => {
    if (!activeChat) return;

    const messagesRef = collection(db, `chats/${activeChat.id}/messages`);
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
  }, [activeChat]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || !activeChat) return;

    const text = input.trim();
    setInput("");
    setLoading(true);

    try {
      const messagesRef = collection(db, `chats/${activeChat.id}/messages`);
      
      // Add user message
      await addDoc(messagesRef, {
        chatId: activeChat.id,
        senderId: user.uid,
        senderName: profile?.companyName || user.email || "You",
        text: text,
        createdAt: serverTimestamp()
      });

      // Update chat last message
      await updateDoc(doc(db, "chats", activeChat.id), {
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: "open" // Ensure it stays open if it was somehow marked otherwise
      });

      // If in AI mode, trigger AI response
      if (activeChat.supportMode === "ai") {
        setIsTyping(true);
        // Get full history for AI context
        const responseText = await generateSupportResponse([...messages, { 
          chatId: activeChat.id, 
          senderId: user.uid, 
          text: text, 
          createdAt: new Date() 
        } as Message]);

        const hasHandover = responseText.includes("[HANDOVER_REQUESTED]");
        const cleanResponse = responseText.replace("[HANDOVER_REQUESTED]", "").trim();

        // Add AI message
        await addDoc(messagesRef, {
          chatId: activeChat.id,
          senderId: "HIX_SUPPORT_AI",
          senderName: "HIX AI Assistant",
          text: cleanResponse,
          createdAt: serverTimestamp()
        });

        // Update chat with AI response
        await updateDoc(doc(db, "chats", activeChat.id), {
          lastMessage: cleanResponse,
          lastMessageTime: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        if (hasHandover) {
          // Switch to agent mode and notify admin
          await updateDoc(doc(db, "chats", activeChat.id), {
            supportMode: "agent"
          });
          
          await addDoc(collection(db, "notifications"), {
            userId: "ADMIN_GROUP", // Special target or list of admins
            title: "Support Handover Requested",
            message: `User ${profile?.companyName || user.email} requires a live agent.`,
            type: 'system',
            link: `/admin?tab=support`,
            read: false,
            createdAt: serverTimestamp()
          });
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "support_messages");
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const handleCloseChat = async () => {
    if (!activeChat || !user) return;
    
    try {
      setLoading(true);
      await updateDoc(doc(db, "chats", activeChat.id), {
        status: "closed",
        updatedAt: serverTimestamp()
      });
      
      await addDoc(collection(db, `chats/${activeChat.id}/messages`), {
        chatId: activeChat.id,
        senderId: "SYSTEM",
        senderName: "System",
        text: "The support session has been closed by the user.",
        createdAt: serverTimestamp()
      });
      
      setActiveChat(null);
      setMessages([]);
      setIsOpen(false);
      setShowCloseConfirm(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, "chats");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="mb-4 w-[350px] sm:w-[400px]"
          >
            <Card className="glass border-primary/20 shadow-2xl shadow-primary/10 overflow-hidden flex flex-col h-[500px]">
              <CardHeader className="bg-primary/10 border-b border-primary/20 p-4 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20 text-primary">
                      <Headphones className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold uppercase tracking-tight">HIX Support Center</CardTitle>
                      <CardDescription className="text-[10px] uppercase font-mono font-bold flex items-center gap-1.5 overflow-hidden">
                        {activeChat?.supportMode === "ai" ? (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            AI Assistant Online
                          </>
                        ) : (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                            Waiting for Agent
                          </>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {showCloseConfirm ? (
                      <div className="flex items-center bg-red-500/10 rounded-full px-2 py-1 gap-1">
                        <span className="text-[8px] font-bold text-red-500 uppercase ml-1">End?</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={handleCloseChat} 
                          className="h-6 w-6 rounded-full hover:bg-red-500 text-red-500 hover:text-white"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setShowCloseConfirm(false)} 
                          className="h-6 w-6 rounded-full hover:bg-white/10 text-white/50"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setShowCloseConfirm(true)} 
                        className="rounded-full hover:bg-red-500/10 text-red-500/50 hover:text-red-500 h-8 w-8 transition-colors"
                        title="Close Ticket"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full hover:bg-white/5 h-8 w-8">
                      <Minimize2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-hidden p-0 bg-background/40">
                <ScrollArea className="h-full">
                  <div ref={scrollRef} className="p-4 space-y-4 min-h-full">
                    {messages.map((msg, idx) => {
                      const isMe = msg.senderId === user.uid;
                      const isAI = msg.senderId === "HIX_SUPPORT_AI";
                      
                      return (
                        <motion.div
                          key={`supp-msg-${idx}`}
                          initial={{ opacity: 0, x: isMe ? 10 : -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`max-w-[85%] space-y-1`}>
                            <div className={`p-3 rounded-2xl text-xs font-medium ${
                              isMe 
                                ? "bg-primary text-primary-foreground rounded-tr-none" 
                                : isAI 
                                  ? "bg-muted/30 border border-primary/10 rounded-tl-none" 
                                  : "bg-blue-500/10 border border-blue-500/20 rounded-tl-none text-blue-500"
                            }`}>
                              {msg.text}
                            </div>
                            <p className={`text-[8px] font-mono opacity-50 uppercase ${isMe ? "text-right" : "text-left"}`}>
                              {msg.senderName || (isAI ? "AI Assistant" : "Support Agent")} • {msg.createdAt ? format(msg.createdAt.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt), "HH:mm") : "Sending..."}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-muted/30 border border-primary/10 rounded-2xl rounded-tl-none p-3 px-4">
                          <div className="flex gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce"></span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>

              <CardFooter className="p-4 border-t border-primary/10 shrink-0 bg-background/60">
                <form onSubmit={handleSendMessage} className="flex w-full gap-2">
                  <Input 
                    placeholder="Describe your issue..."
                    className="rounded-full bg-white/5 border-primary/10 focus:ring-1 focus:ring-primary h-10 text-xs"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading}
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    className="rounded-full shrink-0"
                    disabled={loading || !input.trim()}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-14 w-14 rounded-full shadow-xl shadow-primary/20 transition-all duration-300 ${
          isOpen ? "bg-muted text-muted-foreground rotate-90" : "bg-primary text-white hover:scale-110 active:scale-95"
        }`}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-background animate-pulse" />
        )}
      </Button>
    </div>
  );
}
