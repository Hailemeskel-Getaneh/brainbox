import express from 'express';
import { getNotes, createNote, deleteNote, searchNotes } from '../controllers/notesController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/search/:term', authMiddleware, searchNotes);
router.get('/:topicId', authMiddleware, getNotes);
router.post('/:topicId', authMiddleware, createNote);
router.delete('/:id', authMiddleware, deleteNote);

export default router;



