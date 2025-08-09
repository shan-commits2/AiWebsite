import express, { type Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import { generateChatResponse, generateConversationTitle } from "./services/gemini";
import { insertConversationSchema, insertMessageSchema } from "@shared/schema";
import { upload, analyzeFile, getFileUrl } from "./services/upload";
import { z } from "zod";

// Middleware to attach sessionId from query, body, or headers
function sessionIdMiddleware(req, res, next) {
  const sessionId =
    req.headers["x-session-id"] ||
    req.body.sessionId ||
    req.query.sessionId ||
    req.headers["sessionid"] ||
    null;

  if (!sessionId) {
    return res.status(400).json({ message: "Missing sessionId" });
  }

  req.sessionId = String(sessionId);
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply sessionIdMiddleware to all /api routes except file uploads
  app.use("/api", express.json(), (req, res, next) => {
    if (req.path.startsWith("/upload")) return next();
    sessionIdMiddleware(req, res, next);
  });

  // GET all conversations
  app.get("/api/conversations", async (req, res) => {
    try {
      const conversations = await storage.getConversations(req.sessionId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // CREATE new conversation
  app.post("/api/conversations", async (req, res) => {
    try {
      const validatedData = insertConversationSchema.parse({
        ...req.body,
        sessionId: req.sessionId,
      });
      const conversation = await storage.createConversation(validatedData);
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid conversation data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create conversation" });
      }
    }
  });

  // GET analytics totals
  app.get("/api/analytics/totals", async (req, res) => {
    try {
      const usageStats = await storage.getUsageStats();
      const conversations = await storage.getConversations();

      const totalTokens = usageStats.reduce((sum, stat) => sum + (stat.tokensUsed || 0), 0);
      const totalMessages = usageStats.reduce((sum, stat) => sum + (stat.messagesExchanged || 0), 0);
      const totalConversations = conversations.length;

      res.json({ totalTokens, totalMessages, totalConversations });
    } catch (error) {
      console.error("Error fetching totals:", error);
      res.status(500).json({ message: "Failed to fetch totals" });
    }
  });

  // POST new message & generate AI response + update conversation title on first user message
  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = req.params.id;
      const messageData = { ...req.body, conversationId, sessionId: req.sessionId };
      const validatedData = insertMessageSchema.parse(messageData);

      const conversation = await storage.getConversation(conversationId, req.sessionId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const userMessage = await storage.createMessage(validatedData);
      await storage.updateConversation(conversationId, { updatedAt: new Date() }, req.sessionId);

      // Check if this is the first user message, then generate & update title
      const messages = await storage.getMessages(conversationId, req.sessionId);
      const userMessagesCount = messages.filter(m => m.role === "user").length;

      if (userMessagesCount === 1) {
        try {
          const title = await generateConversationTitle(validatedData.content, conversation.model);
          console.log("Generated conversation title:", title);
          await storage.updateConversation(conversationId, { title }, req.sessionId);
        } catch (titleError) {
          console.error("Error generating/updating conversation title:", titleError);
        }
      }

      // Generate AI response
      try {
        // Updated here to capture memoryTokens from generateChatResponse
        const { text: aiText, tokensUsed, memoryTokens, responseTimeMs } = await generateChatResponse(validatedData.content, conversation.model);

        const aiMessage = await storage.createMessage({
          conversationId,
          sessionId: req.sessionId,
          role: "assistant",
          content: aiText,
          tokens: tokensUsed,
          memoryTokens,  // <-- store memoryTokens here
          responseTime: responseTimeMs,
        });

        await storage.updateConversation(conversationId, { updatedAt: new Date() }, req.sessionId);

        // Update usage analytics
        await storage.recordUsage({
          conversationsCreated: 0,
          messagesExchanged: 1,
          tokensUsed,
          averageResponseTime: responseTimeMs,
          modelsUsed: { [conversation.model]: 1 },
        });

        res.status(201).json({ userMessage, aiMessage });
      } catch (aiError) {
        console.error("AI response generation error:", aiError);
        res.status(201).json({ userMessage, error: "Failed to generate AI response. Please try again." });
      }
    } catch (error) {
      console.error("Message creation error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid message data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create message" });
      }
    }
  });

  // DELETE conversation
  app.delete("/api/conversations/:id", async (req, res) => {
    try {
      const success = await storage.deleteConversation(req.params.id, req.sessionId);
      if (success) {
        res.json({ message: "Conversation deleted successfully" });
      } else {
        res.status(404).json({ message: "Conversation not found" });
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ message: "Failed to delete conversation" });
    }
  });

  // GET messages for a conversation
  app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      const messages = await storage.getMessages(req.params.id, req.sessionId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // FILE UPLOAD (no sessionId check here by default)
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const analysis = await analyzeFile(req.file.path, req.file.originalname, req.file.mimetype);
      const fileUrl = getFileUrl(req.file.filename);

      res.json({
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        analysis,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // UPDATE message
  app.patch("/api/messages/:id", async (req, res) => {
    try {
      const updatedMessage = await storage.updateMessage(req.params.id, req.body);
      if (updatedMessage) {
        res.json(updatedMessage);
      } else {
        res.status(404).json({ message: "Message not found" });
      }
    } catch (error) {
      console.error("Error updating message:", error);
      res.status(500).json({ message: "Failed to update message" });
    }
  });

  // MODEL COMPARISON
  app.post("/api/chat/compare", async (req, res) => {
    try {
      const { message, model } = req.body;
      if (!message || !model) {
        return res.status(400).json({ message: "Message and model are required" });
      }

      const startTime = Date.now();
      const response = await generateChatResponse(message, model);
      const responseTime = Date.now() - startTime;

      res.json({ response, responseTime, tokens: response.length, model });
    } catch (error) {
      console.error("Error in chat compare:", error);
      res.status(500).json({ message: "Failed to generate comparison response" });
    }
  });

  // ANALYTICS
  app.get("/api/analytics/usage", async (req, res) => {
    try {
      const stats = await storage.getUsageStats(req.sessionId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // USER SETTINGS
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getUserSettings(req.sessionId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", async (req, res) => {
    try {
      const settings = await storage.updateUserSettings(req.body, req.sessionId);
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
