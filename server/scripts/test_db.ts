import dotenv from 'dotenv';
dotenv.config();
import { Pool } from 'pg';

async function run() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '[present]' : '[missing]');
  let pool: Pool;
  try {
    if (process.env.DATABASE_URL) {
      pool = new Pool({ connectionString: process.env.DATABASE_URL });
    } else {
      pool = new Pool({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME
      });
    }

    const res = await pool.query('SELECT NOW()');
    console.log('DB OK:', res.rows[0]);
  } catch (err: any) {
    console.error('DB error message:', err?.message);
    console.error('DB error stack:', err?.stack);
  } finally {
    if (pool) await pool.end();
  }
}

run();
