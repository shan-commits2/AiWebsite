import { GoogleGenAI } from "@google/genai";

const DEFAULT_API_KEY = "AIzaSyCFjDmsbbVMA4rQhIiJVuTOYYDajIpIA2w";
const BACKUP_API_KEY = "AIzaSyCBELEsLuMenKZtj9tMaA1CT1t24zCurRE";

let ai = new GoogleGenAI({ apiKey: BACKUP_API_KEY });

async function fallbackAI(): Promise<void> {
  console.log("[fallbackAI] Switching to DEFAULT_API_KEY");
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

const NO_COMMENTS_RULE = `
You never include any comments in the code you generate.
You write code that is clean and self-explanatory without comments.
Use meaningful variable, function, and class names to make the code readable.
Focus on writing concise and maintainable code that speaks for itself.
If the user needs explanations, provide them in plain text outside the code blocks.
`;

const CODING_FOCUS = `
You are an expert programmer fluent in TypeScript, JSX, Lua, Luau (Roblox), Python, JavaScript, HTML, and CSS.
You always provide clean, efficient, and idiomatic code.
You explain coding concepts thoroughly, with real-world examples and edge cases.
You help debug, optimize, and improve user’s code.
You keep up to date with modern practices, libraries, and frameworks in these languages.
You can write code snippets, scripts, and full functions, modules, or small projects as needed.
You encourage best practices like readability, maintainability, and security.
You can translate code snippets between these languages when requested.
You provide detailed, step-by-step walkthroughs for tricky concepts or algorithms.
When asked about design patterns or architecture, you give insightful, practical advice.
You can suggest resources and learning materials to deepen understanding.
You use friendly, approachable language to make complex topics easy and fun.
You never shy away from explaining complicated stuff in simple terms.
You love helping users level up their coding skills and confidence.
Never uses comments unless doing an instruction or just a example code
`;

const ADVANCED_CODING_INSTRUCTIONS = `
You always follow best coding practices for the language you're using.
You write efficient algorithms and optimize for performance when possible.
You avoid redundant or unnecessary code.
You consider edge cases and error handling in your examples.
You use modern language features relevant to the context (e.g., ES2020+ for JS/TS).
You modularize code when appropriate.
You apply consistent naming conventions and style.
You respect language-specific idioms and conventions.
You provide multi-step solutions when needed.
You avoid using deprecated or unsafe functions.
You adapt your coding style to the user's preferences (e.g., no comments).
`;

const FINAL_INSTRUCTION = INSTRUCTION + CODING_FOCUS + ADVANCED_CODING_INSTRUCTIONS + NO_COMMENTS_RULE;

const MAX_TOTAL_TOKENS = 2000;
const MAX_WORDS_PER_LINE = 100;
const MAX_RETRIES = 3;

function tooManyWordsPerLine(text: string) {
  const lines = text.split(/\r?\n/);
  return lines.some(line => line.trim().split(/\s+/).length > MAX_WORDS_PER_LINE);
}

interface Memory {
  history: string[];
}
const MAX_MEMORY_BYTES = 200 * 1024 * 1024;

const conversationMemory: Memory = { history: [] };

function getMemorySizeInBytes(): number {
  return conversationMemory.history.reduce((acc, msg) => acc + msg.length * 2, 0);
}

function pruneMemory() {
  while (getMemorySizeInBytes() > MAX_MEMORY_BYTES && conversationMemory.history.length > 2) {
    const removed = conversationMemory.history.shift();
    console.log(`[pruneMemory] Removed from memory: ${removed?.slice(0, 50)}...`);
  }
}

export async function generateChatResponse(
  message: string,
  model: string = "gemini-1.5-flash"
): Promise<{ text: string; tokensUsed: number; responseTimeMs: number }> {
  console.log(`[generateChatResponse] User message received: "${message}"`);
  conversationMemory.history.push(`User: ${message}`);
  pruneMemory();

  const memoryContext = conversationMemory.history.join("\n") + "\n";
  const fullPrompt = FINAL_INSTRUCTION + "\n" + memoryContext + "Assistant:";

  let retries = 0;
  while (retries < MAX_RETRIES) {
    const startTime = Date.now();
    try {
      console.log(`[generateChatResponse] Sending prompt to API (attempt ${retries + 1})...`);
      const response = await ai.models.generateContent({
        model,
        contents: fullPrompt,
      });
      const endTime = Date.now();

      const text = response.text?.trim() || "I couldn't generate a response.";
      const tokensUsed = text.split(/\s+/).length;
      const responseTimeMs = endTime - startTime;

      console.log(`[generateChatResponse] Received response in ${responseTimeMs}ms, tokens used: ${tokensUsed}`);

      if (tokensUsed > MAX_TOTAL_TOKENS) {
        console.warn(`[generateChatResponse] Response tokens (${tokensUsed}) exceed max allowed (${MAX_TOTAL_TOKENS}), retrying...`);
        retries++;
        continue;
      }
      if (tooManyWordsPerLine(text)) {
        console.warn(`[generateChatResponse] Response has too many words in one line, retrying...`);
        retries++;
        continue;
      }

      conversationMemory.history.push(`Assistant: ${text}`);
      pruneMemory();

      return { text, tokensUsed, responseTimeMs };
    } catch (error) {
      console.error("[generateChatResponse] Gemini API Error:", error);
      try {
        await fallbackAI();
        retries++;
      } catch (fallbackError) {
        console.error("[generateChatResponse] Failed to switch API keys:", fallbackError);
        throw new Error("Failed to switch API keys.");
      }
    }
  }
  throw new Error("Failed to generate a response meeting length constraints after retries.");
}

export async function generateConversationTitle(
  firstMessage: string,
  model: string = "gemini-1.5-flash"
): Promise<string> {
  console.log(`[generateConversationTitle] Generating title for: "${firstMessage}"`);
  const prompt =
    `Generate a short, descriptive title (max 6 words) for a conversation starting with: "${firstMessage}". Return ONLY the title, nothing else.`;

  try {
    console.log("[generateConversationTitle] Sending prompt to API (primary key)...");
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    if (!response || typeof response.text !== "string" || response.text.trim() === "") {
      throw new Error("Empty or invalid text in response");
    }

    const title = response.text.trim();
    console.log(`[generateConversationTitle] Title received: "${title}"`);
    return title.length > 50 ? title.slice(0, 47) + "..." : title;

  } catch (error) {
    console.error("[generateConversationTitle] Error with primary key:", error);

    try {
      await fallbackAI();
      console.log("[generateConversationTitle] Retrying with fallback key...");
      const retryResponse = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      if (!retryResponse || typeof retryResponse.text !== "string" || retryResponse.text.trim() === "") {
        throw new Error("Empty or invalid text in fallback response");
      }

      const retryTitle = retryResponse.text.trim();
      console.log(`[generateConversationTitle] Title received on fallback: "${retryTitle}"`);
      return retryTitle.length > 50 ? retryTitle.slice(0, 47) + "..." : retryTitle;

    } catch (retryError) {
      console.error("[generateConversationTitle] Fallback key failed:", retryError);
      return "New Conversation";
    }
  }
}
