import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please add it to your environment variables.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export interface AssetVerificationResult {
  title: string;
  category: string;
  specs: {
    voltage?: string;
    power?: string;
    dimensions?: string;
    weight?: string;
    manufacturer?: string;
    model?: string;
  };
  verificationScore: number;
  esgAnalysis: string;
}

export async function scanAssetDocument(file: File): Promise<AssetVerificationResult> {
  const ai = getAI();
  // Convert File to base64
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(file);
  });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            text: "Analyze this industrial asset technical document or nameplate photo. Extract exact technical specifications. Determine the asset category and provide a reliability score for the extraction. Also, analyze if the asset's weight and power ratings suggest it is a high-impact candidate for circular exchange (saving CO2 vs buying new).",
          },
          {
            inlineData: {
              data: base64Data,
              mimeType: file.type || "application/pdf",
            },
          },
        ],
      },
    ],
    config: {
      systemInstruction: "You are a Senior Industrial Asset Auditor. You extract precise data from technical manuals, nameplates, and spec sheets. Be extremely accurate with units.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Professional asset title" },
          category: { type: Type.STRING, description: "Industrial category (e.g. Machinery, Electrical, HVAC)" },
          specs: {
            type: Type.OBJECT,
            properties: {
              voltage: { type: Type.STRING },
              power: { type: Type.STRING },
              dimensions: { type: Type.STRING },
              weight: { type: Type.STRING },
              manufacturer: { type: Type.STRING },
              model: { type: Type.STRING },
            }
          },
          verificationScore: { type: Type.NUMBER, description: "Confidence score 0-100" },
          esgAnalysis: { type: Type.STRING, description: "Summary of CO2 impact verification" },
        },
        required: ["title", "category", "verificationScore"],
      },
    },
  });

  return JSON.parse(response.text);
}

export interface TechnicalDocumentExtraction {
  summary: string;
  calibrationDate?: string;
  expiryDate?: string;
  technicianNotes?: string;
  isLogBook: boolean;
  isManual: boolean;
}

export async function scanTechnicalDocument(file: File): Promise<TechnicalDocumentExtraction> {
  const ai = getAI();
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(file);
  });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            text: "Extract technical characteristics from this industrial document. Identify if it's a maintenance log, an operating manual, or a calibration certificate. Extract key dates (calibration/expiry), technician notes, and a high-level technical summary.",
          },
          {
            inlineData: {
              data: base64Data,
              mimeType: file.type || "application/pdf",
            },
          },
        ],
      },
    ],
    config: {
      systemInstruction: "You are an AI Industrial Librarian. You digest technical PDFs and extract structured metadata for Digital Product Passports.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          calibrationDate: { type: Type.STRING },
          expiryDate: { type: Type.STRING },
          technicianNotes: { type: Type.STRING },
          isLogBook: { type: Type.BOOLEAN },
          isManual: { type: Type.BOOLEAN },
        },
        required: ["summary", "isLogBook", "isManual"],
      },
    },
  });

  return JSON.parse(response.text);
}

import { Listing } from "@/types";

export interface MatchResult {
  matches: {
    listingId: string;
    matchReason: string;
    confidenceScore: number;
    technicalOverlap: string[];
  }[];
}

export async function matchMarketplaceInventory(requirements: string, listings: Listing[]): Promise<MatchResult> {
  const ai = getAI();
  const listingSamples = listings.map(l => ({
    id: l.id,
    title: l.title,
    specs: `${l.brand || ""} ${l.model || ""} ${l.category || ""}`,
    price: l.price
  }));

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            text: `Analyze these technical requirements: "${requirements}". Cross-reference them with the current marketplace inventory provided below. Identify potential matches based on technical compatibility and industrial logic. Return a ranked list of matches.

Inventory:
${JSON.stringify(listingSamples)}`,
          },
        ],
      },
    ],
    config: {
      systemInstruction: "You are an Industrial Procurement Matcher. You find technical overlaps between buyer requirements and available inventory.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          matches: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                listingId: { type: Type.STRING },
                matchReason: { type: Type.STRING },
                confidenceScore: { type: Type.NUMBER },
                technicalOverlap: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["listingId", "matchReason", "confidenceScore"],
            }
          }
        },
        required: ["matches"],
      },
    },
  });

  return JSON.parse(response.text);
}
