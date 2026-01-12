import express from 'express';
import { getTopics, createTopic, deleteTopic, updateTopic } from '../controllers/topicsController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, getTopics);
router.post('/', authMiddleware, createTopic);
router.put('/:id', authMiddleware, updateTopic);
router.delete('/:id', authMiddleware, deleteTopic);

export default router;
