/**
 * This middleware is responsible for authenticating requests using JWT tokens.
 * It extracts the token from the Authorization header, verifies it, and
 * attaches the decoded user information to the request object.
 */
import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        // Verify the token and attach the decoded user to the request
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    // eslint-disable-next-line no-unused-vars
    } catch (_) {
        res.status(400).json({ error: 'Invalid token.' });
    }
};

export default authMiddleware;
