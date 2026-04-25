import { Listing, AssetRequest } from "../types";

export interface MatchResult {
  listingId: string;
  score: number; // 0-100
  reasoning: string;
  matchType: 'perfect' | 'good' | 'potential';
}

export async function findMatches(request: AssetRequest, listings: Listing[]): Promise<MatchResult[]> {
  try {
    const response = await fetch("/api/ai/match", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ request, listings }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("AI Matching failed:", error);
    return [];
  }
}
