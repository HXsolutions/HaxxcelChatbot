import { db } from '../db.js';
import { dataSources, embeddings } from '@shared/schema';
import { eq, sql, desc } from 'drizzle-orm';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class PgVectorService {
  private googleAI: GoogleGenerativeAI | null = null;

  constructor() {
    // Try to initialize Google AI if API key is available
    if (process.env.GOOGLE_AI_API_KEY) {
      this.googleAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    }
  }

  // Generate embeddings using Google's text-embedding-004 model
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.googleAI) {
      // Fallback: Use simple TF-IDF-like vector representation
      return this.generateFallbackEmbedding(text);
    }

    try {
      const model = this.googleAI.getGenerativeModel({ 
        model: 'text-embedding-004' 
      });
      
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error('Error generating Google embedding:', error);
      // Fallback to simple vector
      return this.generateFallbackEmbedding(text);
    }
  }

  // Simple fallback embedding generation
  private generateFallbackEmbedding(text: string): number[] {
    const words = text.toLowerCase().split(/\s+/);
    const vocab = new Set(words);
    const vector = new Array(384).fill(0); // 384-dim vector
    
    words.forEach((word, index) => {
      const hash = this.simpleHash(word);
      vector[hash % 384] += 1;
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
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Split text into chunks for better processing
  splitIntoChunks(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      let chunk = text.slice(start, end);
      
      // Try to break at sentence boundaries
      if (end < text.length) {
        const lastPeriod = chunk.lastIndexOf('.');
        const lastNewline = chunk.lastIndexOf('\n');
        const breakPoint = Math.max(lastPeriod, lastNewline);
        
        if (breakPoint > chunkSize * 0.7) {
          chunk = chunk.slice(0, breakPoint + 1);
        }
      }
      
      chunks.push(chunk.trim());
      start = start + chunk.length - overlap;
      
      if (start >= text.length) break;
    }

    return chunks.filter(chunk => chunk.length > 50);
  }

  // Add document with embeddings to database
  async addDocument(
    chatbotId: string,
    title: string,
    content: string,
    type: string = 'text',
    metadata: any = {}
  ): Promise<string> {
    try {
      // Create data source entry
      const [dataSource] = await db.insert(dataSources).values({
        chatbotId,
        type,
        name: title,
        content,
        metadata,
        status: 'processed'
      }).returning();

      // Split content into chunks
      const chunks = this.splitIntoChunks(content);
      
      // Process each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = await this.generateEmbedding(chunk);
        
        // Store embedding in database
        await db.insert(embeddings).values({
          chatbotId,
          content: chunk,
          embedding: JSON.stringify(embedding),
          metadata: {
            dataSourceId: dataSource.id,
            chunkIndex: i,
            totalChunks: chunks.length,
            chunkSize: chunk.length,
            ...metadata
          }
        });
      }

      console.log(`✅ Processed document "${title}" into ${chunks.length} chunks`);
      return dataSource.id;
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  }

  // Search for similar content using cosine similarity
  async searchSimilar(
    chatbotId: string,
    query: string,
    limit: number = 5,
    threshold: number = 0.5
  ): Promise<Array<{
    id: string;
    title: string;
    content: string;
    similarity: number;
    metadata: any;
  }>> {
    try {
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Get all embeddings for this chatbot
      const results = await db
        .select({
          id: embeddings.id,
          chunkText: embeddings.content,
          embedding: embeddings.embedding,
          metadata: embeddings.metadata,
          title: dataSources.name,
          dataSourceId: dataSources.id
        })
        .from(embeddings)
        .leftJoin(dataSources, eq(sql`${embeddings.metadata}->>'dataSourceId'`, dataSources.id))
        .where(eq(embeddings.chatbotId, chatbotId));

      // Calculate similarities
      const similarities = results.map(result => {
        const storedEmbedding = JSON.parse(result.embedding);
        const similarity = this.cosineSimilarity(queryEmbedding, storedEmbedding);
        
        return {
          id: result.id,
          title: result.title,
          content: result.chunkText,
          similarity,
          metadata: result.metadata
        };
      });

      // Filter by threshold and sort by similarity
      return similarities
        .filter(item => item.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
    } catch (error) {
      console.error('Error searching similar content:', error);
      return [];
    }
  }

  // Calculate cosine similarity between two vectors
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude > 0 ? dotProduct / magnitude : 0;
  }

  // Get context for RAG queries
  async getContextForQuery(
    chatbotId: string,
    query: string,
    maxLength: number = 3000
  ): Promise<string> {
    try {
      const similarContent = await this.searchSimilar(chatbotId, query, 5, 0.3);
      
      if (similarContent.length === 0) {
        return '';
      }

      let context = '';
      for (const item of similarContent) {
        const addition = `${item.title}: ${item.content}\n\n`;
        if (context.length + addition.length <= maxLength) {
          context += addition;
        } else {
          break;
        }
      }

      return context.trim();
    } catch (error) {
      console.error('Error getting context:', error);
      return '';
    }
  }

  // Get statistics for a chatbot's vector data
  async getVectorStats(chatbotId: string): Promise<{
    totalDocuments: number;
    totalChunks: number;
    avgSimilarity: number;
  }> {
    try {
      const stats = await db
        .select({
          totalDocuments: sql<number>`count(distinct ${dataSources.id})`,
          totalChunks: sql<number>`count(${embeddings.id})`
        })
        .from(dataSources)
        .leftJoin(embeddings, eq(sql`${embeddings.metadata}->>'dataSourceId'`, dataSources.id))
        .where(eq(dataSources.chatbotId, chatbotId));

      return {
        totalDocuments: stats[0]?.totalDocuments || 0,
        totalChunks: stats[0]?.totalChunks || 0,
        avgSimilarity: 0.85 // Placeholder
      };
    } catch (error) {
      console.error('Error getting vector stats:', error);
      return { totalDocuments: 0, totalChunks: 0, avgSimilarity: 0 };
    }
  }
}

// Export singleton instance
export const pgVectorService = new PgVectorService();