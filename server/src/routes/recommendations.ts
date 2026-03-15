import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { claudeAgent } from '../services/claudeAgent.js';
import { googleCalendar } from '../services/googleCalendar.js';
import { googleGmail } from '../services/googleGmail.js';
import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';

const { Pool } = pg;
const router = Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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

    // Generate recommendations using Claude
    const recommendations = await claudeAgent.generateRecommendations(
      query,
      calendar,
      emailSummary,
    );

    // Save conversation and recommendations to database
    const client = await pool.connect();
    try {
      // Save conversation
      const conversationId = uuidv4();
      await client.query(
        'INSERT INTO conversations (id, user_id, query) VALUES ($1, $2, $3)',
        [conversationId, req.user.userId, query],
      );

      // Save recommendations
      for (const rec of recommendations.recommendations) {
        const recId = uuidv4();
        await client.query(
          'INSERT INTO recommendations (id, conversation_id, place_name, place_category, recommendation_reason, suggested_times) VALUES ($1, $2, $3, $4, $5, $6)',
          [
            recId,
            conversationId,
            rec.name,
            rec.category,
            rec.why_recommended,
            rec.suggested_times || null,
          ],
        );
      }
    } finally {
      client.release();
    }

    res.json(recommendations);
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

    const client = await pool.connect();
    try {
      // Get conversations with recommendations
      const result = await client.query(
        `SELECT c.id, c.query, c.created_at, json_agg(
          json_build_object(
            'id', r.id,
            'name', r.place_name,
            'category', r.place_category,
            'why_recommended', r.recommendation_reason,
            'suggested_times', r.suggested_times
          )
        ) as recommendations
        FROM conversations c
        LEFT JOIN recommendations r ON c.id = r.conversation_id
        WHERE c.user_id = $1
        GROUP BY c.id, c.query, c.created_at
        ORDER BY c.created_at DESC
        LIMIT 20`,
        [req.user.userId],
      );

      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

export default router;
