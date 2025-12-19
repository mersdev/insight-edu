/**
 * Migration Runner Script
 * Runs database migrations
 */

import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'insight_edu',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function runMigration(migrationFile) {
  try {
    console.log(`\n🔄 Running migration: ${migrationFile}`);
    
    const migrationPath = path.join(__dirname, '..', 'migrations', migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    await pool.query(sql);
    
    console.log(`✅ Migration completed: ${migrationFile}\n`);
  } catch (error) {
    console.error(`❌ Migration failed: ${migrationFile}`);
    console.error(error.message);
    throw error;
  }
}

// Main execution
(async () => {
  try {
    const migrationFile = process.argv[2] || 'add-insight-auto-update-hours.sql';
    await runMigration(migrationFile);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();

