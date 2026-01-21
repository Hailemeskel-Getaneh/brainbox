/**
 * @file This file is the main entry point for the BrainBox backend application.
 * @summary It configures and exports the main Express application, including middleware and API routes.
 * @description This file sets up middleware for CORS, JSON parsing, and URL encoding. It also defines the API routes for different resources like topics, notes, and users.
 */
import express from 'express';
import cors from 'cors'
import dotenv from 'dotenv';
dotenv.config();

import topicsRoutes from './routes/topicsRoutes.js';
import notesRoutes from './routes/notesRoutes.js';
import userRoutes from './routes/userRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import authMiddleware from './middleware/authMiddleware.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/users', userRoutes);
app.use('/api/topics', authMiddleware, topicsRoutes);
app.use('/api/notes', authMiddleware, notesRoutes);
app.use('/api/health', healthRoutes);

// Generic Error Handling Middleware
app.use((err, req, res, _next) => {
    console.error(err.stack); // Log the error stack for debugging
    res.status(err.statusCode || 500).json({
        error: err.message || 'Something went wrong!'
    });
});

export { app };

