import express from 'express';
import { register, login, getUserProfile, updateUserProfile, changeUserPassword, getDashboardStats } from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authMiddleware, getUserProfile);
router.put('/profile', authMiddleware, updateUserProfile);
router.put('/password', authMiddleware, changeUserPassword);
router.get('/dashboard/stats', authMiddleware, getDashboardStats);

export default router;
