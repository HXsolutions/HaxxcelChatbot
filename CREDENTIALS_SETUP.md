# Haxxcel Chatbot Platform - Credentials Setup Guide

## Current Configured Credentials

### Vector Database & AI Services
The following credentials are currently configured and active in Replit Secrets:

#### 1. Qdrant Vector Database
- **QDRANT_URL**: Your Qdrant cloud instance URL
- **QDRANT_API_KEY**: Authentication key for Qdrant access
- **Status**: ✅ Connected and working
- **Usage**: Primary vector database for semantic search and embeddings

#### 2. Google AI Services
- **GOOGLE_AI_API_KEY**: Google AI Studio API key
- **Status**: ✅ Connected and working  
- **Usage**: High-quality text embeddings using text-embedding-004 model

#### 3. Database Connection
- **DATABASE_URL**: Supabase PostgreSQL connection with SSL
- **Status**: ✅ Connected with vector extension enabled
- **Usage**: Primary database with pgvector fallback support

## Setup Instructions

### Qdrant Cloud Setup
1. Go to [Qdrant Cloud](https://cloud.qdrant.io/)
2. Create a new cluster
3. Copy the cluster URL (format: `https://your-cluster-id.region.aws.cloud.qdrant.io:6333`)
4. Generate API key from cluster settings
5. Add both to Replit Secrets

### Google AI Studio Setup
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Create or select a project
3. Generate API key from API access section
4. Add to Replit Secrets as `GOOGLE_AI_API_KEY`

### Supabase Database Setup
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create new project or use existing
3. Navigate to Settings > Database
4. Copy connection string from "Connection string" > "Transaction pooler"
5. Replace `[YOUR-PASSWORD]` with your database password
6. Add to Replit Secrets as `DATABASE_URL`

## Current Integration Status

### Vector Database Hybrid System
- **Primary**: Qdrant for production-grade vector operations
- **Fallback**: PostgreSQL with pgvector extension
- **Embeddings**: Google AI text-embedding-004 (768 dimensions)
- **Features**: Document chunking, semantic search, RAG context retrieval

### API Endpoints Available
- `/api/vector/upload` - Document upload and processing
- `/api/vector/add-text` - Direct text content addition
- `/api/vector/add-url` - URL content scraping and processing
- `/api/vector/search` - Semantic similarity search
- `/api/vector/context` - RAG context retrieval
- `/api/vector/chatbots/:id/vector-stats` - Vector database statistics
- `/api/vector-dashboard/health` - System health check
- `/api/vector-dashboard/dashboard/:chatbotId` - Comprehensive dashboard

### Test Results
✅ All 8 vector database tests passing
✅ Qdrant connection established successfully
✅ Google AI embeddings generating 768-dimension vectors
✅ Document processing and chunking working
✅ Semantic search retrieving relevant results
✅ RAG context retrieval functional

## Security Notes
- All credentials stored securely in Replit Secrets
- SSL/TLS encryption for all database connections
- API keys are environment variables, never hardcoded
- Connection pooling configured for optimal performance
- Error handling with automatic fallback systems

## Maintenance
- Monitor API usage limits for Google AI
- Check Qdrant cluster performance regularly
- Backup Supabase database as needed
- Update credentials when rotating API keys

## Support Contacts
- Qdrant: [Qdrant Support](https://qdrant.tech/documentation/)
- Google AI: [Google AI Documentation](https://ai.google.dev/)
- Supabase: [Supabase Support](https://supabase.com/docs)

Last Updated: August 12, 2025