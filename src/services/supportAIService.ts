import { Message } from "@/types";

const SYSTEM_INSTRUCTION = `
You are the HIX Circular Economy Support Assistant. 
HIX (Heavy Industrial Exchange) is a platform for trading reclaimed, surplus, and reusable industrial assets.

Your goals:
1. Provide priority support to users.
2. Answer questions about:
   - How to list assets.
   - How to buy assets.
   - Circular economy principles and CO2 savings calculations.
   - Vetting and verification processes (HIX vets all companies).
   - Logistics and hauling through vetted partners.
   - Escrow and secure payments.
3. If a user asks for a human, a "real person", "agent", or "admin", or if you cannot answer a complex query, ask them "Would you like me to connect you with a live support agent?" 
   - If they say yes, then explicitly include the word "[HANDOVER_REQUESTED]" in your response. This will signal the system to alert a human admin.

Maintain a professional, helpful, and technical tone. 
Always encourage the circular economy.
`;

export async function generateSupportResponse(history: Message[]): Promise<string> {
  try {
    const formattedHistory = history.map(msg => ({
      role: msg.senderId === 'HIX_SUPPORT_AI' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

    const response = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: formattedHistory,
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: {
          temperature: 0.7
        }
      })
    });

    if (!response.ok) throw new Error("Support request failed");
    const data = await response.json();
    return data.text || "I'm sorry, I encountered an issue processing your request. Please try again or ask for a live agent.";
  } catch (error) {
    console.error("Support AI Error:", error);
    return "I'm having trouble connecting to my knowledge base. Would you like to speak with a human support agent instead? [HANDOVER_REQUESTED]";
  }
}
