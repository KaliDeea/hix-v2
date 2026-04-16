import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { UserProfile, Listing } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, 
  ShieldCheck, 
  MapPin, 
  Globe, 
  Package, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft,
  MessageSquare
} from "lucide-react";
import { motion } from "motion/react";

export default function PublicProfile() {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;

    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          setProfile(null);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${uid}`);
      }
    };

    const fetchListings = () => {
      const q = query(
        collection(db, "listings"),
        where("sellerId", "==", uid),
        where("status", "==", "available")
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Listing[];
        setListings(data);
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "listings");
        setLoading(false);
      });

      return unsubscribe;
    };

    fetchProfile();
    const unsubscribeListings = fetchListings();

    return () => unsubscribeListings();
  }, [uid]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Skeleton className="h-48 w-full rounded-3xl mb-8" />
        <div className="grid gap-8 lg:grid-cols-3">
          <Skeleton className="h-96 rounded-3xl" />
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-md mx-auto space-y-6">
          <div className="h-20 w-20 rounded-3xl bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold">Seller Not Found</h1>
          <p className="text-muted-foreground">The seller profile you are looking for does not exist or has been removed.</p>
          <Button onClick={() => navigate("/marketplace")} variant="outline" className="rounded-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Button 
        variant="ghost" 
        className="mb-8 rounded-full gap-2" 
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Profile Info */}
        <div className="space-y-6">
          <Card className="glass border-white/10 overflow-hidden rounded-[2rem]">
            <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
            <CardContent className="relative pt-0 px-6 pb-8">
              <div className="flex flex-col items-center -mt-12 text-center">
                <Avatar className="h-24 w-24 border-4 border-background shadow-xl rounded-3xl">
                  <AvatarImage src={profile.logoUrl} alt={profile.companyName} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold rounded-3xl">
                    {profile.companyName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="mt-4 space-y-1">
                  <h1 className="text-2xl font-bold tracking-tight">{profile.companyName}</h1>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>{profile.businessType}</span>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-2 mt-6">
                  {profile.isVetted && (
                    <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary gap-1 px-3 py-1 rounded-full">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      ID Verified
                    </Badge>
                  )}
                  {profile.isVatVerified && (
                    <Badge variant="outline" className="bg-blue-500/5 border-blue-500/20 text-blue-500 gap-1 px-3 py-1 rounded-full">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      VAT Verified
                    </Badge>
                  )}
                </div>

                <Button className="w-full mt-8 rounded-xl h-12 gap-2" onClick={() => navigate("/messages")}>
                  <MessageSquare className="h-4 w-4" />
                  Message Seller
                </Button>
              </div>

              <div className="mt-8 space-y-4 pt-8 border-t border-white/5">
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Location</p>
                    <p>{profile.address || "United Kingdom"}</p>
                  </div>
                </div>
                {profile.website && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground">
                      <Globe className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Website</p>
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {profile.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/10 rounded-[2rem]">
            <CardHeader>
              <CardTitle className="text-lg">About Company</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {profile.bio || "No company description provided."}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Listings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              Active Listings
              <Badge variant="secondary" className="ml-2 rounded-full">{listings.length}</Badge>
            </h2>
          </div>

          {listings.length === 0 ? (
            <Card className="glass border-dashed border-white/10 rounded-[2rem] py-20 text-center">
              <CardContent>
                <Package className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground">This seller currently has no active listings.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {listings.map((listing) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  className="cursor-pointer"
                  onClick={() => navigate(`/listing/${listing.id}`)}
                >
                  <Card className="glass border-white/10 overflow-hidden h-full flex flex-col hover:border-primary/30 transition-all duration-300">
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <img 
                        src={listing.images[0]} 
                        alt={listing.title}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-black/60 backdrop-blur-md border-white/10 text-white font-bold">
                          £{listing.price.toLocaleString()}
                        </Badge>
                      </div>
                    </div>
                    <CardHeader className="p-4">
                      <CardTitle className="text-base line-clamp-1">{listing.title}</CardTitle>
                      <CardDescription className="text-xs line-clamp-2">{listing.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 flex-1">
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{listing.location}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
