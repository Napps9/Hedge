import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware/auth.js';
import { db } from '../db/index.js';

const router = Router();

const isGoogleConfigured =
  !!process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_ID !== 'your_client_id';

// Get OAuth URL
router.get('/url', (req: Request, res: Response) => {
  if (!isGoogleConfigured) {
    // In demo mode, return a flag so the client knows to use demo login
    return res.json({ url: null, demo: true });
  }

  try {
    // Dynamic import to avoid errors when Google credentials aren't set
    import('../services/googleAuth.js').then(({ googleAuth }) => {
      const url = googleAuth.getAuthUrl();
      res.json({ url });
    });
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

    const { googleAuth } = await import('../services/googleAuth.js');
    const { jwtToken, userId, email } = await googleAuth.handleCallback(code);

    res.json({ token: jwtToken, userId, email });
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'Failed to process authentication' });
  }
});

// Demo login — creates a demo user without Google OAuth
router.post('/demo', async (req: Request, res: Response) => {
  try {
    const email = 'demo@hedge.app';
    const userId = await db.upsertUser(email, 'demo-user');

    const token = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET || 'hedge-dev-secret-key',
      { expiresIn: '7d' },
    );

    res.json({ token, userId, email });
  } catch (error) {
    console.error('Demo login error:', error);
    res.status(500).json({ error: 'Failed to create demo session' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await db.getUser(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;
