import React, { useState, useEffect } from "react";
import { useAuth, db, onSnapshot, collection, query, where, handleFirestoreError, OperationType, deleteDoc, doc, updateDoc } from "@/lib/firebase";
import { Notification } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import { Bell, Trash2, CheckCircle2, MessageSquare, Gavel, Info, Heart } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "notifications"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      setNotifications(data.sort((a, b) => {
        const dateA = b.createdAt?.seconds || b.createdAt?.toMillis?.() / 1000 || Date.now() / 1000;
        const dateB = a.createdAt?.seconds || a.createdAt?.toMillis?.() / 1000 || Date.now() / 1000;
        return dateA - dateB;
      }));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "notifications");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (e) {
      console.error(e);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, "notifications", id));
      toast.success("Notification deleted");
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'bid': return <Gavel className="h-5 w-5 text-amber-500" />;
      case 'wishlist': return <Heart className="h-5 w-5 text-red-500" />;
      case 'auction': return <Bell className="h-5 w-5 text-primary" />;
      default: return <Info className="h-5 w-5 text-muted-foreground" />;
    }
  };

  if (!user) {
    return (
      <div className="container py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Please log in to view your notifications.</h2>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-20 text-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Notifications</h1>
            <p className="text-muted-foreground">Stay updated with your marketplace activity.</p>
          </div>
          {notifications.some(n => !n.read) && (
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-full"
              onClick={async () => {
                const unread = notifications.filter(n => !n.read);
                for (const n of unread) {
                  await updateDoc(doc(db, "notifications", n.id), { read: true });
                }
                toast.success("All marked as read");
              }}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <Card className="glass border-dashed border-primary/20 py-24 text-center flex flex-col items-center justify-center">
            <div className="h-20 w-20 rounded-3xl bg-primary/5 flex items-center justify-center mb-6 border border-primary/10 shadow-[0_0_20px_rgba(33,197,94,0.05)]">
              <Bell className="h-10 w-10 text-primary/40" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Zero Alerts</h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-8 font-medium">
              Your transmission feed is clear. High-value trade alerts, system updates and important marketplace signals will appear here.
            </p>
            <Button variant="outline" size="lg" className="rounded-full px-8 border-primary/20 hover:bg-primary/5" asChild>
              <Link to="/dashboard">Return to Overview</Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((n) => (
              <motion.div
                key={`page-notif-${n.id}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card 
                  className={`glass transition-all hover:border-primary/30 cursor-pointer ${!n.read ? 'border-primary/40 bg-primary/5' : ''}`}
                  onClick={() => {
                    if (!n.read) markAsRead(n.id);
                    if (n.link) navigate(n.link);
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="mt-1 p-2 rounded-xl bg-background/50 border border-white/5">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`font-semibold ${!n.read ? 'text-primary' : ''}`}>{n.title}</h3>
                          <span className="text-[10px] text-muted-foreground">
                            {n.createdAt && formatDistanceToNow(n.createdAt?.toDate ? n.createdAt.toDate() : new Date(n.createdAt))} ago
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{n.message}</p>
                        <div className="flex items-center justify-end gap-2 mt-4">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(n.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
