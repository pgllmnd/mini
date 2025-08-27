require('dotenv').config();
const { Pool } = require('pg');
(async function(){
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query('SELECT * FROM "public"."questions" LIMIT 1');
    console.log('rows:', res.rows.length);
  } catch (err) {
    console.error('raw_query error:', err && err.message);
    console.error(err && err.stack);
  } finally {
    await pool.end();
  }
})();
