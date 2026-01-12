import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db/index.js';

export const register = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1 OR username = $2', [email, username]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
            [username, email, passwordHash]
        );

        const token = jwt.sign({ id: newUser.rows[0].id }, "your_jwt_secret", { expiresIn: '1d' });

        res.status(201).json({ user: newUser.rows[0], token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.rows[0].id }, "your_jwt_secret", { expiresIn: '1d' });

        res.json({ user: { id: user.rows[0].id, username: user.rows[0].username, email: user.rows[0].email }, token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getUserProfile = async (req, res) => {
    try {
        const user = await pool.query('SELECT id, username, email FROM users WHERE id = $1', [req.user.id]);
        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

export const updateUserProfile = async (req, res) => {
    const { username, email } = req.body;
    const userId = req.user.id; // From authMiddleware

    try {
        // Check if new username/email already exists for another user
        const userExists = await pool.query(
            'SELECT id FROM users WHERE (email = $1 OR username = $2) AND id != $3',
            [email, username, userId]
        );
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'Username or email already taken by another user' });
        }

        const updatedUser = await pool.query(
            'UPDATE users SET username = $1, email = $2 WHERE id = $3 RETURNING id, username, email',
            [username, email, userId]
        );

        if (updatedUser.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(updatedUser.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

export const changeUserPassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id; // From authMiddleware

    try {
        const user = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const validPassword = await bcrypt.compare(oldPassword, user.rows[0].password_hash);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid old password' });
        }

        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, userId]);

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getDashboardStats = async (req, res) => {
    const userId = req.user.id;

    try {
        const totalTopicsResult = await pool.query(
            'SELECT COUNT(*) FROM topics WHERE user_id = $1',
            [userId]
        );
        const totalTopics = parseInt(totalTopicsResult.rows[0].count, 10);

        const totalNotesResult = await pool.query(
            'SELECT COUNT(*) FROM notes n JOIN topics t ON n.topic_id = t.id WHERE t.user_id = $1',
            [userId]
        );
        const totalNotes = parseInt(totalNotesResult.rows[0].count, 10);

        const notesLast7DaysResult = await pool.query(
            'SELECT COUNT(*) FROM notes n JOIN topics t ON n.topic_id = t.id WHERE t.user_id = $1 AND n.created_at >= NOW() - INTERVAL \'7 days\'',
            [userId]
        );
        const notesLast7Days = parseInt(notesLast7DaysResult.rows[0].count, 10);

        res.json({
            totalTopics,
            totalNotes,
            notesLast7Days,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
