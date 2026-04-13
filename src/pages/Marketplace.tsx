import { useState, useEffect, MouseEvent, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
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
  serverTimestamp
} from "@/lib/firebase";
import { Listing } from "@/types";
import { CATEGORIES } from "@/constants";
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
import { Search, Filter, Leaf, ShieldCheck, Heart, Clock, ArrowUpDown, LayoutGrid, List as ListIcon, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

export default function Marketplace() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
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
  const itemsPerPage = 12;

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

  const getCategoryColor = (category: string) => {
    return 'border-primary/20 hover:border-primary/50';
  };

  const MarketplaceSkeleton = () => (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <Card key={`skeleton-${i}`} className="overflow-hidden glass h-full flex flex-col animate-pulse">
          <div className="aspect-[4/3] bg-white/5" />
          <CardHeader className="p-4 space-y-2">
            <div className="h-4 w-2/3 bg-white/5 rounded" />
            <div className="h-6 w-full bg-white/5 rounded" />
            <div className="h-3 w-1/2 bg-white/5 rounded" />
          </CardHeader>
          <CardContent className="p-4 pt-0 flex-1 space-y-2">
            <div className="h-8 w-1/3 bg-white/5 rounded" />
            <div className="h-3 w-1/4 bg-white/5 rounded" />
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <div className="h-10 w-full bg-white/5 rounded-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12 h-20 w-1/2 bg-white/5 rounded-xl animate-pulse" />
        <MarketplaceSkeleton />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Industrial Marketplace</h1>
          <p className="text-muted-foreground">Find and trade industrial assets across the UK and Europe.</p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row items-center">
          <div className="flex items-center gap-2 glass p-1 rounded-full border border-white/10">
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'ghost'} 
              size="icon" 
              className="h-8 w-8 rounded-full"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'ghost'} 
              size="icon" 
              className="h-8 w-8 rounded-full"
              onClick={() => setViewMode('list')}
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search assets..." 
              className="pl-10 rounded-full"
              value={search}
              onChange={(e) => updateSearch(e.target.value)}
            />
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-40 rounded-full">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="co2-desc">Highest CO2 Savings</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            className="rounded-full gap-2 w-full sm:w-auto"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            Filters
            {(category !== "all" || condition !== "all" || location || minPrice || maxPrice || brand || model || year) && (
              <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-primary text-[10px]">
                {[category !== "all", condition !== "all", !!location, !!minPrice, !!maxPrice, !!brand, !!model, !!year].filter(Boolean).length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {showFilters && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 p-6 glass rounded-3xl grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Condition</Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conditions</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="used-excellent">Used - Excellent</SelectItem>
                <SelectItem value="used-good">Used - Good</SelectItem>
                <SelectItem value="used-fair">Used - Fair</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <Input 
              placeholder="e.g. Hartlepool" 
              className="rounded-xl"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Price Range (£)</Label>
            <div className="flex gap-2">
              <Input 
                placeholder="Min" 
                type="number"
                className="rounded-xl"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <Input 
                placeholder="Max" 
                type="number"
                className="rounded-xl"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Brand</Label>
            <Input 
              placeholder="e.g. Siemens" 
              className="rounded-xl"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Model</Label>
            <Input 
              placeholder="e.g. S7-1200" 
              className="rounded-xl"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Year</Label>
            <Input 
              placeholder="e.g. 2021" 
              type="number"
              className="rounded-xl"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Shipping</Label>
            <Select value={shipping} onValueChange={setShipping}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Shipping" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="collection">Collection Only</SelectItem>
                <SelectItem value="standard">Standard Shipping</SelectItem>
                <SelectItem value="express">Express Shipping</SelectItem>
                <SelectItem value="international">International</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-4 flex justify-end">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setCategory("all");
                setCondition("all");
                setShipping("all");
                setLocation("");
                setMinPrice("");
                setMaxPrice("");
                setBrand("");
                setModel("");
                setYear("");
                setSearch("");
                setCurrentPage(1);
              }}
            >
              Reset All Filters
            </Button>
          </div>
        </motion.div>
      )}

      <div className={viewMode === 'grid' 
        ? "grid gap-4 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        : "flex flex-col gap-4"
      }>
        <AnimatePresence mode="popLayout">
          {filteredListings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((listing) => (
            <motion.div
              key={`market-listing-${listing.id}`}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileHover={viewMode === 'grid' ? { y: -8, transition: { duration: 0.2 } } : {}}
              className="h-full"
            >
              {viewMode === 'grid' ? (
                <Card className={`overflow-hidden glass h-full flex flex-col border-2 transition-all duration-300 shadow-lg hover:shadow-primary/20 ${getCategoryColor(listing.category)}`}>
                  <div className="relative aspect-[4/3] overflow-hidden group">
                    <img 
                      src={listing.images?.[0] || "https://picsum.photos/seed/industrial/400/300"} 
                      alt={listing.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                      <Button size="sm" className="rounded-full gap-2" asChild>
                        <Link to={`/listing/${listing.id}`}>
                          <Eye className="h-4 w-4" />
                          Quick View
                        </Link>
                      </Button>
                    </div>
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        className={`h-8 w-8 rounded-full glass border-white/10 ${wishlist.includes(listing.id) ? 'text-red-500' : 'text-white'}`}
                        onClick={(e) => toggleWishlist(e, listing.id)}
                      >
                        <Heart className={`h-4 w-4 ${wishlist.includes(listing.id) ? 'fill-current' : ''}`} />
                      </Button>
                      <Badge className="bg-primary/90 hover:bg-primary">
                        {listing.category}
                      </Badge>
                    </div>
                    <div className="absolute bottom-3 right-3">
                      {listing.shippingOptions?.includes('collection') && (
                        <Badge variant="outline" className="bg-black/50 text-white border-white/20 backdrop-blur-sm text-[8px]">
                          Collection
                        </Badge>
                      )}
                    </div>
                    {listing.listingType === 'auction' && (
                      <div className="absolute bottom-3 left-3">
                        <Badge className="bg-primary text-primary-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Auction
                        </Badge>
                      </div>
                    )}
                    {listing.status === 'sold' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                        <Badge variant="destructive" className="text-lg px-4 py-1">SOLD</Badge>
                      </div>
                    )}
                  </div>
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <div className="relative">
                          <ShieldCheck className={`h-3.5 w-3.5 ${listing.isVetted ? 'text-primary' : 'text-muted-foreground/40'}`} />
                          {listing.isVetted && (
                            <span className="absolute -top-1 -right-1 h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />
                          )}
                        </div>
                        <span className="truncate max-w-[100px]">{listing.sellerName}</span>
                        {listing.isVetted && (
                          <Badge variant="outline" className="text-[8px] h-3 px-1 border-primary/30 text-primary bg-primary/5 uppercase font-black">Verified</Badge>
                        )}
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 text-xs font-bold text-primary">
                          <Leaf className="h-3 w-3" />
                          {listing.co2Savings}kg CO2
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          ≈ {Math.round(listing.co2Savings / 20)} trees/yr
                        </div>
                      </div>
                    </div>
                    <CardTitle className="line-clamp-1 text-lg">{listing.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] h-4 px-1 capitalize">
                        {(listing.condition || 'used-good').replace('-', ' ')}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{listing.location || 'Unknown location'}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {listing.shippingOptions?.map((opt, idx) => (
                        <span key={`${opt}-${idx}`} className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground uppercase font-bold">
                          {opt}
                        </span>
                      ))}
                    </div>
                    <CardDescription className="line-clamp-2 text-xs h-8 mt-2">
                      {listing.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-primary">£{listing.price?.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">/ unit</span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                      {listing.brand && (
                        <div className="flex items-center gap-1">
                          <span className="font-bold uppercase opacity-50">Brand:</span>
                          <span className="truncate">{listing.brand}</span>
                        </div>
                      )}
                      {listing.year && (
                        <div className="flex items-center gap-1">
                          <span className="font-bold uppercase opacity-50">Year:</span>
                          <span>{listing.year}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button className="w-full rounded-full" asChild disabled={listing.status === 'sold'}>
                      <Link to={`/listing/${listing.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ) : (
                <Card className={`overflow-hidden glass flex flex-row border-2 transition-all duration-300 hover:border-primary/50 ${getCategoryColor(listing.category)}`}>
                  <div className="relative w-48 h-48 overflow-hidden shrink-0">
                    <img 
                      src={listing.images?.[0] || "https://picsum.photos/seed/industrial/400/300"} 
                      alt={listing.title}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    {listing.status === 'sold' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                        <Badge variant="destructive">SOLD</Badge>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-primary/20 text-primary border-primary/20 hover:bg-primary/30">
                            {listing.category}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {(listing.condition || 'used-good').replace('-', ' ')}
                          </Badge>
                        </div>
                        <CardTitle className="text-xl">{listing.title}</CardTitle>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                          <ShieldCheck className={`h-3.5 w-3.5 ${listing.isVetted ? 'text-primary' : 'text-muted-foreground/40'}`} />
                          <span className="font-medium">{listing.sellerName}</span>
                          {listing.isVetted && (
                            <Badge variant="outline" className="text-[8px] h-3 px-1 border-primary/30 text-primary bg-primary/5 uppercase font-black">Verified Seller</Badge>
                          )}
                          <span className="mx-1">•</span>
                          {listing.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">£{listing.price?.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{listing.quantity} units available</div>
                      </div>
                    </div>
                    <CardDescription className="line-clamp-2 text-sm mb-4">
                      {listing.description}
                    </CardDescription>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-primary/10">
                            <Leaf className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-primary">{listing.co2Savings}kg CO2</p>
                            <p className="text-[10px] text-muted-foreground">Savings</p>
                          </div>
                        </div>
                        {listing.brand && (
                          <div>
                            <p className="text-xs font-bold">{listing.brand}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Brand</p>
                          </div>
                        )}
                        {listing.year && (
                          <div>
                            <p className="text-xs font-bold">{listing.year}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Year</p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`rounded-full ${wishlist.includes(listing.id) ? 'text-red-500' : 'text-muted-foreground'}`}
                          onClick={(e) => toggleWishlist(e, listing.id)}
                        >
                          <Heart className={`h-5 w-5 ${wishlist.includes(listing.id) ? 'fill-current' : ''}`} />
                        </Button>
                        <Button className="rounded-full px-8" asChild disabled={listing.status === 'sold'}>
                          <Link to={`/listing/${listing.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredListings.length > itemsPerPage && (
        <div className="mt-12 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          {Array.from({ length: Math.ceil(filteredListings.length / itemsPerPage) }).map((_, i) => {
            const page = i + 1;
            // Only show current, first, last, and neighbors
            if (
              page === 1 || 
              page === Math.ceil(filteredListings.length / itemsPerPage) || 
              (page >= currentPage - 1 && page <= currentPage + 1)
            ) {
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  className="h-8 w-8 rounded-full p-0"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              );
            } else if (
              (page === currentPage - 2 && page > 1) || 
              (page === currentPage + 2 && page < Math.ceil(filteredListings.length / itemsPerPage))
            ) {
              return <span key={page} className="text-muted-foreground">...</span>;
            }
            return null;
          })}

          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredListings.length / itemsPerPage), prev + 1))}
            disabled={currentPage === Math.ceil(filteredListings.length / itemsPerPage)}
          >
            Next
          </Button>
        </div>
      )}

      {filteredListings.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-xl text-muted-foreground">No listings found matching your criteria.</p>
          <Button variant="link" onClick={() => { 
            setSearch(""); 
            setCategory("all"); 
            setCondition("all");
            setLocation("");
            setMinPrice("");
            setMaxPrice("");
          }}>
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}
