import { useState, useEffect, MouseEvent } from "react";
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
import { Search, Filter, Leaf, ShieldCheck, Heart, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Marketplace() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState("all");
  const [condition, setCondition] = useState("all");
  const [location, setLocation] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);

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

  const filteredListings = listings.filter(l => {
    const matchesSearch = l.title.toLowerCase().includes(search.toLowerCase()) || 
                         l.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || l.category === category;
    const matchesCondition = condition === "all" || l.condition === condition;
    const matchesLocation = !location || l.location.toLowerCase().includes(location.toLowerCase());
    const matchesMinPrice = !minPrice || l.price >= parseFloat(minPrice);
    const matchesMaxPrice = !maxPrice || l.price <= parseFloat(maxPrice);
    const matchesBrand = !brand || l.brand?.toLowerCase().includes(brand.toLowerCase());
    const matchesModel = !model || l.model?.toLowerCase().includes(model.toLowerCase());
    const matchesYear = !year || l.year?.toString() === year;
    
    return matchesSearch && matchesCategory && matchesCondition && matchesLocation && matchesMinPrice && matchesMaxPrice && matchesBrand && matchesModel && matchesYear;
  });

  const getCategoryColor = (category: string) => {
    return 'border-primary/20 hover:border-primary/50';
  };

  const MarketplaceSkeleton = () => (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <Card key={i} className="overflow-hidden glass h-full flex flex-col animate-pulse">
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
      <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Industrial Marketplace</h1>
          <p className="text-muted-foreground">Find and trade industrial assets across the UK and Europe.</p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search assets..." 
              className="pl-10 rounded-full"
              value={search}
              onChange={(e) => updateSearch(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            className="rounded-full gap-2"
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

          <div className="lg:col-span-4 flex justify-end">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setCategory("all");
                setCondition("all");
                setLocation("");
                setMinPrice("");
                setMaxPrice("");
                setBrand("");
                setModel("");
                setYear("");
                setSearch("");
              }}
            >
              Reset All Filters
            </Button>
          </div>
        </motion.div>
      )}

      <div className="grid gap-4 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredListings.map((listing) => (
          <motion.div
            key={listing.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            className="h-full"
          >
            <Card className={`overflow-hidden glass h-full flex flex-col border-2 transition-all duration-300 shadow-lg hover:shadow-primary/20 ${getCategoryColor(listing.category)}`}>
              <div className="relative aspect-[4/3] overflow-hidden">
                <img 
                  src={listing.images?.[0] || "https://picsum.photos/seed/industrial/400/300"} 
                  alt={listing.title}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
                  referrerPolicy="no-referrer"
                />
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
                  <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <ShieldCheck className="h-3 w-3 text-primary" />
                    {listing.sellerName}
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 text-xs font-bold text-orange-500">
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
                <CardDescription className="line-clamp-2 text-xs h-8">
                  {listing.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 flex-1">
                <div className="text-2xl font-bold text-primary">
                  £{listing.price?.toLocaleString()}
                  <span className="text-sm font-normal text-muted-foreground ml-1">/ unit</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {listing.quantity} units available
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
          </motion.div>
        ))}
      </div>

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
