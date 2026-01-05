import express from 'express';
import { getNotes, createNote, deleteNote } from '../controllers/notesController.js';

const router = express.Router();

router.get('/:topicId', getNotes);
router.post('/:topicId', createNote);
router.delete('/:id', deleteNote);

export default router;
