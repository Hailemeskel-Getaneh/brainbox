import pool from '../db/index.js';

export const getNotes = async (req, res) => {
    try {
        const { topicId } = req.params;
        const { searchTerm, tags, sortBy = 'created_at', sortOrder = 'ASC' } = req.query; // Add sortBy and sortOrder

        // Validate sortBy and sortOrder to prevent SQL injection
        const validSortBy = ['created_at', 'content', 'updated_at']; // Assuming notes table has updated_at
        const validSortOrder = ['ASC', 'DESC'];

        const finalSortBy = validSortBy.includes(sortBy) ? sortBy : 'created_at';
        const finalSortOrder = validSortOrder.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

        // Verify topic ownership
        const topicCheck = await pool.query('SELECT * FROM topics WHERE id = $1 AND user_id = $2', [topicId, req.user.id]);
        if (topicCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Topic not found or access denied' });
        }

        let query = 'SELECT id, topic_id, content, created_at, tags, is_complete FROM notes WHERE topic_id = $1'; // Explicitly select is_complete
        const queryParams = [topicId];
        let paramIndex = 2; // Start index for additional parameters

        if (searchTerm) {
            queryParams.push(`%${searchTerm}%`);
            query += ` AND content ILIKE $${paramIndex}`;
            paramIndex++;
        }

        if (tags) {
            // tags can be a comma-separated string, convert to array
            const tagArray = Array.isArray(tags) ? tags : tags.split(',');
            // For checking if ALL tags are present in the TEXT[] column
            // Use ANY for checking if ANY tag is present
            // For checking ALL, we need to iterate
            query += ` AND tags @> $${paramIndex}::TEXT[]`; // PostgreSQL contains operator for arrays
            queryParams.push(tagArray);
            paramIndex++;
        }

        query += ` ORDER BY ${finalSortBy} ${finalSortOrder}`; // Apply dynamic sorting

        const result = await pool.query(query, queryParams);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createNote = async (req, res) => {
    try {
        const { topicId } = req.params;
        const { content, tags, is_complete } = req.body; // Destructure tags and is_complete

        // Verify topic ownership
        const topicCheck = await pool.query('SELECT * FROM topics WHERE id = $1 AND user_id = $2', [topicId, req.user.id]);
        if (topicCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Topic not found or access denied' });
        }

        // Use COALESCE for tags and is_complete
        const result = await pool.query(
            'INSERT INTO notes (topic_id, content, tags, is_complete) VALUES ($1, $2, COALESCE($3, ARRAY[]::TEXT[]), COALESCE($4, FALSE)) RETURNING *',
            [topicId, content, tags, is_complete] // Pass tags and is_complete to the query
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
        const { q } = req.query;
        const userId = req.user.id; // Get user ID from authenticated request
        const result = await pool.query(
            `SELECT n.*, t.title as topic_title FROM notes n
             JOIN topics t ON n.topic_id = t.id
             WHERE n.content ILIKE $1 AND t.user_id = $2
             ORDER BY n.created_at DESC`,
            [`%${q}%`, userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error); // Added console.error for better error visibility
        res.status(500).json({ error: 'Server error' }); // Generic server error message
    }
};

export const updateNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, tags, is_complete } = req.body; // Destructure tags and is_complete

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

        // Update content, tags, and is_complete. Use COALESCE for tags.
        const result = await pool.query(
            'UPDATE notes SET content = $1, tags = COALESCE($2, ARRAY[]::TEXT[]), is_complete = $3 WHERE id = $4 RETURNING *',
            [content, tags, is_complete, id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getTagsSuggestions = async (req, res) => {
    const userId = req.user.id;
    const { topicId } = req.query; // New: Get topicId from query

    try {
        let query = `
            SELECT DISTINCT UNNEST(n.tags) AS tag
            FROM notes n
            JOIN topics t ON n.topic_id = t.id
            WHERE t.user_id = $1 AND n.tags IS NOT NULL AND array_length(n.tags, 1) > 0
        `;
        const queryParams = [userId];
        let paramIndex = 2;

        if (topicId) {
            query += ` AND n.topic_id = $${paramIndex}`;
            queryParams.push(topicId);
            paramIndex++;
        }

        const result = await pool.query(query, queryParams);
        const tags = result.rows.map(row => row.tag);
        res.json(tags);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching tag suggestions' });
    }
};

export const getAllNotesForUser = async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await pool.query(
            `SELECT
                n.id,
                n.content,
                n.tags,
                n.created_at,
                n.topic_id,
                t.title AS topic_title
            FROM notes n
            JOIN topics t ON n.topic_id = t.id
            WHERE t.user_id = $1
            ORDER BY n.created_at DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching all notes' });
    }
};

export const getNoteById = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const result = await pool.query(
            `SELECT
                n.id,
                n.content,
                n.tags,
                n.created_at,
                n.topic_id,
                t.title AS topic_title
            FROM notes n
            JOIN topics t ON n.topic_id = t.id
            WHERE n.id = $1 AND t.user_id = $2`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Note not found or access denied' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching note' });
    }
};


