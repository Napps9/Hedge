import { Router } from 'express';
import { autocompletePlaces } from '../services/googlePlaces.js';

const router = Router();

router.get('/autocomplete', async (req, res) => {
  const { input, lat, lng } = req.query;

  if (!input || !lat || !lng) {
    return res.status(400).json({ error: 'Missing input, lat, or lng' });
  }

  const results = await autocompletePlaces(
    String(input),
    Number(lat),
    Number(lng),
  );

  res.json({ predictions: results });
});

export default router;
