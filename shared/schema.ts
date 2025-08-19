import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from 'drizzle-orm';

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enums
export const planTypeEnum = pgEnum('plan_type', ['starter', 'pro', 'enterprise']);
export const chatbotStatusEnum = pgEnum('chatbot_status', ['active', 'inactive', 'draft']);
export const llmProviderEnum = pgEnum('llm_provider', ['google', 'openai', 'anthropic', 'xai', 'meta', 'mistral', 'alibaba', 'deepseek', 'huggingface', 'together']);
export const voiceProviderEnum = pgEnum('voice_provider', ['google', 'openai', 'deepgram', 'elevenlabs']);
export const deploymentChannelEnum = pgEnum('deployment_channel', ['website', 'shopify', 'whatsapp', 'facebook', 'instagram', 'telegram']);
export const integrationTypeEnum = pgEnum('integration_type', ['google_suite', 'notion', 'hubspot', 'salesforce', 'zoho', 'shopify', 'zapier', 'make', 'n8n']);
export const toolTypeEnum = pgEnum('tool_type', ['gmail', 'google_sheets', 'google_docs', 'google_drive', 'google_calendar', 'google_meet', 'google_forms', 'google_slides', 'zapier', 'n8n', 'make', 'shopify', 'zoho', 'hubspot', 'salesforce', 'notion', 'webhook']);
export const connectionStatusEnum = pgEnum('connection_status', ['connected', 'disconnected', 'error', 'testing']);
export const credentialTypeEnum = pgEnum('credential_type', ['llm_api_key', 'voice_api_key', 'integration_credentials', 'deployment_credentials', 'stripe_config']);

