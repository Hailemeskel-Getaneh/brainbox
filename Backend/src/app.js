import dotenv from 'dotenv';
dotenv.config();

import topicsRoutes from './routes/topicsRoutes.js';
import notesRoutes from './routes/notesRoutes.js';
import userRoutes from './routes/userRoutes.js';
import authMiddleware from './middleware/authMiddleware.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', userRoutes);
app.use('/api/topics', authMiddleware, topicsRoutes);
app.use('/api/notes', authMiddleware, notesRoutes);

// Health Check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Backend is running' });
});

export { app };
