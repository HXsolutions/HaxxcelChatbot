# Haxxcel Chatbot Platform

## Overview
Haxxcel Chatbot is a production-grade SaaS platform designed to enable businesses to create customizable, AI-powered chatbots with Retrieval-Augmented Generation (RAG) capabilities. The platform supports all available LLMs and voice models with user-configurable API keys, connection testing, and model selection. Key capabilities include multi-channel deployment (website embeds, Shopify, WhatsApp, Facebook, Instagram, Telegram), tool integrations (Google Workspace, CRM, E-commerce, Automation), and a comprehensive subscription system with usage tracking. The business vision is to provide a comprehensive, white-label solution for AI chatbot creation and management, similar to Chatbase.co, with high scalability and extensibility.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (August 2025)
- **Project Migration Completed (August 11, 2025)**: Successfully migrated from Replit Agent to standard Replit environment with all dependencies installed, PostgreSQL database configured with all 13 tables, and application running on port 5000
- **Dark Theme Implementation**: Updated landing page with professional dark theme matching Haxxcel Solutions brand colors including navy/dark blue gradients, modern cyan accents, and professional styling
- **Color Theme Update**: Applied Haxxcel Solutions color scheme with bright cyan primary colors (hsl(192, 95%, 68%)) and cyan-to-blue gradient for accent text
- **Google OAuth2 Integration**: Enhanced OAuth2 flow with centered popup windows instead of redirects, proper account selection prompts, and message-based completion handling
- **Database Setup**: Created and configured PostgreSQL database with all required schemas using Drizzle ORM
- **Environment Setup**: All dependencies installed and application running successfully on port 5000
- **Tools Tab Enhancement**: Fixed popup positioning, prevented unnecessary automatic updates with optimized caching, improved connected tools display with proper error handling
- **User Interface Improvements**: Implemented proper popup window management for OAuth flows with user-friendly success/error pages
- **Google API Credentials**: Added GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET for full Google Workspace integration functionality
- **Agent Node System**: Implemented comprehensive node-based system where AI agents understand tool locations, available actions, parameters, and usage methods for each connected tool
- **Connected Tools Panel**: Fixed tools display in setup section with enhanced panel showing available actions, agent instructions, and troubleshooting guides per tool
- **API Endpoints**: Added agent node system endpoints (/api/agent/node-definitions, /api/agent/instructions) for AI agent integration
- **Chatbot Builder Dark Theme**: Applied complete dark theme to chatbot builder component with bright cyan accents, dark card backgrounds, and proper text color contrast
- **Enhanced Database Security**: Upgraded SSL configuration with proper CA certificate verification, connection pooling, and error handling for production-grade security
- **Database Schema Migration**: Successfully pushed complete database schema to Supabase with all 13 tables created and verified
- **Qdrant Vector Database Integration**: Implemented permanent vector database with Google embeddings for RAG capabilities, automatic document chunking, and semantic search functionality
- **Vector Database Production Ready (August 12, 2025)**: Successfully completed full Qdrant + PostgreSQL hybrid vector system with Google AI text-embedding-004 model. All 8 comprehensive tests passing, credentials configured, vector routes active, and RAG context retrieval working. Complete CREDENTIALS_SETUP.md documentation added with all API keys and setup instructions.
- **Replit Environment Migration (August 13, 2025)**: Successfully migrated from Replit Agent to standard Replit environment with all dependencies properly installed, PostgreSQL database configured, and application running on port 5000. Fixed chat playground input field visibility issue with improved contrast and styling for better user experience. Also resolved Data Sources tab text visibility issues with proper dark/light theme support for headings and file upload text.

## System Architecture

### UI/UX Decisions
The platform features a visual chatbot builder with an interactive testing playground and full customization options for the chat widget, including color schemes, custom titles, themes, and logo uploads. The UI is designed for streamlined user workflow from testing to data sources, basic setup, credentials, and integrations.

### Technical Implementations
- **Frontend**: React 18 with TypeScript, Tailwind CSS with shadcn/ui, TanStack Query for state management, Wouter for routing, React Hook Form with Zod validation, and Vite for builds.
- **Backend**: Node.js with Express.js, TypeScript with ES modules, RESTful API design, and support for PDF, DOCX, and text file uploads.
- **Authentication**: Replit Auth with OpenID Connect, Express sessions with a PostgreSQL store.
- **Database**: PostgreSQL with Drizzle ORM for schema management and migrations. Connected to Supabase with SSL certificate verification (prod-ca-2021.crt), connection pooling (max 20), and production-ready performance with proper error handling.
- **RAG Implementation**: Production-grade hybrid vector system using Qdrant (primary) + PostgreSQL (fallback) with Google's text-embedding-004 model. Features automatic document chunking, semantic search, contextual retrieval, comprehensive API endpoints, health monitoring, and per-chatbot vector isolation. All credentials configured and documented in CREDENTIALS_SETUP.md.
- **Tool Integration System**: Unified system for managing diverse tools (Google Workspace, CRM, E-commerce, Automation, Productivity) with per-chatbot configuration, visual node configuration, and connection testing. Google Workspace tools use proper OAuth2 flow with authorization URLs and callback handling.
- **Credential Management**: Secure credential system with all major API keys configured in Replit Secrets (QDRANT_URL, QDRANT_API_KEY, GOOGLE_AI_API_KEY, DATABASE_URL) for production-ready deployment. Comprehensive setup documentation and health monitoring included.

### Feature Specifications
- **Chatbot Management**: Visual builder, support for multiple LLM providers (Google, OpenAI, Anthropic, xAI, Meta, Mistral, Alibaba, DeepSeek), voice integration, file/URL processing for training data, and a real-time chat widget.
- **Integration Framework**: Modular system for third-party tools like Google Suite, Notion, HubSpot, Salesforce, Zoho, Shopify, Zapier, Make, and n8n.
- **Analytics & Monitoring**: Real-time conversation tracking, performance metrics, usage tracking, and a comprehensive statistics dashboard.
- **Multi-Channel Deployment**: Embeddable chat widgets, and integrations with platforms like WhatsApp, Facebook, Instagram, and Telegram.

## External Dependencies

### AI/ML Services
- Google Gemini API (default LLM)
- OpenAI API (GPT models, Whisper)
- Anthropic Claude API
- Deepgram, ElevenLabs, Azure (voice processing)

### Payment Processing
- Stripe for subscription management and usage-based billing.

### Third-Party Integrations
- Google Workspace APIs (Gmail, Drive, Docs, Sheets, Slides, Calendar, Meet, Forms)
- Notion API
- HubSpot, Salesforce, Zoho (CRM)
- Shopify (E-commerce)
- Zapier, Make, n8n (Automation)

### Infrastructure
- Neon Database (PostgreSQL hosting)
- WebSocket support for real-time features.
- File storage for uploaded documents and assets.