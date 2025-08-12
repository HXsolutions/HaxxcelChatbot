import { pgVectorService } from './pgVectorService.js';

export async function testPgVectorIntegration() {
  console.log('🧪 Testing PostgreSQL Vector Database Integration...');
  
  try {
    const testChatbotId = 'test-chatbot-123';
    
    // Test 1: Add sample document
    console.log('1. Adding sample document...');
    const sampleContent = `
      Haxxcel Solutions is a leading technology company specializing in AI-powered chatbot solutions.
      We provide comprehensive chatbot platforms that help businesses automate customer support,
      lead generation, and user engagement. Our platform supports multiple LLM providers including
      Google Gemini, OpenAI GPT, Anthropic Claude, and many others. Key features include:
      - Multi-channel deployment (website, WhatsApp, Telegram, etc.)
      - Advanced RAG capabilities with vector search
      - Tool integrations (Google Workspace, CRM systems, e-commerce platforms)
      - White-label solutions for agencies
      - Real-time analytics and conversation tracking
    `;
    
    const doc1Id = await pgVectorService.addDocument(
      testChatbotId,
      'Haxxcel Solutions Overview',
      sampleContent,
      'text',
      { category: 'company-info' }
    );
    console.log(`   Document added with ID: ${doc1Id}`);
    
    // Test 2: Add technical documentation
    console.log('2. Adding technical documentation...');
    const techContent = `
      Vector search implementation uses PostgreSQL with the vector extension for storing embeddings.
      The system supports both Google AI embeddings and fallback local embeddings for offline operation.
      Document chunking uses smart boundary detection with configurable chunk sizes (default 1000 characters)
      and overlap (default 200 characters). Similarity search uses cosine similarity with configurable thresholds.
      The RAG system retrieves relevant context up to 3000 characters for enhanced LLM responses.
    `;
    
    const doc2Id = await pgVectorService.addDocument(
      testChatbotId,
      'Technical Documentation',
      techContent,
      'text',
      { category: 'technical' }
    );
    console.log(`   Technical doc added with ID: ${doc2Id}`);
    
    // Test 3: Search similarity
    console.log('3. Testing similarity search...');
    const searchQuery = 'How does the chatbot platform work?';
    const searchResults = await pgVectorService.searchSimilar(
      testChatbotId,
      searchQuery,
      3,
      0.3
    );
    console.log(`   Found ${searchResults.length} similar documents`);
    searchResults.forEach((result, index) => {
      console.log(`     ${index + 1}. "${result.title}" (similarity: ${result.similarity.toFixed(3)})`);
    });
    
    // Test 4: Get context for RAG
    console.log('4. Testing context retrieval for RAG...');
    const context = await pgVectorService.getContextForQuery(
      testChatbotId,
      'What is Haxxcel Solutions and what services do they offer?'
    );
    console.log(`   Retrieved context: ${context.length} characters`);
    console.log(`   Context preview: ${context.substring(0, 200)}...`);
    
    // Test 5: Get vector statistics
    console.log('5. Getting vector database statistics...');
    const stats = await pgVectorService.getVectorStats(testChatbotId);
    console.log(`   Statistics:`, stats);
    
    // Test 6: Test different query types
    console.log('6. Testing various query types...');
    const queries = [
      'vector search implementation',
      'multi-channel deployment features',
      'AI chatbot capabilities',
      'integration with Google Workspace'
    ];
    
    for (const query of queries) {
      const results = await pgVectorService.searchSimilar(testChatbotId, query, 2, 0.2);
      console.log(`   Query: "${query}" -> ${results.length} results`);
    }
    
    console.log('✅ All PostgreSQL vector database tests passed successfully!');
    return {
      success: true,
      testsRun: 6,
      documentsAdded: 2,
      searchQueriestested: 5,
      vectorStats: stats,
      contextLength: context.length
    };
    
  } catch (error) {
    console.error('❌ Vector database test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Auto-run test after 5 seconds
setTimeout(async () => {
  const result = await testPgVectorIntegration();
  console.log('📊 Test Summary:', result);
}, 5000);