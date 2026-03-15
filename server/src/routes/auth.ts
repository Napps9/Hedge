import { Router, Request, Response } from 'express';
import { googleAuth } from '../services/googleAuth.js';
import { authMiddleware } from '../middleware/auth.js';
import pg from 'pg';

const { Pool } = pg;
const router = Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Get OAuth URL
router.get('/url', (req: Request, res: Response) => {
  try {
    const url = googleAuth.getAuthUrl();
    res.json({ url });
  } catch (error) {
    console.error('Error getting auth URL:', error);
    res.status(500).json({ error: 'Failed to get auth URL' });
  }
});

// Handle OAuth callback
router.post('/callback', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'No authorization code provided' });
    }

    const { jwtToken, userId, email } = await googleAuth.handleCallback(code);

    res.json({ token: jwtToken, userId, email });
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'Failed to process authentication' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT id, email, created_at FROM users WHERE id = $1',
        [req.user.userId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;
