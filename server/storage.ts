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

interface UserStorageData {
  users: Map<string, User>;
  conversations: Map<string, Conversation>;
  messages: Map<string, Message>;
  userSettings: UserSettings;
  usageStats: Map<string, UsageStats>;
}

export interface IStorage {
  getUser(sessionId: string, id: string): Promise<User | undefined>;
  getUserByUsername(sessionId: string, username: string): Promise<User | undefined>;
  createUser(sessionId: string, user: InsertUser): Promise<User>;

  getConversations(sessionId: string): Promise<Conversation[]>;
  getConversation(sessionId: string, id: string): Promise<Conversation | undefined>;
  createConversation(sessionId: string, conversation: InsertConversation): Promise<Conversation>;
  updateConversation(sessionId: string, id: string, updates: Partial<Conversation>): Promise<Conversation | undefined>;
  deleteConversation(sessionId: string, id: string): Promise<boolean>;

  getMessages(sessionId: string, conversationId: string): Promise<Message[]>;
  getMessage(sessionId: string, id: string): Promise<Message | undefined>;
  createMessage(sessionId: string, message: InsertMessage): Promise<Message>;
  updateMessage(sessionId: string, id: string, updates: Partial<Message>): Promise<Message | undefined>;
  deleteMessage(sessionId: string, id: string): Promise<boolean>;

  getUserSettings(sessionId: string): Promise<UserSettings | undefined>;
  updateUserSettings(sessionId: string, updates: Partial<UserSettings>): Promise<UserSettings>;

  getUsageStats(sessionId: string): Promise<UsageStats[]>;
  recordUsage(sessionId: string, data: InsertUsageStats): Promise<UsageStats>;
}

export class MemStorage implements IStorage {
  private storageMap: Map<string, UserStorageData>;

  constructor() {
    this.storageMap = new Map();
  }

  private getOrCreateStorage(sessionId: string): UserStorageData {
    let data = this.storageMap.get(sessionId);
    if (!data) {
      data = {
        users: new Map(),
        conversations: new Map(),
        messages: new Map(),
        usageStats: new Map(),
        userSettings: {
          id: randomUUID(),
          theme: "dark-gray",
          fontSize: "medium",
          typingSpeed: "normal",
          autoSave: true,
          showTimestamps: true,
          soundEnabled: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };
      this.storageMap.set(sessionId, data);
    }
    return data;
  }

  async getUser(sessionId: string, id: string): Promise<User | undefined> {
    return this.getOrCreateStorage(sessionId).users.get(id);
  }

  async getUserByUsername(sessionId: string, username: string): Promise<User | undefined> {
    const users = this.getOrCreateStorage(sessionId).users;
    return Array.from(users.values()).find(u => u.username === username);
  }

  async createUser(sessionId: string, insertUser: InsertUser): Promise<User> {
    const data = this.getOrCreateStorage(sessionId);
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    data.users.set(id, user);
    return user;
  }

  async getConversations(sessionId: string): Promise<Conversation[]> {
    const conversations = this.getOrCreateStorage(sessionId).conversations;
    return Array.from(conversations.values()).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getConversation(sessionId: string, id: string): Promise<Conversation | undefined> {
    return this.getOrCreateStorage(sessionId).conversations.get(id);
  }

  async createConversation(sessionId: string, insertConversation: InsertConversation): Promise<Conversation> {
    const data = this.getOrCreateStorage(sessionId);
    const id = randomUUID();
    const now = new Date();
    const conversation: Conversation = {
      ...insertConversation,
      id,
      model: insertConversation.model || "gemini-1.5-flash",
      createdAt: now,
      updatedAt: now
    };
    data.conversations.set(id, conversation);
    return conversation;
  }

  async updateConversation(sessionId: string, id: string, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const data = this.getOrCreateStorage(sessionId);
    const conversation = data.conversations.get(id);
    if (!conversation) return undefined;
    const updatedConversation = { ...conversation, ...updates, updatedAt: new Date() };
    data.conversations.set(id, updatedConversation);
    return updatedConversation;
  }

  async deleteConversation(sessionId: string, id: string): Promise<boolean> {
    const data = this.getOrCreateStorage(sessionId);
    // Delete all messages in conversation
    for (const [msgId, msg] of data.messages) {
      if (msg.conversationId === id) {
        data.messages.delete(msgId);
      }
    }
    return data.conversations.delete(id);
  }

  async getMessages(sessionId: string, conversationId: string): Promise<Message[]> {
    const messages = this.getOrCreateStorage(sessionId).messages;
    return Array.from(messages.values())
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async getMessage(sessionId: string, id: string): Promise<Message | undefined> {
    return this.getOrCreateStorage(sessionId).messages.get(id);
  }

  async createMessage(sessionId: string, insertMessage: InsertMessage): Promise<Message> {
    const data = this.getOrCreateStorage(sessionId);
    const id = randomUUID();
    const message: Message = { ...insertMessage, id, timestamp: new Date() };
    data.messages.set(id, message);
    return message;
  }

  async updateMessage(sessionId: string, id: string, updates: Partial<Message>): Promise<Message | undefined> {
    const data = this.getOrCreateStorage(sessionId);
    const message = data.messages.get(id);
    if (!message) return undefined;
    const updatedMessage = { ...message, ...updates, updatedAt: new Date() };
    data.messages.set(id, updatedMessage);
    return updatedMessage;
  }

  async deleteMessage(sessionId: string, id: string): Promise<boolean> {
    return this.getOrCreateStorage(sessionId).messages.delete(id);
  }

  async getUserSettings(sessionId: string): Promise<UserSettings | undefined> {
    return this.getOrCreateStorage(sessionId).userSettings;
  }

  async updateUserSettings(sessionId: string, updates: Partial<UserSettings>): Promise<UserSettings> {
    const data = this.getOrCreateStorage(sessionId);
    data.userSettings = { ...data.userSettings, ...updates, updatedAt: new Date() };
    return data.userSettings;
  }

  async getUsageStats(sessionId: string): Promise<UsageStats[]> {
    return Array.from(this.getOrCreateStorage(sessionId).usageStats.values());
  }

  async recordUsage(sessionId: string, data: InsertUsageStats): Promise<UsageStats> {
    const storageData = this.getOrCreateStorage(sessionId);
    const stats: UsageStats = {
      id: randomUUID(),
      date: new Date(),
      conversationsCreated: data.conversationsCreated || 0,
      messagesExchanged: data.messagesExchanged || 0,
      tokensUsed: data.tokensUsed || 0,
      averageResponseTime: data.averageResponseTime || 0,
      modelsUsed: data.modelsUsed || {}
    };
    storageData.usageStats.set(stats.id, stats);
    return stats;
  }
}

export const storage = new MemStorage();
