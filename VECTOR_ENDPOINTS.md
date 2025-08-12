# Vector Database API Endpoints Documentation

## Overview
Complete documentation for Haxxcel Chatbot Platform vector database API endpoints. All endpoints are production-ready with comprehensive error handling and validation.

## Base Configuration
- **Primary Vector DB**: Qdrant Cloud
- **Fallback Vector DB**: PostgreSQL with pgvector extension  
- **Embeddings**: Google AI text-embedding-004 (768 dimensions)
- **Authentication**: Required for most endpoints via Replit Auth

## Vector Operation Endpoints

### 1. Document Upload and Processing
```
POST /api/vector/upload/:chatbotId
```
**Purpose**: Upload and process documents (PDF, DOCX, TXT) for vector storage

**Parameters**:
- `chatbotId` (path): Unique chatbot identifier
- `files` (multipart): Document files to process

**Response**:
```json
{
  "success": true,
  "documentsAdded": 3,
  "totalChunks": 15,
  "message": "Documents processed successfully"
}
```

### 2. Add Text Content
```
POST /api/vector/add-text/:chatbotId
```
**Purpose**: Add raw text content directly to vector database

**Body**:
```json
{
  "title": "Document Title",
  "text": "Content to be processed...",
  "metadata": {
    "category": "knowledge",
    "priority": "high"
  }
}
```

**Response**:
```json
{
  "success": true,
  "documentId": "doc_12345",
  "chunksCreated": 5
}
```

### 3. Add URL Content
```
POST /api/vector/add-url/:chatbotId
```
**Purpose**: Scrape and process content from URLs

**Body**:
```json
{
  "url": "https://example.com/article",
  "title": "Optional custom title"
}
```

**Response**:
```json
{
  "success": true,
  "documentId": "doc_67890",
  "contentLength": 2048,
  "chunksCreated": 3
}
```

### 4. Semantic Search
```
GET /api/vector/search/:chatbotId
```
**Purpose**: Search for semantically similar content

**Query Parameters**:
- `query` (required): Search query text
- `limit` (optional): Number of results (default: 5, max: 10)
- `threshold` (optional): Similarity threshold (default: 0.5, min: 0.1)

**Response**:
```json
{
  "results": [
    {
      "id": "chunk_123",
      "title": "Document Title",
      "content": "Relevant content...",
      "similarity": 0.89,
      "metadata": {
        "category": "knowledge"
      }
    }
  ],
  "totalResults": 5,
  "query": "search query"
}
```

### 5. RAG Context Retrieval
```
GET /api/vector/context/:chatbotId
```
**Purpose**: Get contextual information for RAG-enhanced responses

**Query Parameters**:
- `query` (required): Query for context retrieval
- `maxLength` (optional): Maximum context length (default: 3000, max: 5000)

**Response**:
```json
{
  "context": "Combined relevant context from multiple sources...",
  "contextLength": 2048,
  "sourceCount": 3,
  "query": "context query"
}
```

### 6. Vector Statistics
```
GET /api/vector/chatbots/:chatbotId/vector-stats
```
**Purpose**: Get comprehensive vector database statistics

**Response**:
```json
{
  "totalDocuments": 25,
  "totalChunks": 150,
  "avgSimilarity": 0.76,
  "vectorService": "Qdrant"
}
```

## Dashboard and Monitoring Endpoints

### 7. Vector Dashboard
```
GET /api/vector-dashboard/dashboard/:chatbotId
```
**Purpose**: Comprehensive dashboard with statistics and recent documents

**Response**:
```json
{
  "statistics": {
    "totalDocuments": 25,
    "totalChunks": 150,
    "avgSimilarity": 0.76,
    "vectorService": "Qdrant"
  },
  "recentDocuments": [
    {
      "id": "doc_1",
      "name": "Document Name",
      "type": "pdf",
      "status": "processed",
      "createdAt": "2025-08-12T13:30:00Z",
      "chunkCount": 8
    }
  ],
  "serviceStatus": {
    "postgresqlAvailable": true,
    "activeService": "Qdrant"
  },
  "capabilities": {
    "documentUpload": true,
    "textProcessing": true,
    "urlScraping": true,
    "semanticSearch": true,
    "contextRetrieval": true,
    "ragIntegration": true
  }
}
```

### 8. Health Check
```
GET /api/vector-dashboard/health
```
**Purpose**: System health and service status

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-08-12T13:30:00Z",
  "services": {
    "postgresqlAvailable": true,
    "activeService": "Qdrant"
  },
  "vectorDatabase": "Qdrant + PostgreSQL fallback",
  "embeddings": "Google AI text-embedding-004"
}
```

## Error Handling

### Common Error Responses
```json
{
  "error": true,
  "message": "Descriptive error message",
  "code": "ERROR_CODE",
  "details": "Additional error details"
}
```

### HTTP Status Codes
- `200`: Success
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (missing authentication)
- `404`: Not Found (invalid chatbot ID)
- `413`: Payload Too Large (file size limit exceeded)
- `429`: Too Many Requests (rate limiting)
- `500`: Internal Server Error

## Rate Limiting
- Upload endpoints: 10 requests/minute per chatbot
- Search endpoints: 100 requests/minute per chatbot
- Dashboard endpoints: 20 requests/minute per user

## File Upload Limits
- Maximum file size: 10MB per file
- Supported formats: PDF, DOCX, TXT
- Maximum files per request: 5
- Content must be at least 10 characters

## Usage Examples

### JavaScript/TypeScript Client
```typescript
// Upload documents
const formData = new FormData();
formData.append('files', fileInput.files[0]);

const response = await fetch(`/api/vector/upload/${chatbotId}`, {
  method: 'POST',
  body: formData
});

// Search for content
const searchResponse = await fetch(
  `/api/vector/search/${chatbotId}?query=${encodeURIComponent(searchQuery)}&limit=5`
);
const results = await searchResponse.json();

// Get RAG context
const contextResponse = await fetch(
  `/api/vector/context/${chatbotId}?query=${encodeURIComponent(ragQuery)}&maxLength=2000`
);
const context = await contextResponse.json();
```

### cURL Examples
```bash
# Upload document
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@document.pdf" \
  "https://your-domain.replit.app/api/vector/upload/chatbot-123"

# Search content
curl -G \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "query=AI chatbot features" \
  -d "limit=3" \
  "https://your-domain.replit.app/api/vector/search/chatbot-123"
```

## Integration Notes
- All endpoints support CORS for cross-origin requests
- Responses include appropriate caching headers
- Vector operations are optimized for production performance
- Automatic fallback from Qdrant to PostgreSQL ensures reliability
- Comprehensive logging for debugging and monitoring

Last Updated: August 12, 2025