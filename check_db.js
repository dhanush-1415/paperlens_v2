const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  try {
    const plansRes = await pool.query('SELECT * FROM public.plans');
    console.log('Plans:', plansRes.rows);

    const triggerRes = await pool.query(`
      SELECT tgname, relname 
      FROM pg_trigger 
      JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid 
      WHERE tgname = 'on_auth_user_created_subscription'
    `);
    console.log('Triggers:', triggerRes.rows);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

main();