// User storage table with email/password authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  password: varchar("password"), // For email/password auth
  name: varchar("name"), // Full name for signup - nullable to handle existing data
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  googleId: varchar("google_id"), // For Google OAuth
  isEmailVerified: boolean("is_email_verified").default(false),
  emailVerificationToken: varchar("email_verification_token"),
  passwordResetToken: varchar("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  planType: planTypeEnum("plan_type").default('starter'),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  isWhiteLabel: boolean("is_white_label").default(false),
  whitelabelConfig: jsonb("whitelabel_config"),
  apiKeyConfigs: jsonb("api_key_configs"), // Store encrypted API keys for different providers
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userCredentials = pgTable("user_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: credentialTypeEnum("type").notNull(),
  name: varchar("name").notNull(), // User-friendly name for this credential
  encryptedValue: text("encrypted_value").notNull(), // In production, this should be encrypted
  metadata: jsonb("metadata"), // Additional config data
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chatbots = pgTable("chatbots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar("name").notNull(),
  description: text("description"),
  avatar: varchar("avatar"),
  colorScheme: jsonb("color_scheme"),
  systemPrompt: text("system_prompt"),
  status: chatbotStatusEnum("status").default('draft'),
  llmProvider: llmProviderEnum("llm_provider").default('google'),
  llmModel: varchar("llm_model").default('gemini-2.5-pro'),
  voiceProvider: voiceProviderEnum("voice_provider").default('google'),
  voiceApiKey: text("voice_api_key"),
  voiceEnabled: boolean("voice_enabled").default(false),
  imageEnabled: boolean("image_enabled").default(false),
  ragEnabled: boolean("rag_enabled").default(true),
  deploymentChannels: jsonb("deployment_channels"), // Array of enabled channels
  webhookConfig: jsonb("webhook_config"),
  // Chat widget customization fields
  headerColor: varchar("header_color").default('#3B82F6'),
  title: varchar("title").default('Chat with us'),
  subtitle: varchar("subtitle").default("We're here to help!"),
  theme: varchar("theme").default('light'), // 'light' or 'dark'
  bubbleColor: varchar("bubble_color").default('#3B82F6'),
  logo: varchar("logo"),
  defaultMessages: jsonb("default_messages").default(['Hello! How can I help you today?']),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dataSources = pgTable("data_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatbotId: varchar("chatbot_id").notNull().references(() => chatbots.id, { onDelete: 'cascade' }),
  type: varchar("type").notNull(), // file, url, text
  content: text("content"),
  filePath: varchar("file_path"),
  fileName: varchar("file_name"),
  fileSize: integer("file_size"),
  processed: boolean("processed").default(false),
  vectorized: boolean("vectorized").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Vector embeddings table for RAG functionality
export const embeddings = pgTable("embeddings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dataSourceId: varchar("data_source_id").notNull().references(() => dataSources.id, { onDelete: 'cascade' }),
  chatbotId: varchar("chatbot_id").notNull().references(() => chatbots.id, { onDelete: 'cascade' }),
  content: text("content").notNull(), // The text chunk
  embedding: text("embedding").notNull(), // Store as JSON string for OpenAI embeddings
  metadata: jsonb("metadata"), // Additional metadata like page numbers, section titles, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatbotId: varchar("chatbot_id").notNull().references(() => chatbots.id, { onDelete: 'cascade' }),
  userId: varchar("user_id"), // external user, not platform user
  channel: deploymentChannelEnum("channel"),
  sessionId: varchar("session_id"),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  messageCount: integer("message_count").default(0),
  duration: integer("duration"), // in seconds
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  role: varchar("role").notNull(), // user, assistant
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // Store additional data like voice file paths, images, etc.
  timestamp: timestamp("timestamp").defaultNow(),
});

export const integrations = pgTable("integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatbotId: varchar("chatbot_id").notNull().references(() => chatbots.id, { onDelete: 'cascade' }),
  type: integrationTypeEnum("type").notNull(),
  config: jsonb("config").notNull(), // Store integration-specific config
  credentials: text("credentials"), // Encrypted credentials
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const analytics = pgTable("analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatbotId: varchar("chatbot_id").notNull().references(() => chatbots.id, { onDelete: 'cascade' }),
  date: timestamp("date").notNull(),
  conversationsCount: integer("conversations_count").default(0),
  messagesCount: integer("messages_count").default(0),
  avgResponseTime: decimal("avg_response_time", { precision: 10, scale: 2 }),
  apiCalls: integer("api_calls").default(0),
  errorCount: integer("error_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const deployments = pgTable("deployments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatbotId: varchar("chatbot_id").notNull().references(() => chatbots.id, { onDelete: 'cascade' }),
  channel: deploymentChannelEnum("channel").notNull(),
  config: jsonb("config").notNull(), // Channel-specific config
  embedCode: text("embed_code"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tool Connections Table - stores tool credentials and connection status
export const toolConnections = pgTable("tool_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  chatbotId: varchar("chatbot_id").notNull().references(() => chatbots.id, { onDelete: 'cascade' }),
  toolType: toolTypeEnum("tool_type").notNull(),
  toolName: varchar("tool_name").notNull(), // User-friendly display name
  credentials: jsonb("credentials").notNull(), // Encrypted credentials
  connectionStatus: connectionStatusEnum("connection_status").default('disconnected'),
  lastTested: timestamp("last_tested"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"), // Tool-specific metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tool Nodes Table - stores individual node configurations for each tool
export const toolNodes = pgTable("tool_nodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  toolConnectionId: varchar("tool_connection_id").notNull().references(() => toolConnections.id, { onDelete: 'cascade' }),
  nodeName: varchar("node_name").notNull(), // User-defined node name
  operation: varchar("operation").notNull(), // e.g., 'send_email', 'read_sheet', 'append_row'
  config: jsonb("config").notNull(), // Operation-specific configuration
  isActive: boolean("is_active").default(true),
  testResults: jsonb("test_results"), // Last test execution results
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  chatbots: many(chatbots),
  credentials: many(userCredentials),
  toolConnections: many(toolConnections),
}));

export const userCredentialsRelations = relations(userCredentials, ({ one }) => ({
  user: one(users, {
    fields: [userCredentials.userId],
    references: [users.id],
  }),
}));

export const chatbotsRelations = relations(chatbots, ({ one, many }) => ({
  user: one(users, {
    fields: [chatbots.userId],
    references: [users.id],
  }),
  dataSources: many(dataSources),
  conversations: many(conversations),
  integrations: many(integrations),
  analytics: many(analytics),
  deployments: many(deployments),
  embeddings: many(embeddings),
  toolConnections: many(toolConnections),
}));

export const dataSourcesRelations = relations(dataSources, ({ one, many }) => ({
  chatbot: one(chatbots, {
    fields: [dataSources.chatbotId],
    references: [chatbots.id],
  }),
  embeddings: many(embeddings),
}));

export const embeddingsRelations = relations(embeddings, ({ one }) => ({
  chatbot: one(chatbots, {
    fields: [embeddings.chatbotId],
    references: [chatbots.id],
  }),
  dataSource: one(dataSources, {
    fields: [embeddings.dataSourceId],
    references: [dataSources.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  chatbot: one(chatbots, {
    fields: [conversations.chatbotId],
    references: [chatbots.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const integrationsRelations = relations(integrations, ({ one }) => ({
  chatbot: one(chatbots, {
    fields: [integrations.chatbotId],
    references: [chatbots.id],
  }),
}));

export const analyticsRelations = relations(analytics, ({ one }) => ({
  chatbot: one(chatbots, {
    fields: [analytics.chatbotId],
    references: [chatbots.id],
  }),
}));

export const deploymentsRelations = relations(deployments, ({ one }) => ({
  chatbot: one(chatbots, {
    fields: [deployments.chatbotId],
    references: [chatbots.id],
  }),
}));

export const toolConnectionsRelations = relations(toolConnections, ({ one, many }) => ({
  user: one(users, {
    fields: [toolConnections.userId],
    references: [users.id],
  }),
  chatbot: one(chatbots, {
    fields: [toolConnections.chatbotId],
    references: [chatbots.id],
  }),
  nodes: many(toolNodes),
}));

export const toolNodesRelations = relations(toolNodes, ({ one }) => ({
  toolConnection: one(toolConnections, {
    fields: [toolNodes.toolConnectionId],
    references: [toolConnections.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatbotSchema = createInsertSchema(chatbots).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDataSourceSchema = createInsertSchema(dataSources).omit({
  id: true,
  createdAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

export const insertIntegrationSchema = createInsertSchema(integrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
  createdAt: true,
});

export const insertDeploymentSchema = createInsertSchema(deployments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserCredentialSchema = createInsertSchema(userCredentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmbeddingSchema = createInsertSchema(embeddings).omit({
  id: true,
  createdAt: true,
});

export const insertToolConnectionSchema = createInsertSchema(toolConnections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertToolNodeSchema = createInsertSchema(toolNodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertChatbot = z.infer<typeof insertChatbotSchema>;
export type Chatbot = typeof chatbots.$inferSelect;
export type InsertDataSource = z.infer<typeof insertDataSourceSchema>;
export type DataSource = typeof dataSources.$inferSelect;
export type InsertToolConnection = z.infer<typeof insertToolConnectionSchema>;
export type ToolConnection = typeof toolConnections.$inferSelect;
export type InsertToolNode = z.infer<typeof insertToolNodeSchema>;
export type ToolNode = typeof toolNodes.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type Integration = typeof integrations.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type Analytics = typeof analytics.$inferSelect;
export type InsertDeployment = z.infer<typeof insertDeploymentSchema>;
export type Deployment = typeof deployments.$inferSelect;
export type InsertUserCredential = z.infer<typeof insertUserCredentialSchema>;
export type UserCredential = typeof userCredentials.$inferSelect;
export type InsertEmbedding = z.infer<typeof insertEmbeddingSchema>;
export type Embedding = typeof embeddings.$inferSelect;


