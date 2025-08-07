import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateChatResponse, generateConversationTitle } from "./services/gemini";
import { insertConversationSchema, insertMessageSchema } from "@shared/schema";
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

  const httpServer = createServer(app);
  return httpServer;
}
