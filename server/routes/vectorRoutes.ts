import { Router } from 'express';
import multer from 'multer';
import { simpleVectorService } from '../services/simpleVectorService.js';
import { db } from '../db.js';
import { dataSources } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Upload and process documents for vector search
router.post('/chatbots/:chatbotId/documents/upload', upload.array('files', 10), async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const results = [];

    for (const file of files) {
      let content = '';
      const metadata = {
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      };

      // Extract text content based on file type
      if (file.mimetype === 'text/plain') {
        content = file.buffer.toString('utf-8');
      } else if (file.mimetype === 'application/json') {
        content = file.buffer.toString('utf-8');
      } else {
        // For other file types, treat as text for now
        content = file.buffer.toString('utf-8');
      }

      if (content.length < 10) {
        continue; // Skip very short content
      }

      const documentId = await simpleVectorService.addDocument(
        chatbotId,
        file.originalname,
        content,
        'file',
        metadata
      );

      results.push({
        documentId,
        filename: file.originalname,
        processed: true
      });
    }

    res.json({ 
      message: `Successfully processed ${results.length} documents`,
      results 
    });
  } catch (error) {
    console.error('Error uploading documents:', error);
    res.status(500).json({ message: 'Failed to process documents' });
  }
});

// Process text content directly
router.post('/chatbots/:chatbotId/documents/text', async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const { text, title = 'Text Document', metadata = {} } = req.body;

    if (!text || text.length < 10) {
      return res.status(400).json({ message: 'Text content is required and must be at least 10 characters' });
    }

    const documentId = await simpleVectorService.addDocument(
      chatbotId,
      title,
      text,
      'text',
      metadata
    );

    res.json({ 
      message: 'Text processed successfully',
      documentId
    });
  } catch (error) {
    console.error('Error processing text:', error);
    res.status(500).json({ message: 'Failed to process text' });
  }
});

// Process URL content (placeholder for web scraping)
router.post('/chatbots/:chatbotId/documents/url', async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const { url, title } = req.body;

    if (!url) {
      return res.status(400).json({ message: 'URL is required' });
    }

    // For now, just create a placeholder document
    // In production, you would scrape the URL content
    const content = `Content from ${url} would be scraped here. This is a placeholder implementation.`;
    
    const documentId = await simpleVectorService.addDocument(
      chatbotId,
      title || `Content from ${url}`,
      content,
      'url',
      { sourceUrl: url }
    );

    res.json({ 
      message: 'URL processed successfully',
      documentId
    });
  } catch (error) {
    console.error('Error processing URL:', error);
    res.status(500).json({ message: 'Failed to process URL' });
  }
});

// Search for similar content
router.post('/chatbots/:chatbotId/search', async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const { query, limit = 5, threshold = 0.5 } = req.body;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const results = await simpleVectorService.searchSimilar(
      chatbotId,
      query,
      Math.min(limit, 10), // Max 10 results
      Math.max(threshold, 0.1) // Min threshold 0.1
    );

    res.json({ 
      query,
      results,
      total: results.length
    });
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ message: 'Failed to search documents' });
  }
});

// Get context for RAG queries
router.post('/chatbots/:chatbotId/context', async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const { query, maxLength = 3000 } = req.body;

    if (!query) {
      return res.status(400).json({ message: 'Query is required' });
    }

    const context = await simpleVectorService.getContextForQuery(
      chatbotId,
      query,
      Math.min(maxLength, 5000) // Max 5000 chars
    );

    res.json({ 
      query,
      context,
      contextLength: context.length
    });
  } catch (error) {
    console.error('Error getting context:', error);
    res.status(500).json({ message: 'Failed to get context' });
  }
});

// Get vector database statistics
router.get('/chatbots/:chatbotId/vector-stats', async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const stats = await simpleVectorService.getVectorStats(chatbotId);

    res.json(stats);
  } catch (error) {
    console.error('Error getting vector stats:', error);
    res.status(500).json({ message: 'Failed to get statistics' });
  }
});

// Delete document and its embeddings
router.delete('/chatbots/:chatbotId/documents/:documentId', async (req, res) => {
  try {
    const { chatbotId, documentId } = req.params;

    // Delete data source and its embeddings
    await db.delete(dataSources).where(eq(dataSources.id, documentId));

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Failed to delete document' });
  }
});

// Clear all vector data for a chatbot
router.delete('/chatbots/:chatbotId/vector-data', async (req, res) => {
  try {
    const { chatbotId } = req.params;

    // Get all data sources for this chatbot and delete them
    const dataSourcesList = await db.select().from(dataSources).where(eq(dataSources.chatbotId, chatbotId));
    
    await db.delete(dataSources).where(eq(dataSources.chatbotId, chatbotId));

    res.json({ 
      message: 'All vector data cleared successfully',
      deletedDocuments: dataSourcesList.length
    });
  } catch (error) {
    console.error('Error clearing vector data:', error);
    res.status(500).json({ message: 'Failed to clear vector data' });
  }
});

export { router as vectorRoutes };