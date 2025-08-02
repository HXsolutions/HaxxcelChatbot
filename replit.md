# Haxxcel Chatbot Platform - SaaS Architecture Overview

## Overview

This is a production-grade SaaS platform called "Haxxcel Chatbot" (similar to Chatbase.co) designed to enable businesses to create customizable, AI-powered chatbots with Retrieval-Augmented Generation (RAG) capabilities. The platform supports all available LLMs and voice models with user-configurable API keys, connection testing, and model selection. Google is the default provider for all models. The platform follows a modern full-stack architecture with React frontend, Express.js backend, and PostgreSQL database using Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (August 1, 2025)

### Database Connection Fixed (August 1, 2025)
- **Issue Resolution**: Fixed SASL authentication errors preventing user registration/login
- **Database Migration**: Switched from Neon serverless to standard node-postgres driver for better compatibility
- **Database Provider**: Now using Replit-provided PostgreSQL database for reliable connections
- **Authentication Status**: ✅ Registration and login working properly
- **Session Management**: ✅ PostgreSQL session store functioning correctly
- **User Creation**: ✅ Users can successfully register and authenticate

### Chatbot Builder UI Improvements (August 1, 2025)
- **Header Context**: Fixed header to show contextual information when in builder mode (Create New Chatbot / Edit Chatbot)
- **Button Repositioning**: Moved create/update chatbot button from bottom to top of the builder form for better user experience
- **Navigation**: Added "Back to List" button in header when in builder mode instead of redundant "New Chatbot" button
- **User Flow**: Eliminated confusion with redundant "Create and manage your AI chatbots" text when already creating a chatbot

## Previous Changes (January 27, 2025)

### Vector Database RAG Implementation (January 30, 2025)
- **Vector Database**: Implemented pgvector extension in Supabase for semantic search and RAG functionality
- **Embeddings Table**: Added embeddings table to store text chunks with OpenAI embeddings (1536 dimensions)
- **Vector Service**: Created comprehensive VectorService with text chunking, embedding generation, and semantic search
- **Automatic Processing**: Data sources are automatically chunked and vectorized when uploaded
- **RAG Integration**: Semantic search provides relevant context for chatbot responses
- **API Endpoints**: Added /vectorize, /search, and /context endpoints for vector operations
- **Real-time Processing**: Content is processed and made searchable immediately upon upload
- **Production Ready**: Full RAG pipeline from data ingestion to semantic retrieval

### Migration to Replit Environment Complete (August 1, 2025)
- **Migration Status**: ✅ Successfully migrated from Replit Agent to standard Replit environment  
- **Database Setup**: ✅ **PERMANENT SUPABASE DATABASE CONNECTED**
- **Authentication System**: ✅ Fixed redirect issues, login/signup works properly
- **Application Status**: ✅ Fully functional React + Express app running on port 5000
- **TypeScript Issues**: ✅ Resolved all compilation errors for production readiness
- **Package Dependencies**: ✅ All required packages installed and working
- **Data Persistence**: ✅ **Database persists across all deployments and team members**
- **Cross-Platform**: ✅ **Same data on Replit, Vercel, Railway, Fly.io, anywhere**
- **Team Collaboration**: ✅ **All team members access same database with shared data**
- **Connection String**: `postgresql://postgres.zyvxtjekwsbfqrttnqqi:HaxxcelCh%40tbot1%21@aws-0-us-west-1.pooler.supabase.com:6543/postgres`
- **Deployment Ready**: ✅ **Can be deployed anywhere with same DATABASE_URL**
- **Team Setup**: ✅ **Created TEAM_SETUP.md for new team members and account imports**
- **Documentation Updated**: ✅ **Complete instructions for persistent database across all platforms**

### Enhanced Chatbot Builder with Testing Playground
- **Playground Tab**: Added interactive testing playground as the first tab for real-time chatbot testing
- **Data Sources Separation**: Moved data source configuration to dedicated tab for better organization
- **Full Customization Options**: Added comprehensive chat widget customization including:
  - Header color and chat bubble color selection with color pickers
  - Custom chat title and subtitle configuration
  - Light/dark theme selection for chat window
  - Logo upload capability for header branding
  - Default bot message configuration
  - Real-time preview integration with playground
- **Live Preview**: All Basic Setup changes reflect instantly in the Playground tab
- **Database Schema Update**: Added new customization fields to chatbots table
- **User Experience**: Streamlined workflow from playground testing → data sources → basic setup → credentials → integrations
- **Save Button Fix**: Fixed issue where individual tab save buttons were creating chatbots - now only main "Create Chatbot" button creates the chatbot while individual tabs just save settings

### Chatbot Builder UI Improvements
- **Fixed "No Chatbots" Issue**: Resolved issue where "no chatbots yet" message appeared during chatbot creation
- **Streamlined Basic Setup**: Removed integrations and deployment sections from basic setup tab (available in separate tabs)
- **Improved User Flow**: Basic setup now focuses on core chatbot configuration only
- **Data Source Note**: Added informational note about data source configuration being available after creation

