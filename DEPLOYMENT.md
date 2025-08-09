# Deployment Guide - Haxxcel Chatbot Platform

## ✅ Permanent Supabase Database Connected

Your Haxxcel Chatbot Platform is configured with a permanent Supabase database that persists across all deployments and team members.

**Database Connection**: `postgresql://postgres.zyvxtjekwsbfqrttnqqi:HaxxcelCh%40tbot1%21@aws-0-us-west-1.pooler.supabase.com:6543/postgres`

## Deploy Anywhere - Data Stays Same

### 🚀 Vercel Deployment
```bash
# 1. Clone/fork this repo
git clone <your-repo>
cd haxxcel-chatbot-platform

# 2. Install Vercel CLI
npm i -g vercel

# 3. Set environment variable
vercel env add DATABASE_URL
# Paste: postgresql://postgres.zyvxtjekwsbfqrttnqqi:HaxxcelCh%40tbot1%21@aws-0-us-west-1.pooler.supabase.com:6543/postgres

# 4. Deploy
vercel --prod
```

### 🚂 Railway Deployment
```bash
# 1. Connect GitHub repo to Railway
# 2. Add environment variable in Railway dashboard:
DATABASE_URL=postgresql://postgres.zyvxtjekwsbfqrttnqqi:HaxxcelCh%40tbot1%21@aws-0-us-west-1.pooler.supabase.com:6543/postgres

# 3. Deploy automatically from GitHub
```

### ✈️ Fly.io Deployment
```bash
# 1. Install Fly CLI and login
flyctl auth login

# 2. Initialize app
flyctl launch

# 3. Set environment variable
flyctl secrets set DATABASE_URL="postgresql://postgres.zyvxtjekwsbfqrttnqqi:HaxxcelCh%40tbot1%21@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

# 4. Deploy
flyctl deploy
```

### 🌐 Netlify Deployment
```bash
# 1. Build the project
npm run build

# 2. Deploy to Netlify
# 3. Add environment variable in Netlify dashboard:
DATABASE_URL=postgresql://postgres.zyvxtjekwsbfqrttnqqi:HaxxcelCh%40tbot1%21@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

## Team Collaboration

### New Team Member Setup
```bash
# 1. Clone the repository
git clone <your-repo>
cd haxxcel-chatbot-platform

# 2. Install dependencies
npm install

# 3. Set environment variable in Replit secrets or .env.local:
DATABASE_URL=postgresql://postgres.zyvxtjekwsbfqrttnqqi:HaxxcelCh%40tbot1%21@aws-0-us-west-1.pooler.supabase.com:6543/postgres

# 4. Start development
npm run dev
```

### Import to New Replit Account
1. **Fork/Import** this Replit project
2. **Add Secret**: Go to Secrets tab (🔒) and add:
   - Key: `DATABASE_URL`
   - Value: `postgresql://postgres.zyvxtjekwsbfqrttnqqi:HaxxcelCh%40tbot1%21@aws-0-us-west-1.pooler.supabase.com:6543/postgres`
3. **Run**: The application will automatically connect to the same database

## Data Persistence Benefits

✅ **Cross-Platform**: Same data on Replit, Vercel, Railway, Fly.io, etc.  
✅ **Team Sync**: All developers see same users, chatbots, conversations  
✅ **Zero Downtime**: Switch hosting without losing data  
✅ **Production Ready**: Supabase handles scaling, backups, security  
✅ **Real-time**: Built-in WebSocket support for live features  

## Environment Variables Required

| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_URL` | `postgresql://postgres.zyvxtjekwsbfqrttnqqi:HaxxcelCh%40tbot1%21@aws-0-us-west-1.pooler.supabase.com:6543/postgres` | Supabase database connection |
| `NODE_ENV` | `production` | Production environment |
| `PORT` | `5000` | Application port (auto-set by most hosts) |

## Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Start production server  
npm run start

# Database operations
npm run db:push    # Push schema changes
```

## Monitoring

- **Supabase Dashboard**: https://supabase.com/dashboard/projects
- **Database Metrics**: Monitor usage, performance, connections
- **Real-time Logs**: View API calls and errors
- **Backup Status**: Automatic daily backups enabled

Your data is now permanent and accessible from anywhere! 🌍