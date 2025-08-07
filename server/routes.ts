import express, { type Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import { generateChatResponse, generateConversationTitle } from "./services/gemini";
import { insertConversationSchema, insertMessageSchema } from "@shared/schema";
import { upload, analyzeFile, getFileUrl } from "./services/upload";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all conversations
  app.get("/api/conversations", async (_req, res) => {
    try {
      const conversations = await storage.getConversations();
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", async (req, res) => {
    try {
      const validatedData = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation(validatedData);
      res.status(201).json(conversation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid conversation data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create conversation" });
      }
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", async (req, res) => {
    try {
      const success = await storage.deleteConversation(req.params.id);
      if (success) {
        res.json({ message: "Conversation deleted successfully" });
      } else {
        res.status(404).json({ message: "Conversation not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete conversation" });
    }
  });

  // Get messages for a conversation
  app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      const messages = await storage.getMessages(req.params.id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send message and get AI response
  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = req.params.id;
      const messageData = { ...req.body, conversationId };
      const validatedData = insertMessageSchema.parse(messageData);

      // Verify conversation exists
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Create user message
      const userMessage = await storage.createMessage(validatedData);

      // Update conversation's updated time
      await storage.updateConversation(conversationId, { 
        updatedAt: new Date() 
      });

      // If this is the first user message, generate a title
      const messages = await storage.getMessages(conversationId);
      if (messages.filter(m => m.role === 'user').length === 1) {
        const title = await generateConversationTitle(validatedData.content, conversation.model);
        await storage.updateConversation(conversationId, { title });
      }

      // Generate AI response using the conversation's model
      try {
        const aiResponse = await generateChatResponse(validatedData.content, conversation.model);
        
        // Create AI message
        const aiMessage = await storage.createMessage({
          conversationId,
          role: "assistant",
          content: aiResponse,
        });

        // Update conversation timestamp again
        await storage.updateConversation(conversationId, { 
          updatedAt: new Date() 
        });

        res.status(201).json({
          userMessage,
          aiMessage,
        });
      } catch (aiError) {
        // Return user message even if AI response fails
        res.status(201).json({
          userMessage,
          error: "Failed to generate AI response. Please try again.",
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid message data", errors: error.errors });
      } else {
        console.error("Message creation error:", error);
        res.status(500).json({ message: "Failed to create message" });
      }
    }
  });

  // File upload endpoint
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const analysis = await analyzeFile(
        req.file.path, 
        req.file.originalname, 
        req.file.mimetype
      );
      
      const fileUrl = getFileUrl(req.file.filename);
      
      res.json({
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        analysis
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Serve uploaded files
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Update message (for editing, reactions, bookmarks)
  app.patch("/api/messages/:id", async (req, res) => {
    try {
      const messageId = req.params.id;
      const updates = req.body;
      
      const updatedMessage = await storage.updateMessage(messageId, updates);
      if (updatedMessage) {
        res.json(updatedMessage);
      } else {
        res.status(404).json({ message: "Message not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to update message" });
    }
  });

  // Model comparison endpoint
  app.post("/api/chat/compare", async (req, res) => {
    try {
      const { message, model } = req.body;
      
      if (!message || !model) {
        return res.status(400).json({ message: "Message and model are required" });
      }

      const startTime = Date.now();
      const response = await generateChatResponse(message, model);
      const responseTime = Date.now() - startTime;
      
      res.json({
        response,
        responseTime,
        tokens: response.length, // Rough estimate
        model
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate comparison response" });
    }
  });

  // Analytics endpoints
  app.get("/api/analytics/usage", async (_req, res) => {
    try {
      const stats = await storage.getUsageStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // User settings endpoints
  app.get("/api/settings", async (_req, res) => {
    try {
      const settings = await storage.getUserSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", async (req, res) => {
    try {
      const updates = req.body;
      const settings = await storage.updateUserSettings(updates);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
