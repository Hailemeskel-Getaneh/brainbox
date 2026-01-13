import express from 'express';
import { getTopics, createTopic, deleteTopic, updateTopic, getTopicById } from '../controllers/topicsController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, getTopics);
router.post('/', authMiddleware, createTopic);
router.get('/:id', authMiddleware, getTopicById); // New route for getting a single topic by ID
router.put('/:id', authMiddleware, updateTopic);
router.delete('/:id', authMiddleware, deleteTopic);

export default router;
