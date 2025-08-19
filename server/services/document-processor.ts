import { vectorService } from './qdrant.js';

export class DocumentProcessor {
  
  // Text chunking for better retrieval
  private chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = [];
    let start = 0;
    
    while (start < text.length) {
      let end = start + chunkSize;
      
      // Try to find a good breaking point (sentence end)
      if (end < text.length) {
        const lastSentence = text.lastIndexOf('.', end);
        const lastNewline = text.lastIndexOf('\n', end);
        const lastSpace = text.lastIndexOf(' ', end);
        
        // Use the best breaking point
        if (lastSentence > start + chunkSize * 0.5) {
          end = lastSentence + 1;
        } else if (lastNewline > start + chunkSize * 0.5) {
          end = lastNewline + 1;
        } else if (lastSpace > start + chunkSize * 0.5) {
          end = lastSpace;
        }
      }
      
      const chunk = text.slice(start, end).trim();
      if (chunk) {
        chunks.push(chunk);
      }
      
      start = end - overlap;
      if (start >= text.length) break;
    }
    
    return chunks;
  }
  
  async processTextDocument(
    chatbotId: string,
    documentId: string,
    text: string,
    metadata: Record<string, any> = {}
  ) {
    try {
      // Clean and prepare text
      const cleanText = text.replace(/\s+/g, ' ').trim();
      
      // Split into chunks
      const chunks = this.chunkText(cleanText);
      
      // Prepare chunk data with metadata
      const chunkData = chunks.map((chunk, index) => ({
        text: chunk,
        metadata: {
          ...metadata,
          total_chunks: chunks.length,
          chunk_length: chunk.length
        }
      }));
      
      // Store in vector database
      await vectorService.addDocumentChunks(chatbotId, documentId, chunkData);
      
      return {
        success: true,
        chunksCount: chunks.length,
        totalLength: cleanText.length
      };
    } catch (error) {
      console.error('Error processing document:', error);
      throw new Error('Failed to process document for vector storage');
    }
  }
  
  async processFileUpload(
    chatbotId: string,
    file: any,
    documentId?: string
  ) {
    const docId = documentId || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let text = '';
    const metadata = {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      uploaded_at: new Date().toISOString()
    };
    
    try {
      if (file.mimetype === 'text/plain') {
        text = file.buffer.toString('utf-8');
      } else if (file.mimetype === 'application/json') {
        const jsonData = JSON.parse(file.buffer.toString('utf-8'));
        text = JSON.stringify(jsonData, null, 2);
        (metadata as any).type = 'json';
      } else {
        throw new Error(`Unsupported file type: ${file.mimetype}`);
      }
      
      const result = await this.processTextDocument(chatbotId, docId, text, metadata);
      
      return {
        documentId: docId,
        ...result
      };
    } catch (error) {
      console.error('Error processing file upload:', error);
      throw error;
    }
  }
  
  async processWebURL(
    chatbotId: string,
    url: string,
    content: string,
    documentId?: string
  ) {
    const docId = documentId || `url_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const metadata = {
      source_url: url,
      scraped_at: new Date().toISOString(),
      type: 'web_page'
    };
    
    return await this.processTextDocument(chatbotId, docId, content, metadata);
  }
  
  async getContextForQuery(
    chatbotId: string,
    query: string,
    maxContextLength: number = 3000
  ): Promise<string> {
    try {
      const similarDocs = await vectorService.searchSimilar(chatbotId, query, 5, 0.7);
      
      if (similarDocs.length === 0) {
        return '';
      }
      
      let context = '';
      let currentLength = 0;
      
      for (const doc of similarDocs) {
        const addition = `\n\n--- Source (Score: ${doc.score.toFixed(2)}) ---\n${doc.text}`;
        
        if (currentLength + addition.length > maxContextLength) {
          break;
        }
        
        context += addition;
        currentLength += addition.length;
      }
      
      return context.trim();
    } catch (error) {
      console.error('Error getting context for query:', error);
      return '';
    }
  }
}

export const documentProcessor = new DocumentProcessor();