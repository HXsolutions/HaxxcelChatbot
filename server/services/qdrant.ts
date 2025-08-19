import { QdrantClient } from '@qdrant/js-client-rest';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Qdrant client configuration with fallback
let qdrantClient: QdrantClient | null = null;

export function initializeQdrant() {
  // Try environment variables first
  const qdrantUrl = process.env.QDRANT_URL;
  const qdrantApiKey = process.env.QDRANT_API_KEY;
  
  if (qdrantUrl && qdrantApiKey) {
    console.log('🔗 Initializing Qdrant with provided credentials...');
    qdrantClient = new QdrantClient({
      url: qdrantUrl,
      apiKey: qdrantApiKey,
    });
    return qdrantClient;
  }
  
  // Try with default demo/local instance
  if (qdrantUrl && !qdrantApiKey) {
    console.log('🔗 Initializing Qdrant without API key (local instance)...');
    qdrantClient = new QdrantClient({
      url: qdrantUrl,
    });
    return qdrantClient;
  }
  
  console.warn('⚠️ QDRANT_URL not configured. Using PostgreSQL vector fallback.');
  return null;
}

export function getQdrantClient(): QdrantClient | null {
  if (!qdrantClient) {
    return initializeQdrant();
  }
  return qdrantClient;
}

// Google embedding model configuration with fallback
let googleAI: GoogleGenerativeAI | null = null;

export function initializeGoogleEmbedding() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  if (apiKey) {
    console.log('🤖 Initializing Google AI with provided API key...');
    googleAI = new GoogleGenerativeAI(apiKey);
    return googleAI;
  }
  
  console.warn('⚠️ GOOGLE_AI_API_KEY not configured. Using fallback embedding method.');
  return null;
}

export function getGoogleAI(): GoogleGenerativeAI | null {
  if (!googleAI) {
    return initializeGoogleEmbedding();
  }
  return googleAI;
}

// Vector operations
export class VectorService {
  private client: QdrantClient | null;
  private googleAI: GoogleGenerativeAI | null;
  
  constructor() {
    this.client = getQdrantClient();
    this.googleAI = getGoogleAI();
  }
  
  private checkConfiguration() {
    if (!this.client) {
      console.warn('Qdrant client not available, falling back to PostgreSQL vector service');
      return false;
    }
    if (!this.googleAI) {
      console.warn('Google AI not available, using fallback embedding method');
      return false;
    }
    return true;
  }
  
  async ensureCollection(collectionName: string) {
    if (!this.client) {
      console.log(`⚠️ Qdrant not available, using PostgreSQL for collection: ${collectionName}`);
      return;
    }
    
    try {
      await this.client.getCollection(collectionName);
      console.log(`✅ Collection ${collectionName} already exists`);
    } catch (error) {
      // Collection doesn't exist, create it
      console.log(`📁 Creating collection: ${collectionName}`);
      await this.client.createCollection(collectionName, {
        vectors: {
          size: 768, // Google embedding dimension
          distance: 'Cosine'
        }
      });
      console.log(`✅ Collection ${collectionName} created successfully`);
    }
  }
  
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.checkConfiguration()) {
      // Fallback to simple hash-based embedding
      return this.generateFallbackEmbedding(text);
    }
    
    try {
      const model = this.googleAI!.getGenerativeModel({ 
        model: 'text-embedding-004' 
      });
      
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error('Error generating Google embedding:', error);
      // Fallback to simple embedding
      return this.generateFallbackEmbedding(text);
    }
  }

  // Fallback embedding generation using simple text processing
  private generateFallbackEmbedding(text: string): number[] {
    const words = text.toLowerCase().split(/\s+/);
    const vocab = new Set(words);
    const vector = new Array(768).fill(0); // Match Google embedding dimension
    
    words.forEach((word, index) => {
      const hash = this.simpleHash(word);
      vector[hash % 768] += 1;
    });
    
    // Normalize
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
  
  async addDocument(
    chatbotId: string,
    documentId: string,
    text: string,
    metadata: Record<string, any> = {}
  ) {
    const collectionName = `chatbot_${chatbotId}`;
    await this.ensureCollection(collectionName);
    
    const embedding = await this.generateEmbedding(text);
    
    await this.client!.upsert(collectionName, {
      wait: true,
      points: [{
        id: Math.abs(documentId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)),
        vector: embedding,
        payload: {
          text,
          chatbot_id: chatbotId,
          document_id: documentId,
          created_at: new Date().toISOString(),
          ...metadata
        }
      }]
    });
  }
  
  async addDocumentChunks(
    chatbotId: string,
    documentId: string,
    chunks: Array<{ text: string; metadata?: Record<string, any> }>
  ) {
    const collectionName = `chatbot_${chatbotId}`;
    await this.ensureCollection(collectionName);
    
    const points = await Promise.all(
      chunks.map(async (chunk, index) => {
        const embedding = await this.generateEmbedding(chunk.text);
        return {
          id: Math.abs(`${documentId}_chunk_${index}`.split('').reduce((a, b) => a + b.charCodeAt(0), 0)),
          vector: embedding,
          payload: {
            text: chunk.text,
            chatbot_id: chatbotId,
            document_id: documentId,
            chunk_index: index,
            created_at: new Date().toISOString(),
            ...chunk.metadata
          }
        };
      })
    );
    
    await this.client!.upsert(collectionName, {
      wait: true,
      points
    });
  }
  
  async searchSimilar(
    chatbotId: string,
    query: string,
    limit: number = 5,
    scoreThreshold: number = 0.7
  ) {
    const collectionName = `chatbot_${chatbotId}`;
    
    try {
      await this.ensureCollection(collectionName);
      
      const queryEmbedding = await this.generateEmbedding(query);
      
      const searchResult = await this.client!.search(collectionName, {
        vector: queryEmbedding,
        limit,
        score_threshold: scoreThreshold,
        with_payload: true
      });
      
      return searchResult.map(point => ({
        id: point.id,
        score: point.score,
        text: point.payload?.text as string,
        metadata: point.payload || {}
      }));
    } catch (error) {
      console.error('Error searching vectors:', error);
      return [];
    }
  }
  
  async deleteDocument(chatbotId: string, documentId: string) {
    const collectionName = `chatbot_${chatbotId}`;
    
    try {
      // Delete all chunks for this document
      await this.client!.delete(collectionName, {
        filter: {
          must: [{
            key: 'document_id',
            match: { value: documentId }
          }]
        }
      });
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  }
  
  async deleteChatbotData(chatbotId: string) {
    const collectionName = `chatbot_${chatbotId}`;
    
    try {
      await this.client!.deleteCollection(collectionName);
    } catch (error) {
      console.error('Error deleting chatbot collection:', error);
    }
  }
  
  async getCollectionInfo(chatbotId: string) {
    const collectionName = `chatbot_${chatbotId}`;
    
    try {
      const info = await this.client!.getCollection(collectionName);
      return {
        name: collectionName,
        vectorsCount: info.vectors_count,
        status: info.status
      };
    } catch (error) {
      return {
        name: collectionName,
        vectorsCount: 0,
        status: 'not_exists'
      };
    }
  }
}

export const vectorService = new VectorService();