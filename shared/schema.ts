import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  model: varchar("model").default("gemini-1.5-flash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(),
  role: varchar("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  title: true,
  model: true,
});

// Available Gemini models (free tier)
export const GEMINI_MODELS = {
  "gemini-1.5-flash": {
    name: "Gemini 1.5 Flash",
    description: "Fast responses, great for general tasks",
    speed: "Fast",
    capabilities: ["Text", "Code", "Math"]
  },
  "gemini-2.0-flash-exp": {
    name: "Gemini 2.0 Flash",
    description: "Latest model with enhanced capabilities",
    speed: "Fast", 
    capabilities: ["Text", "Code", "Math", "Reasoning"]
  },
  "gemini-2.5-flash": {
    name: "Gemini 2.5 Flash",
    description: "Advanced model with thinking capabilities",
    speed: "Fast",
    capabilities: ["Text", "Code", "Math", "Reasoning", "Thinking"]
  }
} as const;

export type GeminiModel = keyof typeof GEMINI_MODELS;

export const insertMessageSchema = createInsertSchema(messages).pick({
  conversationId: true,
  role: true,
  content: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Remove old user schema
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
