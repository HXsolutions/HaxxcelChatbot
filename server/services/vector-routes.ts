import { Router } from 'express';
import multer from 'multer';
import { vectorService } from './qdrant.js';
import { documentProcessor } from './document-processor.js';
import { db } from '../db.js';
import { dataSources } from '@shared/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Upload and process document for vector storage
router.post('/chatbots/:chatbotId/documents/upload', upload.single('file'), async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Process file and store in vector database
    const result = await documentProcessor.processFileUpload(chatbotId, file);
    
    // Store data source in PostgreSQL
    const [dataSource] = await db.insert(dataSources).values({
      chatbotId,
      type: 'file',
      fileName: file.originalname,
      fileSize: file.size,
      processed: true,
      vectorized: true,
      content: file.buffer.toString('utf-8').substring(0, 1000) // Store preview
    }).returning();
    
    res.json({
      success: true,
      documentId: result.documentId,
      dataSourceId: dataSource.id,
      chunksCount: result.chunksCount,
      totalLength: result.totalLength
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ 
      error: 'Failed to process document',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Process text content directly
router.post('/chatbots/:chatbotId/documents/text', async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const { text, title } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text content is required' });
    }
    
    const documentId = `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const metadata = { title: title || 'Text Content', type: 'text' };
    
    const result = await documentProcessor.processTextDocument(chatbotId, documentId, text, metadata);
    
    // Store in PostgreSQL
    const [dataSource] = await db.insert(dataSources).values({
      chatbotId,
      type: 'text',
      content: text.substring(0, 1000), // Store preview
      processed: true,
      vectorized: true
    }).returning();
    
    res.json({
      success: true,
      documentId,
      dataSourceId: dataSource.id,
      chunksCount: result.chunksCount,
      totalLength: result.totalLength
    });
  } catch (error) {
    console.error('Text processing error:', error);
    res.status(500).json({ 
      error: 'Failed to process text content',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Process web URL
router.post('/chatbots/:chatbotId/documents/url', async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const { url, content } = req.body;
    
    if (!url || !content) {
      return res.status(400).json({ error: 'URL and content are required' });
    }
    
    const documentId = `url_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const result = await documentProcessor.processWebURL(chatbotId, url, content, documentId);
    
    // Store in PostgreSQL
    const [dataSource] = await db.insert(dataSources).values({
      chatbotId,
      type: 'url',
      content: url,
      processed: true,
      vectorized: true
    }).returning();
    
    res.json({
      success: true,
      documentId,
      dataSourceId: dataSource.id,
      chunksCount: result.chunksCount,
      totalLength: result.totalLength
    });
  } catch (error) {
    console.error('URL processing error:', error);
    res.status(500).json({ 
      error: 'Failed to process URL content',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Search similar documents
router.post('/chatbots/:chatbotId/search', async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const { query, limit = 5 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const results = await vectorService.searchSimilar(chatbotId, query, limit);
    
    res.json({
      query,
      results,
      count: results.length
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: 'Failed to search documents',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get context for chat query
router.post('/chatbots/:chatbotId/context', async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const { query, maxLength = 3000 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    const context = await documentProcessor.getContextForQuery(chatbotId, query, maxLength);
    
    res.json({
      query,
      context,
      hasContext: context.length > 0
    });
  } catch (error) {
    console.error('Context retrieval error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve context',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete document from vector store
router.delete('/chatbots/:chatbotId/documents/:documentId', async (req, res) => {
  try {
    const { chatbotId, documentId } = req.params;
    
    await vectorService.deleteDocument(chatbotId, documentId);
    
    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Document deletion error:', error);
    res.status(500).json({ 
      error: 'Failed to delete document',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get collection info
router.get('/chatbots/:chatbotId/vector-info', async (req, res) => {
  try {
    const { chatbotId } = req.params;
    
    const info = await vectorService.getCollectionInfo(chatbotId);
    
    res.json(info);
  } catch (error) {
    console.error('Collection info error:', error);
    res.status(500).json({ 
      error: 'Failed to get collection info',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete all chatbot data from vector store
router.delete('/chatbots/:chatbotId/vector-data', async (req, res) => {
  try {
    const { chatbotId } = req.params;
    
    await vectorService.deleteChatbotData(chatbotId);
    
    res.json({ success: true, message: 'All chatbot vector data deleted successfully' });
  } catch (error) {
    console.error('Chatbot data deletion error:', error);
    res.status(500).json({ 
      error: 'Failed to delete chatbot data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;