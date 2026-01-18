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

        // Migration to add tags column to notes table
        const tagsColumnCheck = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='notes' AND column_name='tags'
        `);

        if (tagsColumnCheck.rows.length === 0) {
            console.log('Adding tags column to notes table...');
            await pool.query(`
                ALTER TABLE notes 
                ADD COLUMN tags TEXT[] DEFAULT '{}'
            `);
            console.log('Migration completed: tags column added to notes table');
        } else {
            console.log('Migration skipped: tags column already exists');
        }

        // Migration to add is_complete column to notes table
        const isCompleteColumnCheck = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='notes' AND column_name='is_complete'
        `);

        if (isCompleteColumnCheck.rows.length === 0) {
            console.log('Adding is_complete column to notes table...');
            await pool.query(`
                ALTER TABLE notes 
                ADD COLUMN is_complete BOOLEAN DEFAULT FALSE
            `);
            console.log('Migration completed: is_complete column added to notes table');
        } else {
            console.log('Migration skipped: is_complete column already exists');
        }
    } catch (err) {
        console.error('Migration error:', err);
        throw err;
    }
};
