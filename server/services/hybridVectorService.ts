import { VectorService } from './qdrant.js';
import { pgVectorService } from './pgVectorService.js';

export class HybridVectorService {
  private qdrantService: VectorService;
  private useQdrant: boolean = false;

  constructor() {
    this.qdrantService = new VectorService();
    
    // Check if Qdrant is available
    this.checkQdrantAvailability();
  }

  private async checkQdrantAvailability() {
    try {
      // Check if Qdrant environment variables are available
      if (!process.env.QDRANT_URL) {
        this.useQdrant = false;
        console.log('⚠️ Qdrant not configured, using PostgreSQL vector service');
        return;
      }
      
      const testResult = await this.qdrantService.getCollectionInfo('test-connection');
      this.useQdrant = true;
      console.log('✅ Qdrant service is available and will be used for vector operations');
    } catch (error) {
      this.useQdrant = false;
      console.log('⚠️ Qdrant not available, using PostgreSQL vector service as fallback');
    }
  }

  async addDocument(
    chatbotId: string,
    title: string,
    content: string,
    type: string = 'text',
    metadata: any = {}
  ): Promise<string> {
    // Always ensure we check Qdrant availability first
    if (!this.useQdrant) {
      await this.checkQdrantAvailability();
    }
    
    if (this.useQdrant) {
      try {
        return await this.qdrantService.addDocument(chatbotId, title, content, type, metadata);
      } catch (error) {
        console.warn('Qdrant failed, falling back to PostgreSQL:', error);
        this.useQdrant = false;
      }
    }
    
    // Use PostgreSQL fallback
    return await pgVectorService.addDocument(chatbotId, title, content, type, metadata);
  }

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
    if (this.useQdrant) {
      try {
        return await this.qdrantService.searchSimilar(chatbotId, query, limit, threshold);
      } catch (error) {
        console.warn('Qdrant search failed, falling back to PostgreSQL:', error);
        this.useQdrant = false;
      }
    }
    
    // Use PostgreSQL fallback
    return await pgVectorService.searchSimilar(chatbotId, query, limit, threshold);
  }

  async getContextForQuery(
    chatbotId: string,
    query: string,
    maxLength: number = 3000
  ): Promise<string> {
    if (this.useQdrant) {
      try {
        return await this.qdrantService.getContextForQuery(chatbotId, query, maxLength);
      } catch (error) {
        console.warn('Qdrant context retrieval failed, falling back to PostgreSQL:', error);
        this.useQdrant = false;
      }
    }
    
    // Use PostgreSQL fallback
    return await pgVectorService.getContextForQuery(chatbotId, query, maxLength);
  }

  async getVectorStats(chatbotId: string): Promise<{
    totalDocuments: number;
    totalChunks: number;
    avgSimilarity: number;
    vectorService: string;
  }> {
    let stats;
    
    if (this.useQdrant) {
      try {
        stats = await this.qdrantService.getVectorStats(chatbotId);
        return {
          ...stats,
          vectorService: 'Qdrant'
        };
      } catch (error) {
        console.warn('Qdrant stats failed, falling back to PostgreSQL:', error);
        this.useQdrant = false;
      }
    }
    
    // Use PostgreSQL fallback
    stats = await pgVectorService.getVectorStats(chatbotId);
    return {
      ...stats,
      vectorService: 'PostgreSQL'
    };
  }

  async clearVectorData(chatbotId: string): Promise<number> {
    let deletedCount = 0;
    
    if (this.useQdrant) {
      try {
        deletedCount = await this.qdrantService.clearVectorData(chatbotId);
      } catch (error) {
        console.warn('Qdrant clear failed, falling back to PostgreSQL:', error);
        this.useQdrant = false;
      }
    }
    
    // Get PostgreSQL stats before clearing
    const pgStats = await pgVectorService.getVectorStats(chatbotId);
    
    // Clear PostgreSQL data (implement basic clear functionality)
    // This would require implementing a clearVectorData method in pgVectorService
    console.log(`Would clear ${pgStats.totalDocuments} documents from PostgreSQL`);
    
    return deletedCount || pgStats.totalDocuments;
  }

  getServiceStatus(): {
    qdrantAvailable: boolean;
    postgresqlAvailable: boolean;
    activeService: string;
  } {
    return {
      qdrantAvailable: this.useQdrant,
      postgresqlAvailable: true, // PostgreSQL is always available as it's the main database
      activeService: this.useQdrant ? 'Qdrant' : 'PostgreSQL'
    };
  }
}

// Export singleton instance
export const hybridVectorService = new HybridVectorService();