import pool from '../db/index.js';

export const getNotes = async (req, res) => {
    try {
        const { topicId } = req.params;
        const result = await pool.query(
            'SELECT * FROM notes WHERE topic_id = $1 ORDER BY created_at ASC',
            [topicId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createNote = async (req, res) => {
    try {
        const { topicId } = req.params;
        const { content } = req.body;
        const result = await pool.query(
            'INSERT INTO notes (topic_id, content) VALUES ($1, $2) RETURNING *',
            [topicId, content]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteNote = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM notes WHERE id = $1', [id]);
        res.json({ message: 'Note deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
