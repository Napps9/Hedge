import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { claudeAgent } from '../services/claudeAgent.js';
import { googleCalendar } from '../services/googleCalendar.js';
import { googleGmail } from '../services/googleGmail.js';
import { googlePlaces } from '../services/googlePlaces.js';
import { db } from '../db/index.js';

const router = Router();

// Get recommendations
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { query, latitude, longitude } = req.body;

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({ error: 'Invalid query' });
    }

    // Fetch user context in parallel
    const [calendar, emailSummary] = await Promise.all([
      googleCalendar.getUpcomingEvents(req.user.userId),
      googleGmail.getEmailSummary(req.user.userId),
    ]);

    // Search for real nearby places if we have location
    let nearbyPlaces = [];
    let city: string | null = null;

    if (latitude && longitude) {
      nearbyPlaces = await googlePlaces.searchNearby(query, latitude, longitude);

      // Get city name from reverse geocoding
      try {
        const geoResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        );
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          city = geoData.address?.city || geoData.address?.town || geoData.address?.county || null;
        }
      } catch {
        // City is nice to have
      }
    }

    // Generate recommendations using Claude with full context
    const result = await claudeAgent.generateRecommendations(
      query,
      calendar,
      emailSummary,
      nearbyPlaces,
      city,
    );

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
