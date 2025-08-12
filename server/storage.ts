import {
  users,
  chatbots,
  conversations,
  messages,
  dataSources,
  integrations,
  analytics,
  deployments,
  userCredentials,
  embeddings,
  toolConnections,
  toolNodes,
  type User,
  type UpsertUser,
  type Chatbot,
  type InsertChatbot,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type DataSource,
  type InsertDataSource,
  type Integration,
  type InsertIntegration,
  type Analytics,
  type InsertAnalytics,
  type Deployment,
  type InsertDeployment,
  type UserCredential,
  type InsertUserCredential,
  type Embedding,
  type InsertEmbedding,
  type ToolConnection,
  type InsertToolConnection,
  type ToolNode,
  type InsertToolNode,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, count, sum, avg } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  
  // Chatbot operations
  getChatbots(userId: string): Promise<Chatbot[]>;
  getChatbot(id: string): Promise<Chatbot | undefined>;
  createChatbot(chatbot: InsertChatbot): Promise<Chatbot>;
  updateChatbot(id: string, updates: Partial<InsertChatbot>): Promise<Chatbot>;
  deleteChatbot(id: string): Promise<void>;
  
  // Conversation operations
  getConversations(chatbotId: string, limit?: number): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  
  // Message operations
  getMessages(conversationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Data source operations
  getDataSources(chatbotId: string): Promise<DataSource[]>;
  createDataSource(dataSource: InsertDataSource): Promise<DataSource>;
  
  // Integration operations
  getIntegrations(chatbotId: string): Promise<Integration[]>;
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  updateIntegration(id: string, updates: Partial<InsertIntegration>): Promise<Integration>;
  deleteIntegration(id: string): Promise<void>;
  
  // Analytics operations
  getAnalytics(chatbotId: string, startDate?: Date, endDate?: Date): Promise<Analytics[]>;
  createAnalytics(analytics: InsertAnalytics): Promise<Analytics>;
  
  // Deployment operations
  getDeployments(chatbotId: string): Promise<Deployment[]>;
  createDeployment(deployment: InsertDeployment): Promise<Deployment>;
  updateDeployment(id: string, updates: Partial<InsertDeployment>): Promise<Deployment>;
  
  // User credentials operations
  getUserCredentials(userId: string): Promise<UserCredential[]>;
  createUserCredential(credential: InsertUserCredential): Promise<UserCredential>;
  updateUserCredential(id: string, updates: Partial<InsertUserCredential>): Promise<UserCredential>;
  deleteUserCredential(id: string): Promise<void>;
  getUserCredentialByType(userId: string, type: string): Promise<UserCredential | undefined>;
  
  // Dashboard stats
  getDashboardStats(userId: string): Promise<{
    activeChatbots: number;
    totalConversations: number;
    avgResponseTime: number;
    apiUsage: number;
  }>;
  
  // Tool connection operations
  getToolConnections(chatbotId: string): Promise<ToolConnection[]>;
  getToolConnection(id: string): Promise<ToolConnection | undefined>;
  createToolConnection(connection: InsertToolConnection): Promise<ToolConnection>;
  updateToolConnection(id: string, updates: Partial<InsertToolConnection>): Promise<ToolConnection>;
  deleteToolConnection(id: string): Promise<void>;
  
  // Tool node operations
  getToolNodes(toolConnectionId: string): Promise<ToolNode[]>;
  getToolNode(id: string): Promise<ToolNode | undefined>;
  createToolNode(node: InsertToolNode): Promise<ToolNode>;
  updateToolNode(id: string, updates: Partial<InsertToolNode>): Promise<ToolNode>;
  deleteToolNode(id: string): Promise<void>;

  // Admin operations
  getAllUsers(): Promise<User[]>;
  getAllChatbots(): Promise<Chatbot[]>;
  getPlatformStats(): Promise<{
    totalUsers: number;
    totalChatbots: number;
    totalConversations: number;
    monthlyRevenue: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  // Chatbot operations
  async getChatbots(userId: string): Promise<Chatbot[]> {
    return await db.select().from(chatbots).where(eq(chatbots.userId, userId)).orderBy(desc(chatbots.updatedAt));
  }

  async getChatbot(id: string): Promise<Chatbot | undefined> {
    const [chatbot] = await db.select().from(chatbots).where(eq(chatbots.id, id));
    return chatbot;
  }

  async createChatbot(chatbot: InsertChatbot): Promise<Chatbot> {
    const [newBot] = await db.insert(chatbots).values(chatbot).returning();
    return newBot;
  }

  async updateChatbot(id: string, updates: Partial<InsertChatbot>): Promise<Chatbot> {
    const [updated] = await db
      .update(chatbots)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(chatbots.id, id))
      .returning();
    return updated;
  }

  async deleteChatbot(id: string): Promise<void> {
    await db.delete(chatbots).where(eq(chatbots.id, id));
  }

  // Conversation operations
  async getConversations(chatbotId: string, limit: number = 50): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.chatbotId, chatbotId))
      .orderBy(desc(conversations.startedAt))
      .limit(limit);
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [newConversation] = await db.insert(conversations).values(conversation).returning();
    return newConversation;
  }

  // Message operations
  async getMessages(conversationId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.timestamp);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  // Data source operations
  async getDataSources(chatbotId: string): Promise<DataSource[]> {
    return await db
      .select()
      .from(dataSources)
      .where(eq(dataSources.chatbotId, chatbotId))
      .orderBy(desc(dataSources.createdAt));
  }

  async createDataSource(dataSource: InsertDataSource): Promise<DataSource> {
    const [newSource] = await db.insert(dataSources).values(dataSource).returning();
    return newSource;
  }

  async updateDataSource(id: string, updates: Partial<InsertDataSource>): Promise<DataSource> {
    const [updated] = await db
      .update(dataSources)
      .set(updates)
      .where(eq(dataSources.id, id))
      .returning();
    return updated;
  }

  // Embedding operations
  async getEmbeddings(chatbotId: string): Promise<Embedding[]> {
    return await db
      .select()
      .from(embeddings)
      .where(eq(embeddings.chatbotId, chatbotId))
      .orderBy(desc(embeddings.createdAt));
  }

  async createEmbedding(embedding: InsertEmbedding): Promise<Embedding> {
    const [newEmbedding] = await db.insert(embeddings).values(embedding).returning();
    return newEmbedding;
  }

  async createMultipleEmbeddings(embeddingData: InsertEmbedding[]): Promise<Embedding[]> {
    return await db.insert(embeddings).values(embeddingData).returning();
  }

  async deleteEmbeddingsByDataSource(dataSourceId: string): Promise<void> {
    await db.delete(embeddings).where(eq(embeddings.dataSourceId, dataSourceId));
  }

  // Integration operations
  async getIntegrations(chatbotId: string): Promise<Integration[]> {
    return await db
      .select()
      .from(integrations)
      .where(eq(integrations.chatbotId, chatbotId))
      .orderBy(desc(integrations.createdAt));
  }

  async createIntegration(integration: InsertIntegration): Promise<Integration> {
    const [newIntegration] = await db.insert(integrations).values(integration).returning();
    return newIntegration;
  }

  async updateIntegration(id: string, updates: Partial<InsertIntegration>): Promise<Integration> {
    const [updated] = await db
      .update(integrations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(integrations.id, id))
      .returning();
    return updated;
  }

  async deleteIntegration(id: string): Promise<void> {
    await db.delete(integrations).where(eq(integrations.id, id));
  }

  // Analytics operations
  async getAnalytics(chatbotId: string, startDate?: Date, endDate?: Date): Promise<Analytics[]> {
    if (startDate && endDate) {
      return await db
        .select()
        .from(analytics)
        .where(
          and(
            eq(analytics.chatbotId, chatbotId),
            gte(analytics.date, startDate),
            lte(analytics.date, endDate)
          )
        )
        .orderBy(desc(analytics.date));
    }
    
    return await db
      .select()
      .from(analytics)
      .where(eq(analytics.chatbotId, chatbotId))
      .orderBy(desc(analytics.date));
  }

  async createAnalytics(analyticsData: InsertAnalytics): Promise<Analytics> {
    const [newAnalytics] = await db.insert(analytics).values(analyticsData).returning();
    return newAnalytics;
  }

  // Deployment operations
  async getDeployments(chatbotId: string): Promise<Deployment[]> {
    return await db
      .select()
      .from(deployments)
      .where(eq(deployments.chatbotId, chatbotId))
      .orderBy(desc(deployments.createdAt));
  }

  async createDeployment(deployment: InsertDeployment): Promise<Deployment> {
    const [newDeployment] = await db.insert(deployments).values(deployment).returning();
    return newDeployment;
  }

  async updateDeployment(id: string, updates: Partial<InsertDeployment>): Promise<Deployment> {
    const [updated] = await db
      .update(deployments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(deployments.id, id))
      .returning();
    return updated;
  }

  // Dashboard stats
  async getDashboardStats(userId: string): Promise<{
    activeChatbots: number;
    totalConversations: number;
    avgResponseTime: number;
    apiUsage: number;
  }> {
    // Get active chatbots count
    const [activeBots] = await db
      .select({ count: count() })
      .from(chatbots)
      .where(and(eq(chatbots.userId, userId), eq(chatbots.status, 'active')));

    // Get total conversations for user's chatbots
    const userChatbots = await db.select({ id: chatbots.id }).from(chatbots).where(eq(chatbots.userId, userId));
    const chatbotIds = userChatbots.map(c => c.id);
    
    let totalConversations = 0;
    let avgResponseTime = 0;
    let apiUsage = 0;

    if (chatbotIds.length > 0) {
      const [convCount] = await db
        .select({ count: count() })
        .from(conversations)
        .where(eq(conversations.chatbotId, chatbotIds[0])); // Simplified for demo
      totalConversations = convCount.count;

      // Calculate average response time and API usage from analytics
      const recentAnalytics = await db
        .select({
          avgTime: avg(analytics.avgResponseTime),
          totalCalls: sum(analytics.apiCalls)
        })
        .from(analytics)
        .where(eq(analytics.chatbotId, chatbotIds[0]))
        .limit(30);

      if (recentAnalytics[0]) {
        avgResponseTime = Number(recentAnalytics[0].avgTime) || 0;
        apiUsage = Number(recentAnalytics[0].totalCalls) || 0;
      }
    }

    return {
      activeChatbots: activeBots.count,
      totalConversations,
      avgResponseTime,
      apiUsage,
    };
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAllChatbots(): Promise<Chatbot[]> {
    return await db.select().from(chatbots).orderBy(desc(chatbots.createdAt));
  }

  async getPlatformStats(): Promise<{
    totalUsers: number;
    totalChatbots: number;
    totalConversations: number;
    monthlyRevenue: number;
  }> {
    const [userCount] = await db.select({ count: count() }).from(users);
    const [chatbotCount] = await db.select({ count: count() }).from(chatbots);
    const [conversationCount] = await db.select({ count: count() }).from(conversations);

    return {
      totalUsers: userCount.count,
      totalChatbots: chatbotCount.count,
      totalConversations: conversationCount.count,
      monthlyRevenue: 42385, // This would come from Stripe in real implementation
    };
  }

  // User credentials operations
  async getUserCredentials(userId: string, type?: any): Promise<UserCredential[]> {
    if (type) {
      return await db
        .select()
        .from(userCredentials)
        .where(and(
          eq(userCredentials.userId, userId),
          eq(userCredentials.type, type)
        ))
        .orderBy(desc(userCredentials.createdAt));
    }
    
    return await db
      .select()
      .from(userCredentials)
      .where(eq(userCredentials.userId, userId))
      .orderBy(desc(userCredentials.createdAt));
  }

  async createUserCredential(credential: InsertUserCredential): Promise<UserCredential> {
    const [newCredential] = await db
      .insert(userCredentials)
      .values(credential)
      .returning();
    return newCredential;
  }

  async updateUserCredential(id: string, updates: Partial<InsertUserCredential>): Promise<UserCredential> {
    const [updatedCredential] = await db
      .update(userCredentials)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userCredentials.id, id))
      .returning();
    return updatedCredential;
  }

  async deleteUserCredential(id: string): Promise<void> {
    await db.delete(userCredentials).where(eq(userCredentials.id, id));
  }

  async getUserCredentialByType(userId: string, type: string): Promise<UserCredential | undefined> {
    const [credential] = await db
      .select()
      .from(userCredentials)
      .where(and(
        eq(userCredentials.userId, userId),
        eq(userCredentials.type, type as any),
        eq(userCredentials.isActive, true)
      ))
      .limit(1);
    return credential;
  }

  // Tool connection operations
  async getToolConnections(chatbotId: string): Promise<ToolConnection[]> {
    return await db
      .select()
      .from(toolConnections)
      .where(eq(toolConnections.chatbotId, chatbotId))
      .orderBy(desc(toolConnections.createdAt));
  }

  async getToolConnection(id: string): Promise<ToolConnection | undefined> {
    const [connection] = await db
      .select()
      .from(toolConnections)
      .where(eq(toolConnections.id, id));
    return connection;
  }

  async createToolConnection(connection: InsertToolConnection): Promise<ToolConnection> {
    const [newConnection] = await db
      .insert(toolConnections)
      .values(connection)
      .returning();
    return newConnection;
  }

  async updateToolConnection(id: string, updates: Partial<InsertToolConnection>): Promise<ToolConnection> {
    const [updatedConnection] = await db
      .update(toolConnections)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(toolConnections.id, id))
      .returning();
    return updatedConnection;
  }

  async deleteToolConnection(id: string): Promise<void> {
    await db.delete(toolConnections).where(eq(toolConnections.id, id));
  }

  // Tool node operations
  async getToolNodes(toolConnectionId: string): Promise<ToolNode[]> {
    return await db
      .select()
      .from(toolNodes)
      .where(eq(toolNodes.toolConnectionId, toolConnectionId))
      .orderBy(desc(toolNodes.createdAt));
  }

  async getToolNode(id: string): Promise<ToolNode | undefined> {
    const [node] = await db
      .select()
      .from(toolNodes)
      .where(eq(toolNodes.id, id));
    return node;
  }

  async createToolNode(node: InsertToolNode): Promise<ToolNode> {
    const [newNode] = await db
      .insert(toolNodes)
      .values(node)
      .returning();
    return newNode;
  }

  async updateToolNode(id: string, updates: Partial<InsertToolNode>): Promise<ToolNode> {
    const [updatedNode] = await db
      .update(toolNodes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(toolNodes.id, id))
      .returning();
    return updatedNode;
  }

  async deleteToolNode(id: string): Promise<void> {
    await db.delete(toolNodes).where(eq(toolNodes.id, id));
  }
}

export const storage = new DatabaseStorage();
