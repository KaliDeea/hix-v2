export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'message' | 'bid' | 'system' | 'auction' | 'wishlist';
  link?: string;
  read: boolean;
  createdAt: any;
}

export interface WishlistItem {
  id: string;
  userId: string;
  listingId: string;
  createdAt: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  companyName: string;
  vatNumber: string;
  phoneNumber?: string;
  address?: string;
  website?: string;
  bio?: string;
  isVetted: boolean;
  isVatVerified: boolean;
  isSuspended: boolean;
  suspensionReason?: string;
  role: 'user' | 'admin' | 'superadmin';
  logoUrl?: string;
  createdAt: any;
  stripeAccountId?: string;
  revenue: number;
  commissionsPaid: number;
  currency?: string;
}

export interface Listing {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  description: string;
  price: number;
  quantity: number;
  category: string;
  brand?: string;
  model?: string;
  year?: number;
  condition: 'new' | 'used-excellent' | 'used-good' | 'used-fair';
  location: string;
  weight?: number;
  dimensions?: string;
  images: string[];
  documents?: { name: string; url: string; type: string }[];
  co2Savings: number; // in kg
  status: 'available' | 'sold' | 'draft';
  listingType: 'fixed' | 'auction';
  reservePrice?: number;
  auctionEndTime?: string;
  currentBid?: number;
  bidCount?: number;
  createdAt: any;
  updatedAt?: any;
}

export interface Chat {
  id: string;
  participants: string[];
  participantNames: { [uid: string]: string };
  participantLogos: { [uid: string]: string };
  lastMessage?: string;
  lastMessageTime?: any;
  lastRead?: { [uid: string]: any };
  updatedAt: any;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  attachmentUrl?: string;
  createdAt: any;
}

export interface Bid {
  id: string;
  listingId: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  createdAt: any;
}

export interface Transaction {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  quantity: number;
  buyerCommission: number;
  sellerCommission: number;
  co2Saved: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  createdAt: any;
  invoiceUrl?: string;
  certificateUrl?: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedUserId: string;
  reportedUserName: string;
  listingId?: string;
  transactionId?: string;
  co2Saved?: number;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: any;
}

export interface HaulingCompany {
  id: string;
  name: string;
  description: string;
  contactEmail: string;
  isVetted: boolean;
}

export interface HaulingQuoteRequest {
  id: string;
  haulerId: string;
  haulerName: string;
  userId: string;
  userName: string;
  userEmail: string;
  origin: string;
  destination: string;
  assetDetails: string;
  status: 'pending' | 'responded' | 'closed';
  createdAt: any;
}

export interface HaulingPartnerApplication {
  id: string;
  companyName: string;
  contactEmail: string;
  phoneNumber: string;
  description: string;
  fleetSize: number;
  specializations: string[];
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  createdAt: any;
}
