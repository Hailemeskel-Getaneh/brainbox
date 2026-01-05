import express from 'express';
import cors from 'cors';

import topicsRoutes from './routes/topicsRoutes.js';
import notesRoutes from './routes/notesRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/topics', topicsRoutes);
app.use('/api/notes', notesRoutes);

// Health Check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Backend is running' });
});

export { app };
