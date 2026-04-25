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
import { 
  calculateESGImpactScore, 
  getESGImpactColorBadge, 
  getESGImpactScoreLabel 
} from "@/lib/qualityScore";
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
import { Search, Filter, Leaf, ShieldCheck, Heart, Clock, ArrowRight, LayoutGrid, List as ListIcon, X, MapPin, Package, Truck, Calendar, MessageSquare, Loader2, AlertTriangle, Scale } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useComparison } from "@/components/ComparisonProvider";

export default function Marketplace() {
  const { user, profile } = useAuth();
  const { addToListings, removeFromListings, isInComparison } = useComparison();
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
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
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
          l.model?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          l.tags?.some(t => t.toLowerCase().includes(debouncedSearch.toLowerCase()));
          
        const matchesCategory = category === "all" || l.category === category;
        const matchesTag = !selectedTag || l.tags?.includes(selectedTag);
        const matchesCondition = condition === "all" || l.condition === condition;
        const matchesLocation = !location || l.location.toLowerCase().includes(location.toLowerCase());
        const matchesMinPrice = !minPrice || l.price >= parseFloat(minPrice);
        const matchesMaxPrice = !maxPrice || l.price <= parseFloat(maxPrice);
        const matchesBrand = !brand || l.brand?.toLowerCase().includes(brand.toLowerCase());
        const matchesModel = !model || l.model?.toLowerCase().includes(model.toLowerCase());
        const matchesYear = !year || l.year?.toString() === year;
        const matchesShipping = shipping === "all" || l.shippingOptions?.includes(shipping as any);
        
        return matchesSearch && matchesCategory && matchesTag && matchesCondition && matchesLocation && matchesMinPrice && matchesMaxPrice && matchesBrand && matchesModel && matchesYear && matchesShipping;
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
  }, [listings, debouncedSearch, category, selectedTag, condition, location, minPrice, maxPrice, brand, model, year, sortBy]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    listings.forEach(l => {
      l.tags?.forEach(t => tags.add(t));
    });
    return Array.from(tags).sort();
  }, [listings]);

  useEffect(() => {
    const getSemanticSuggestions = async (query: string) => {
      setIsAiLoadingSuggestions(true);
      try {
        const response = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `As an industrial equipment specialist, suggest exactly one technical alternative for the search query: "${query}". 
                If searching for 'forklift', suggest 'Reach Truck'. If searching for 'drill', suggest 'Magnetic Drill Press'. 
                Return JSON: suggestion (string).`
              }]
            }],
            responseSchema: {
              type: "object",
              properties: {
                suggestion: { type: "string" }
              }
            }
          })
        });

        if (!response.ok) throw new Error("Suggestion request failed");
        const result = await response.json();
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
    <div className="border border-border rounded-3xl overflow-hidden bg-card/50">
      {/* Header Row */}
      <div className="grid grid-cols-12 bg-muted/40 border-b border-border hidden md:grid">
        {["Asset", "Specs", "ESG", "Price", ""].map((h, i) => (
          <div key={i} className={`py-4 px-6 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50 ${
            i === 0 ? "col-span-4" : i === 1 ? "col-span-3" : i === 2 ? "col-span-2" : i === 3 ? "col-span-2" : "col-span-1"
          }`}>{h}</div>
        ))}
      </div>
      {/* Loading Rows */}
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={`msg-skeleton-${i}`} className="grid grid-cols-12 border-b border-border animate-pulse last:border-b-0">
          <div className="col-span-4 p-6 flex gap-4">
            <div className="w-20 h-20 bg-muted rounded-xl" />
            <div className="flex-1 space-y-3 mt-2">
              <div className="h-4 bg-muted w-3/4 rounded-full" />
              <div className="h-3 bg-muted w-1/2 rounded-full" />
            </div>
          </div>
          <div className="col-span-3 p-6 flex items-center"><div className="h-4 bg-muted w-2/3 rounded-full" /></div>
          <div className="col-span-2 p-6 flex items-center justify-center border-x border-border"><div className="h-8 bg-muted w-12 rounded-lg" /></div>
          <div className="col-span-2 p-6 flex items-center"><div className="h-6 bg-muted w-full rounded-full" /></div>
          <div className="col-span-1 p-6 flex items-center justify-center"><div className="h-12 bg-muted w-12 rounded-full" /></div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="container mx-auto py-20 page-transition">
        <div className="mb-12 space-y-2">
          <div className="h-4 w-32 bg-white/5 animate-pulse rounded" />
          <div className="h-12 w-96 bg-white/5 animate-pulse rounded" />
        </div>
        <MarketplaceSkeleton />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-20 page-transition">
      <div className="mb-16 flex flex-col lg:flex-row lg:items-end lg:justify-between border-b border-border pb-12 gap-8">
        <div className="space-y-4 text-center lg:text-left">
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-500">Verified Industrial Registry</span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-display tracking-tighter uppercase italic italic-caps">Marketplace</h1>
          <p className="text-muted-foreground font-light max-w-xl mx-auto lg:mx-0 text-sm sm:text-base">
            The global index for trusted industrial exchange. 
            All registry entries are verified via the HiX Intelligence Node and Digital Product Passports.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row items-center justify-center lg:justify-end w-full lg:w-auto">
          <div className="relative w-full sm:w-80 lg:w-96 group">
            <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search assets..." 
              className="pl-12 pr-12 h-14 rounded-full bg-white/40 dark:bg-white/5 border-border focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all font-sans text-sm"
              value={search}
              onChange={(e) => updateSearch(e.target.value)}
            />
            {search && (
              <button 
                onClick={() => updateSearch("")}
                className="absolute right-5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
                aria-label="Clear search"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>

          <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
            <Button 
              className="flex-1 sm:flex-none h-14 px-8 rounded-full font-semibold transition-all hover:shadow-md"
              onClick={() => setShowFilters(!showFilters)}
              variant={showFilters ? "default" : "outline"}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            
            <Button className="flex-1 sm:flex-none h-14 px-8 rounded-full font-bold bg-primary text-primary-foreground border-none shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] transition-all" asChild>
              <Link to="/create-listing">Post Asset</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Tag Cloud / Quick Filters */}
      <div className="mb-8 flex flex-wrap gap-2 items-center">
        <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mr-2">Quick Tags:</span>
        <Button 
          variant={selectedTag === null ? "default" : "outline"} 
          size="sm" 
          className="rounded-full text-[10px] h-7 uppercase font-bold"
          onClick={() => setSelectedTag(null)}
        >
          All Assets
        </Button>
        {allTags.slice(0, 15).map(tag => (
          <Button 
            key={tag} 
            variant={selectedTag === tag ? "default" : "outline"} 
            size="sm" 
            className={`rounded-full text-[10px] h-7 uppercase font-bold ${selectedTag === tag ? "bg-primary border-primary" : "border-primary/20 hover:border-primary/50"}`}
            onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
          >
            {tag}
          </Button>
        ))}
        {allTags.length > 15 && (
          <span className="text-[10px] text-muted-foreground uppercase font-bold px-2">+{allTags.length - 15} more</span>
        )}
      </div>

      {showFilters && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 p-8 bg-card border border-border rounded-3xl shadow-xl shadow-primary/5 grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          <div className="space-y-2">
            <Label className="text-xs font-semibold ml-1">Industrial Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="rounded-2xl border-border bg-background/50 h-12">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold ml-1">Condition</Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger className="rounded-2xl border-border bg-background/50 h-12">
                <SelectValue placeholder="Any Condition" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Any Condition</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="like-new">Like New</SelectItem>
                <SelectItem value="refurbished">Refurbished</SelectItem>
                <SelectItem value="used-fair">Used (Fair)</SelectItem>
                <SelectItem value="used-poor">Used (Poor)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold ml-1">Location</Label>
            <Input 
              placeholder="e.g. London, UK" 
              className="h-12 rounded-2xl bg-background/50"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold ml-1">Sort By</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="rounded-2xl border-border bg-background/50 h-12">
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="co2-desc">ESG: Max Savings</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="lg:col-span-4 flex justify-end">
            <Button variant="ghost" className="text-xs font-bold uppercase tracking-widest text-primary hover:bg-primary/5 rounded-full" onClick={() => {
              setCategory("all");
              setCondition("all");
              setLocation("");
              setMinPrice("");
              setMaxPrice("");
              setBrand("");
              setModel("");
              setYear("");
              setShipping("all");
              setSortBy("newest");
            }}>
              Reset All Filters
            </Button>
          </div>
        </motion.div>
      )}

      {/* Technical Grid Implementation - Recipe 1 */}
      <div className="border border-border">
        {/* Table Header Row */}
        <div className="grid grid-cols-12 bg-white/40 dark:bg-black/20 border-b border-border hidden md:grid">
          <div className="col-span-4 py-4 px-6 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Industrial Asset / Identifier</div>
          <div className="col-span-3 py-4 px-6 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Specifications</div>
          <div className="col-span-2 py-4 px-6 text-[10px] uppercase font-bold tracking-widest text-muted-foreground border-x border-border text-center">Buffer Stock</div>
          <div className="col-span-2 py-4 px-6 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Unit Valuation</div>
          <div className="col-span-1 py-4 px-6 text-[10px] uppercase font-bold tracking-widest text-muted-foreground border-l border-border text-center">Action</div>
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
                      <span className="text-[10px] font-mono opacity-60 font-medium tracking-tight">ID: {listing.id.slice(-6).toUpperCase()}</span>
                      {listing.status === 'available' ? (
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] font-mono h-4 -mt-0.5">AVAILABLE</Badge>
                      ) : (
                        <Badge className="bg-rose-500/10 text-rose-500 border-none text-[8px] font-mono h-4 -mt-0.5">SOLD OUT</Badge>
                      )}
                      {listing.verificationData && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-none bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[8px] font-black uppercase tracking-[0.2em]">
                          <ShieldCheck className="h-2 w-2" />
                          Registry Verified
                        </div>
                      )}
                    </div>
                    <Link to={`/listing/${listing.id}`} className="text-xl font-bold tracking-tight hover:text-primary transition-colors truncate">
                      {listing.title}
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                       <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-primary/60" />
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-tight">{listing.location || "UK Cluster"}</span>
                       </div>
                       {listing.tags?.slice(0, 3).map((tag, i) => (
                         <Badge key={i} variant="secondary" className="bg-primary/5 text-primary/70 border-none text-[8px] h-4 font-mono px-1.5">
                           #{tag}
                         </Badge>
                       ))}
                    </div>
                  </div>
                </div>

                {/* Specs */}
                <div className="col-span-1 md:col-span-3 p-6 flex flex-col justify-center bg-muted/5 border-y md:border-y-0 border-border md:border-none">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight">Condition</span>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-background border border-border rounded-full italic">{(listing.condition || 'Used').replace('-', ' ')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight">Manufacturer</span>
                      <span className="text-xs font-medium truncate max-w-[120px]">{listing.brand || "Industrial"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight">Model/Year</span>
                      <span className="text-xs font-medium">{listing.year || listing.model || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {/* ESG Impact */}
                <div className="col-span-1 md:col-span-2 p-6 flex flex-col items-center justify-center border-x border-border bg-primary/5 md:bg-primary/5">
                  {(() => {
                    const esgScore = calculateESGImpactScore(listing, sellerProfiles[listing.sellerId]);
                    return (
                      <>
                        <div className={`flex items-center gap-1.5 ${esgScore >= 70 ? 'text-emerald-500' : esgScore >= 40 ? 'text-amber-500' : 'text-rose-500'}`}>
                          <Leaf className="h-3.5 w-3.5" />
                          <span className="text-xl font-black font-display tracking-tighter">
                            {esgScore}
                          </span>
                          <span className="text-[10px] font-bold uppercase opacity-60">ESG</span>
                        </div>
                        <Badge variant="outline" className={`mt-2 border-none rounded-none text-[8px] font-black uppercase tracking-widest px-2 py-0.5 ${getESGImpactColorBadge(esgScore)}`}>
                          {getESGImpactScoreLabel(esgScore)}
                        </Badge>
                        <div className="mt-3 w-full h-1 bg-primary/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${esgScore}%` }}
                            className={`h-full ${esgScore >= 70 ? 'bg-emerald-500' : esgScore >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                          />
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Price */}
                <div className="col-span-1 md:col-span-2 p-6 flex flex-col items-center md:items-start justify-center border-t md:border-t-0 border-border">
                  <div className={`text-2xl md:text-xl font-black tracking-tighter ${listing.status === 'sold' ? 'text-muted-foreground line-through opacity-50' : 'text-foreground'}`}>
                    £{listing.price?.toLocaleString()}
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-tight text-muted-foreground mt-1">
                    {listing.status === 'sold' ? 'Final Sale Value' : 'Valuation (GBP)'}
                  </span>
                </div>

                {/* Action */}
                <div className="col-span-1 md:col-span-1 p-6 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-border md:bg-muted/5 gap-3">
                  <Button 
                    size="icon" 
                    className="h-12 w-12 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-110 transition-all bg-primary text-primary-foreground group/btn" 
                    asChild
                  >
                    <Link to={`/listing/${listing.id}`}>
                      <ArrowRight className="h-5 w-5 transition-transform group-hover/btn:translate-x-0.5" />
                    </Link>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className={`h-8 w-8 rounded-full border-primary/20 hover:bg-primary/10 transition-all ${isInComparison(listing.id) ? 'bg-primary/20 text-primary border-primary' : 'text-muted-foreground'}`}
                    onClick={() => isInComparison(listing.id) ? removeFromListings(listing.id) : addToListings(listing)}
                  >
                    <Scale className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Pagination - Unified Block */}
      {filteredListings.length > itemsPerPage && (
        <div className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6">
          <Button 
            variant="outline" 
            className="w-full sm:w-auto rounded-full font-bold text-xs h-12 px-8 transition-all hover:bg-primary hover:text-white order-2 sm:order-1"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            ← Previous
          </Button>
          <div className="flex items-center gap-3 px-6 py-2 rounded-full border border-border font-medium text-xs bg-muted/20 text-foreground order-1 sm:order-2">
            <span className="opacity-60 uppercase tracking-widest text-[10px]">Page</span>
            <span className="font-bold text-primary">{currentPage}</span>
            <span className="opacity-40">/</span>
            <span className="font-bold">{Math.ceil(filteredListings.length / itemsPerPage)}</span>
          </div>
          <Button 
            variant="outline" 
            className="w-full sm:w-auto rounded-full font-bold text-xs h-12 px-8 transition-all hover:bg-primary hover:text-white order-3"
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
          <h3 className="text-3xl font-black mb-6 tracking-tighter uppercase italic">Target Reference Not Found</h3>
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
