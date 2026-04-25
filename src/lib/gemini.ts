export interface ModerationResult {
  flagged: boolean;
  reason?: string;
  action: 'block' | 'warn' | 'allow';
}

export async function analyzeMessage(text: string): Promise<ModerationResult> {
  try {
    const response = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `Analyse this message for external trading violations: "${text}"` }] }],
        systemInstruction: `You are a message moderation AI for a professional industrial asset marketplace. 
        Your goal is to detect and prevent external trading to protect platform integrity.
        
        Analyze the provided message text for:
        1. Contact information (phone numbers, full emails, external websites).
        2. Suggestions to move the conversation or transaction to another platform or social media.
        3. Requests for direct payments (bank transfer, cash, etc.) outside our platform's secure checkout.
        
        Strictly follow the rules of a B2B platform where all communication and payments must stay on the platform.`,
        responseSchema: {
          type: "object",
          properties: {
            flagged: { type: "boolean" },
            reason: { type: "string" },
            action: { type: "string", enum: ["block", "warn", "allow"] }
          },
          required: ["flagged", "action"]
        }
      })
    });

    if (!response.ok) throw new Error("Moderation request failed");
    return await response.json();
  } catch (error) {
    console.error("Moderation analysis failed:", error);
    return { flagged: false, action: "allow" };
  }
}
