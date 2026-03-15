import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import recommendationRoutes from './routes/recommendations.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/recommendations', recommendationRoutes);

app.listen(PORT, () => {
  const hasClaude = !!process.env.CLAUDE_API_KEY;
  const hasPlaces = !!process.env.GOOGLE_PLACES_API_KEY;

  console.log(`\n  Hedge server on http://localhost:${PORT}\n`);
  console.log(`  Claude API:  ${hasClaude ? 'Ready' : 'Missing CLAUDE_API_KEY'}`);
  console.log(`  Places API:  ${hasPlaces ? 'Ready' : 'Missing GOOGLE_PLACES_API_KEY'}`);
  console.log('');
});
