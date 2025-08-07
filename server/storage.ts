import { 
  type Conversation, 
  type InsertConversation, 
  type Message, 
  type InsertMessage, 
  type User, 
  type InsertUser,
  type UserSettings,
  type InsertUserSettings,
  type UsageStats,
  type InsertUsageStats
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Conversation methods
  getConversations(): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined>;
  deleteConversation(id: string): Promise<boolean>;
  
  // Message methods
  getMessages(conversationId: string): Promise<Message[]>;
  getMessage(id: string): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: string, updates: Partial<Message>): Promise<Message | undefined>;
  deleteMessage(id: string): Promise<boolean>;

  // User settings
  getUserSettings(): Promise<UserSettings | undefined>;
  updateUserSettings(updates: Partial<UserSettings>): Promise<UserSettings>;

  // Analytics  
  getUsageStats(): Promise<UsageStats[]>;
  recordUsage(data: InsertUsageStats): Promise<UsageStats>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private conversations: Map<string, Conversation>;
  private messages: Map<string, Message>;
  private userSettings: UserSettings;
  private usageStats: Map<string, UsageStats>;

  constructor() {
    this.users = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    this.usageStats = new Map();
    
    // Default user settings
    this.userSettings = {
      id: randomUUID(),
      theme: "dark-gray",
      fontSize: "medium",
      typingSpeed: "normal",
      autoSave: true,
      showTimestamps: true,
      soundEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = randomUUID();
    const now = new Date();
    const conversation: Conversation = {
      ...insertConversation,
      id,
      model: insertConversation.model || "gemini-1.5-flash",
      createdAt: now,
      updatedAt: now,
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const conversation = this.conversations.get(id);
    if (!conversation) return undefined;
    
    const updatedConversation = {
      ...conversation,
      ...updates,
      updatedAt: new Date(),
    };
    this.conversations.set(id, updatedConversation);
    return updatedConversation;
  }

  async deleteConversation(id: string): Promise<boolean> {
    // Also delete all messages in this conversation
    const messages = Array.from(this.messages.values())
      .filter(message => message.conversationId === id);
    messages.forEach(message => this.messages.delete(message.id));
    
    return this.conversations.delete(id);
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.conversationId === conversationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async getMessage(id: string): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      timestamp: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async updateMessage(id: string, updates: Partial<Message>): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    
    const updatedMessage = { ...message, ...updates, updatedAt: new Date() };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }

  async deleteMessage(id: string): Promise<boolean> {
    return this.messages.delete(id);
  }

  async getUserSettings(): Promise<UserSettings | undefined> {
    return this.userSettings;
  }

  async updateUserSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
    this.userSettings = { 
      ...this.userSettings, 
      ...updates, 
      updatedAt: new Date() 
    };
    return this.userSettings;
  }

  async getUsageStats(): Promise<UsageStats[]> {
    return Array.from(this.usageStats.values());
  }

  async recordUsage(data: InsertUsageStats): Promise<UsageStats> {
    const stats: UsageStats = {
      id: randomUUID(),
      date: new Date(),
      conversationsCreated: data.conversationsCreated || 0,
      messagesExchanged: data.messagesExchanged || 0,
      tokensUsed: data.tokensUsed || 0,
      averageResponseTime: data.averageResponseTime || 0,
      modelsUsed: data.modelsUsed || {}
    };
    
    this.usageStats.set(stats.id, stats);
    return stats;
  }
}

export const storage = new MemStorage();
