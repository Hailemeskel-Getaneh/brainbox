import { app } from './app.js';
import pool from './db/index.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Verify DB Connection
        await pool.query('SELECT 1');
        console.log('Database connected successfully.');

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