### Haxxcel Chatbot Platform Implementation According to Specification
- **Complete Platform Rebuild**: Implemented according to official Haxxcel specification document
- **Enhanced LLM Support**: Added support for all major providers (Google default, OpenAI, Anthropic, xAI, Meta, Mistral, Alibaba, DeepSeek)
- **Voice Integration**: Full voice provider support (Google Cloud Speech default, Whisper, Deepgram, ElevenLabs, Azure)
- **Per-Chatbot Credentials**: Each chatbot has separate API keys, integrations, and deployment credentials
- **Chat Widget**: Created production-ready chat widget with "Powered by Haxxcel Solutions" footer (removable for Enterprise)
- **Subscription System**: Implemented Starter, Pro, Enterprise plans with usage tracking and white-label support
- **Multi-Channel Deployment**: Website embeds, Shopify, WhatsApp, Facebook, Instagram, Telegram support
- **Tool Integrations**: Google Suite, Notion, HubSpot, Salesforce, Zoho, Shopify, automation platforms

### User-Managed Credentials System (Previous)
- **Architecture Change**: Moved from platform-wide API keys to user-managed credential system
- **New Database Table**: Added `user_credentials` table for secure storage of user API keys
- **Credential Management**: Each chatbot can have separate credentials configured during creation
- **Integration Approach**: Credentials managed per-chatbot basis, not globally
- **Workflow**: API keys configured during chatbot creation, integrations added per-chatbot, deployments configured per-chatbot
- **Security**: Each user stores their own encrypted credentials instead of sharing platform keys
- **Credential Types**: Support for LLM API keys, voice API keys, integration credentials, deployment credentials, and payment configuration

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store
- **API Design**: RESTful endpoints with proper error handling
- **File Processing**: Support for PDF, DOCX, and text file uploads

### Database Architecture
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Drizzle ORM with migrations
- **Schema**: Comprehensive schema supporting users, chatbots, conversations, messages, data sources, integrations, analytics, and deployments

## Key Components

### Authentication System
- Uses Replit Auth with OpenID Connect for secure authentication
- Session-based authentication with PostgreSQL session storage
- Role-based access control (Standard User, Admin)
- Multi-factor authentication support planned

### Chatbot Management
- Visual chatbot builder with configuration options
- Support for multiple LLM providers (Google, OpenAI, Anthropic, xAI, Meta, etc.)
- Voice integration capabilities with multiple providers
- File upload and URL crawling for training data
- Real-time chat widget for testing and deployment

### Integration Framework
- Modular integration system for third-party tools
- Support for Google Suite, Notion, HubSpot, Salesforce, Zoho, Shopify
- Webhook and API key authentication methods
- Extensible architecture for adding new integrations

### Analytics and Monitoring
- Real-time conversation tracking
- Performance metrics and response time monitoring
- Usage tracking for billing and limits
- Dashboard with comprehensive statistics

### Multi-Channel Deployment
- Website embedding with customizable chat widget
- Support for WhatsApp, Facebook, Instagram, Telegram
- Shopify integration for e-commerce
- Webhook-based deployment system

## Data Flow

1. **User Authentication**: Users authenticate via Replit Auth, sessions stored in PostgreSQL
2. **Chatbot Creation**: Users configure chatbots through the builder interface
3. **Data Processing**: Files and URLs are processed and stored as data sources
4. **Conversation Handling**: Real-time chat processing with chosen LLM providers
5. **Analytics Collection**: Conversation data stored for analytics and billing
6. **Multi-Channel Distribution**: Chatbots deployed across various channels

## External Dependencies

### AI/ML Services
- Google Gemini API for LLM capabilities
- OpenAI API for GPT models and Whisper
- Anthropic Claude API
- Various voice processing services (Google, Deepgram, ElevenLabs)

### Payment Processing
- Stripe integration for subscription management
- Support for multiple pricing tiers (Starter, Pro, Enterprise)
- Usage-based billing with API call tracking

### Third-Party Integrations
- Google Suite APIs for productivity tools
- Notion API for knowledge management
- CRM integrations (HubSpot, Salesforce, Zoho)
- E-commerce platforms (Shopify)
- Automation tools (Zapier, Make, n8n)

### Infrastructure
- Neon Database for PostgreSQL hosting
- WebSocket support for real-time features
- File storage for uploaded documents and assets

## Deployment Strategy

### Development Environment
- Replit-hosted development with hot reloading
- Vite dev server for frontend development
- Environment-based configuration management

### Production Deployment
- Static asset building with Vite
- Server bundle creation with esbuild
- Environment variable configuration for different stages
- Database migrations managed through Drizzle Kit

### Scalability Considerations
- Serverless-compatible database (Neon)
- Stateless server architecture
- Horizontal scaling capability through load balancing
- CDN integration for static assets

### Security Features
- HTTPS enforcement
- CORS configuration
- Rate limiting implementation
- API key management for external services
- Session security with HTTP-only cookies

The architecture is designed to be highly scalable, maintainable, and extensible, supporting both current requirements and future growth as a comprehensive chatbot platform solution.