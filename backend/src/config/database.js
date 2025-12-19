/**
 * Database Configuration
 * PostgreSQL connection pool with optimized settings
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Database configuration with connection pooling
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'insight_edu',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',

  // Connection pool settings
  max: parseInt(process.env.DB_POOL_MAX) || 20, // Maximum number of clients in the pool
  min: parseInt(process.env.DB_POOL_MIN) || 2,  // Minimum number of clients in the pool
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000, // Return error after 2 seconds if connection cannot be established

  // Query timeout
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 30000, // 30 seconds query timeout

  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
};

const pool = new Pool(config);

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  // Don't exit the process in production, just log the error
  if (process.env.NODE_ENV !== 'production') {
    process.exit(-1);
  }
});

// Handle pool connection
pool.on('connect', (client) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('New client connected to database');
  }
});

// Handle pool removal
pool.on('remove', (client) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Client removed from pool');
  }
});

// Test database connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Database connected successfully at:', res.rows[0].now);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing database pool...');
  await pool.end();
  console.log('Database pool closed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Closing database pool...');
  await pool.end();
  console.log('Database pool closed');
  process.exit(0);
});

export default pool;

