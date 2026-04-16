import { Listing, UserProfile } from "@/types";

/**
 * Calculates a quality score for a listing from 0 to 100.
 * Factors:
 * - Description length (max 30 pts)
 * - Number of images (max 20 pts)
 * - Specifications completeness (max 20 pts)
 * - Seller verification status (max 20 pts)
 * - Recency (max 10 pts)
 */
export function calculateListingQualityScore(listing: Listing, seller?: UserProfile | null): number {
  let score = 0;

  // 1. Description (max 30 pts)
  const descLength = listing.description?.length || 0;
  if (descLength > 500) score += 30;
  else if (descLength > 300) score += 20;
  else if (descLength > 100) score += 10;

  // 2. Images (max 20 pts)
  const imageCount = listing.images?.length || 0;
  if (imageCount >= 4) score += 20;
  else if (imageCount >= 2) score += 15;
  else if (imageCount >= 1) score += 5;

  // 3. Specifications (max 20 pts)
  if (listing.weight) score += 10;
  if (listing.dimensions && listing.dimensions.trim() !== "") score += 10;

  // 4. Seller Verification (max 20 pts)
  if (seller?.isVatVerified) score += 20;

  // 5. Recency (max 10 pts)
  const createdAt = listing.createdAt;
  if (createdAt) {
    const createdDate = typeof createdAt === 'string' ? new Date(createdAt) : (createdAt.toDate ? createdAt.toDate() : new Date(createdAt));
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) score += 10;
    else if (diffDays < 30) score += 5;
  }

  return Math.min(score, 100);
}

export function getQualityScoreColor(score: number): string {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-emerald-400";
  if (score >= 40) return "text-amber-500";
  return "text-rose-500";
}

export function getQualityScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Poor";
}
