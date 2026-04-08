import { useState, useEffect } from "react";
import { useAuth, db, onSnapshot, collection, handleFirestoreError, OperationType } from "@/lib/firebase";
import { Listing } from "@/types";
import { CATEGORIES } from "@/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Search, Filter, Leaf, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Marketplace() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);

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

  const filteredListings = listings.filter(l => {
    const matchesSearch = l.title.toLowerCase().includes(search.toLowerCase()) || 
                         l.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || l.category === category;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return <div className="container py-20 text-center">Loading marketplace...</div>;
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
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-48 rounded-full">
              <Filter className="mr-2 h-4 w-4" />
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
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredListings.map((listing) => (
          <motion.div
            key={listing.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="overflow-hidden glass h-full flex flex-col">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img 
                  src={listing.images?.[0] || "https://picsum.photos/seed/industrial/400/300"} 
                  alt={listing.title}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <Badge className="absolute left-3 top-3 bg-primary/90 hover:bg-primary">
                  {listing.category}
                </Badge>
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
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-500">
                    <Leaf className="h-3 w-3" />
                    {listing.co2Savings}kg CO2
                  </div>
                </div>
                <CardTitle className="line-clamp-1 text-lg">{listing.title}</CardTitle>
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
          <Button variant="link" onClick={() => { setSearch(""); setCategory("all"); }}>
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}
