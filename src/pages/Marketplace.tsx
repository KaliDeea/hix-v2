import { useState, useEffect, MouseEvent, useMemo, FormEvent } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  useAuth, 
  db, 
  onSnapshot, 
  collection, 
  handleFirestoreError, 
  OperationType,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  addDoc,
  serverTimestamp,
  getDoc
} from "@/lib/firebase";
import { Listing, Chat, UserProfile } from "@/types";
import { CATEGORIES } from "@/constants";
import { GoogleGenAI, Type } from "@google/genai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { Search, Filter, Leaf, ShieldCheck, Heart, Clock, ArrowUpDown, LayoutGrid, List as ListIcon, Eye, X, MapPin, Package, Truck, Calendar, MessageSquare, Loader2, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

export default function Marketplace() {
  const { user, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [sellerProfiles, setSellerProfiles] = useState<Record<string, UserProfile>>({});
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [category, setCategory] = useState("all");
  const [condition, setCondition] = useState("all");
  const [location, setLocation] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [shipping, setShipping] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedListingForQuickView, setSelectedListingForQuickView] = useState<Listing | null>(null);
  const [selectedListingForReport, setSelectedListingForReport] = useState<Listing | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportData, setReportData] = useState({ reason: "", description: "" });
  const [isReporting, setIsReporting] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const itemsPerPage = 12;
  const [isAiLoadingSuggestions, setIsAiLoadingSuggestions] = useState(false);
  const [semanticSuggestion, setSemanticSuggestion] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) {
      setSearch(q);
    }
  }, [searchParams]);

  const updateSearch = (val: string) => {
    setSearch(val);
    if (val) {
      setSearchParams({ q: val });
    } else {
      setSearchParams({});
    }
  };

  useEffect(() => {
    const path = "listings";
    const unsubscribe = onSnapshot(collection(db, path), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Listing[];
      setListings(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (listings.length === 0) return;

    const fetchSellerProfiles = async () => {
      const uniqueSellerIds = Array.from(new Set(listings.map(l => l.sellerId))) as string[];
      const newProfiles: Record<string, UserProfile> = { ...sellerProfiles };
      let updated = false;

      for (const sid of uniqueSellerIds) {
        if (!newProfiles[sid]) {
          try {
            const docSnap = await getDoc(doc(db, "users", sid));
            if (docSnap.exists()) {
              newProfiles[sid] = docSnap.data() as UserProfile;
              updated = true;
            }
          } catch (error) {
            console.error("Error fetching seller profile:", sid, error);
          }
        }
      }

      if (updated) {
        setSellerProfiles(newProfiles);
      }
    };

    fetchSellerProfiles();
  }, [listings]);

  useEffect(() => {
    if (!user) {
      setWishlist([]);
      return;
    }

    const q = query(collection(db, "wishlists"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ids = snapshot.docs.map(doc => doc.data().listingId);
      setWishlist(ids);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "wishlists");
    });

    return () => unsubscribe();
  }, [user]);

  const toggleWishlist = async (e: MouseEvent, listingId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error("Please log in to add items to your wishlist");
      return;
    }

    try {
      const isWishlisted = wishlist.includes(listingId);
      if (isWishlisted) {
        // Remove
        const q = query(
          collection(db, "wishlists"), 
          where("userId", "==", user.uid), 
          where("listingId", "==", listingId)
        );
        const snap = await getDocs(q);
        snap.forEach(async (d) => {
          await deleteDoc(doc(db, "wishlists", d.id));
        });
        toast.success("Removed from wishlist");
      } else {
        // Add
        await addDoc(collection(db, "wishlists"), {
          userId: user.uid,
          listingId: listingId,
          createdAt: serverTimestamp()
        });
        toast.success("Added to wishlist");
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "wishlists");
    }
  };

  const handleStartChat = async (listing: Listing) => {
    if (!user || !profile) {
      toast.error("Please log in to message the seller");
      return;
    }
    if (user.uid === listing.sellerId) {
      toast.error("You cannot message yourself");
      return;
    }

    setIsStartingChat(true);
    try {
      const chatsPath = "chats";
      const q = query(
        collection(db, chatsPath),
        where("participants", "array-contains", user.uid)
      );
      const querySnapshot = await getDocs(q);
      let existingChat = querySnapshot.docs.find(doc => {
        const data = doc.data() as Chat;
        return data.participants.includes(listing.sellerId);
      });

      if (existingChat) {
        navigate("/messages");
      } else {
        const newChat: Partial<Chat> = {
          participants: [user.uid, listing.sellerId],
          participantNames: {
            [user.uid]: profile.companyName,
            [listing.sellerId]: listing.sellerName
          },
          participantLogos: {
            [user.uid]: profile.logoUrl || "",
            [listing.sellerId]: "" 
          },
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          lastMessage: `Inquiry about: ${listing.title}`,
          lastMessageTime: serverTimestamp()
        };
        await addDoc(collection(db, "chats"), newChat);
        navigate("/messages");
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "chats");
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleReport = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !selectedListingForReport) return;

    setIsReporting(true);
    const path = "reports";
    try {
      await addDoc(collection(db, path), {
        reporterId: user.uid,
        reporterName: profile?.companyName || user.email,
        reportedUserId: selectedListingForReport.sellerId,
        reportedUserName: selectedListingForReport.sellerName,
        listingId: selectedListingForReport.id,
        co2Saved: selectedListingForReport.co2Savings,
        reason: reportData.reason,
        description: reportData.description,
        status: "pending",
        createdAt: serverTimestamp()
      });

      await addDoc(collection(db, "audit_logs"), {
        adminId: "system",
        adminName: "System",
        action: "REPORT_CREATED",
        details: `New report created by ${profile?.companyName || user.email}. Reason: ${reportData.reason}`,
        targetId: selectedListingForReport.id,
        targetType: 'report',
        targetName: `Report on Listing ${selectedListingForReport.id}`,
        createdAt: serverTimestamp()
      }).catch(e => console.error("Error logging report:", e));

      toast.success("Report submitted to administration.");
      setIsReportModalOpen(false);
      setReportData({ reason: "", description: "" });
      setSelectedListingForReport(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsReporting(false);
    }
  };

  const filteredListings = useMemo(() => {
    return listings
      .filter(l => {
        const matchesSearch = 
          l.title.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
          l.description.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          l.brand?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          l.model?.toLowerCase().includes(debouncedSearch.toLowerCase());
          
        const matchesCategory = category === "all" || l.category === category;
        const matchesCondition = condition === "all" || l.condition === condition;
        const matchesLocation = !location || l.location.toLowerCase().includes(location.toLowerCase());
        const matchesMinPrice = !minPrice || l.price >= parseFloat(minPrice);
        const matchesMaxPrice = !maxPrice || l.price <= parseFloat(maxPrice);
        const matchesBrand = !brand || l.brand?.toLowerCase().includes(brand.toLowerCase());
        const matchesModel = !model || l.model?.toLowerCase().includes(model.toLowerCase());
        const matchesYear = !year || l.year?.toString() === year;
        const matchesShipping = shipping === "all" || l.shippingOptions?.includes(shipping as any);
        
        return matchesSearch && matchesCategory && matchesCondition && matchesLocation && matchesMinPrice && matchesMaxPrice && matchesBrand && matchesModel && matchesYear && matchesShipping;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        if (sortBy === "co2-desc") return b.co2Savings - a.co2Savings;
        if (sortBy === "newest") {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        }
        return 0;
      });
  }, [listings, debouncedSearch, category, condition, location, minPrice, maxPrice, brand, model, year, sortBy]);

  useEffect(() => {
    const getSemanticSuggestions = async (query: string) => {
      setIsAiLoadingSuggestions(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{
            parts: [{
              text: `As an industrial equipment specialist, suggest exactly one technical alternative for the search query: "${query}". 
              If searching for 'forklift', suggest 'Reach Truck'. If searching for 'drill', suggest 'Magnetic Drill Press'. 
              Return JSON: suggestion (string).`
            }]
          }],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                suggestion: { type: Type.STRING }
              }
            }
          }
        });
        const result = JSON.parse(response.text);
        setSemanticSuggestion(result.suggestion);
      } catch (err) {
        console.error("Semantic search failed:", err);
      } finally {
        setIsAiLoadingSuggestions(false);
      }
    };

    if (debouncedSearch && filteredListings.length === 0) {
      getSemanticSuggestions(debouncedSearch);
    } else {
      setSemanticSuggestion(null);
    }
  }, [debouncedSearch, filteredListings.length]);

  const getCategoryColor = (category: string) => {
    return 'border-primary/20 hover:border-primary/50';
  };

  const MarketplaceSkeleton = () => (
    <div className="border border-border">
      {/* Header Row */}
      <div className="grid grid-cols-12 bg-white/5 border-b border-border">
        {["Asset", "Specs", "ESG", "Price", ""].map((h, i) => (
          <div key={i} className={`tech-header ${
            i === 0 ? "col-span-4" : i === 1 ? "col-span-3" : i === 2 ? "col-span-2" : i === 3 ? "col-span-2" : "col-span-1"
          }`}>{h}</div>
        ))}
      </div>
      {/* Loading Rows */}
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={`msg-skeleton-${i}`} className="grid grid-cols-12 border-b border-border animate-pulse">
          <div className="col-span-4 p-4 flex gap-4">
            <div className="w-16 h-16 bg-white/5 rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/5 w-1/2 rounded" />
              <div className="h-3 bg-white/5 w-1/3 rounded" />
            </div>
          </div>
          <div className="col-span-3 p-4"><div className="h-3 bg-white/5 w-2/3 rounded" /></div>
          <div className="col-span-2 p-4 text-center"><div className="h-3 bg-white/5 w-1/2 mx-auto rounded" /></div>
          <div className="col-span-2 p-4"><div className="h-6 bg-white/5 w-full rounded" /></div>
          <div className="col-span-1 p-4"><div className="h-8 bg-white/5 w-full rounded" /></div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 page-transition">
        <div className="mb-12 space-y-2">
          <div className="h-4 w-32 bg-white/5 animate-pulse rounded" />
          <div className="h-12 w-96 bg-white/5 animate-pulse rounded" />
        </div>
        <MarketplaceSkeleton />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20 page-transition">
      <div className="mb-16 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between border-b border-border pb-12">
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Live Asset Index</span>
          <h1 className="text-6xl font-black font-display tracking-tighter">Marketplace</h1>
          <p className="text-muted-foreground font-light max-w-xl">
            Real-time industrial inventory across the UK cluster. 
            All listings are verified for technical specification accuracy.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row items-center">
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="SEARCH BY TYPE, MODEL, OR ID..." 
              className="pl-12 pr-12 h-14 rounded-none bg-transparent border-border focus:border-primary transition-all font-mono text-sm tracking-widest uppercase"
              value={search}
              onChange={(e) => updateSearch(e.target.value)}
            />
          </div>

          <Button 
            className="h-14 px-8 rounded-none font-bold uppercase tracking-widest"
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? "default" : "outline"}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          
          <Button className="h-14 px-8 rounded-none font-black uppercase tracking-widest bg-primary text-primary-foreground border-none shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform" asChild>
            <Link to="/create-listing">Post Asset</Link>
          </Button>
        </div>
      </div>

      {showFilters && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-12 p-10 bg-white/[0.02] border border-border grid gap-8 md:grid-cols-2 lg:grid-cols-4"
        >
          {/* Filters section similar to before but with sharp industrial styling */}
          <div className="space-y-4">
            <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Industrial Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="rounded-none border-border bg-transparent h-12 font-mono text-xs">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* ... other filters ... */}
          <div className="lg:col-span-4 flex justify-end">
            <Button variant="link" className="text-[10px] font-bold uppercase tracking-widest" onClick={() => {/* reset logic */}}>
              Clear All Parameters
            </Button>
          </div>
        </motion.div>
      )}

      {/* Technical Grid Implementation - Recipe 1 */}
      <div className="border border-border">
        {/* Table Header Row */}
        <div className="grid grid-cols-12 bg-white/5 border-b border-border hidden md:grid">
          <div className="col-span-4 tech-header">Industrial Asset / Identifier</div>
          <div className="col-span-3 tech-header">Technical Specifications</div>
          <div className="col-span-2 tech-header border-l border-border text-center">ESG Impact</div>
          <div className="col-span-2 tech-header border-l border-border">Trading Value</div>
          <div className="col-span-1 tech-header border-l border-border">Action</div>
        </div>

        {/* Rows */}
        <div className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {filteredListings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((listing, idx) => (
              <motion.div
                key={`market-listing-${listing.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ delay: idx * 0.05 }}
                className="grid grid-cols-1 md:grid-cols-12 tech-row bg-white/5 group border border-border rounded-2xl overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-primary/20 transition-all duration-300"
              >
                {/* Asset Info */}
                <div className="col-span-1 md:col-span-4 p-6 flex items-center gap-6">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-500 border border-white/10">
                    <img 
                      src={listing.images?.[0] || "https://picsum.photos/seed/industrial/200/200"} 
                      alt={listing.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    {listing.status === 'sold' && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-[10px] font-black tracking-widest uppercase text-white -rotate-12 border-2 border-white px-2">Sold</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="tech-value opacity-90 font-bold uppercase tracking-tighter truncate">#{listing.id.slice(-6)}</span>
                      {(sellerProfiles[listing.sellerId]?.isVetted || listing.isVetted) && <Badge className="bg-primary/20 text-primary border-none text-[8px] h-4 rounded-none uppercase font-bold tracking-widest">Verified</Badge>}
                    </div>
                    <Link to={`/listing/${listing.id}`} className="text-lg font-bold tracking-tight hover:underline underline-offset-4 decoration-primary truncate text-foreground">{listing.title}</Link>
                    <div className="flex items-center gap-2 mt-2">
                       <MapPin className="h-3 w-3 text-muted-foreground" />
                       <span className="text-[10px] font-mono uppercase text-muted-foreground font-medium">LOC: {listing.location || "UK-WIDE"}</span>
                    </div>
                  </div>
                </div>

                {/* Specs */}
                <div className="col-span-1 md:col-span-3 p-6 flex flex-col justify-center border-l border-border md:border-l-0 lg:border-l">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="tech-header p-0 opacity-80">Condition</span>
                      <span className="tech-value uppercase font-bold text-foreground">{(listing.condition || 'Used').replace('-', ' ')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="tech-header p-0 opacity-80">OEM / Manufacturer</span>
                      <span className="tech-value truncate max-w-[120px] font-bold text-foreground">{listing.brand || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="tech-header p-0 opacity-80">Build Version</span>
                      <span className="tech-value font-bold text-foreground">{listing.year || listing.model || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* ESG Impact */}
                <div className="col-span-1 md:col-span-2 p-6 flex flex-col items-center justify-center border-l border-border bg-primary/5">
                  <div className="text-2xl font-black font-display text-primary flex items-baseline gap-1">
                    {listing.co2Savings}
                    <span className="text-[10px] font-sans font-bold uppercase tracking-widest opacity-80">kg</span>
                  </div>
                  <span className="text-[8px] font-bold uppercase tracking-[0.2em] opacity-80 mt-1">CO2 Offset Value</span>
                  
                  <div className="mt-4 w-full h-1 bg-primary/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${Math.min(100, (listing.co2Savings / 500) * 100)}%` }} />
                  </div>
                </div>

                {/* Price */}
                <div className="col-span-1 md:col-span-2 p-6 flex flex-col justify-center border-l border-border">
                  <div className="text-3xl font-black font-mono tracking-tighter text-foreground">
                    £{listing.price?.toLocaleString()}
                  </div>
                  <span className="text-[8px] font-bold uppercase tracking-[0.2em] opacity-80 mt-1">Valuation (GBP)</span>
                </div>

                {/* Action */}
                <div className="col-span-1 md:col-span-1 p-6 flex items-center justify-center border-l border-border">
                  <div className="flex flex-col gap-2">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="hover:bg-primary hover:text-primary-foreground rounded-none"
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedListingForQuickView(listing);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="hover:bg-primary hover:text-primary-foreground rounded-none" asChild>
                      <Link to={`/listing/${listing.id}`}>
                        <ArrowUpDown className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Pagination - Unified Block */}
      {filteredListings.length > itemsPerPage && (
        <div className="mt-12 flex justify-center gap-4">
          <Button 
            variant="outline" 
            className="rounded-none font-bold uppercase tracking-widest text-[10px] h-10 px-6"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            ← Previous
          </Button>
          <div className="flex items-center gap-4 px-6 border border-border font-mono text-[10px] bg-muted/20 text-foreground">
            <span className="opacity-80 text-primary font-bold">BATCH:</span>
            <span className="font-bold">{currentPage} / {Math.ceil(filteredListings.length / itemsPerPage)}</span>
          </div>
          <Button 
            variant="outline" 
            className="rounded-none font-bold uppercase tracking-widest text-[10px] h-10 px-6"
            disabled={currentPage >= Math.ceil(filteredListings.length / itemsPerPage)}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            Next →
          </Button>
        </div>
      )}

      {/* AI Semantic Suggestion Logic - Unified */}
      {search && filteredListings.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-24 max-w-2xl mx-auto hardware-surface p-16 text-center border-primary/20"
        >
          <div className="flex justify-center mb-10">
            <div className="flex items-center gap-3 px-4 py-1.5 bg-primary/20 border border-primary/30 rounded-none">
              <div className="glow-indicator glow-amber animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Semantic Diagnosis Node</span>
            </div>
          </div>
          <h3 className="text-3xl font-black mb-6 tracking-tighter uppercase font-serif italic">Target Reference Not Found</h3>
          <p className="text-muted-foreground text-sm mb-12 leading-relaxed font-mono uppercase text-xs tracking-widest">
            IDENTIFIER: "{search}" <br />
            STATUS: ZERO_MATCH <br /><br />
            {isAiLoadingSuggestions ? (
              <span className="flex items-center justify-center gap-2 opacity-60">
                <Loader2 className="h-4 w-4 animate-spin" />
                SCANNINIG TECHNICAL ALTERNATIVES...
              </span>
            ) : semanticSuggestion ? (
              <>
                Our industrial semantic engine identifies technical overlap. <br />
                DID YOU MEAN: 
                <span className="text-primary underline cursor-pointer ml-2 hover:opacity-80 transition-opacity" onClick={() => updateSearch(semanticSuggestion)}>
                  "{semanticSuggestion}"
                </span>?
              </>
            ) : (
              <>
                No direct semantic overlap detected. <br />
                Try adjusting your technical parameters or search for 
                <span className="text-primary underline cursor-pointer ml-1" onClick={() => updateSearch("Surplus " + (category !== 'all' ? category : 'Industrial'))}>
                  "Surplus {(category !== 'all' ? category : 'Industrial')} Assets"
                </span>.
              </>
            )}
          </p>
          <Button variant="outline" className="rounded-none uppercase tracking-widest text-[10px] font-black h-14 px-12 border-primary/50 text-primary hover:bg-primary/10" onClick={() => updateSearch("")}>
            Reset Diagnostic System
          </Button>
        </motion.div>
      )}

      {/* Quick View Dialog - Unified & Fixed (Recipe 1) */}
      <Dialog open={!!selectedListingForQuickView} onOpenChange={() => setSelectedListingForQuickView(null)}>
        <DialogContent className="sm:max-w-5xl p-0 glass overflow-hidden border-primary/30 rounded-2xl h-[80vh] shadow-2xl">
          {selectedListingForQuickView && (
            <div className="flex flex-col md:flex-row h-full">
              {/* Left Side: Visuals */}
              <div className="md:w-1/2 relative bg-primary/5 border-r border-border/50">
                <img 
                  src={selectedListingForQuickView.images?.[0] || "https://picsum.photos/seed/industrial/800/800"} 
                  alt={selectedListingForQuickView.title}
                  className="w-full h-full object-cover shadow-inner"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-8 left-8 flex flex-col gap-3">
                  <Badge className="rounded-none bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] h-6">
                    {selectedListingForQuickView.category}
                  </Badge>
                  <div className="glass p-3 rounded-none border-primary/30 flex items-center gap-3">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">{selectedListingForQuickView.sellerName}</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Data */}
              <div className="md:w-1/2 p-12 flex flex-col justify-between">
                <div className="space-y-8">
                  <DialogHeader>
                    <div className="flex items-center gap-2 mb-2 text-primary">
                      <div className="glow-indicator glow-blue" />
                      <span className="text-[10px] font-mono tracking-widest uppercase">ID: {selectedListingForQuickView.id.toUpperCase()}</span>
                    </div>
                    <DialogTitle className="text-4xl font-black tracking-tighter uppercase leading-none">
                      {selectedListingForQuickView.title}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black font-mono text-primary">£{selectedListingForQuickView.price?.toLocaleString()}</span>
                      <span className="text-xs font-bold uppercase tracking-widest opacity-80">EXC VAT</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: "Technical Weight", val: selectedListingForQuickView.weight ? `${selectedListingForQuickView.weight}kg` : "Variable" },
                        { label: "Inventory Level", val: `${selectedListingForQuickView.quantity} Units` },
                        { label: "Asset Quality", val: (selectedListingForQuickView.condition || "Used").replace('-', ' ') },
                        { label: "CO2 Equilibrium", val: `${selectedListingForQuickView.co2Savings}kg Offset` }
                      ].map(item => (
                        <div key={item.label} className="glass p-4 rounded-xl border-primary/20 space-y-1 bg-primary/5">
                          <div className="text-[10px] uppercase font-bold text-primary tracking-widest opacity-70">{item.label}</div>
                          <div className="font-mono text-sm font-black uppercase text-foreground">{item.val}</div>
                        </div>
                      ))}
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed font-light line-clamp-4 italic border-l-2 border-primary/20 pl-4">
                      {selectedListingForQuickView.description}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-12">
                  <Button 
                    variant="outline" 
                    className="rounded-none h-14 font-black uppercase tracking-widest text-[10px] border-border hover:bg-primary transition-colors"
                    onClick={() => handleStartChat(selectedListingForQuickView)}
                    disabled={isStartingChat}
                  >
                    {isStartingChat ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MessageSquare className="h-4 w-4 mr-2" />}
                    Direct Message
                  </Button>
                  <Button className="rounded-none h-14 font-black uppercase tracking-widest text-[10px]" asChild>
                    <Link to={`/listing/${selectedListingForQuickView.id}`}>
                      Full Data Analytics
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Report Modal - Unified */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="hardware-surface border-destructive/30 sm:max-w-md p-10 rounded-none">
          <DialogHeader className="mb-8">
            <div className="flex items-center gap-2 text-destructive mb-2">
              <div className="glow-indicator bg-red-500 shadow-[0_0_8px_red]" />
              <span className="text-[10px] font-black uppercase tracking-widest">Integrity Violation Report</span>
            </div>
            <DialogTitle className="text-2xl font-black uppercase">Report Listing</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReport} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Reason for Analysis</Label>
              <Select 
                value={reportData.reason} 
                onValueChange={(v) => setReportData({...reportData, reason: v})}
                required
              >
                <SelectTrigger className="rounded-none bg-transparent border-border h-12 font-mono text-xs">
                  <SelectValue placeholder="Select diagnostic reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inaccurate">Inaccurate Parameters</SelectItem>
                  <SelectItem value="prohibited">Policy Violation</SelectItem>
                  <SelectItem value="scam">Identity Anomaly</SelectItem>
                  <SelectItem value="other">Other Variance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Observations</Label>
              <textarea 
                className="w-full min-h-[120px] rounded-none bg-black border border-border p-4 text-xs font-mono focus:outline-none focus:border-destructive transition-colors"
                placeholder="DETAILED OBSERVATIONS..."
                value={reportData.description}
                onChange={(e) => setReportData({...reportData, description: e.target.value})}
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit" variant="destructive" className="w-full rounded-none h-14 font-black uppercase tracking-widest text-[10px]" disabled={isReporting}>
                {isReporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Transmit Report
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
