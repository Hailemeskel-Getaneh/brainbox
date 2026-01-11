import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    // eslint-disable-next-line no-unused-vars
    } catch (_) {
        res.status(400).json({ error: 'Invalid token.' });
    }
};

export default authMiddleware;
