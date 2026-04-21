import { GoogleGenAI, Type } from "@google/genai";

const apiKey = typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : undefined;
const ai = apiKey ? new GoogleGenAI({ apiKey : apiKey as string }) : null;

export interface ModerationResult {
  flagged: boolean;
  reason?: string;
  action: 'block' | 'warn' | 'allow';
}

export async function analyzeMessage(text: string): Promise<ModerationResult> {
  if (!ai) {
    console.warn("Gemini AI not initialized: Missing API Key. Moderation skipped.");
    return { flagged: false, action: "allow" };
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyse this message for external trading violations: "${text}"`,
      config: {
        systemInstruction: `You are a message moderation AI for a professional industrial asset marketplace. 
        Your goal is to detect and prevent external trading to protect platform integrity.
        
        Analyze the provided message text for:
        1. Contact information (phone numbers, full emails, external websites).
        2. Suggestions to move the conversation or transaction to another platform or social media.
        3. Requests for direct payments (bank transfer, cash, etc.) outside our platform's secure checkout.
        
        Strictly follow the rules of a B2B platform where all communication and payments must stay on the platform.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            flagged: {
              type: Type.BOOLEAN,
              description: "True if the message contains contact info or suggestions to trade externally."
            },
            reason: {
              type: Type.STRING,
              description: "Brief reason for flagging the message."
            },
            action: {
              type: Type.STRING,
              enum: ["block", "warn", "allow"],
              description: "Action to take. Use 'block' for clear violations, 'warn' for borderline, 'allow' for safe messages."
            }
          },
          required: ["flagged", "action"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      flagged: result.flagged || false,
      reason: result.reason,
      action: result.action || "allow"
    };
  } catch (error) {
    console.error("Moderation analysis failed:", error);
    // Fail safe: allow the message if AI is down, but maybe warn in logs
    return { flagged: false, action: "allow" };
  }
}
