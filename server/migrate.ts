import { db } from './db';
import { users, images } from '../shared/schema';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';

async function main() {
  console.log('Starting database migration...');
  
  // Create tables if they don't exist
  try {
    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Created or verified users table');
    
    // Create images table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS images (
        id SERIAL PRIMARY KEY,
        original_image_key TEXT NOT NULL,
        detoxified_image_key TEXT NOT NULL,
        diagnosis_points TEXT[],
        treatment_points TEXT[],
        contamination_level INTEGER NOT NULL,
        user_id INTEGER REFERENCES users(id),
        description TEXT,
        is_public BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Created or verified images table');
    
    console.log('Migration completed successfully!');
    
    // Need to exit process because Postgres connection remains open
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
main();