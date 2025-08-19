# Haxxcel Chatbot Platform

A comprehensive SaaS platform for building AI-powered chatbots with **permanent Supabase database persistence**.

## ✅ Permanent Data Persistence

**Your data persists everywhere:**
- ✅ Same database on any Replit account
- ✅ Deploy to Vercel, Railway, Fly.io with same data
- ✅ Team members access identical database
- ✅ Zero data loss when switching platforms

## 🚀 Quick Setup for Team Members

### Replit Account Import
1. **Fork/Import** this project to your Replit account
2. **Add Database Secret**:
   - Go to Secrets tab (🔒) in Replit sidebar
   - Add new secret:
     - **Key**: `DATABASE_URL`
     - **Value**: `postgresql://postgres.zyvxtjekwsbfqrttnqqi:HaxxcelCh%40tbot1%21@aws-0-us-west-1.pooler.supabase.com:6543/postgres`
3. **Verify Connection**:
   ```bash
   npm run db:push
   ```

## 📋 Documentation Files

- **[TEAM_SETUP.md](TEAM_SETUP.md)** - Complete setup guide for new team members
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deploy anywhere (Vercel, Railway, Fly.io)
- **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)** - Database configuration details

## 🔧 Key Commands

```bash
npm run dev          # Start development server
npm run db:push      # Sync database schema
npm run build        # Build for production
```

## 🌍 Deploy Anywhere

Set the same `DATABASE_URL` environment variable on any platform:

**Vercel:**
```bash
vercel env add DATABASE_URL
# Paste connection string
```

**Railway/Fly.io/Others:**
Add `DATABASE_URL` in environment variables dashboard.

---

**Same data everywhere, zero configuration!**