import express from 'express';
import { getNotes, createNote, deleteNote, searchNotes, updateNote, getTagsSuggestions, getAllNotesForUser, getNoteById } from '../controllers/notesController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/search', searchNotes);
router.get('/tags/suggestions', authMiddleware, getTagsSuggestions);
router.get('/', authMiddleware, getAllNotesForUser); // New route for getting all notes for a user
router.get('/notes/:id', authMiddleware, getNoteById); // New route for getting a single note by ID
router.get('/:topicId', authMiddleware, getNotes);
router.post('/:topicId', authMiddleware, createNote);
router.put('/:id', authMiddleware, updateNote);
router.delete('/:id', authMiddleware, deleteNote);

export default router;



