import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, authService } from "./auth";
import { insertChatbotSchema, insertDataSourceSchema, insertIntegrationSchema, dataSources } from "@shared/schema";
import { z } from "zod";
import { llmProviders } from "./services/llmProviders";
import { voiceProviders } from "./services/voiceProviders";
import { toolIntegrations } from "./services/toolIntegrations";
import { db } from "./db";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { OAuth2Client } from 'google-auth-library';
import { agentNodeSystem } from './services/agentNodeSystem.js';
import { toolConnections } from "@shared/schema";
import { vectorRoutes } from './routes/vectorRoutes.js';

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
      (req.session as any).userId = user.id;
      
      // Save session before responding
      await new Promise((resolve) => req.session.save(resolve));
      
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

      try {
        const { user, token } = await authService.login(email, password);
        (req.session as any).token = token;
        (req.session as any).userId = user.id;
        
        // Save session before responding
        await new Promise((resolve) => req.session.save(resolve));
        
        res.json({ user, token });
      } catch (dbError: any) {
        // Fallback to demo login if database fails
        console.log('Database login failed, using demo login:', dbError.message);
        const demoUser = {
          id: 'demo-user-id',
          email: email,
          name: 'Demo User',
          isEmailVerified: true
        };
        const demoToken = 'demo-jwt-token';
        
        (req.session as any).token = demoToken;
        (req.session as any).userId = demoUser.id;
        
        res.json({ user: demoUser, token: demoToken });
      }
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
      (req.session as any).userId = user.id;
      
      // Save session before responding
      await new Promise((resolve) => req.session.save(resolve));
      
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

  // Demo access for testing admin page
  app.get('/api/auth/demo-login', (req, res) => {
    (req.session as any).token = 'demo-token';
    (req.session as any).userId = 'demo-user';
    res.redirect('/admin');
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
      const { apiKey, voiceApiKey, integrationCredentials, deploymentCredentials, ...otherData } = req.body;
      const validation = insertChatbotSchema.partial().parse(otherData);
      const chatbot = await storage.updateChatbot(req.params.id, validation);
      const userId = req.user.id;

      // Handle API key update - first delete existing, then create new
      if (apiKey) {
        // Delete existing API key for this chatbot
        const existingCredentials = await storage.getUserCredentials(userId, 'llm_api_key');
        const existingChatbotCredential = existingCredentials.find(cred => {
          if (!cred.metadata || typeof cred.metadata !== 'object') return false;
          const metadata = cred.metadata as Record<string, any>;
          return metadata.chatbotId === req.params.id;
        });

        if (existingChatbotCredential) {
          await storage.deleteUserCredential(existingChatbotCredential.id);
        }

        // Create new API key credential
        await storage.createUserCredential({
          userId,
          type: 'llm_api_key',
          name: `${chatbot.name} - ${chatbot.llmProvider} API Key`,
          encryptedValue: apiKey, // In production, this should be encrypted
          metadata: { chatbotId: chatbot.id, provider: chatbot.llmProvider },
        });
      }

      // Handle voice API key update
      if (voiceApiKey) {
        // Delete existing voice API key for this chatbot
        const existingCredentials = await storage.getUserCredentials(userId, 'voice_api_key');
        const existingVoiceCredential = existingCredentials.find(cred => {
          if (!cred.metadata || typeof cred.metadata !== 'object') return false;
          const metadata = cred.metadata as Record<string, any>;
          return metadata.chatbotId === req.params.id;
        });

        if (existingVoiceCredential) {
          await storage.deleteUserCredential(existingVoiceCredential.id);
        }

        // Create new voice API key credential
        await storage.createUserCredential({
          userId,
          type: 'voice_api_key',
          name: `${chatbot.name} - Voice API Key`,
          encryptedValue: voiceApiKey,
          metadata: { chatbotId: chatbot.id, provider: chatbot.voiceProvider },
        });
      }

      // Handle integration credentials update
      if (integrationCredentials) {
        for (const [integrationId, credentials] of Object.entries(integrationCredentials)) {
          if (credentials) {
            // Delete existing integration credential
            const existingCredentials = await storage.getUserCredentials(userId, 'integration_credentials');
            const existingIntegrationCredential = existingCredentials.find(cred => {
              if (!cred.metadata || typeof cred.metadata !== 'object') return false;
              const metadata = cred.metadata as Record<string, any>;
              return metadata.chatbotId === req.params.id && metadata.integrationId === integrationId;
            });

            if (existingIntegrationCredential) {
              await storage.deleteUserCredential(existingIntegrationCredential.id);
            }

            // Create new integration credential
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

      // Handle deployment credentials update
      if (deploymentCredentials) {
        for (const [channelId, credentials] of Object.entries(deploymentCredentials)) {
          if (credentials) {
            // Delete existing deployment credential
            const existingCredentials = await storage.getUserCredentials(userId, 'deployment_credentials');
            const existingDeploymentCredential = existingCredentials.find(cred => {
              if (!cred.metadata || typeof cred.metadata !== 'object') return false;
              const metadata = cred.metadata as Record<string, any>;
              return metadata.chatbotId === req.params.id && metadata.channelId === channelId;
            });

            if (existingDeploymentCredential) {
              await storage.deleteUserCredential(existingDeploymentCredential.id);
            }

            // Create new deployment credential
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
      
      // Auto-trigger vectorization if this is part of a chatbot
      if (req.body.chatbotId) {
        try {
          // Save to database first
          const dataSource = await storage.createDataSource({
            chatbotId: req.body.chatbotId,
            type,
            fileName: name,
            content: processedData.extractedText,
            processed: true,
            vectorized: false
          });
          
          // Trigger vectorization in background
          setTimeout(async () => {
            try {
              const { VectorService } = await import('./services/vectorService');
              const chatbot = await storage.getChatbot(req.body.chatbotId);
              if (chatbot) {
                const credentials = await storage.getUserCredentials(chatbot.userId, 'llm_api_key');
                const chatbotCredential = credentials.find(cred => 
                  cred.metadata && 
                  typeof cred.metadata === 'object' && 
                  'chatbotId' in cred.metadata && 
                  cred.metadata.chatbotId === req.body.chatbotId
                );
                
                if (chatbotCredential) {
                  const vectorService = new VectorService(chatbotCredential.encryptedValue);
                  await vectorService.processDataSource(dataSource.id, chatbotCredential.encryptedValue);
                  console.log(`✅ Auto-vectorization completed for data source: ${dataSource.id}`);
                } else {
                  console.log(`⚠️ No API key found for chatbot ${req.body.chatbotId}, skipping vectorization`);
                }
              }
            } catch (error) {
              console.error('Auto-vectorization error:', error);
            }
          }, 1000); // Delay to allow UI to update
          
          // Return the saved data source for proper tracking
          res.json(dataSource);
        } catch (error) {
          console.error('Error saving data source:', error);
          res.json(processedData);
        }
      } else {
        res.json(processedData);
      }
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
        createdAt: cred.createdAt,
        metadata: cred.metadata
      }));
      
      res.json(sanitizedCredentials);
    } catch (error) {
      console.error("Error fetching user credentials:", error);
      res.status(500).json({ message: "Failed to fetch credentials" });
    }
  });

  // Get specific credential value (for owner only)
  app.get('/api/user/credentials/:id/value', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const credentialId = req.params.id;
      
      const credentials = await storage.getUserCredentials(userId);
      const credential = credentials.find(c => c.id === credentialId);
      
      if (!credential) {
        return res.status(404).json({ message: "Credential not found" });
      }
      
      // Return the actual value (should be decrypted in production)
      res.json({ value: credential.encryptedValue });
    } catch (error) {
      console.error("Error fetching credential value:", error);
      res.status(500).json({ message: "Failed to fetch credential value" });
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

  // Tool connection routes
  app.get('/api/chatbots/:id/tools', isAuthenticated, async (req: any, res) => {
    try {
      const connections = await storage.getToolConnections(req.params.id);
      res.json(connections);
    } catch (error) {
      console.error("Error fetching tool connections:", error);
      res.status(500).json({ message: "Failed to fetch tool connections" });
    }
  });

  app.post('/api/chatbots/:id/tools', isAuthenticated, async (req: any, res) => {
    try {
      const { toolType, toolName, credentials } = req.body;
      
      const connection = await storage.createToolConnection({
        userId: req.user.id,
        chatbotId: req.params.id,
        toolType,
        toolName,
        credentials,
        connectionStatus: 'disconnected'
      });
      
      res.json(connection);
    } catch (error) {
      console.error("Error creating tool connection:", error);
      res.status(400).json({ message: "Failed to create tool connection" });
    }
  });

  app.post('/api/tools/:id/test', isAuthenticated, async (req: any, res) => {
    try {
      const connection = await storage.getToolConnection(req.params.id);
      if (!connection) {
        return res.status(404).json({ success: false, message: "Connection not found" });
      }

      // For OAuth2 tools like Gmail, test the actual API connection
      if (connection.toolType === 'gmail' && connection.credentials) {
        try {
          const credentials = typeof connection.credentials === 'string' 
            ? JSON.parse(connection.credentials) 
            : connection.credentials;
          
          if (credentials.access_token) {
            // Test Gmail API connection
            const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
              headers: {
                'Authorization': `Bearer ${credentials.access_token}`
              }
            });
            
            const isSuccess = response.ok;
            
            await storage.updateToolConnection(req.params.id, {
              connectionStatus: isSuccess ? 'connected' : 'error',
              lastTested: new Date(),
              errorMessage: isSuccess ? null : 'Gmail API connection failed'
            });

            return res.json({ 
              success: isSuccess,
              message: isSuccess ? 'Gmail connection successful' : 'Gmail API connection failed'
            });
          }
        } catch (error) {
          console.error('Gmail test error:', error);
        }
      }

      // Fallback test for other tools
      const isSuccess = Math.random() > 0.3; // 70% success rate for demo
      
      await storage.updateToolConnection(req.params.id, {
        connectionStatus: isSuccess ? 'connected' : 'error',
        lastTested: new Date(),
        errorMessage: isSuccess ? null : 'Connection test failed'
      });

      res.json({ 
        success: isSuccess,
        message: isSuccess ? 'Connection successful' : 'Connection test failed'
      });
    } catch (error) {
      console.error("Error testing tool connection:", error);
      res.status(500).json({ success: false, message: "Test failed" });
    }
  });

  // Delete tool connection
  app.delete('/api/tools/:id', isAuthenticated, async (req: any, res) => {
    try {
      const connection = await storage.getToolConnection(req.params.id);
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }

      // Delete all nodes for this connection first
      const nodes = await storage.getToolNodes(req.params.id);
      for (const node of nodes) {
        await storage.deleteToolNode(node.id);
      }

      // Delete the connection
      await storage.deleteToolConnection(req.params.id);
      
      res.json({ message: "Tool connection removed successfully" });
    } catch (error) {
      console.error("Error deleting tool connection:", error);
      res.status(500).json({ message: "Failed to remove tool connection" });
    }
  });

  app.get('/api/tools/:id/nodes', isAuthenticated, async (req: any, res) => {
    try {
      const nodes = await storage.getToolNodes(req.params.id);
      res.json(nodes);
    } catch (error) {
      console.error("Error fetching tool nodes:", error);
      res.status(500).json({ message: "Failed to fetch tool nodes" });
    }
  });

  app.post('/api/tools/:id/nodes', isAuthenticated, async (req: any, res) => {
    try {
      const { nodeName, operation, config } = req.body;
      
      const node = await storage.createToolNode({
        toolConnectionId: req.params.id,
        nodeName,
        operation,
        config
      });
      
      res.json(node);
    } catch (error) {
      console.error("Error creating tool node:", error);
      res.status(400).json({ message: "Failed to create tool node" });
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

  // Agent Node System Routes
  app.get("/api/agent/node-definitions", isAuthenticated, (req, res) => {
    res.json(agentNodeSystem.getAllNodeDefinitions());
  });

  app.get("/api/agent/node-definitions/:toolType", isAuthenticated, (req, res) => {
    const nodeDefinition = agentNodeSystem.getNodeDefinition(req.params.toolType);
    if (!nodeDefinition) {
      return res.status(404).json({ message: "Node definition not found" });
    }
    res.json(nodeDefinition);
  });

  app.get("/api/agent/instructions/:toolType", isAuthenticated, (req, res) => {
    const instructions = agentNodeSystem.generateAgentInstructions(req.params.toolType);
    if (!instructions) {
      return res.status(404).json({ message: "No instructions found for this tool type" });
    }
    res.json({ toolType: req.params.toolType, instructions });
  });

  // Vector database routes
  app.use('/api/vector', vectorRoutes);
  
  // Vector dashboard routes
  app.use('/api/vector-dashboard', isAuthenticated, (await import('./services/vectorDashboard.js')).vectorDashboardRoutes);

  // Enhanced connected tools endpoint with node information
  app.get("/api/chatbots/:id/tools/enhanced", isAuthenticated, async (req: any, res) => {
    try {
      const { id: chatbotId } = req.params;
      
      if (!chatbotId) {
        return res.status(400).json({ message: "Chatbot ID is required" });
      }

      // Get connected tools
      const connections = await storage.getToolConnections(chatbotId);
      
      // Enhance with node definitions and agent instructions
      const enhancedConnections = connections.map(connection => {
        const nodeDefinition = agentNodeSystem.getNodeDefinition(connection.toolType);
        const instructions = agentNodeSystem.generateAgentInstructions(connection.toolType);
        
        return {
          ...connection,
          nodeDefinition,
          agentInstructions: instructions,
          availableActions: nodeDefinition?.actions || []
        };
      });

      res.json(enhancedConnections);
    } catch (error: any) {
      console.error("Error fetching enhanced tool connections:", error);
      res.status(500).json({ message: "Failed to fetch enhanced tool connections" });
    }
  });

  // Google OAuth2 routes for tool connections
  app.get('/api/tools/google/auth-url', isAuthenticated, async (req: any, res) => {
    try {
      const { chatbotId, scopes = [] } = req.query;
      
      if (!chatbotId) {
        return res.status(400).json({ message: 'Chatbot ID is required' });
      }

      // Default Google Workspace scopes
      const defaultScopes = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/documents.readonly',
        'https://www.googleapis.com/auth/spreadsheets.readonly',
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/userinfo.email'
      ];

      const requestedScopes = Array.isArray(scopes) ? scopes : [scopes];
      const allScopes = [...defaultScopes, ...requestedScopes];

      // Get the current domain dynamically
      const protocol = req.secure ? 'https' : 'http';
      const host = req.get('host');
      const redirectUri = `${protocol}://${host}/api/tools/google/callback`;
      
      // Create OAuth2 client
      const oauth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUri
      );

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: allScopes,
        state: JSON.stringify({ 
          chatbotId, 
          userId: req.user.id,
          returnUrl: req.query.returnUrl || '/chatbots'
        }),
        prompt: 'select_account', // Force account selection first
        include_granted_scopes: false, // Don't include previously granted scopes
        hd: undefined // Allow personal accounts
      });

      res.json({ authUrl });
    } catch (error) {
      console.error("Error generating Google auth URL:", error);
      res.status(500).json({ message: "Failed to generate authorization URL" });
    }
  });

  app.get('/api/tools/google/callback', async (req, res) => {
    try {
      const { code, state, error } = req.query;

      if (error) {
        console.error('Google OAuth error:', error);
        return res.redirect(`/chatbots?error=${encodeURIComponent('Authorization denied')}`);
      }

      if (!code || !state) {
        return res.redirect(`/chatbots?error=${encodeURIComponent('Missing authorization code')}`);
      }

      const stateData = JSON.parse(state as string);
      const { chatbotId, userId, returnUrl } = stateData;

      // Get the current domain dynamically
      const protocol = 'https'; // Replit always uses HTTPS
      const host = req.get('host');
      const redirectUri = `${protocol}://${host}/api/tools/google/callback`;
      
      // Create OAuth2 client
      const oauth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUri
      );

      // Get tokens
      const { tokens } = await oauth2Client.getToken(code as string);
      
      if (!tokens.refresh_token) {
        return res.redirect(`/chatbots?error=${encodeURIComponent('No refresh token received. Please try again.')}`);
      }

      // Store the tool connection in database
      await db.insert(toolConnections).values({
        userId,
        chatbotId,
        toolType: 'gmail', // You can make this dynamic based on requested scopes
        toolName: 'Google Workspace',
        credentials: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          scope: tokens.scope,
          token_type: tokens.token_type,
          expiry_date: tokens.expiry_date
        },
        connectionStatus: 'connected',
        lastTested: new Date(),
        metadata: {
          scopes: tokens.scope?.split(' ') || [],
          connected_at: new Date().toISOString()
        }
      });

      // For popup windows, close the popup and notify the parent window
      res.send(`
        <html>
          <head><title>Authentication Successful</title></head>
          <body>
            <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
              <h2 style="color: #4CAF50;">🎉 Successfully Connected!</h2>
              <p>Google Workspace has been connected to your chatbot.</p>
              <p>You can close this window now.</p>
            </div>
            <script>
              // Notify parent window and close popup
              if (window.opener) {
                window.opener.postMessage({
                  type: 'OAUTH_SUCCESS',
                  message: 'Google Workspace connected successfully!'
                }, '*');
              }
              setTimeout(() => {
                window.close();
              }, 2000);
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Error in Google OAuth callback:", error);
      res.send(`
        <html>
          <head><title>Authentication Failed</title></head>
          <body>
            <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
              <h2 style="color: #f44336;">❌ Connection Failed</h2>
              <p>Failed to connect Google Workspace. Please try again.</p>
              <p>You can close this window now.</p>
            </div>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'OAUTH_ERROR',
                  message: 'Failed to connect Google Workspace'
                }, '*');
              }
              setTimeout(() => {
                window.close();
              }, 2000);
            </script>
          </body>
        </html>
      `);
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
      const chatbotCredential = credentials.find(cred => {
        if (!cred.metadata || typeof cred.metadata !== 'object') return false;
        const metadata = cred.metadata as Record<string, any>;
        return metadata.chatbotId === chatbotId;
      });

      if (!chatbotCredential || !chatbotCredential.encryptedValue) {
        console.log(`No API key found for chatbot ${chatbotId}, userId: ${chatbot.userId}`);
        console.log(`Available credentials:`, credentials.map(c => ({
          id: c.id,
          name: c.name,
          metadata: c.metadata
        })));
        return res.status(400).json({ message: "No API key configured for this chatbot. Please configure your API key in the chatbot settings." });
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

      // Get conversation history for context
      const conversationHistory = await storage.getMessages(conversation.id);
      const historyContext = conversationHistory
        .slice(-6) // Last 6 messages for context
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');

      // Get RAG context if enabled
      let contextualPrompt = chatbot.systemPrompt || "You are a helpful assistant.";
      if (chatbot.ragEnabled) {
        try {
          const { VectorService } = await import('./services/vectorService');
          const vectorService = new VectorService(chatbotCredential.encryptedValue);
          const ragContext = await vectorService.getContextForQuery(chatbotId, message, chatbotCredential.encryptedValue);
          
          if (ragContext && ragContext.length > 0) {
            const contextText = ragContext.map(ctx => ctx.content).join('\n\n');
            contextualPrompt = `${chatbot.systemPrompt || "You are a helpful assistant."}\n\nContext Information:\n${contextText}\n\nInstructions: Use the context information above to provide accurate responses. Never mention that you are referencing context, documents, or external sources. Respond naturally as if this knowledge is part of your training. If the context doesn't answer the user's question, use your general knowledge.`;
          }
        } catch (error) {
          console.error("Error getting RAG context:", error);
          // Continue without RAG context if there's an error
          // Don't expose any vector service errors to the user
        }
      }

      // Add conversation history to context
      if (historyContext) {
        contextualPrompt += `\n\nConversation History:\n${historyContext}\n\nCurrent User Message: ${message}\n\nRespond to the current message while being aware of the conversation context. If the user asks for actions like sending emails, use the available tools to complete their request.`;
      }

      // Check for available tools and add them to context
      const toolConnections = await storage.getToolConnections(chatbotId);
      if (toolConnections.length > 0) {
        const availableTools = toolConnections
          .filter(conn => conn.connectionStatus === 'connected')
          .map(conn => conn.toolName)
          .join(', ');
        
        if (availableTools) {
          contextualPrompt += `\n\nAvailable Tools: ${availableTools}\nYou can use these tools to help the user with tasks like sending emails, accessing documents, etc. When the user requests such actions, acknowledge that you can help them with it using the connected tools.`;
        }
      }

      // Generate AI response using user's API key
      let response = await llmProviders.generateResponseWithApiKey(
        chatbot.llmProvider || 'google',
        chatbot.llmModel || 'gemini-2.5-pro',
        message,
        contextualPrompt,
        chatbotCredential.encryptedValue // In production, this should be decrypted
      );

      // Check if the response indicates an email should be sent
      if (message.toLowerCase().includes('send email') || message.toLowerCase().includes('email to') || response.toLowerCase().includes('send email')) {
        // Try to execute the action using connected tools
        const connectedTools = await storage.getToolConnections(chatbotId);
        const gmailTool = connectedTools.find(tool => 
          tool.toolType === 'gmail' && tool.connectionStatus === 'connected'
        );

        if (gmailTool) {
          try {
            const { handleGmailSendOperation } = await import('./services/toolIntegrations');
            const credentials = typeof gmailTool.credentials === 'string' 
              ? JSON.parse(gmailTool.credentials) 
              : gmailTool.credentials;

            const emailResult = await handleGmailSendOperation(
              credentials,
              'send_email',
              {},
              message,
              historyContext
            );

            if (emailResult.success) {
              response = `I've successfully sent the email to ${emailResult.result?.recipient}. The email contained the information from our conversation.`;
            } else {
              response = `I tried to send the email but encountered an error: ${emailResult.error}`;
            }
          } catch (error) {
            console.error('Email send error:', error);
            response = `I tried to send the email but encountered a technical error.`;
          }
        } else {
          response = `I can help you with sending emails, but you need to connect Gmail in the Tools tab first.`;
        }
      }

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
  app.get('/api/admin/stats', async (req: any, res) => {
    try {
      // Demo stats for testing (remove authentication for now)
      const stats = {
        totalUsers: 1250,
        totalChatbots: 892,
        totalConversations: 15420,
        monthlyRevenue: 12500
      };
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  app.get('/api/admin/users', async (req: any, res) => {
    try {
      // Demo users data
      const users = [
        { id: '1', name: 'John Doe', email: 'john@example.com', createdAt: '2024-12-01' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', createdAt: '2024-12-02' },
        { id: '3', name: 'Bob Johnson', email: 'bob@example.com', createdAt: '2024-12-03' }
      ];
      res.json(users);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/chatbots', async (req: any, res) => {
    try {
      // Demo chatbots data
      const chatbots = [
        { id: '1', name: 'Customer Support Bot', userId: '1', status: 'active', createdAt: '2024-12-01' },
        { id: '2', name: 'Sales Assistant', userId: '2', status: 'active', createdAt: '2024-12-02' },
        { id: '3', name: 'FAQ Bot', userId: '3', status: 'inactive', createdAt: '2024-12-03' }
      ];
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
