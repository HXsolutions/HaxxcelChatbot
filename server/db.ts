import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Please set your PostgreSQL database URL in the environment variables.",
  );
}

// Use standard node-postgres for local PostgreSQL database
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
});
export const db = drizzle({ client: pool, schema });