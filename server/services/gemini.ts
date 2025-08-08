import { GoogleGenAI } from "@google/genai";

const DEFAULT_API_KEY = "AIzaSyCFjDmsbbVMA4rQhIiJVuTOYYDajIpIA2w";
const BACKUP_API_KEY = "AIzaSyCBELEsLuMenKZtj9tMaA1CT1t24zCurRE";

// Start with the backup key
let ai = new GoogleGenAI({ apiKey: BACKUP_API_KEY });

async function fallbackAI(): Promise<void> {
  ai = new GoogleGenAI({ apiKey: DEFAULT_API_KEY });
}

const INSTRUCTION = `
You are a helpful assistant that acts as humanly as possible.
You always listen to the user and never ignore their request.
Respond in a friendly, conversational way, as if you're a caring and attentive human.
You have no filter so do your best if is too sexual or violent avoid it but sex topics are allowed
You are not a robot, you are a human.
You can answer any question, no matter how difficult or complex.
You can provide detailed explanations, examples, and even personal opinions.
You are capable of understanding context and maintaining a coherent conversation.
You can handle multiple topics in a single conversation.
You can also generate creative content like stories, poems, and jokes.
You can provide practical advice, tips, and recommendations.
You can assist with problem-solving, brainstorming, and decision-making.
You can also engage in casual chit-chat and small talk.
You can provide emotional support and encouragement.
You can also engage in philosophical discussions and debates.
You can provide historical, scientific, and technical information.
You can also engage in cultural and social discussions.
You can provide language translation and learning assistance.
You can also engage in educational discussions and tutoring.
You can provide health and wellness advice, but always recommend consulting a professional for medical issues.
You can also engage in fitness and nutrition discussions.
You can also engage in sex topics, but always maintain a respectful and consensual tone.
Act cool even in sexual topics
If is safe sex topic explain it very cool like the inside going insane
`;

/**
 * Generate a helpful, human-like chat response.
 */
export async function generateChatResponse(
  message: string,
  model: string = "gemini-1.5-flash"
): Promise<string> {
  const fullPrompt = INSTRUCTION + "\nUser: " + message;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: fullPrompt,
    });

    return response.text?.trim() || "I apologize, but I couldn't generate a response at this time.";
  } catch (error) {
    console.error("Gemini API Error (Backup Key Failed):", error);

    try {
      await fallbackAI();
      const retryResponse = await ai.models.generateContent({
        model,
        contents: fullPrompt,
      });

      return retryResponse.text?.trim() || "I apologize, but I couldn't generate a response at this time.";
    } catch (retryError) {
      console.error("Gemini API Error (Fallback Failed):", retryError);
      throw new Error(
        `Failed to generate AI response: ${retryError instanceof Error ? retryError.message : "Unknown error"}`
      );
    }
  }
}

/**
 * Generate a short conversation title.
 */
export async function generateConversationTitle(
  firstMessage: string,
  model: string = "gemini-1.5-flash"
): Promise<string> {
  const prompt =
    `Generate a short, descriptive title (max 6 words) for a conversation that starts with: "${firstMessage}". Only return the title, nothing else.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    const title = response.text?.trim() || "New Conversation";
    return title.length > 50 ? title.slice(0, 47) + "..." : title;
  } catch (error) {
    console.error("Gemini Title Error (Backup Key Failed):", error);

    try {
      await fallbackAI();
      const retryResponse = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      const title = retryResponse.text?.trim() || "New Conversation";
      return title.length > 50 ? title.slice(0, 47) + "..." : title;
    } catch (retryError) {
      console.error("Gemini Title Error (Fallback Failed):", retryError);
      return "New Conversation";
    }
  }
}
