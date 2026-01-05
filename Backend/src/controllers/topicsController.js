import pool from '../db/index.js';

export const getTopics = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM topics ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createTopic = async (req, res) => {
    try {
        const { title } = req.body;
        const result = await pool.query(
            'INSERT INTO topics (title) VALUES ($1) RETURNING *',
            [title]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteTopic = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM topics WHERE id = $1', [id]);
        res.json({ message: 'Topic deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
