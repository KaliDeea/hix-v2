export interface UserProfile {
  uid: string;
  email: string;
  companyName: string;
  vatNumber: string;
  phoneNumber?: string;
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
}

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedUserId: string;
  reportedUserName: string;
  transactionId?: string;
  listingId?: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: any;
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
  images: string[];
  co2Savings: number; // in kg
  status: 'available' | 'sold';
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
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: any;
  certificateUrl?: string;
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

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  listingId: string;
  listingTitle: string;
  content: string;
  status: 'unread' | 'read';
  createdAt: any;
}
