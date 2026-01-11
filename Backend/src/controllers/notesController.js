import pool from '../db/index.js';

export const getNotes = async (req, res) => {
    try {
        const { topicId } = req.params;

        // Verify topic ownership
        const topicCheck = await pool.query('SELECT * FROM topics WHERE id = $1 AND user_id = $2', [topicId, req.user.id]);
        if (topicCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Topic not found or access denied' });
        }

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

        // Verify topic ownership
        const topicCheck = await pool.query('SELECT * FROM topics WHERE id = $1 AND user_id = $2', [topicId, req.user.id]);
        if (topicCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Topic not found or access denied' });
        }

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

        const result = await pool.query(
            'DELETE FROM notes USING topics WHERE notes.id = $1 AND notes.topic_id = topics.id AND topics.user_id = $2 RETURNING notes.*',
            [id, req.user.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Note not found or access denied' });
        }

        res.json({ message: 'Note deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const searchNotes = async (req, res) => {
    try {
        const { term } = req.params;
        const result = await pool.query(
            `SELECT n.*, t.title as topic_title FROM notes n
             JOIN topics t ON n.topic_id = t.id
             WHERE t.user_id = $1 AND n.content ILIKE $2
             ORDER BY n.created_at DESC`,
            [req.user.id, `%${term}%`]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        // Verify note ownership through topic ownership
        const noteCheck = await pool.query(
            `SELECT n.id, n.topic_id FROM notes n
             JOIN topics t ON n.topic_id = t.id
             WHERE n.id = $1 AND t.user_id = $2`,
            [id, req.user.id]
        );

        if (noteCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Note not found or access denied' });
        }

        const result = await pool.query(
            'UPDATE notes SET content = $1 WHERE id = $2 RETURNING *',
            [content, id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
