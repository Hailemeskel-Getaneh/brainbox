/**
 * This script is responsible for running database migrations.
 * It connects to the PostgreSQL database and performs schema changes,
 * such as adding the `user_id` column to the `topics` table if it doesn't already exist.
 */
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'brainbox',
    password: process.env.DB_PASSWORD || 'postgres',
    port: parseInt(process.env.DB_PORT || '5432', 10),
});

async function runMigration() {
    try {
        console.log('Connecting to database...');

        // Check weather user_id column exists or not
        const checkColumn = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='topics' AND column_name='user_id'
        `);

        if (checkColumn.rows.length === 0) {
            console.log('Adding user_id column to topics table...');
            await pool.query(`
                ALTER TABLE topics 
                ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
            `);
            console.log('✅ Migration completed: user_id column added to topics table');
        } else {
            console.log('✅ Migration skipped: user_id column already exists');
        }

        // Show table structure
        const tableInfo = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name='topics'
            ORDER BY ordinal_position
        `);

        console.log('\nTopics table structure:');
        tableInfo.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        await pool.end();
        process.exit(1);
    }
}

runMigration();

