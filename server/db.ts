import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import fs from 'fs';
import path from 'path';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Please set your PostgreSQL database URL in the environment variables.",
  );
}

// Check if we're using Supabase (contains supabase.com) or local Replit database
const isSupabase = process.env.DATABASE_URL.includes('supabase.com');

let poolConfig: any = {
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 60000, // Close idle clients after 60 seconds
  connectionTimeoutMillis: 10000, // Increase timeout to 10 seconds
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
};

// Add SSL configuration for Supabase
if (isSupabase) {
  const certPath = path.join(process.cwd(), 'certs', 'prod-ca-2021.crt');
  if (fs.existsSync(certPath)) {
    poolConfig.ssl = {
      rejectUnauthorized: true,
      ca: fs.readFileSync(certPath).toString(),
    };
  } else {
    // Fallback for Supabase without certificate file
    poolConfig.ssl = { rejectUnauthorized: false };
  }
}

export const pool = new Pool(poolConfig);

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const db = drizzle({ client: pool, schema });