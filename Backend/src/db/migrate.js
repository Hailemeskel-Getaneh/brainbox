import pool from './index.js';

// Migration to add user_id column to topics table if it doesn't exist
export const migrateDatabase = async () => {
    try {
        // Check if user_id column exists in topics table
        const columnCheck = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='topics' AND column_name='user_id'
        `);

        if (columnCheck.rows.length === 0) {
            console.log('Adding user_id column to topics table...');

            // Add user_id column (nullable initially)
            await pool.query(`
                ALTER TABLE topics 
                ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
            `);

            console.log('Migration completed: user_id column added to topics table');
        } else {
            console.log('Migration skipped: user_id column already exists');
        }
    } catch (err) {
        console.error('Migration error:', err);
        throw err;
    }
};
