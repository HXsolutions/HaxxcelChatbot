import { pgVectorService } from './pgVectorService.js';

export class SimpleVectorService {
  // Unified interface that uses PostgreSQL as the primary vector store
  
  async addDocument(
    chatbotId: string,
    title: string,
    content: string,
    type: string = 'text',
    metadata: any = {}
  ): Promise<string> {
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
    return await pgVectorService.searchSimilar(chatbotId, query, limit, threshold);
  }

  async getContextForQuery(
    chatbotId: string,
    query: string,
    maxLength: number = 3000
  ): Promise<string> {
    return await pgVectorService.getContextForQuery(chatbotId, query, maxLength);
  }

  async getVectorStats(chatbotId: string): Promise<{
    totalDocuments: number;
    totalChunks: number;
    avgSimilarity: number;
    vectorService: string;
  }> {
    const stats = await pgVectorService.getVectorStats(chatbotId);
    return {
      ...stats,
      vectorService: 'PostgreSQL'
    };
  }

  getServiceStatus(): {
    postgresqlAvailable: boolean;
    activeService: string;
  } {
    return {
      postgresqlAvailable: true,
      activeService: 'PostgreSQL'
    };
  }
}

// Export singleton instance
export const simpleVectorService = new SimpleVectorService();