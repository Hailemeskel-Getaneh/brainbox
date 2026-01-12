import 'dotenv/config';
import { app } from './app.js';
import pool from './db/index.js';
import { createTables } from './db/init.js';
import { migrateDatabase } from './db/migrate.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    let retries = 5;
    while (retries) {
        try {
            // Verify DB Connection
            await pool.query('SELECT 1');
            console.log('Database connected successfully.');

            // Initialize Tables
            await createTables();

            // Run migrations
            await migrateDatabase();

            app.listen(PORT, () => {
                console.log(`Server is running on port ${PORT}`);
            });
            break;
        } catch (error) {
            console.error(`Failed to connect to DB. Retries left: ${retries - 1}`, error.message);
            retries -= 1;
            if (!retries) {
                console.error('Could not connect to database after multiple attempts. Exiting.');
                process.exit(1);
            }
            // Wait for 2 seconds before retrying
            await new Promise(res => setTimeout(res, 5000));
        }
    }
};

startServer();
