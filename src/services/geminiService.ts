import { Listing, DigitalProductPassport } from "@/types";

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

export async function extractPassportData(file: File): Promise<Partial<DigitalProductPassport>> {
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(file);
  });

  const response = await fetch("/api/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: "Extract Digital Product Passport (DPP) data from this technical document. Identify manufacturer, model, serial number, manufacturing year, power rating, and voltage. Also, look for material composition (e.g. Steel 80%, Copper 10%) and maintenance history logs. Calculate a 'Circular Value Score' (0-100) based on documentation quality and asset durability." },
          { inlineData: { data: base64Data, mimeType: file.type || "application/pdf" } }
        ]
      }],
      systemInstruction: "You are an Industrial Asset Auditor specialized in Digital Product Passports. Extract structured metadata from manuals, spec sheets, and certificates.",
      responseSchema: {
        type: "object",
        properties: {
          manufacturer: { type: "string" },
          model: { type: "string" },
          serialNumber: { type: "string" },
          manufacturingYear: { type: "number" },
          powerRating: { type: "string" },
          voltage: { type: "string" },
          materialComposition: {
            type: "array",
            items: {
              type: "object",
              properties: {
                material: { type: "string" },
                percentage: { type: "number" }
              },
              required: ["material", "percentage"]
            }
          },
          maintenanceHistory: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string" },
                action: { type: "string" },
                technician: { type: "string" }
              },
              required: ["date", "action"]
            }
          },
          circularValueScore: { type: "number" }
        }
      }
    })
  });

  if (!response.ok) throw new Error("Passport extraction failed");
  return await response.json();
}

export async function scanAssetDocument(file: File): Promise<AssetVerificationResult> {
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

  const response = await fetch("/api/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: "Analyze this industrial asset technical document or nameplate photo. Extract exact technical specifications. Determine the asset category and provide a reliability score for the extraction. Also, analyze if the asset's weight and power ratings suggest it is a high-impact candidate for circular exchange (saving CO2 vs buying new)." },
          { inlineData: { data: base64Data, mimeType: file.type || "application/pdf" } }
        ]
      }],
      systemInstruction: "You are a Senior Industrial Asset Auditor. You extract precise data from technical manuals, nameplates, and spec sheets. Be extremely accurate with units.",
      responseSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          category: { type: "string" },
          specs: {
            type: "object",
            properties: {
              voltage: { type: "string" },
              power: { type: "string" },
              dimensions: { type: "string" },
              weight: { type: "string" },
              manufacturer: { type: "string" },
              model: { type: "string" }
            }
          },
          verificationScore: { type: "number" },
          esgAnalysis: { type: "string" }
        },
        required: ["title", "category", "verificationScore"]
      }
    })
  });

  if (!response.ok) throw new Error("Asset scan failed");
  return await response.json();
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
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(file);
  });

  const response = await fetch("/api/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: "Extract technical characteristics from this industrial document. Identify if it's a maintenance log, an operating manual, or a calibration certificate. Extract key dates (calibration/expiry), technician notes, and a high-level technical summary." },
          { inlineData: { data: base64Data, mimeType: file.type || "application/pdf" } }
        ]
      }],
      systemInstruction: "You are an AI Industrial Librarian. You digest technical PDFs and extract structured metadata for Digital Product Passports.",
      responseSchema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          calibrationDate: { type: "string" },
          expiryDate: { type: "string" },
          technicianNotes: { type: "string" },
          isLogBook: { type: "boolean" },
          isManual: { type: "boolean" }
        },
        required: ["summary", "isLogBook", "isManual"]
      }
    })
  });

  if (!response.ok) throw new Error("Technical document scan failed");
  return await response.json();
}

export interface MatchResult {
  matches: {
    listingId: string;
    matchReason: string;
    confidenceScore: number;
    technicalOverlap: string[];
  }[];
}

export async function matchMarketplaceInventory(requirements: string, listings: Listing[]): Promise<MatchResult> {
  const listingSamples = listings.map(l => ({
    id: l.id,
    title: l.title,
    specs: `${l.brand || ""} ${l.model || ""} ${l.category || ""}`,
    price: l.price
  }));

  const response = await fetch("/api/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: `Analyze these technical requirements: "${requirements}". Cross-reference them with the current marketplace inventory provided below. Identify potential matches based on technical compatibility and industrial logic. Return a ranked list of matches.

Inventory:
${JSON.stringify(listingSamples)}` }]
      }],
      systemInstruction: "You are an Industrial Procurement Matcher. You find technical overlaps between buyer requirements and available inventory.",
      responseSchema: {
        type: "object",
        properties: {
          matches: {
            type: "array",
            items: {
              type: "object",
              properties: {
                listingId: { type: "string" },
                matchReason: { type: "string" },
                confidenceScore: { type: "number" },
                technicalOverlap: { type: "array", items: { type: "string" } }
              },
              required: ["listingId", "matchReason", "confidenceScore"]
            }
          }
        },
        required: ["matches"]
      }
    })
  });

  if (!response.ok) throw new Error("Marketplace matching failed");
  return await response.json();
}
