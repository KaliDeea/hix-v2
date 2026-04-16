import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  db, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDoc 
} from "@/lib/firebase";
import { Transaction, UserProfile, Listing } from "@/types";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ShoppingCart, DollarSign, Clock, FileText, Search, X } from "lucide-react";
import { format } from "date-fns";

export default function AdminUserTransactions() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const uid = searchParams.get("uid");
  const type = searchParams.get("type") as 'buy' | 'sell' | null;
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [listings, setListings] = useState<Record<string, Listing>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!uid) return;

    // Fetch user profile
    const fetchUser = async () => {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        setUser({ uid: userDoc.id, ...userDoc.data() } as UserProfile);
      }
    };
    fetchUser();

    // Fetch transactions
    const transactionsRef = collection(db, "transactions");
    const q = type === 'buy' 
      ? query(transactionsRef, where("buyerId", "==", uid))
      : type === 'sell'
        ? query(transactionsRef, where("sellerId", "==", uid))
        : query(transactionsRef, where("buyerId", "==", uid)); // Default to buy if not specified

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const transData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      
      setTransactions(transData.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      }));

      // Fetch listing titles
      const listingIds = [...new Set(transData.map(t => t.listingId))];
      const listingMap: Record<string, Listing> = { ...listings };
      
      for (const id of listingIds) {
        if (!listingMap[id]) {
          const lDoc = await getDoc(doc(db, "listings", id));
          if (lDoc.exists()) {
            listingMap[id] = { id: lDoc.id, ...lDoc.data() } as Listing;
          }
        }
      }
      setListings(listingMap);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [uid, type]);

  const filteredTransactions = transactions.filter(t => {
    const searchLower = search.toLowerCase();
    const listingTitle = listings[t.listingId]?.title?.toLowerCase() || "";
    return t.id.toLowerCase().includes(searchLower) || listingTitle.includes(searchLower);
  });

  if (!uid) {
    return (
      <div className="container py-20 text-center">
        <p>No user specified.</p>
        <Button onClick={() => navigate("/admin")} className="mt-4">Back to Admin</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Transactions</h1>
            <p className="text-muted-foreground">
              {type === 'buy' ? 'Purchases' : 'Sales'} for {user?.companyName || 'Loading...'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={type === 'buy' ? 'default' : 'outline'} 
            onClick={() => navigate(`/admin/transactions?uid=${uid}&type=buy`)}
            className="rounded-full"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Buy History
          </Button>
          <Button 
            variant={type === 'sell' ? 'default' : 'outline'} 
            onClick={() => navigate(`/admin/transactions?uid=${uid}&type=sell`)}
            className="rounded-full"
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Sell History
          </Button>
        </div>
      </div>

      <Card className="glass border-primary/20 overflow-hidden">
        <CardHeader className="border-b border-white/5 bg-white/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Transaction History
              </CardTitle>
              <CardDescription>
                Detailed list of all {type === 'buy' ? 'purchases' : 'sales'} made by this user.
              </CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search ID or title..." 
                className="pl-9 rounded-xl glass border-primary/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button 
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="pl-6">Listing Title</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right pr-6">Transaction ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      Loading transactions...
                    </TableCell>
                  </TableRow>
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Clock className="h-8 w-8 opacity-20" />
                        <p>No transactions found matching your search.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((t) => (
                    <TableRow key={t.id} className="hover:bg-primary/5 transition-colors">
                      <TableCell className="pl-6 font-medium">
                        {listings[t.listingId]?.title || "Unknown Listing"}
                      </TableCell>
                      <TableCell className="font-bold text-primary">
                        £{t.amount?.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            t.status === 'completed' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                            t.status === 'pending' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                            "bg-destructive/10 text-destructive border-destructive/20"
                          }
                        >
                          {t.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {t.createdAt ? format(t.createdAt.toDate ? t.createdAt.toDate() : new Date(t.createdAt), "dd MMM yyyy, HH:mm") : "N/A"}
                      </TableCell>
                      <TableCell className="text-right pr-6 font-mono text-[10px] text-muted-foreground">
                        {t.id}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
