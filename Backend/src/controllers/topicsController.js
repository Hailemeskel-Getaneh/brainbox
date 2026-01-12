import pool from '../db/index.js';


export const getTopics = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM topics WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


export const createTopic = async (req, res) => {
    try {
        const { title } = req.body;
        const result = await pool.query(
            'INSERT INTO topics (title, user_id) VALUES ($1, $2) RETURNING *',
            [title, req.user.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteTopic = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM topics WHERE id = $1 AND user_id = $2 RETURNING *', [id, req.user.id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Topic not found or access denied' });
        }

        res.json({ message: 'Topic deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateTopic = async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;

        // Verify topic ownership
        const topicCheck = await pool.query('SELECT * FROM topics WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (topicCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Topic not found or access denied' });
        }

        const result = await pool.query(
            'UPDATE topics SET title = $1 WHERE id = $2 RETURNING *',
            [title, id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


