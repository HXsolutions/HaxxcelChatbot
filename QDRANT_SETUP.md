# Qdrant Vector Database Setup for Haxxcel Chatbot Platform

## Overview
Permanent Qdrant vector database integration for storing and retrieving training data embeddings using Google's embedding model.

## 🔧 Required Environment Variables

Add these secrets in Replit Secrets tab:

### Qdrant Configuration
```bash
QDRANT_URL=your_qdrant_cluster_url
QDRANT_API_KEY=your_qdrant_api_key
```

### Google AI API Key (for embeddings)
```bash
GOOGLE_AI_API_KEY=your_google_ai_api_key
```

## 🚀 Features Implemented

### Vector Database Services
✅ **Qdrant Client Setup** - Production-ready Qdrant connection
✅ **Google Embeddings** - Using text-embedding-004 model (768 dimensions)
✅ **Document Processing** - Automatic text chunking with overlap
✅ **Collection Management** - Auto-creation of chatbot-specific collections

### API Endpoints Available

#### Upload & Process Documents
```bash
POST /api/vector/chatbots/:chatbotId/documents/upload
- Upload files (text, JSON) for training
- Automatic chunking and vectorization
- Stores in both Qdrant and PostgreSQL
```

#### Process Text Content
```bash
POST /api/vector/chatbots/:chatbotId/documents/text
- Direct text input processing
- Custom titles and metadata
- Chunk-based storage
```

#### Process Web URLs
```bash
POST /api/vector/chatbots/:chatbotId/documents/url
- Process scraped web content
- URL metadata tracking
- Vectorized storage
```

#### Search & Retrieval
```bash
POST /api/vector/chatbots/:chatbotId/search
- Semantic similarity search
- Configurable score thresholds
- Relevance ranking
```

#### Context Retrieval for RAG
```bash
POST /api/vector/chatbots/:chatbotId/context
- Get context for chat queries
- Optimized for chatbot responses
- Length-limited context
```

#### Management Operations
```bash
GET /api/vector/chatbots/:chatbotId/vector-info
- Collection statistics
- Vector count and status

DELETE /api/vector/chatbots/:chatbotId/documents/:documentId
- Remove specific documents

DELETE /api/vector/chatbots/:chatbotId/vector-data
- Clear all chatbot data
```

## 📊 How It Works

### 1. Document Upload Flow
```
File Upload → Text Extraction → Chunking (1000 chars, 200 overlap) → 
Google Embedding → Qdrant Storage → PostgreSQL Metadata
```

### 2. Chunking Strategy
- **Chunk Size**: 1000 characters
- **Overlap**: 200 characters
- **Smart Breaking**: Sentence and paragraph boundaries
- **Metadata**: Chunk index, total chunks, source info

### 3. Vector Search Process
```
Query → Google Embedding → Qdrant Similarity Search → 
Score Filtering (>0.7) → Context Assembly → RAG Response
```

### 4. Collection Structure
```
Collection Name: chatbot_{chatbotId}
Vector Dimension: 768 (Google embedding)
Distance Metric: Cosine similarity
```

## 🔒 Security & Performance

✅ **Per-Chatbot Isolation** - Separate collections for each chatbot
✅ **Metadata Security** - No sensitive data in vector payloads
✅ **Connection Pooling** - Optimized Qdrant client connections
✅ **Error Handling** - Comprehensive error catching and logging
✅ **SSL/TLS** - Secure connections to Qdrant cloud

## 📈 Integration with Existing System

### PostgreSQL Integration
- Vector operations logged in `data_sources` table
- Metadata and previews stored in PostgreSQL
- Full audit trail of processed documents

### Chatbot Builder Integration
- Automatic RAG enabling for new chatbots
- Training data upload in builder interface
- Real-time vector statistics

### Chat Interface Integration
- Context retrieval for every user query
- Relevance-based response enhancement
- Seamless integration with LLM providers

## 🔧 Setup Instructions

### 1. Get Qdrant Cloud Account
1. Visit https://cloud.qdrant.io/
2. Create account and cluster
3. Get cluster URL and API key

### 2. Get Google AI API Key
1. Visit https://makersuite.google.com/app/apikey
2. Create new API key
3. Enable Generative AI API

### 3. Add to Replit Secrets
```bash
QDRANT_URL=https://your-cluster-url.qdrant.tech:6333
QDRANT_API_KEY=your-api-key
GOOGLE_AI_API_KEY=your-google-ai-key
```

### 4. Test Setup
```bash
# Upload test document
curl -X POST "http://localhost:5000/api/vector/chatbots/test-bot/documents/text" \
  -H "Content-Type: application/json" \
  -d '{"text":"Test document content","title":"Test Doc"}'

# Search test
curl -X POST "http://localhost:5000/api/vector/chatbots/test-bot/search" \
  -H "Content-Type: application/json" \
  -d '{"query":"test content","limit":3}'
```

## 🎯 Usage in Chatbot Responses

When a user sends a message:
1. System generates embedding for user query
2. Searches Qdrant for similar content (score > 0.7)
3. Assembles relevant context (max 3000 chars)
4. Sends to LLM with context + user query
5. LLM generates informed response

## 📊 Performance Expectations

- **Upload Speed**: ~100ms per chunk (1000 chars)
- **Search Speed**: ~50ms per query
- **Context Assembly**: ~20ms
- **Total RAG Overhead**: ~100ms per chat message

Your Haxxcel Chatbot Platform now has enterprise-grade vector search capabilities!