import { Pool } from 'pg';

// Use environment variable for connection string
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // If using SSL (Supabase requires SSL), add this:
  ssl: { rejectUnauthorized: false }
});

export default pool;