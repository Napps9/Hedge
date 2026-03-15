import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { claudeAgent } from '../services/claudeAgent.js';
import { googleCalendar } from '../services/googleCalendar.js';
import { googleGmail } from '../services/googleGmail.js';
import { db } from '../db/index.js';

const router = Router();

// Get recommendations
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { query } = req.body;

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({ error: 'Invalid query' });
    }

    // Fetch user's calendar and email context
    const [calendar, emailSummary] = await Promise.all([
      googleCalendar.getUpcomingEvents(req.user.userId),
      googleGmail.getEmailSummary(req.user.userId),
    ]);

    // Generate recommendations using Claude (or mock)
    const result = await claudeAgent.generateRecommendations(query, calendar, emailSummary);

    // Save to database
    await db.saveConversation(req.user.userId, query, result.recommendations);

    res.json(result);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// Get conversation history
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const conversations = await db.getConversations(req.user.userId);
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

export default router;
