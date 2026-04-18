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
import { Search, Filter, Leaf, ShieldCheck, Heart, Clock, ArrowUpDown, LayoutGrid, List as ListIcon, Eye, X, MapPin, Package, Truck, Calendar, MessageSquare, Loader2, AlertTriangle, ArrowRight } from "lucide-react";
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

      {/* Quick View Dialog - Refined Wide Ledger (Recipe 1 & 8) */}
      <Dialog open={!!selectedListingForQuickView} onOpenChange={() => setSelectedListingForQuickView(null)}>
        <DialogContent className="max-w-7xl w-[98vw] p-0 border-none bg-transparent shadow-none h-auto sm:h-[90vh] overflow-visible focus:outline-none">
          {selectedListingForQuickView && (
            <div className="flex flex-col md:flex-row h-full w-full glass border border-primary/40 rounded-[2rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]">
              {/* Left Side: Visuals - Specialist Hardware Feel */}
              <div className="md:w-5/12 lg:w-[38%] relative bg-black/60 border-r border-primary/20 h-full overflow-hidden flex flex-col">
                <div className="flex-1 relative overflow-hidden group">
                  <img 
                    src={selectedListingForQuickView.images?.[0] || "https://picsum.photos/seed/industrial/1200/800"} 
                    alt={selectedListingForQuickView.title}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-[5s] group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                </div>
                
                {/* Secondary Visuals Rail */}
                <div className="h-28 p-4 grid grid-cols-3 gap-2 border-t border-primary/10 bg-black/40">
                  {[1, 2, 3].map((i) => (
                    <div key={`qv-thumb-${i}`} className="glass rounded-lg overflow-hidden border-white/5 opacity-40 hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center bg-black/10">
                      <img src={`https://picsum.photos/seed/machine-${i+10}/200/200`} alt="" className="w-full h-full object-cover grayscale" />
                    </div>
                  ))}
                </div>

                <div className="absolute top-6 left-6 flex flex-col gap-2">
                  <Badge className="rounded-md px-3 bg-primary text-primary-foreground font-black uppercase tracking-widest text-[9px] h-6 border-none">
                    {selectedListingForQuickView.category}
                  </Badge>
                  <div className="glass px-3 py-1.5 rounded-md border-primary/20 flex items-center gap-2 bg-black/60 backdrop-blur-md">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[9px] font-black uppercase tracking-widest leading-none text-white/90">{selectedListingForQuickView.sellerName}</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Data - Pristine Industrial Ledger */}
              <div className="md:w-7/12 lg:w-[62%] flex flex-col h-full bg-slate-50/5 text-foreground">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 space-y-10">
                  {/* Ledger Header */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="px-2 py-1 bg-primary/10 border border-primary/30 rounded text-[9px] font-mono font-bold text-primary tracking-widest leading-none">
                        LOG_REF: {selectedListingForQuickView.id.toUpperCase().slice(0, 12)}
                      </div>
                      <div className="h-px flex-1 bg-border/40" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 italic">Industrial Record</span>
                    </div>
                    
                    <DialogTitle className="text-2xl lg:text-3xl font-black tracking-tight uppercase leading-snug font-sans">
                      {selectedListingForQuickView.title}
                    </DialogTitle>
                  </div>

                  {/* Valuation & Impact Area */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 glass p-6 rounded-xl border-primary/20 bg-white/[0.03] hover:bg-white/[0.05] transition-all">
                      <p className="text-[8px] font-black uppercase tracking-[0.3em] text-primary/70 mb-3">Asset Valuation</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl lg:text-4xl font-black font-mono tracking-tighter text-foreground italic">£{selectedListingForQuickView.price?.toLocaleString()}</span>
                        <span className="text-[9px] font-mono opacity-40 uppercase tracking-widest">GBP</span>
                      </div>
                    </div>
                    <div className="flex-1 glass p-6 rounded-xl border-primary/20 bg-primary/[0.03] hover:bg-primary/[0.06] transition-all">
                      <p className="text-[8px] font-black uppercase tracking-[0.3em] text-primary/70 mb-3 italic">CO2e Delta Offset</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl lg:text-4xl font-black font-mono text-primary italic">-{selectedListingForQuickView.co2Savings}</span>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black uppercase tracking-tighter leading-none text-primary">kgCO2e</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Specification Table */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">01 // Asset Specifications</h3>
                      <div className="text-[9px] font-mono font-bold opacity-30">P_COUNT: 06</div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-primary/10 border border-primary/20 rounded-xl overflow-hidden shadow-inner">
                      {[
                        { label: "Weight Class", val: selectedListingForQuickView.weight ? `${selectedListingForQuickView.weight}kg` : "SYSTEM_SPEC" },
                        { label: "Inventory", val: `${selectedListingForQuickView.quantity} UNITS` },
                        { label: "Certification", val: (selectedListingForQuickView.condition || "INDUSTRIAL").replace('-', '_').toUpperCase() },
                        { label: "Brand Origin", val: selectedListingForQuickView.brand || "UK_CLUSTER" },
                        { label: "Reference", val: selectedListingForQuickView.model || "GENERIC_SPEC" },
                        { label: "Facility Loc.", val: (selectedListingForQuickView.location || "TEESSIDE").toUpperCase() }
                      ].map(item => (
                        <div key={`qv-spec-${item.label}`} className="bg-background/80 p-5 hover:bg-background/40 transition-colors">
                          <div className="text-[8px] uppercase font-bold text-muted-foreground tracking-widest mb-1.5">{item.label}</div>
                          <div className="font-mono text-sm font-black uppercase text-foreground truncate">{item.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Descriptive Narrative */}
                  <div className="space-y-6">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">02 // Operational Review</h3>
                    <div className="glass p-8 lg:p-10 rounded-2xl border-primary/20 bg-white/[0.02] italic font-serif leading-relaxed text-muted-foreground/90 text-base border-l-4 border-l-primary">
                      {selectedListingForQuickView.description || "No narrative evaluation provided for this terminal asset reference."}
                    </div>
                  </div>
                </div>

                {/* Secure Tactical Footer */}
                <div className="p-6 lg:p-10 bg-black/10 backdrop-blur-2xl border-t border-primary/10">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                      variant="outline" 
                      className="flex-1 h-16 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] border-primary/20 hover:border-primary/60 hover:bg-primary/5 transition-all flex items-center justify-center"
                      onClick={() => handleStartChat(selectedListingForQuickView)}
                      disabled={isStartingChat}
                    >
                      {isStartingChat ? <Loader2 className="h-4 w-4 animate-spin mr-3" /> : <MessageSquare className="h-4 w-4 mr-3" />}
                      Start inquiry
                    </Button>
                    <Button 
                      className="flex-1 h-16 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] bg-primary text-primary-foreground border-none hover:opacity-90 shadow-[0_0_30px_rgba(var(--primary),0.2)] transition-all flex items-center justify-center gap-3"
                      asChild
                    >
                      <Link to={`/listing/${selectedListingForQuickView.id}`}>
                        Full Technical data
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                  <div className="mt-8 flex items-center justify-between">
                    <span className="text-[7px] font-mono tracking-widest font-black opacity-30 uppercase">HiX_PROTOCOL_VER_4.0.0</span>
                    <div className="flex gap-4">
                      {["VETTED", "SECURE", "CIRCULAR"].map(tag => (
                        <span key={tag} className="text-[7px] font-black tracking-widest text-primary opacity-60 italic underline decoration-primary/30 underline-offset-4">{tag}</span>
                      ))}
                    </div>
                  </div>
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
