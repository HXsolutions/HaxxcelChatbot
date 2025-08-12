# Database Configuration - Haxxcel Chatbot Platform

## Connection Details
- **Provider**: Supabase (PostgreSQL)
- **Database URL**: `postgresql://postgres.zyvxtjekwsbfqrttnqqi:HaxxcelCh%40tbot1%21@aws-0-us-west-1.pooler.supabase.com:6543/postgres`
- **SSL**: Enabled with CA certificate verification
- **CA Certificate**: `certs/prod-ca-2021.crt` (Supabase Root 2021 CA)

## SSL Configuration
- **SSL Mode**: Required with certificate verification
- **CA Certificate**: Supabase Root 2021 CA certificate
- **Certificate Location**: `/certs/prod-ca-2021.crt`
- **Reject Unauthorized**: `true` (secure connection)

## Pool Configuration
- **Max Connections**: 20
- **Idle Timeout**: 30 seconds
- **Connection Timeout**: 2 seconds
- **Error Handling**: Automatic process exit on pool errors

## Database Tables (13 Total)
✅ All tables successfully created and verified:

1. **analytics** - Usage analytics and metrics
2. **chatbots** - Chatbot configurations
3. **conversations** - Chat conversation records
4. **data_sources** - Training data sources
5. **deployments** - Deployment configurations
6. **embeddings** - Vector embeddings for RAG
7. **integrations** - Third-party integrations
8. **messages** - Individual chat messages
9. **sessions** - User session management
10. **tool_connections** - Connected tool configurations
11. **tool_nodes** - Agent node system definitions
12. **user_credentials** - Encrypted API keys and credentials
13. **users** - User accounts and authentication

## Environment Variables
- `DATABASE_URL` - Complete Supabase PostgreSQL connection string
- SSL certificates automatically loaded from `/certs/` directory

## Connection Status
✅ **ACTIVE** - Database connection verified and working
✅ **SECURE** - SSL encryption with certificate verification
✅ **READY** - All schemas pushed and tables created