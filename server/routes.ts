import express, { type Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import { generateChatResponse, generateConversationTitle } from "./services/gemini";
import { insertConversationSchema, insertMessageSchema } from "@shared/schema";
import { upload, analyzeFile, getFileUrl } from "./services/upload";
import { z } from "zod";

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
  app.use("/api", express.json(), (req, res, next) => {
    if (req.path.startsWith("/upload")) return next();
    sessionIdMiddleware(req, res, next);
  });

  app.get("/api/conversations", async (req, res) => {
    try {
      const conversations = await storage.getConversations(req.sessionId);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.post("/api/conversations", async (req, res) => {
    try {
      const validatedData = insertConversationSchema.parse({
        ...req.body,
      });
      const conversation = await storage.createConversation(req.sessionId, validatedData);
      res.status(201).json(conversation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid conversation data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create conversation" });
      }
    }
  });

  app.get("/api/analytics/totals", async (req, res) => {
    try {
      const usageStats = await storage.getUsageStats(req.sessionId);
      const conversations = await storage.getConversations(req.sessionId);
      const totalTokens = usageStats.reduce((sum, stat) => sum + (stat.tokensUsed || 0), 0);
      const totalMessages = usageStats.reduce((sum, stat) => sum + (stat.messagesExchanged || 0), 0);
      const totalConversations = conversations.length;
      res.json({ totalTokens, totalMessages, totalConversations });
    } catch {
      res.status(500).json({ message: "Failed to fetch totals" });
    }
  });

  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = req.params.id;
      const messageData = { ...req.body, conversationId };
      const validatedData = insertMessageSchema.parse(messageData);
      const conversation = await storage.getConversation(req.sessionId, conversationId);
      if (!conversation) return res.status(404).json({ message: "Conversation not found" });

      const userMessage = await storage.createMessage(req.sessionId, validatedData);
      await storage.updateConversation(req.sessionId, conversationId, { updatedAt: new Date() });

      const messages = await storage.getMessages(req.sessionId, conversationId);
      const userMessagesCount = messages.filter(m => m.role === "user").length;

      if (userMessagesCount === 1) {
        try {
          const title = await generateConversationTitle(validatedData.content, conversation.model);
          await storage.updateConversation(req.sessionId, conversationId, { title });
        } catch {}
      }

      try {
        const { text: aiText, tokensUsed, memoryTokens, responseTimeMs } = await generateChatResponse(validatedData.content, conversation.model);
        const aiMessage = await storage.createMessage(req.sessionId, {
          conversationId,
          role: "assistant",
          content: aiText,
          tokens: tokensUsed,
          memoryTokens,
          responseTime: responseTimeMs,
        });
        await storage.updateConversation(req.sessionId, conversationId, { updatedAt: new Date() });
        await storage.recordUsage(req.sessionId, {
          conversationsCreated: 0,
          messagesExchanged: 1,
          tokensUsed,
          averageResponseTime: responseTimeMs,
          modelsUsed: { [conversation.model]: 1 },
        });
        res.status(201).json({ userMessage, aiMessage });
      } catch {
        res.status(201).json({ userMessage, error: "Failed to generate AI response. Please try again." });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid message data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create message" });
      }
    }
  });

  app.delete("/api/conversations/:id", async (req, res) => {
    try {
      const success = await storage.deleteConversation(req.sessionId, req.params.id);
      if (success) {
        res.json({ message: "Conversation deleted successfully" });
      } else {
        res.status(404).json({ message: "Conversation not found" });
      }
    } catch {
      res.status(500).json({ message: "Failed to delete conversation" });
    }
  });

  app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      const messages = await storage.getMessages(req.sessionId, req.params.id);
      res.json(messages);
    } catch {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/upload", upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    try {
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
    } catch {
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  app.patch("/api/messages/:id", async (req, res) => {
    try {
      const updatedMessage = await storage.updateMessage(req.sessionId, req.params.id, req.body);
      if (updatedMessage) {
        res.json(updatedMessage);
      } else {
        res.status(404).json({ message: "Message not found" });
      }
    } catch {
      res.status(500).json({ message: "Failed to update message" });
    }
  });

  app.post("/api/chat/compare", async (req, res) => {
    try {
      const { message, model } = req.body;
      if (!message || !model) return res.status(400).json({ message: "Message and model are required" });
      const startTime = Date.now();
      const response = await generateChatResponse(message, model);
      const responseTime = Date.now() - startTime;
      res.json({ response, responseTime, tokens: response.length, model });
    } catch {
      res.status(500).json({ message: "Failed to generate comparison response" });
    }
  });

  app.get("/api/analytics/usage", async (req, res) => {
    try {
      const stats = await storage.getUsageStats(req.sessionId);
      res.json(stats);
    } catch {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getUserSettings(req.sessionId);
      res.json(settings);
    } catch {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", async (req, res) => {
    try {
      const settings = await storage.updateUserSettings(req.sessionId, req.body);
      res.json(settings);
    } catch {
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
