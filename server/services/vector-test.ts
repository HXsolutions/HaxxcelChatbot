import { vectorService } from './qdrant.js';
import { documentProcessor } from './document-processor.js';

export async function testVectorIntegration() {
  console.log('🧪 Testing Qdrant Vector Database Integration...');
  
  try {
    // Test 1: Check configuration
    console.log('1. Checking vector service configuration...');
    const testChatbotId = 'test-chatbot-123';
    
    // Test 2: Collection info (should create if not exists)
    console.log('2. Getting collection info...');
    const collectionInfo = await vectorService.getCollectionInfo(testChatbotId);
    console.log('   Collection info:', collectionInfo);
    
    // Test 3: Generate embedding
    console.log('3. Testing Google embedding generation...');
    const testText = 'This is a test document for vector database integration.';
    const embedding = await vectorService.generateEmbedding(testText);
    console.log(`   Generated embedding with ${embedding.length} dimensions`);
    
    // Test 4: Add document
    console.log('4. Adding test document...');
    await vectorService.addDocument(
      testChatbotId,
      'test-doc-1',
      testText,
      { title: 'Test Document', type: 'test' }
    );
    console.log('   Document added successfully');
    
    // Test 5: Search similar documents
    console.log('5. Testing similarity search...');
    const searchResults = await vectorService.searchSimilar(
      testChatbotId,
      'test document integration',
      3,
      0.5
    );
    console.log(`   Found ${searchResults.length} similar documents`);
    
    // Test 6: Get context for query
    console.log('6. Testing context retrieval...');
    const context = await documentProcessor.getContextForQuery(
      testChatbotId,
      'vector database test'
    );
    console.log(`   Retrieved context: ${context.length} characters`);
    
    // Test 7: Process text chunks
    console.log('7. Testing document processing...');
    const processResult = await documentProcessor.processTextDocument(
      testChatbotId,
      'test-doc-2',
      'This is a longer test document that will be chunked into smaller pieces for better retrieval. It contains multiple sentences and paragraphs to test the chunking algorithm.',
      { title: 'Chunked Document', type: 'test' }
    );
    console.log(`   Processed document into ${processResult.chunksCount} chunks`);
    
    // Test 8: Final collection stats
    console.log('8. Final collection statistics...');
    const finalInfo = await vectorService.getCollectionInfo(testChatbotId);
    console.log('   Final collection info:', finalInfo);
    
    console.log('✅ All vector database tests passed successfully!');
    return {
      success: true,
      tests: 8,
      embedding_dimensions: embedding.length,
      collection_info: finalInfo,
      context_length: context.length,
      chunks_created: processResult.chunksCount
    };
    
  } catch (error) {
    console.error('❌ Vector database test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Auto-run test if this file is executed directly
if (process.env.NODE_ENV === 'development') {
  // Run test after a short delay to ensure services are initialized
  setTimeout(async () => {
    const result = await testVectorIntegration();
    console.log('\n📊 Test Summary:', result);
  }, 5000);
}