import { Router } from 'express';
import { simpleVectorService } from './simpleVectorService.js';
import { db } from '../db.js';
import { dataSources, embeddings } from '@shared/schema';
import { eq, sql, desc } from 'drizzle-orm';

const router = Router();

// Vector database dashboard endpoint
router.get('/dashboard/:chatbotId', async (req, res) => {
  try {
    const { chatbotId } = req.params;
    
    // Get comprehensive statistics
    const stats = await simpleVectorService.getVectorStats(chatbotId);
    
    // Get recent documents
    const recentDocuments = await db
      .select({
        id: dataSources.id,
        name: dataSources.name,
        type: dataSources.type,
        status: dataSources.status,
        createdAt: dataSources.createdAt,
        chunkCount: sql<number>`count(${embeddings.id})`
      })
      .from(dataSources)
      .leftJoin(embeddings, eq(sql`${embeddings.metadata}->>'dataSourceId'`, dataSources.id))
      .where(eq(dataSources.chatbotId, chatbotId))
      .groupBy(dataSources.id, dataSources.name, dataSources.type, dataSources.status, dataSources.createdAt)
      .orderBy(desc(dataSources.createdAt))
      .limit(10);
    
    // Get service status
    const serviceStatus = simpleVectorService.getServiceStatus();
    
    const dashboard = {
      statistics: stats,
      recentDocuments,
      serviceStatus,
      chatbotId,
      capabilities: {
        documentUpload: true,
        textProcessing: true,
        urlScraping: true,
        semanticSearch: true,
        contextRetrieval: true,
        ragIntegration: true
      }
    };
    
    res.json(dashboard);
  } catch (error) {
    console.error('Error generating vector dashboard:', error);
    res.status(500).json({ message: 'Failed to generate dashboard' });
  }
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const serviceStatus = simpleVectorService.getServiceStatus();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: serviceStatus,
      vectorDatabase: 'PostgreSQL with vector extension',
      embeddings: 'Google AI text-embedding-004 with fallback'
    });
  } catch (error) {
    console.error('Vector service health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export { router as vectorDashboardRoutes };