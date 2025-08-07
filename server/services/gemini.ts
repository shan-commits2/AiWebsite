import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "" 
});

export async function generateChatResponse(message: string, model: string = "gemini-1.5-flash"): Promise<string> {
  try {
    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_AI_API_KEY) {
      throw new Error("Gemini API key not configured");
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: message,
    });

    return response.text || "I apologize, but I couldn't generate a response at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error(`Failed to generate AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateConversationTitle(firstMessage: string, model: string = "gemini-1.5-flash"): Promise<string> {
  try {
    const prompt = `Generate a short, descriptive title (max 6 words) for a conversation that starts with: "${firstMessage}". Only return the title, nothing else.`;
    
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    const title = response.text?.trim() || "New Conversation";
    return title.length > 50 ? title.substring(0, 47) + "..." : title;
  } catch (error) {
    console.error("Error generating title:", error);
    return "New Conversation";
  }
}
