import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import recommendationRoutes from './routes/recommendations.js';
import { getStorageMode } from './db/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.get('/api', (req, res) => {
  res.json({ message: 'Hedge API v1.0' });
});

// Auth routes
app.use('/auth', authRoutes);

// Recommendation routes
app.use('/api/recommendations', recommendationRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  const storage = getStorageMode();
  const hasGoogle = !!process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your_client_id';
  const hasClaude = !!process.env.CLAUDE_API_KEY && process.env.CLAUDE_API_KEY !== 'sk-your-key';

  console.log(`\n  Hedge server running on http://localhost:${PORT}\n`);
  console.log(`  Storage:  ${storage === 'postgresql' ? 'PostgreSQL' : 'In-memory (no database needed)'}`);
  console.log(`  Google:   ${hasGoogle ? 'Configured' : 'Demo mode (mock data)'}`);
  console.log(`  Claude:   ${hasClaude ? 'Configured' : 'Demo mode (mock recommendations)'}`);
  console.log('');
});
