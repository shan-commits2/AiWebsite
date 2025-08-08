import express, { type Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import { generateChatResponse, generateConversationTitle } from "./services/gemini";
import { insertConversationSchema, insertMessageSchema } from "@shared/schema";
import { upload, analyzeFile, getFileUrl } from "./services/upload";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // GET all conversations (for this session)
  app.get("/api/conversations", async (req, res) => {
    console.log("GET /api/conversations called");
    try {
      const sessionId = req.query.sessionId as string;
      if (!sessionId) return res.status(400).json({ message: "Missing sessionId" });

      const conversations = await storage.getConversations(sessionId);
      console.log("Fetched conversations:", conversations);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // CREATE new conversation
  app.post("/api/conversations", async (req, res) => {
    console.log("POST /api/conversations body:", req.body);
    try {
      const sessionId = req.body.sessionId as string;
      if (!sessionId) return res.status(400).json({ message: "Missing sessionId" });

      const validatedData = insertConversationSchema.parse({
        ...req.body,
        sessionId
      });
      console.log("Validated conversation data:", validatedData);

      const conversation = await storage.createConversation(validatedData);
      console.log("Created conversation:", conversation);

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

  // DELETE conversation
  app.delete("/api/conversations/:id", async (req, res) => {
    console.log("DELETE /api/conversations/:id", req.params.id);
    try {
      const sessionId = req.query.sessionId as string;
      if (!sessionId) return res.status(400).json({ message: "Missing sessionId" });

      const success = await storage.deleteConversation(req.params.id, sessionId);
      console.log("Delete success:", success);
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
    console.log("GET messages for conversation:", req.params.id);
    try {
      const sessionId = req.query.sessionId as string;
      if (!sessionId) return res.status(400).json({ message: "Missing sessionId" });

      const messages = await storage.getMessages(req.params.id, sessionId);
      console.log("Fetched messages:", messages);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // SEND message and get AI response
  app.post("/api/conversations/:id/messages", async (req, res) => {
    console.log("POST /api/conversations/:id/messages", "body:", req.body, "params:", req.params);
    try {
      const sessionId = req.body.sessionId as string;
      if (!sessionId) return res.status(400).json({ message: "Missing sessionId" });

      const conversationId = req.params.id;
      const messageData = { ...req.body, conversationId, sessionId };
      const validatedData = insertMessageSchema.parse(messageData);
      console.log("Validated message data:", validatedData);

      const conversation = await storage.getConversation(conversationId, sessionId);
      console.log("Fetched conversation:", conversation);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const userMessage = await storage.createMessage(validatedData);
      console.log("Created user message:", userMessage);

      await storage.updateConversation(conversationId, { updatedAt: new Date() }, sessionId);

      const messages = await storage.getMessages(conversationId, sessionId);
      if (messages.filter(m => m.role === 'user').length === 1) {
        const title = await generateConversationTitle(validatedData.content, conversation.model);
        await storage.updateConversation(conversationId, { title }, sessionId);
        console.log("Generated and updated title:", title);
      }

      try {
        const aiResponse = await generateChatResponse(validatedData.content, conversation.model);
        console.log("AI response:", aiResponse);

        const aiMessage = await storage.createMessage({
          conversationId,
          sessionId,
          role: "assistant",
          content: aiResponse,
        });
        console.log("Created AI message:", aiMessage);

        await storage.updateConversation(conversationId, { updatedAt: new Date() }, sessionId);

        res.status(201).json({ userMessage, aiMessage });
      } catch (aiError) {
        console.error("Error generating AI response:", aiError);
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

  // FILE UPLOAD
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    console.log("POST /api/upload file:", req.file);
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const analysis = await analyzeFile(req.file.path, req.file.originalname, req.file.mimetype);
      const fileUrl = getFileUrl(req.file.filename);

      console.log("Upload analysis result:", analysis);

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

  // Serve uploaded files
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // UPDATE message
  app.patch("/api/messages/:id", async (req, res) => {
    console.log("PATCH /api/messages/:id", req.params.id, "body:", req.body);
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
    console.log("POST /api/chat/compare body:", req.body);
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
    console.log("GET /api/analytics/usage called");
    try {
      const sessionId = req.query.sessionId as string;
      const stats = await storage.getUsageStats(sessionId);
      console.log("Fetched usage stats:", stats);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // USER SETTINGS
  app.get("/api/settings", async (req, res) => {
    console.log("GET /api/settings called");
    try {
      const sessionId = req.query.sessionId as string;
      const settings = await storage.getUserSettings(sessionId);
      console.log("Fetched user settings:", settings);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", async (req, res) => {
    console.log("PATCH /api/settings body:", req.body);
    try {
      const sessionId = req.body.sessionId as string;
      const settings = await storage.updateUserSettings(req.body, sessionId);
      console.log("Updated settings:", settings);
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
