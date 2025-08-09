import { GoogleGenAI } from '@google/genai';
import { db } from '../db';
import { dataSources, embeddings } from '@shared/schema';
import { eq } from 'drizzle-orm';

export class VectorService {
  private gemini: GoogleGenAI;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY || '';
    if (!key) {
      console.warn('No Google AI API key provided for vector service');
    }
    this.gemini = new GoogleGenAI({
      apiKey: key,
    });
  }

  // Split text into chunks for better embeddings
  private splitIntoChunks(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunk = text.slice(start, end);
      
      // Try to break at word boundaries
      const lastSpaceIndex = chunk.lastIndexOf(' ');
      const actualChunk = end === text.length ? chunk : 
        (lastSpaceIndex > chunkSize * 0.8 ? chunk.slice(0, lastSpaceIndex) : chunk);
      
      chunks.push(actualChunk.trim());
      start = end - overlap;
      
      if (end === text.length) break;
    }

    return chunks.filter(chunk => chunk.length > 50); // Filter out very small chunks
  }

  // Generate embeddings for text using Google
  async generateEmbedding(text: string, apiKey?: string): Promise<number[]> {
    try {
      // Use provided API key or fallback to constructor key
      const client = apiKey ? new GoogleGenAI({ apiKey }) : this.gemini;
      
      const response = await client.models.embedContent({
        model: 'text-embedding-004',
        contents: [{
          parts: [{ text }],
        }],
      });
      
      return response.embeddings?.[0]?.values || [];
    } catch (error) {
      console.error('Error generating embedding with Google:', error);
      throw error;
    }
  }

  // Process data source and create embeddings
  async processDataSource(dataSourceId: string, apiKey?: string): Promise<void> {
    try {
      // Get the data source
      const [dataSource] = await db
        .select()
        .from(dataSources)
        .where(eq(dataSources.id, dataSourceId))
        .limit(1);

      if (!dataSource) {
        throw new Error('Data source not found');
      }

      if (!dataSource.content) {
        console.log(`Data source ${dataSourceId} has no content, skipping vectorization`);
        // Update as processed but not vectorized
        await db
          .update(dataSources)
          .set({ processed: true, vectorized: false })
          .where(eq(dataSources.id, dataSourceId));
        return;
      }

      // Split content into chunks
      const chunks = this.splitIntoChunks(dataSource.content);
      
      // Generate embeddings for each chunk
      const embeddingPromises = chunks.map(async (chunk, index) => {
        const embedding = await this.generateEmbedding(chunk, apiKey);
        
        return {
          dataSourceId: dataSource.id,
          chatbotId: dataSource.chatbotId,
          content: chunk,
          embedding: JSON.stringify(embedding),
          metadata: {
            chunkIndex: index,
            originalFileName: dataSource.fileName,
            sourceType: dataSource.type,
            chunkSize: chunk.length,
          },
        };
      });

      const embeddingData = await Promise.all(embeddingPromises);

      // Save embeddings to database
      await db.insert(embeddings).values(embeddingData);

      // Update data source as vectorized
      await db
        .update(dataSources)
        .set({ vectorized: true, processed: true })
        .where(eq(dataSources.id, dataSourceId));

      console.log(`✅ Successfully processed ${chunks.length} chunks for data source ${dataSourceId}`);
    } catch (error) {
      console.error('Error processing data source:', error);
      
      // Update as processed but vectorization failed
      try {
        await db
          .update(dataSources)
          .set({ processed: true, vectorized: false })
          .where(eq(dataSources.id, dataSourceId));
      } catch (updateError) {
        console.error('Error updating data source status:', updateError);
      }
      
      throw error;
    }
  }

  // Perform semantic search
  async semanticSearch(chatbotId: string, query: string, limit: number = 5): Promise<Array<{
    content: string;
    similarity: number;
    metadata: any;
  }>> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);

      // Get all embeddings for this chatbot
      const chatbotEmbeddings = await db
        .select()
        .from(embeddings)
        .where(eq(embeddings.chatbotId, chatbotId));

      if (chatbotEmbeddings.length === 0) {
        return [];
      }

      // Calculate cosine similarity
      const results = chatbotEmbeddings.map(embedding => {
        const embeddingVector = JSON.parse(embedding.embedding);
        const similarity = this.cosineSimilarity(queryEmbedding, embeddingVector);
        
        return {
          content: embedding.content,
          similarity,
          metadata: embedding.metadata,
        };
      });

      // Sort by similarity and return top results
      return results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
    } catch (error) {
      console.error('Error performing semantic search:', error);
      throw error;
    }
  }

  // Calculate cosine similarity between two vectors
  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }

  // Semantic search with API key support
  async semanticSearchWithApiKey(chatbotId: string, query: string, apiKey?: string, limit: number = 5): Promise<Array<{
    content: string;
    similarity: number;
    metadata: any;
  }>> {
    try {
      // Generate embedding for the query with API key
      const queryEmbedding = await this.generateEmbedding(query, apiKey);

      // Get all embeddings for this chatbot
      const chatbotEmbeddings = await db
        .select()
        .from(embeddings)
        .where(eq(embeddings.chatbotId, chatbotId));

      if (chatbotEmbeddings.length === 0) {
        return [];
      }

      // Calculate cosine similarity
      const results = chatbotEmbeddings.map(embedding => {
        const embeddingVector = JSON.parse(embedding.embedding);
        const similarity = this.cosineSimilarity(queryEmbedding, embeddingVector);
        
        return {
          content: embedding.content,
          similarity,
          metadata: embedding.metadata,
        };
      });

      // Sort by similarity and return top results
      return results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
    } catch (error) {
      console.error('Error performing semantic search with API key:', error);
      throw error;
    }
  }

  // Get context for RAG
  async getContextForQuery(chatbotId: string, query: string, apiKey?: string): Promise<Array<{content: string; similarity: number; metadata: any}>> {
    const searchResults = await this.semanticSearchWithApiKey(chatbotId, query, apiKey, 3);
    return searchResults;
  }
}

export const vectorService = new VectorService();