import { Router, Request, Response } from 'express';
import { searchPlaces } from '../services/googlePlaces.js';
import { getRecommendations } from '../services/claude.js';
import { ConversationEntry } from '../types/index.js';

const router = Router();

// In-memory conversation history
const conversations: ConversationEntry[] = [];

router.post('/', async (req: Request, res: Response) => {
  try {
    const { query, latitude, longitude, city } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Search for real nearby places
    let places = [];
    if (latitude && longitude) {
      places = await searchPlaces(query, latitude, longitude);
    }

    // Get Claude's recommendations
    const result = await getRecommendations(query, city || null, places);

    // Attach photo URLs by matching recommendation names to place results
    const placeMap = new Map(places.map(p => [p.name.toLowerCase(), p.photoUrl]));
    for (const rec of result.recommendations) {
      const photoUrl = placeMap.get(rec.name.toLowerCase());
      if (photoUrl) rec.photo_url = photoUrl;
    }

    // Save to history
    const entry: ConversationEntry = {
      id: `conv-${Date.now()}`,
      query,
      recommendations: result.recommendations,
      timestamp: new Date().toISOString(),
    };
    conversations.unshift(entry);

    // Keep only last 50
    if (conversations.length > 50) conversations.length = 50;

    res.json(result);
  } catch (error: any) {
    console.error('Recommendation error:', error?.message || error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

router.get('/history', (_req: Request, res: Response) => {
  res.json(conversations);
});

export default router;
