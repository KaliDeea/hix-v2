import React, { useState, useEffect } from "react";
import { useAuth, db, onSnapshot, collection, query, where, handleFirestoreError, OperationType, deleteDoc, doc } from "@/lib/firebase";
import { Listing, WishlistItem } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Heart, Trash2, ArrowRight, ShoppingCart, Leaf, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function Wishlist() {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "wishlists"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WishlistItem[];
      setWishlistItems(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "wishlists");
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (wishlistItems.length === 0) {
      setListings([]);
      setLoading(false);
      return;
    }

    // Fetch listings for wishlist items
    const listingIds = wishlistItems.map(item => item.listingId);
    const path = "listings";
    
    // Firestore 'in' query is limited to 10 items. For a prototype, this is fine.
    // In production, we'd chunk this or fetch individually.
    const q = query(collection(db, path), where("__name__", "in", listingIds.slice(0, 10)));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
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
  }, [wishlistItems]);

  const removeFromWishlist = async (wishlistId: string) => {
    try {
      await deleteDoc(doc(db, "wishlists", wishlistId));
      toast.success("Removed from wishlist");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, "wishlists");
    }
  };

  if (!user) {
    return (
      <div className="container py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Please log in to view your wishlist.</h2>
        <Button asChild className="rounded-full">
          <Link to="/login">Login</Link>
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-20 text-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading your wishlist...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-2">My Wishlist</h1>
        <p className="text-muted-foreground">Saved industrial assets you're interested in.</p>
      </div>

      {listings.length === 0 ? (
        <Card className="glass border-dashed border-primary/20 py-20 text-center flex flex-col items-center justify-center">
          <div className="h-20 w-20 rounded-3xl bg-primary/5 flex items-center justify-center mb-6 border border-primary/10 shadow-[0_0_20px_rgba(33,197,94,0.05)]">
            <Heart className="h-10 w-10 text-primary/40" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">No Saved Assets</h2>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-8 font-medium">
            Your wishlist is currently dormant. Monitor high-value assets and industrial machinery by saving them to your registry.
          </p>
          <Button asChild size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20">
            <Link to="/marketplace">
              <ArrowRight className="mr-2 h-4 w-4" />
              Explore Marketplace
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((listing) => {
            const wishlistItem = wishlistItems.find(item => item.listingId === listing.id);
            return (
              <motion.div
                key={`wishlist-listing-${listing.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="overflow-hidden glass h-full flex flex-col group">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img 
                      src={listing.images[0]} 
                      alt={listing.title} 
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" 
                      referrerPolicy="no-referrer"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-3 right-3 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => wishlistItem && removeFromWishlist(wishlistItem.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <ShieldCheck className="h-3 w-3 text-primary" />
                        {listing.sellerName}
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-orange-500">
                        <Leaf className="h-3 w-3" />
                        {listing.co2Savings}kg
                      </div>
                    </div>
                    <CardTitle className="line-clamp-1 text-lg">{listing.title}</CardTitle>
                    <CardDescription className="line-clamp-2 text-xs h-8">
                      {listing.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex-1">
                    <div className="text-2xl font-bold text-primary">
                      £{listing.price?.toLocaleString() || '0'}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 gap-2">
                    <Button variant="outline" className="flex-1 rounded-full text-xs" asChild>
                      <Link to={`/listing/${listing.id}`}>Details</Link>
                    </Button>
                    <Button className="flex-1 rounded-full text-xs" asChild>
                      <Link to={`/listing/${listing.id}`}>
                        <ShoppingCart className="mr-1 h-3 w-3" />
                        Buy
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
