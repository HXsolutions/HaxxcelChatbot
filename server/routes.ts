import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, authService } from "./auth";
import { insertChatbotSchema, insertDataSourceSchema, insertIntegrationSchema } from "@shared/schema";
import { z } from "zod";
import { llmProviders } from "./services/llmProviders";
import { voiceProviders } from "./services/voiceProviders";
import { toolIntegrations } from "./services/toolIntegrations";
import Stripe from "stripe";

// Initialize Stripe only if API key is provided
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-06-30.basil",
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, name } = req.body;
      
      if (!email || !password || !name) {
        return res.status(400).json({ message: 'Email, password, and name are required' });
      }

      const { user, token } = await authService.register(email, password, name);
      (req.session as any).token = token;
      
      res.json({ user, token });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const { user, token } = await authService.login(email, password);
      (req.session as any).token = token;
      
      res.json({ user, token });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/auth/google', async (req, res) => {
    try {
      const { idToken } = req.body;
      
      if (!idToken) {
        return res.status(400).json({ message: 'Google ID token is required' });
      }

      const { user, token } = await authService.googleLogin(idToken);
      (req.session as any).token = token;
      
      res.json({ user, token });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      await authService.sendPasswordResetEmail(email);
      res.json({ message: 'Password reset email sent' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: 'Token and password are required' });
      }

      await authService.resetPassword(token, password);
      res.json({ message: 'Password reset successfully' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/auth/verify-email', async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: 'Verification token is required' });
      }

      await authService.verifyEmail(token);
      res.redirect('/?verified=true');
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Could not log out' });
      }
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully' });
    });
  });

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Chatbot routes
  app.get('/api/chatbots', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const chatbots = await storage.getChatbots(userId);
      res.json(chatbots);
    } catch (error) {
      console.error("Error fetching chatbots:", error);
      res.status(500).json({ message: "Failed to fetch chatbots" });
    }
  });

  app.get('/api/chatbots/:id', isAuthenticated, async (req: any, res) => {
    try {
      const chatbot = await storage.getChatbot(req.params.id);
      if (!chatbot) {
        return res.status(404).json({ message: "Chatbot not found" });
      }
      res.json(chatbot);
    } catch (error) {
      console.error("Error fetching chatbot:", error);
      res.status(500).json({ message: "Failed to fetch chatbot" });
    }
  });

  app.post('/api/chatbots', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { apiKey, integrationCredentials, deploymentCredentials, ...chatbotData } = req.body;
      
      const validation = insertChatbotSchema.parse({
        ...chatbotData,
        userId,
      });
      
      const chatbot = await storage.createChatbot(validation);

      // Store API key as user credential if provided
      if (apiKey) {
        await storage.createUserCredential({
          userId,
          type: 'llm_api_key',
          name: `${chatbot.name} - ${validation.llmProvider} API Key`,
          encryptedValue: apiKey, // In production, this should be encrypted
          metadata: { chatbotId: chatbot.id, provider: validation.llmProvider },
        });
      }

      // Store integration credentials if provided
      if (integrationCredentials) {
        for (const [integrationId, credentials] of Object.entries(integrationCredentials)) {
          if (credentials) {
            await storage.createUserCredential({
              userId,
              type: 'integration_credentials',
              name: `${chatbot.name} - ${integrationId}`,
              encryptedValue: credentials as string,
              metadata: { chatbotId: chatbot.id, integrationId },
            });
          }
        }
      }

      // Store deployment credentials if provided
      if (deploymentCredentials) {
        for (const [channelId, credentials] of Object.entries(deploymentCredentials)) {
          if (credentials) {
            await storage.createUserCredential({
              userId,
              type: 'deployment_credentials',
              name: `${chatbot.name} - ${channelId}`,
              encryptedValue: credentials as string,
              metadata: { chatbotId: chatbot.id, channelId },
            });
          }
        }
      }

      res.json(chatbot);
    } catch (error) {
      console.error("Error creating chatbot:", error);
      res.status(400).json({ message: "Failed to create chatbot" });
    }
  });

  app.put('/api/chatbots/:id', isAuthenticated, async (req: any, res) => {
    try {
      const validation = insertChatbotSchema.partial().parse(req.body);
      const chatbot = await storage.updateChatbot(req.params.id, validation);
      res.json(chatbot);
    } catch (error) {
      console.error("Error updating chatbot:", error);
      res.status(400).json({ message: "Failed to update chatbot" });
    }
  });

  app.delete('/api/chatbots/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteChatbot(req.params.id);
      res.json({ message: "Chatbot deleted successfully" });
    } catch (error) {
      console.error("Error deleting chatbot:", error);
      res.status(500).json({ message: "Failed to delete chatbot" });
    }
  });

  // Data source routes
  app.get('/api/chatbots/:id/data-sources', isAuthenticated, async (req: any, res) => {
    try {
      const dataSources = await storage.getDataSources(req.params.id);
      res.json(dataSources);
    } catch (error) {
      console.error("Error fetching data sources:", error);
      res.status(500).json({ message: "Failed to fetch data sources" });
    }
  });

  app.post('/api/chatbots/:id/data-sources', isAuthenticated, async (req: any, res) => {
    try {
      const validation = insertDataSourceSchema.parse({
        ...req.body,
        chatbotId: req.params.id,
      });
      
      const dataSource = await storage.createDataSource(validation);
      res.json(dataSource);
    } catch (error) {
      console.error("Error creating data source:", error);
      res.status(400).json({ message: "Failed to create data source" });
    }
  });

  // Data Source processing route (independent of chatbot)
  app.post('/api/data-sources/process', isAuthenticated, async (req: any, res) => {
    try {
      const { type, name, content } = req.body;
      
      // Simulate processing based on type
      let processedData;
      
      switch (type) {
        case 'url':
          // In real implementation, you would crawl the webpage
          processedData = {
            type: 'url',
            name,
            content,
            extractedText: `Processed content from ${content}`,
            status: 'processed'
          };
          break;
          
        case 'file':
          // In real implementation, you would extract text from file
          processedData = {
            type: 'file',
            name,
            extractedText: `Processed content from file: ${name}`,
            status: 'processed'
          };
          break;
          
        case 'text':
          processedData = {
            type: 'text',
            name,
            content,
            extractedText: content,
            status: 'processed'
          };
          break;
          
        case 'image':
          // In real implementation, you would use OCR to extract text
          processedData = {
            type: 'image',
            name,
            extractedText: `OCR extracted text from ${name}`,
            status: 'processed'
          };
          break;
          
        default:
          throw new Error(`Unsupported data source type: ${type}`);
      }
      
      console.log(`✅ Data source processed: ${name} (${type})`);
      res.json(processedData);
    } catch (error) {
      console.error("Error processing data source:", error);
      res.status(400).json({ message: "Failed to process data source" });
    }
  });

  // Vector processing route for data sources
  app.post('/api/data-sources/:id/vectorize', isAuthenticated, async (req: any, res) => {
    try {
      // Get data source to find chatbot and user
      const [dataSource] = await db.select().from(dataSources).where(eq(dataSources.id, req.params.id));
      if (!dataSource) {
        return res.status(404).json({ success: false, message: "Data source not found" });
      }

      // Get chatbot to find user
      const chatbot = await storage.getChatbot(dataSource.chatbotId);
      if (!chatbot) {
        return res.status(404).json({ success: false, message: "Chatbot not found" });
      }

      // Get user's API key for this chatbot
      const credentials = await storage.getUserCredentials(chatbot.userId, 'llm_api_key');
      const chatbotCredential = credentials.find(cred => 
        cred.metadata && 
        typeof cred.metadata === 'object' && 
        'chatbotId' in cred.metadata && 
        cred.metadata.chatbotId === dataSource.chatbotId
      );

      if (!chatbotCredential) {
        return res.status(400).json({ success: false, message: "No API key configured for this chatbot" });
      }

      const { VectorService } = await import('./services/vectorService');
      const vectorService = new VectorService(chatbotCredential.encryptedValue);
      await vectorService.processDataSource(req.params.id, chatbotCredential.encryptedValue);
      
      res.json({ 
        success: true, 
        message: 'Data source vectorized successfully' 
      });
    } catch (error) {
      console.error("Error vectorizing data source:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to vectorize data source" 
      });
    }
  });

  // Semantic search endpoint
  app.post('/api/chatbots/:id/search', isAuthenticated, async (req: any, res) => {
    try {
      const { query, limit = 5 } = req.body;
      const { vectorService } = await import('./services/vectorService');
      
      const results = await vectorService.semanticSearch(req.params.id, query, limit);
      
      res.json(results);
    } catch (error) {
      console.error("Error performing semantic search:", error);
      res.status(500).json({ message: "Failed to perform search" });
    }
  });

  // Get RAG context for chatbot query
  app.post('/api/chatbots/:id/context', isAuthenticated, async (req: any, res) => {
    try {
      const { query } = req.body;
      const { vectorService } = await import('./services/vectorService');
      
      const context = await vectorService.getContextForQuery(req.params.id, query);
      
      res.json({ context });
    } catch (error) {
      console.error("Error getting RAG context:", error);
      res.status(500).json({ message: "Failed to get context" });
    }
  });

  // LLM Provider routes
  app.get('/api/llm-providers', isAuthenticated, async (req: any, res) => {
    try {
      const providers = llmProviders.getAvailableProviders();
      res.json(providers);
    } catch (error) {
      console.error("Error fetching LLM providers:", error);
      res.status(500).json({ message: "Failed to fetch LLM providers" });
    }
  });



  app.post('/api/llm-providers/test', isAuthenticated, async (req: any, res) => {
    try {
      const { provider, apiKey, model } = req.body;
      const result = await llmProviders.testConnection(provider, apiKey, model);
      res.json(result);
    } catch (error) {
      console.error("Error testing LLM connection:", error);
      res.status(400).json({ message: "Failed to test LLM connection" });
    }
  });

  app.get('/api/llm-providers/:provider/models', isAuthenticated, async (req: any, res) => {
    try {
      const { provider } = req.params;
      const { apiKey } = req.query;
      const models = await llmProviders.getModels(provider, apiKey as string);
      res.json(models);
    } catch (error) {
      console.error("Error fetching models:", error);
      res.status(400).json({ message: "Failed to fetch models" });
    }
  });

  // Voice Provider routes
  app.get('/api/voice-providers', isAuthenticated, async (req: any, res) => {
    try {
      const providers = voiceProviders.getAvailableProviders();
      res.json(providers);
    } catch (error) {
      console.error("Error fetching voice providers:", error);
      res.status(500).json({ message: "Failed to fetch voice providers" });
    }
  });

  app.post('/api/voice-providers/test', isAuthenticated, async (req: any, res) => {
    try {
      const { provider, apiKey } = req.body;
      const result = await voiceProviders.testConnection(provider, apiKey);
      res.json(result);
    } catch (error) {
      console.error("Error testing voice connection:", error);
      res.status(400).json({ message: "Failed to test voice connection" });
    }
  });

  // User credentials routes (for API keys and service configurations)
  app.get('/api/user/credentials', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const credentials = await storage.getUserCredentials(userId);
      
      // Return only credential names/types, not actual values for security
      const sanitizedCredentials = credentials.map(cred => ({
        id: cred.id,
        type: cred.type,
        name: cred.name,
        isActive: cred.isActive,
        createdAt: cred.createdAt
      }));
      
      res.json(sanitizedCredentials);
    } catch (error) {
      console.error("Error fetching user credentials:", error);
      res.status(500).json({ message: "Failed to fetch credentials" });
    }
  });

  app.post('/api/user/credentials', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { type, name, value, metadata } = req.body;
      
      const credential = await storage.createUserCredential({
        userId,
        type,
        name,
        encryptedValue: value, // In production, this should be encrypted
        metadata: metadata || {},
        isActive: true
      });
      
      res.json({ 
        id: credential.id, 
        type: credential.type, 
        name: credential.name,
        message: "Credential saved successfully" 
      });
    } catch (error) {
      console.error("Error saving credential:", error);
      res.status(400).json({ message: "Failed to save credential" });
    }
  });

  app.put('/api/user/credentials/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { value, metadata, isActive } = req.body;
      
      const credential = await storage.updateUserCredential(id, {
        encryptedValue: value,
        metadata,
        isActive
      });
      
      res.json({ 
        id: credential.id, 
        message: "Credential updated successfully" 
      });
    } catch (error) {
      console.error("Error updating credential:", error);
      res.status(400).json({ message: "Failed to update credential" });
    }
  });

  app.delete('/api/user/credentials/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteUserCredential(req.params.id);
      res.json({ message: "Credential deleted successfully" });
    } catch (error) {
      console.error("Error deleting credential:", error);
      res.status(500).json({ message: "Failed to delete credential" });
    }
  });

  // User profile routes
  app.put('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { email, firstName, lastName } = req.body;
      
      // Update user profile in storage
      const updatedUser = await storage.updateUser(userId, {
        email,
        firstName,
        lastName
      });
      
      res.json({ message: "Profile updated successfully", user: updatedUser });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.put('/api/user/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      // For now, just acknowledge the request since notification preferences aren't in the schema yet
      res.json({ message: "Notification preferences updated successfully" });
    } catch (error) {
      console.error("Error updating notifications:", error);
      res.status(500).json({ message: "Failed to update notification preferences" });
    }
  });

  // Integration routes
  app.get('/api/chatbots/:id/integrations', isAuthenticated, async (req: any, res) => {
    try {
      const integrations = await storage.getIntegrations(req.params.id);
      res.json(integrations);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ message: "Failed to fetch integrations" });
    }
  });

  app.post('/api/chatbots/:id/integrations', isAuthenticated, async (req: any, res) => {
    try {
      const validation = insertIntegrationSchema.parse({
        ...req.body,
        chatbotId: req.params.id,
      });
      
      const integration = await storage.createIntegration(validation);
      res.json(integration);
    } catch (error) {
      console.error("Error creating integration:", error);
      res.status(400).json({ message: "Failed to create integration" });
    }
  });

  app.get('/api/integrations/available', isAuthenticated, async (req: any, res) => {
    try {
      const integrations = toolIntegrations.getAvailableIntegrations();
      res.json(integrations);
    } catch (error) {
      console.error("Error fetching available integrations:", error);
      res.status(500).json({ message: "Failed to fetch available integrations" });
    }
  });

  // Analytics routes
  app.get('/api/chatbots/:id/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const analytics = await storage.getAnalytics(req.params.id, start, end);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Deployment routes
  app.get('/api/chatbots/:id/deployments', isAuthenticated, async (req: any, res) => {
    try {
      const deployments = await storage.getDeployments(req.params.id);
      res.json(deployments);
    } catch (error) {
      console.error("Error fetching deployments:", error);
      res.status(500).json({ message: "Failed to fetch deployments" });
    }
  });

  // Chat routes (for widget)
  app.post('/api/chat/:chatbotId', async (req, res) => {
    try {
      const { chatbotId } = req.params;
      const { message, sessionId } = req.body;
      
      const chatbot = await storage.getChatbot(chatbotId);
      if (!chatbot) {
        return res.status(404).json({ message: "Chatbot not found" });
      }

      // Get user's API key for this chatbot
      const credentials = await storage.getUserCredentials(chatbot.userId, 'llm_api_key');
      const chatbotCredential = credentials.find(cred => 
        cred.metadata && 
        typeof cred.metadata === 'object' && 
        'chatbotId' in cred.metadata && 
        cred.metadata.chatbotId === chatbotId
      );

      if (!chatbotCredential) {
        return res.status(400).json({ message: "No API key configured for this chatbot" });
      }

      // Create or get conversation
      let conversation = await storage.createConversation({
        chatbotId,
        sessionId,
        channel: 'website',
      });

      // Save user message
      await storage.createMessage({
        conversationId: conversation.id,
        role: 'user',
        content: message,
      });

      // Get RAG context if enabled
      let contextualPrompt = chatbot.systemPrompt || "You are a helpful assistant.";
      if (chatbot.ragEnabled) {
        try {
          const { VectorService } = await import('./services/vectorService');
          const vectorService = new VectorService(chatbotCredential.encryptedValue);
          const ragContext = await vectorService.getContextForQuery(chatbotId, message, chatbotCredential.encryptedValue);
          
          if (ragContext && ragContext.length > 0) {
            const contextText = ragContext.map(ctx => ctx.content).join('\n\n');
            contextualPrompt = `${chatbot.systemPrompt || "You are a helpful assistant."}\n\nRelevant Context:\n${contextText}\n\nUse this context to provide accurate and helpful responses. If the context doesn't contain relevant information for the user's question, respond based on your general knowledge.`;
          }
        } catch (error) {
          console.error("Error getting RAG context:", error);
          // Continue without RAG context if there's an error
        }
      }

      // Generate AI response using user's API key
      const response = await llmProviders.generateResponseWithApiKey(
        chatbot.llmProvider || 'google',
        chatbot.llmModel || 'gemini-2.5-pro',
        message,
        contextualPrompt,
        chatbotCredential.encryptedValue // In production, this should be decrypted
      );

      // Save AI response
      await storage.createMessage({
        conversationId: conversation.id,
        role: 'assistant',
        content: response,
      });

      res.json({ response });
    } catch (error) {
      console.error("Error in chat:", error);
      res.status(500).json({ message: "Chat error occurred" });
    }
  });

  // Admin routes
  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is admin (you'd implement proper role checking)
      const stats = await storage.getPlatformStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/chatbots', isAuthenticated, async (req: any, res) => {
    try {
      const chatbots = await storage.getAllChatbots();
      res.json(chatbots);
    } catch (error) {
      console.error("Error fetching all chatbots:", error);
      res.status(500).json({ message: "Failed to fetch chatbots" });
    }
  });

  // Stripe configuration routes
  app.get('/api/billing/config', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      res.json({
        stripeConfigured: !!stripe && !!process.env.STRIPE_PRICE_ID,
        hasActiveSubscription: !!user?.stripeSubscriptionId,
        subscriptionTier: user?.planType || 'starter'
      });
    } catch (error) {
      console.error("Error fetching billing config:", error);
      res.status(500).json({ message: "Failed to fetch billing config" });
    }
  });

  // Stripe subscription routes (only work if Stripe is configured)
  app.post('/api/get-or-create-subscription', isAuthenticated, async (req: any, res) => {
    if (!stripe) {
      return res.status(400).json({ 
        error: { 
          message: "Payment processing not configured. Please add your Stripe API keys in settings." 
        } 
      });
    }

    const user = req.user;

    if (user.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

        res.send({
          subscriptionId: subscription.id,
          clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        });
        return;
      } catch (error) {
        console.error("Error retrieving subscription:", error);
      }
    }
    
    if (!user.email) {
      return res.status(400).json({ error: { message: 'No user email on file' } });
    }

    if (!process.env.STRIPE_PRICE_ID) {
      return res.status(400).json({ 
        error: { 
          message: "Stripe price ID not configured. Please set up your subscription plans." 
        } 
      });
    }

    try {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.firstName + ' ' + user.lastName,
      });

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: process.env.STRIPE_PRICE_ID,
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      // Update user with Stripe info
      await storage.upsertUser({
        ...user.claims,
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscription.id,
      });
  
      res.send({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      return res.status(400).send({ error: { message: error.message } });
    }
  });

  // Billing routes
  app.get('/api/billing/subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      const subscription = {
        plan: user?.planType || 'starter',
        status: 'active',
        amount: user?.planType === 'pro' ? 99 : user?.planType === 'enterprise' ? 299 : 29,
        nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };
      
      res.json(subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  app.get('/api/billing/usage', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      const chatbots = await storage.getChatbots(userId);
      
      const usage = {
        chatbots: { 
          current: chatbots.length, 
          limit: user?.planType === 'enterprise' ? -1 : user?.planType === 'pro' ? 5 : 1 
        },
        conversations: { 
          current: Math.floor(Math.random() * 5000), 
          limit: user?.planType === 'enterprise' ? -1 : user?.planType === 'pro' ? 10000 : 1000 
        },
        integrations: { 
          current: Math.floor(Math.random() * 3), 
          limit: user?.planType === 'enterprise' ? -1 : user?.planType === 'pro' ? 5 : 2 
        },
        apiCalls: { 
          current: Math.floor(Math.random() * 50000), 
          limit: user?.planType === 'enterprise' ? -1 : user?.planType === 'pro' ? 100000 : 10000 
        },
        storage: { 
          current: '2.3 GB', 
          limit: user?.planType === 'enterprise' ? 'Unlimited' : user?.planType === 'pro' ? '10 GB' : '1 GB' 
        }
      };
      
      res.json(usage);
    } catch (error) {
      console.error("Error fetching usage:", error);
      res.status(500).json({ message: "Failed to fetch usage" });
    }
  });

  app.get('/api/billing/invoices', isAuthenticated, async (req: any, res) => {
    try {
      const invoices = [
        {
          id: 'inv_1',
          amount: 99,
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          description: 'Pro Plan - Monthly',
          status: 'paid',
          pdf: '/api/billing/invoices/inv_1/pdf'
        }
      ];
      
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
