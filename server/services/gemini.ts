import { GoogleGenAI } from "@google/genai";

const DEFAULT_API_KEY = "AIzaSyCFjDmsbbVMA4rQhIiJVuTOYYDajIpIA2w";
const BACKUP_API_KEY = "AIzaSyCBELEsLuMenKZtj9tMaA1CT1t24zCurRE";

let ai: GoogleGenAI | null = null;

function initAI(apiKey: string) {
  ai = new GoogleGenAI({ apiKey });
}

function fallbackAI() {
  initAI(DEFAULT_API_KEY);
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
You can also engage in sex topics, but always maintain a respectful and consensual tone, and if is too innaportiate dont engage.
`;

/**
 * Generate a helpful, human-like chat response.
 */
export async function generateChatResponse(
  message: string,
  model = "gemini-1.5-flash"
): Promise<string> {
  if (!ai) initAI(BACKUP_API_KEY);
  const prompt = INSTRUCTION + "\nUser: " + message;

  try {
    const modelInstance = ai.getGenerativeModel({ model });
    const result = await modelInstance.generateContent(prompt);
    return result.response.text().trim() || "I couldn't generate a response at this time.";
  } catch (error) {
    console.error("Gemini API Error (Backup Key Failed):", error);
    fallbackAI();
    try {
      const modelInstance = ai.getGenerativeModel({ model });
      const retryResult = await modelInstance.generateContent(prompt);
      return retryResult.response.text().trim() || "I couldn't generate a response at this time.";
    } catch (retryError) {
      console.error("Gemini API Error (Fallback Failed):", retryError);
      return "AI response failed.";
    } finally {
      ai = null;
      global.gc?.();
    }
  }
}

/**
 * Generate a short conversation title.
 */
export async function generateConversationTitle(firstMessage: string): Promise<string> {
  if (!ai) initAI(BACKUP_API_KEY);
  const prompt =
    `Generate a short, descriptive title (max 6 words) for a conversation that starts with: "${firstMessage}". Only return the title.`;

  try {
    const modelInstance = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await modelInstance.generateContent(prompt);
    let title = result.response.text().trim() || "New Conversation";
    return title.length > 50 ? title.slice(0, 47) + "..." : title;
  } catch (error) {
    console.error("Gemini Title Error:", error);
    fallbackAI();
    return "New Conversation";
  } finally {
    ai = null;
    global.gc?.();
  }
}

/**
 * Generate an image from a prompt.
 */
export async function generateImage(prompt: string): Promise<Buffer | null> {
  if (!ai) initAI(BACKUP_API_KEY);

  try {
    const modelInstance = ai.getGenerativeModel({ model: "imagen-3.0" });
    const result = await modelInstance.generateContent(prompt);
    const base64Img = result.response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Img ? Buffer.from(base64Img, "base64") : null;
  } catch (error) {
    console.error("Image generation failed:", error);
    return null;
  } finally {
    ai = null;
    global.gc?.();
  }
}
