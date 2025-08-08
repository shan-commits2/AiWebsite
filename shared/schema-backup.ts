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
  systemPrompt: true,
  temperature: true,
  folder: true,
  tags: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  conversationId: true,
  role: true,
  content: true,
  originalContent: true,
  isEdited: true,
  reactions: true,
  tokens: true,
  responseTime: true,
  isBookmarked: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).pick({
  theme: true,
  fontSize: true,
  typingSpeed: true,
  autoSave: true,
  showTimestamps: true,
  soundEnabled: true,
});

export const insertUsageStatsSchema = createInsertSchema(usageStats).pick({
  conversationsCreated: true,
  messagesExchanged: true,
  tokensUsed: true,
  averageResponseTime: true,
  modelsUsed: true,
});

export const insertAttachmentSchema = createInsertSchema(attachments).pick({
  messageId: true,
  fileName: true,
  fileType: true,
  fileSize: true,
  fileUrl: true,
});

// Available Gemini models (free tier)
// Available themes
export const THEMES = {
  "dark-gray": { name: "Dark Gray", primary: "#374151", secondary: "#4B5563" },
  "blue": { name: "Ocean Blue", primary: "#1E40AF", secondary: "#3B82F6" },
  "purple": { name: "Royal Purple", primary: "#7C3AED", secondary: "#A855F7" },
  "green": { name: "Forest Green", primary: "#059669", secondary: "#10B981" },
  "rose": { name: "Rose Pink", primary: "#E11D48", secondary: "#F43F5E" }
} as const;

export const GEMINI_MODELS = {
  "gemini-1.5-flash": {
    name: "Gemini 1.5 Flash",
    description: "Fast responses, great for general tasks",
    speed: "Fast",
    capabilities: ["Text", "Code", "Math", "Multimodal"],
    tokensPerMinute: 15000,
    maxTokens: 1000000
  },
  "gemini-2.0-flash-exp": {
    name: "Gemini 2.0 Flash (Experimental)",
    description: "Preview version of the upgraded Flash model",
    speed: "Slow/Medium",
    capabilities: ["Text", "Code", "Math", "Reasoning", "Multimodal"],
    tokensPerMinute: 10000,
    maxTokens: 1000000
  },
  "gemini-2.0-flash": {
    name: "Gemini 2.0 Flash",
    description: "Fast, multimodal, with enhanced reasoning and tool use",
    speed: "Fast",
    capabilities: ["Text", "Code", "Math", "Reasoning", "Multimodal", "Vision", "Tool Use"],
    tokensPerMinute: 12000,
    maxTokens: 1000000
  },
  "gemini-2.0-flash-lite": {
    name: "Gemini 2.0 Flash Lite",
    description: "Cost-optimized version ideal for high-throughput apps",
    speed: "Faster",
    capabilities: ["Text", "Multimodal"],
    tokensPerMinute: 15000,
    maxTokens: 1000000
  },
  "gemini-2.5-flash": {
    name: "Gemini 2.5 Flash",
    description: "Latest Flash model with enhanced reasoning and audio support",
    speed: "Fast",
    capabilities: ["Text", "Code", "Math", "Reasoning", "Thinking", "Vision", "Multimodal", "Audio Input"],
    tokensPerMinute: 14000,
    maxTokens: 1000000
  }
} as const;

export type GeminiModel = keyof typeof GEMINI_MODELS;
export type Theme = keyof typeof THEMES;

// Type exports for all tables
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type UsageStats = typeof usageStats.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;

export type InsertConversation = typeof insertConversationSchema._type;
export type InsertMessage = typeof insertMessageSchema._type;
export type InsertUserSettings = typeof insertUserSettingsSchema._type;
export type InsertUsageStats = typeof insertUsageStatsSchema._type;
export type InsertAttachment = typeof insertAttachmentSchema._type;

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
