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

/**
 * Calculates an ESG Impact Score from 0 to 100.
 * Factors:
 * - CO2 Savings volume (max 70 pts)
 * - Seller verification status (max 30 pts)
 */
export function calculateESGImpactScore(listing: Listing, seller?: UserProfile | null): number {
  let score = 0;

  // 1. CO2 Savings (max 70 pts)
  const co2 = listing.co2Savings || 0;
  if (co2 >= 2000) score += 70;
  else if (co2 >= 1000) score += 55;
  else if (co2 >= 500) score += 40;
  else if (co2 >= 250) score += 25;
  else if (co2 > 0) score += 10;

  // 2. Trust Factor (max 30 pts)
  if (seller?.isVetted || listing.verificationData) score += 20;
  if (seller?.isVatVerified) score += 10;

  return Math.min(score, 100);
}

export function getESGImpactScoreColor(score: number): string {
  if (score >= 70) return "text-emerald-500";
  if (score >= 40) return "text-amber-500";
  return "text-rose-500";
}

export function getESGImpactColorBadge(score: number): string {
  if (score >= 70) return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  if (score >= 40) return "bg-amber-500/10 text-amber-500 border-amber-500/20";
  return "bg-rose-500/10 text-rose-500 border-rose-500/20";
}

export function getESGImpactScoreLabel(score: number): string {
  if (score >= 70) return "Highest Impact";
  if (score >= 40) return "Moderate Impact";
  return "Low Impact";
}

/**
 * Calculates a User's ESG Impact Score from 0 to 100.
 * Factors:
 * - Total CO2 Saved (max 60 pts) - thresholds calibrated for industrial scale
 * - Verification status (max 40 pts)
 */
export function calculateUserESGImpactScore(profile: UserProfile): number {
  let score = 0;

  // 1. Environmental Contribution (max 60 pts)
  const totalSaved = profile.totalCo2Saved || 0;
  if (totalSaved >= 10000) score += 60;
  else if (totalSaved >= 5000) score += 45;
  else if (totalSaved >= 2000) score += 30;
  else if (totalSaved >= 500) score += 15;
  else if (totalSaved > 0) score += 5;

  // 2. Structural Trust (max 40 pts)
  if (profile.isVetted) score += 20;
  if (profile.isVatVerified) score += 20;

  return Math.min(score, 100);
}

export function getUserESGScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]";
  if (score >= 50) return "text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]";
  if (score >= 30) return "text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]";
  return "text-slate-500";
}

export function getUserESGScoreBadge(score: number): string {
  if (score >= 80) return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  if (score >= 50) return "bg-blue-500/10 text-blue-500 border-blue-500/20";
  if (score >= 30) return "bg-amber-500/10 text-amber-500 border-amber-500/20";
  return "bg-slate-500/10 text-slate-500 border-slate-500/20";
}

export function getUserESGLevel(score: number): string {
  if (score >= 80) return "Legacy Guardian";
  if (score >= 50) return "Active Contributor";
  if (score >= 30) return "Emerging Partner";
  return "Network Member";
}
