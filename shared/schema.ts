import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json, real, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  model: varchar("model").default("gemini-1.5-flash").notNull(),
  systemPrompt: text("system_prompt"),
  temperature: real("temperature").default(0.7),
  folder: varchar("folder"),
  isFavorite: boolean("is_favorite").default(false),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: varchar("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(),
  originalContent: text("original_content"),
  isEdited: boolean("is_edited").default(false),
  reactions: json("reactions").$type<{ like?: boolean; dislike?: boolean }>(),
  tokens: integer("tokens"),
  responseTime: integer("response_time"),
  isBookmarked: boolean("is_bookmarked").default(false),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// User settings and preferences
export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  theme: varchar("theme").default("dark-gray"),
  fontSize: varchar("font_size").default("medium"),
  typingSpeed: varchar("typing_speed").default("normal"),
  autoSave: boolean("auto_save").default(true),
  showTimestamps: boolean("show_timestamps").default(true),
  soundEnabled: boolean("sound_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Usage analytics
export const usageStats = pgTable("usage_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").defaultNow().notNull(),
  conversationsCreated: integer("conversations_created").default(0),
  messagesExchanged: integer("messages_exchanged").default(0),
  tokensUsed: integer("tokens_used").default(0),
  averageResponseTime: real("average_response_time").default(0),
  modelsUsed: json("models_used").$type<Record<string, number>>(),
});

// File uploads and attachments
export const attachments = pgTable("attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").references(() => messages.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileType: varchar("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  fileUrl: text("file_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
