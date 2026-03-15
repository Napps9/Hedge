#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const BASE = __dirname;

function w(filePath, content) {
  const full = path.join(BASE, filePath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  console.log('  \u2713 ' + filePath);
}

console.log('\n  Hedge Setup (v2 \u2014 with images, search onboarding, dashboard)\n  Writing project files...\n');

// ============ ROOT ============

w('.gitignore', `# Dependencies
node_modules/
package-lock.json
yarn.lock

# Environment variables
.env
.env.local
.env.*.local

# Build outputs
dist/
build/
*.tsbuildinfo

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*

# Cache
.cache/
.parcel-cache

# Temporary files
tmp/
temp/
`);

// ============ SERVER ============

w('server/package.json', JSON.stringify({
  name: "hedge-server",
  version: "1.0.0",
  type: "module",
  scripts: {
    dev: "tsx watch src/index.ts",
    build: "tsc",
    start: "node dist/index.js"
  },
  dependencies: {
    "express": "^4.21.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "@anthropic-ai/sdk": "^0.39.0"
  },
  devDependencies: {
    "typescript": "^5.6.0",
    "tsx": "^4.19.0",
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/node": "^22.0.0"
  }
}, null, 2) + '\n');

w('server/tsconfig.json', JSON.stringify({
  compilerOptions: {
    target: "ES2022",
    module: "ES2022",
    moduleResolution: "node",
    outDir: "./dist",
    rootDir: "./src",
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true
  },
  include: ["src"],
  exclude: ["node_modules"]
}, null, 2) + '\n');

w('server/.env.example', `CLAUDE_API_KEY=sk-ant-your-key
GOOGLE_PLACES_API_KEY=your-google-api-key
PORT=3000
`);

w('server/src/index.ts', `import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import recommendationRoutes from './routes/recommendations.js';
import placesRoutes from './routes/places.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/recommendations', recommendationRoutes);
app.use('/api/places', placesRoutes);

app.listen(PORT, () => {
  const hasClaude = !!process.env.CLAUDE_API_KEY;
  const hasPlaces = !!process.env.GOOGLE_PLACES_API_KEY;

  console.log('\\n  Hedge server on http://localhost:' + PORT + '\\n');
  console.log('  Claude API:  ' + (hasClaude ? 'Ready' : 'Missing CLAUDE_API_KEY'));
  console.log('  Places API:  ' + (hasPlaces ? 'Ready' : 'Missing GOOGLE_PLACES_API_KEY'));
  console.log('');
});
`);

w('server/src/types/index.ts', `export interface PlaceResult {
  name: string;
  address: string;
  rating: number | null;
  priceLevel: string | null;
  types: string[];
  googleMapsUrl: string;
  photoUrl: string | null;
}

export interface Recommendation {
  name: string;
  category: string;
  why_recommended: string;
  google_places_link: string;
  suggested_times?: string;
  rating?: number | null;
  price?: string | null;
  photo_url?: string | null;
}

export interface ConversationEntry {
  id: string;
  query: string;
  recommendations: Recommendation[];
  timestamp: string;
}
`);

w('server/src/routes/recommendations.ts', `import { Router, Request, Response } from 'express';
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
      id: \`conv-\${Date.now()}\`,
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
`);

w('server/src/routes/places.ts', `import { Router } from 'express';
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
`);

w('server/src/services/claude.ts', `import Anthropic from '@anthropic-ai/sdk';
import { PlaceResult, Recommendation } from '../types/index.js';

let anthropic: Anthropic | null = null;

function getClient(): Anthropic {
  if (!anthropic) {
    anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY || '' });
  }
  return anthropic;
}

export async function getRecommendations(
  query: string,
  city: string | null,
  places: PlaceResult[],
): Promise<{ recommendations: Recommendation[]; reasoning: string }> {
  const placesContext =
    places.length > 0
      ? places
          .map((p, i) => {
            let line = \`\${i + 1}. \${p.name} \u2014 \${p.address}\`;
            if (p.rating) line += \` (\${p.rating}/5)\`;
            if (p.priceLevel) line += \` [\${p.priceLevel}]\`;
            line += \`\\n   Link: \${p.googleMapsUrl}\`;
            return line;
          })
          .join('\\n')
      : '(No nearby places found \u2014 give general recommendations)';

  const systemPrompt = \`You are Hedge, a lifestyle assistant that recommends real places to visit.

USER LOCATION: \${city || 'Unknown'}

NEARBY PLACES MATCHING THEIR REQUEST:
\${placesContext}

INSTRUCTIONS:
- Pick the 2-3 BEST places from the nearby results above
- For each, explain specifically why it's worth visiting
- If the user mentions timing, suggest the best time to go
- Include the real Google Maps link for each place
- Be concise and conversational

Respond ONLY with valid JSON:
{
  "recommendations": [
    {
      "name": "Place Name",
      "category": "restaurant|cafe|museum|park|bar|etc",
      "why_recommended": "Why this place is great",
      "google_places_link": "https://www.google.com/maps/place/?q=place_id:...",
      "suggested_times": "Best time to go (optional)",
      "rating": 4.5,
      "price": "$$"
    }
  ],
  "reasoning": "Brief summary"
}\`;

  try {
    const response = await getClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: query }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const jsonMatch = content.text.match(/\\{[\\s\\S]*\\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error: any) {
    console.error('Claude API error:', error?.message || error);
    throw error;
  }
}
`);

w('server/src/services/googlePlaces.ts', `import { PlaceResult } from '../types/index.js';

const getApiKey = () => process.env.GOOGLE_PLACES_API_KEY || '';

export function getPhotoUrl(photoReference: string): string {
  return \`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=\${photoReference}&key=\${getApiKey()}\`;
}

export async function searchPlaces(
  query: string,
  latitude: number,
  longitude: number,
): Promise<PlaceResult[]> {
  const apiKey = getApiKey();

  if (!apiKey) {
    console.warn('GOOGLE_PLACES_API_KEY not set \u2014 skipping places search');
    return [];
  }

  try {
    const url = \`https://maps.googleapis.com/maps/api/place/textsearch/json?query=\${encodeURIComponent(query)}&location=\${latitude},\${longitude}&radius=8000&key=\${apiKey}\`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'REQUEST_DENIED') {
      console.error('Places API denied:', data.error_message);
      return [];
    }

    if (!data.results || data.results.length === 0) {
      return [];
    }

    return data.results.slice(0, 8).map((p: any) => ({
      name: p.name,
      address: p.formatted_address || '',
      rating: p.rating || null,
      priceLevel: priceLevelLabel(p.price_level),
      types: p.types || [],
      googleMapsUrl: \`https://www.google.com/maps/place/?q=place_id:\${p.place_id}\`,
      photoUrl: p.photos?.[0]?.photo_reference
        ? getPhotoUrl(p.photos[0].photo_reference)
        : null,
    }));
  } catch (error) {
    console.error('Places search error:', error);
    return [];
  }
}

export async function autocompletePlaces(
  input: string,
  latitude: number,
  longitude: number,
): Promise<{ placeId: string; description: string }[]> {
  const apiKey = getApiKey();
  if (!apiKey || !input.trim()) return [];

  try {
    const url = \`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=\${encodeURIComponent(input)}&location=\${latitude},\${longitude}&radius=8000&types=establishment&key=\${apiKey}\`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.predictions) return [];

    return data.predictions.slice(0, 5).map((p: any) => ({
      placeId: p.place_id,
      description: p.description,
    }));
  } catch (error) {
    console.error('Autocomplete error:', error);
    return [];
  }
}

function priceLevelLabel(level?: number): string | null {
  if (level === undefined) return null;
  return ['Free', '$', '$$', '$$$', '$$$$'][level] || null;
}
`);

// ============ CLIENT ============

w('client/package.json', JSON.stringify({
  name: "hedge-client",
  version: "1.0.0",
  type: "module",
  scripts: {
    dev: "vite",
    build: "tsc && vite build",
    preview: "vite preview"
  },
  dependencies: {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  devDependencies: {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.4.0",
    "typescript": "^5.6.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.40",
    "autoprefixer": "^10.4.20"
  }
}, null, 2) + '\n');

w('client/tsconfig.json', JSON.stringify({
  compilerOptions: {
    target: "ES2020",
    useDefineForClassFields: true,
    lib: ["ES2020", "DOM", "DOM.Iterable"],
    module: "ESNext",
    skipLibCheck: true,
    esModuleInterop: true,
    strict: true,
    moduleResolution: "bundler",
    allowImportingTsExtensions: true,
    resolveJsonModule: true,
    isolatedModules: true,
    noEmit: true,
    jsx: "react-jsx"
  },
  include: ["src"]
}, null, 2) + '\n');

w('client/vite.config.ts', `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
`);

w('client/tailwind.config.js', `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#f5f5f5',
        border: '#d4d4d4',
        muted: '#737373',
      },
      fontSize: {
        display: ['3rem', { lineHeight: '1.1', fontWeight: '200' }],
        headline: ['1.75rem', { lineHeight: '1.2', fontWeight: '300' }],
        body: ['0.9375rem', { lineHeight: '1.6' }],
        caption: ['0.8125rem', { lineHeight: '1.5' }],
        micro: ['0.6875rem', { lineHeight: '1.4', fontWeight: '500' }],
      },
      keyframes: {
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        dot: {
          '0%, 80%, 100%': { opacity: '0.3', transform: 'scale(0.8)' },
          '40%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'slide-up': 'slideUp 0.4s ease-out',
        'dot-1': 'dot 1.4s ease-in-out infinite',
        'dot-2': 'dot 1.4s ease-in-out 0.2s infinite',
        'dot-3': 'dot 1.4s ease-in-out 0.4s infinite',
      },
    },
  },
  plugins: [],
};
`);

w('client/postcss.config.js', `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`);

w('client/index.html', `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Hedge</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`);

w('client/src/main.tsx', `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`);

w('client/src/index.css', `@tailwind base;
@tailwind components;
@tailwind utilities;

* { margin: 0; padding: 0; box-sizing: border-box; }

html { -webkit-font-smoothing: antialiased; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
  background: #fff;
  color: #000;
}

::selection { background: #000; color: #fff; }

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #e5e5e5; border-radius: 2px; }
`);

w('client/src/types/index.ts', `export interface Recommendation {
  name: string;
  category: string;
  why_recommended: string;
  google_places_link: string;
  suggested_times?: string;
  rating?: number | null;
  price?: string | null;
  photo_url?: string | null;
}

export interface Conversation {
  id: string;
  query: string;
  recommendations: Recommendation[];
  timestamp: Date;
  isLoading: boolean;
}

export interface UserPreferences {
  restaurants: string[];
  cafes: string[];
  bars: string[];
  favouritePlaces: string[];
  completed: boolean;
}
`);

w('client/src/App.tsx', `import { useState } from 'react';
import './index.css';
import { useGeolocation } from './hooks/useGeolocation';
import { useConversations } from './hooks/useConversations';
import { usePreferences } from './hooks/usePreferences';
import { useViewedPlaces } from './hooks/useViewedPlaces';
import ConversationCard from './components/ConversationCard';
import InputBox from './components/InputBox';
import EmptyState from './components/EmptyState';
import Onboarding from './components/Onboarding';

export default function App() {
  const geo = useGeolocation();
  const { conversations, isLoading, error, submitQuery, scrollRef } = useConversations();
  const { preferences, toggleItem, addFavourite, removeFavourite, completeOnboarding } = usePreferences();
  const { viewedPlaces, addViewedPlace } = useViewedPlaces();
  const [suggestion, setSuggestion] = useState('');
  const [showHome, setShowHome] = useState(true);

  const handleSubmit = (query: string) => {
    setSuggestion('');
    setShowHome(false);
    submitQuery(query, geo);
  };

  const hasConversations = conversations.length > 0;
  const showOnboarding = !preferences.completed;
  const showEmptyState = showHome || (!hasConversations && !isLoading);

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="shrink-0 border-b-2 border-neutral-800 py-4">
        <div className="max-w-[800px] mx-auto px-6 flex items-center gap-3">
          {/* Home button */}
          {!showOnboarding && (
            <button
              onClick={() => setShowHome(true)}
              className="p-1.5 -ml-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
              aria-label="Go home"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <h1 className="text-xl font-semibold tracking-wide">Hedge</h1>
          {geo.city && <span className="text-micro text-muted">{geo.city}</span>}
        </div>
      </header>

      {showOnboarding ? (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[800px] mx-auto px-6 py-8">
            <Onboarding
              preferences={preferences}
              onToggle={toggleItem}
              onComplete={completeOnboarding}
              onSkip={completeOnboarding}
              onAddFavourite={addFavourite}
              onRemoveFavourite={removeFavourite}
            />
          </div>
        </div>
      ) : (
        <>
          {/* Content */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="max-w-[800px] mx-auto px-6 py-8">
              {showEmptyState && (
                <EmptyState
                  onSuggestion={(s) => { setSuggestion(s); setShowHome(false); }}
                  viewedPlaces={viewedPlaces}
                  favouritePlaces={preferences.favouritePlaces}
                />
              )}

              {!showHome && hasConversations && (
                <div className="max-w-2xl mx-auto">
                  {conversations.map(conv => (
                    <ConversationCard key={conv.id} conv={conv} onViewPlace={addViewedPlace} />
                  ))}
                </div>
              )}

              {error && (
                <div className="max-w-2xl mx-auto mt-4">
                  <p className="text-caption text-red-500/80">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Input */}
          <div className="shrink-0 border-t-2 border-neutral-800 bg-white">
            <div className="max-w-2xl mx-auto px-6 py-4">
              <InputBox onSubmit={handleSubmit} isLoading={isLoading} initialValue={suggestion} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
`);

w('client/src/hooks/useGeolocation.ts', `import { useState, useEffect } from 'react';

interface Geo {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [geo, setGeo] = useState<Geo>(() => {
    const cached = localStorage.getItem('hedge_geo');
    if (cached) {
      try { return { ...JSON.parse(cached), loading: false }; } catch {}
    }
    return { latitude: null, longitude: null, city: null, loading: true };
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeo(prev => ({ ...prev, loading: false }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude, longitude } = coords;
        let city: string | null = null;

        try {
          const res = await fetch(
            \`https://nominatim.openstreetmap.org/reverse?lat=\${latitude}&lon=\${longitude}&format=json\`
          );
          if (res.ok) {
            const data = await res.json();
            city = data.address?.city || data.address?.town || data.address?.village || null;
          }
        } catch {}

        const result = { latitude, longitude, city, loading: false };
        localStorage.setItem('hedge_geo', JSON.stringify({ latitude, longitude, city }));
        setGeo(result);
      },
      () => setGeo(prev => ({ ...prev, loading: false })),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
  }, []);

  return geo;
}
`);

w('client/src/hooks/useConversations.ts', `import { useState, useCallback, useRef } from 'react';
import { Conversation, Recommendation } from '../types';

const API = 'http://localhost:3000';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const submitQuery = useCallback(async (
    query: string,
    location: { latitude: number | null; longitude: number | null; city: string | null }
  ) => {
    setError(null);
    const tempId = \`q-\${Date.now()}\`;

    setConversations(prev => [...prev, {
      id: tempId, query, recommendations: [], timestamp: new Date(), isLoading: true,
    }]);
    scrollToBottom();

    try {
      const res = await fetch(\`\${API}/api/recommendations\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          latitude: location.latitude,
          longitude: location.longitude,
          city: location.city,
        }),
      });

      if (!res.ok) throw new Error('Request failed');

      const data = await res.json();

      setConversations(prev =>
        prev.map(c => c.id === tempId
          ? { ...c, recommendations: data.recommendations || [], isLoading: false }
          : c
        )
      );
      scrollToBottom();
    } catch (err: any) {
      setError('Something went wrong. Try again.');
      setConversations(prev =>
        prev.map(c => c.id === tempId ? { ...c, isLoading: false } : c)
      );
    }
  }, []);

  return { conversations, isLoading: conversations.some(c => c.isLoading), error, submitQuery, scrollRef };
}
`);

w('client/src/hooks/usePreferences.ts', `import { useState } from 'react';
import { UserPreferences } from '../types';

const STORAGE_KEY = 'hedge_preferences';

const defaultPreferences: UserPreferences = {
  restaurants: [],
  cafes: [],
  bars: [],
  favouritePlaces: [],
  completed: false,
};

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return { ...defaultPreferences, ...parsed };
      } catch {}
    }
    return defaultPreferences;
  });

  const save = (updated: UserPreferences) => {
    setPreferences(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const toggleItem = (category: 'restaurants' | 'cafes' | 'bars', item: string) => {
    const list = preferences[category];
    const updated = list.includes(item)
      ? list.filter(i => i !== item)
      : [...list, item];
    save({ ...preferences, [category]: updated });
  };

  const addFavourite = (name: string) => {
    if (!preferences.favouritePlaces.includes(name)) {
      save({ ...preferences, favouritePlaces: [...preferences.favouritePlaces, name] });
    }
  };

  const removeFavourite = (name: string) => {
    save({ ...preferences, favouritePlaces: preferences.favouritePlaces.filter(n => n !== name) });
  };

  const completeOnboarding = () => {
    save({ ...preferences, completed: true });
  };

  const resetOnboarding = () => {
    save(defaultPreferences);
  };

  return { preferences, toggleItem, addFavourite, removeFavourite, completeOnboarding, resetOnboarding };
}
`);

w('client/src/hooks/useViewedPlaces.ts', `import { useState } from 'react';
import { Recommendation } from '../types';

const STORAGE_KEY = 'hedge_viewed_places';
const MAX_VIEWED = 6;

export function useViewedPlaces() {
  const [viewedPlaces, setViewedPlaces] = useState<Recommendation[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch {}
    }
    return [];
  });

  const addViewedPlace = (rec: Recommendation) => {
    setViewedPlaces(prev => {
      const filtered = prev.filter(p => p.name !== rec.name);
      const updated = [rec, ...filtered].slice(0, MAX_VIEWED);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return { viewedPlaces, addViewedPlace };
}
`);

w('client/src/components/LoadingPulse.tsx', `export default function LoadingPulse() {
  return (
    <div className="flex items-center gap-1.5 py-4">
      <div className="w-1.5 h-1.5 rounded-full bg-muted animate-dot-1" />
      <div className="w-1.5 h-1.5 rounded-full bg-muted animate-dot-2" />
      <div className="w-1.5 h-1.5 rounded-full bg-muted animate-dot-3" />
    </div>
  );
}
`);

w('client/src/components/EmptyState.tsx', `import { Recommendation } from '../types';
import ViewedPlaceCard from './ViewedPlaceCard';

const suggestions = [
  'Dinner tonight at 8pm',
  'Coffee spot to work from this morning',
  'Drinks Friday evening',
  'Saturday brunch for 4 people',
];

const recommendedQueries = [
  'Best Italian near me',
  'Cozy cafe with wifi',
  'Rooftop bar for sunset drinks',
  'Brunch with outdoor seating',
];

interface Props {
  onSuggestion: (s: string) => void;
  viewedPlaces: Recommendation[];
  favouritePlaces: string[];
}

export default function EmptyState({ onSuggestion, viewedPlaces, favouritePlaces }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      {/* Previously Viewed */}
      {viewedPlaces.length > 0 && (
        <div className="w-full max-w-lg mb-12">
          <h3 className="text-[0.8rem] font-semibold uppercase tracking-wider text-neutral-400 mb-4">Previously Viewed</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {viewedPlaces.map(rec => (
              <ViewedPlaceCard key={rec.name} rec={rec} />
            ))}
          </div>
        </div>
      )}

      {/* Recommended for you */}
      <div className="w-full max-w-lg mb-12">
        <h3 className="text-[0.8rem] font-semibold uppercase tracking-wider text-neutral-400 mb-4">Recommended for you</h3>
        <div className="flex flex-wrap gap-2.5">
          {favouritePlaces.length > 0 ? (
            favouritePlaces.slice(0, 4).map(place => (
              <button
                key={place}
                onClick={() => onSuggestion(\`Something like \${place}\`)}
                className="px-5 py-2.5 text-caption text-neutral-600 border-2 border-neutral-300 rounded-full hover:border-black hover:text-black transition-all"
              >
                {place}
              </button>
            ))
          ) : (
            recommendedQueries.map(q => (
              <button
                key={q}
                onClick={() => onSuggestion(q)}
                className="px-5 py-2.5 text-caption text-neutral-600 border-2 border-neutral-300 rounded-full hover:border-black hover:text-black transition-all"
              >
                {q}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main CTA */}
      <div className="mb-8 text-neutral-300">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.75">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4l3 3" strokeLinecap="round" />
        </svg>
      </div>
      <h2 className="text-headline text-black mb-3">When and where?</h2>
      <p className="text-caption text-muted mb-10">Tell me when you're free and I'll find the perfect spot</p>
      <div className="flex flex-wrap justify-center gap-3">
        {suggestions.map(s => (
          <button
            key={s}
            onClick={() => onSuggestion(s)}
            className="px-5 py-2.5 text-caption text-neutral-600 border-2 border-neutral-300 rounded-full hover:border-black hover:text-black transition-all"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
`);

w('client/src/components/InputBox.tsx', `import { useState, useRef, useEffect } from 'react';

interface Props {
  onSubmit: (query: string) => void;
  isLoading: boolean;
  initialValue?: string;
}

export default function InputBox({ onSubmit, isLoading, initialValue }: Props) {
  const [value, setValue] = useState(initialValue || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialValue) {
      setValue(initialValue);
      inputRef.current?.focus();
    }
  }, [initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      onSubmit(value.trim());
      setValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          disabled={isLoading}
          placeholder="When are you free? What are you looking for?"
          className="w-full py-4 pr-14 text-body bg-transparent border-b-2 border-neutral-800 placeholder:text-neutral-400 focus:border-black focus:outline-none transition-colors disabled:opacity-40"
        />
        <button
          type="submit"
          disabled={!value.trim() || isLoading}
          className="absolute right-0 px-4 py-2 bg-black text-white rounded-full text-caption font-medium disabled:opacity-20 hover:bg-neutral-800 transition-all"
        >
          Search
        </button>
      </div>
    </form>
  );
}
`);

w('client/src/components/ConversationCard.tsx', `import { Conversation, Recommendation } from '../types';
import RecommendationCard from './RecommendationCard';
import LoadingPulse from './LoadingPulse';

interface Props {
  conv: Conversation;
  onViewPlace?: (rec: Recommendation) => void;
}

export default function ConversationCard({ conv, onViewPlace }: Props) {
  const time = new Date(conv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="animate-slide-up mb-8">
      <div className="flex items-baseline gap-3 mb-4">
        <p className="text-body font-medium text-black">{conv.query}</p>
        <span className="shrink-0 text-micro text-neutral-400">{time}</span>
      </div>

      {conv.isLoading && <LoadingPulse />}

      {!conv.isLoading && conv.recommendations.length > 0 && (
        <div className="pl-5 border-l-2 border-black">
          {conv.recommendations.map((rec, i) => (
            <RecommendationCard key={i} rec={rec} onView={onViewPlace} />
          ))}
        </div>
      )}
    </div>
  );
}
`);

w('client/src/components/RecommendationCard.tsx', `import { Recommendation } from '../types';

interface Props {
  rec: Recommendation;
  onView?: (rec: Recommendation) => void;
}

export default function RecommendationCard({ rec, onView }: Props) {
  const handleBookClick = () => {
    if (onView) onView(rec);
  };

  return (
    <div className="py-5 border-b-2 border-neutral-200 last:border-0">
      <div className="flex items-start gap-4">
        {/* Image thumbnail */}
        <div className="shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-neutral-100">
          {rec.photo_url ? (
            <img src={rec.photo_url} alt={rec.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-300">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="text-[1.05rem] font-medium truncate">{rec.name}</h4>
            {rec.category && (
              <span className="shrink-0 px-2.5 py-0.5 text-micro uppercase tracking-wider text-white bg-black rounded-full">
                {rec.category}
              </span>
            )}
            {rec.rating && (
              <span className="shrink-0 text-caption font-medium text-black">{rec.rating}/5</span>
            )}
            {rec.price && (
              <span className="shrink-0 text-caption text-muted">{rec.price}</span>
            )}
          </div>

          <p className="text-caption text-neutral-600 leading-relaxed">{rec.why_recommended}</p>

          {rec.suggested_times && (
            <div className="flex items-center gap-2 mt-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-400">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="text-caption text-neutral-500">{rec.suggested_times}</span>
            </div>
          )}
        </div>

        {/* Book button */}
        {rec.google_places_link && (
          <a
            href={rec.google_places_link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleBookClick}
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-black text-white text-caption font-medium rounded-full hover:bg-neutral-800 transition-colors"
            aria-label={\`Book \${rec.name}\`}
          >
            Book
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17L17 7M17 7H7M17 7v10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
`);

w('client/src/components/ViewedPlaceCard.tsx', `import { Recommendation } from '../types';

export default function ViewedPlaceCard({ rec }: { rec: Recommendation }) {
  return (
    <a
      href={rec.google_places_link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-xl border-2 border-neutral-200 hover:border-black transition-all group"
    >
      {/* Thumbnail */}
      <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-neutral-100">
        {rec.photo_url ? (
          <img src={rec.photo_url} alt={rec.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[0.85rem] font-medium text-black truncate group-hover:underline">{rec.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {rec.category && (
            <span className="text-micro text-neutral-500 uppercase tracking-wider">{rec.category}</span>
          )}
          {rec.rating && (
            <span className="text-micro text-neutral-400">{rec.rating}/5</span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-neutral-300 group-hover:text-black transition-colors">
        <path d="M7 17L17 7M17 7H7M17 7v10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  );
}
`);

w('client/src/components/Onboarding.tsx', `import { useState, useEffect, useRef } from 'react';
import { UserPreferences } from '../types';

interface Props {
  preferences: UserPreferences;
  onToggle: (category: 'restaurants' | 'cafes' | 'bars', item: string) => void;
  onComplete: () => void;
  onSkip: () => void;
  onAddFavourite: (name: string) => void;
  onRemoveFavourite: (name: string) => void;
}

const sections: { key: 'restaurants' | 'cafes' | 'bars'; label: string; icon: string; placeholder: string }[] = [
  { key: 'restaurants', label: 'Restaurants', icon: '\u{1F37D}', placeholder: 'Search for your favourite restaurants...' },
  { key: 'cafes', label: 'Cafes', icon: '\u2615', placeholder: 'Search for your favourite cafes...' },
  { key: 'bars', label: 'Bars', icon: '\u{1F378}', placeholder: 'Search for your favourite bars...' },
];

const API = 'http://localhost:3000';

export default function Onboarding({ preferences, onToggle, onComplete, onSkip, onAddFavourite, onRemoveFavourite }: Props) {
  const [step, setStep] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<{ placeId: string; description: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const section = sections[step];
  const isLast = step === sections.length - 1;
  const selected = preferences[section.key];

  useEffect(() => {
    setSearchInput('');
    setSuggestions([]);
  }, [step]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (searchInput.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const lat = 51.5074;
        const lng = -0.1278;
        const res = await fetch(
          \`\${API}/api/places/autocomplete?input=\${encodeURIComponent(searchInput)}&lat=\${lat}&lng=\${lng}\`
        );
        const data = await res.json();
        setSuggestions(data.predictions || []);
      } catch {
        setSuggestions([]);
      }
      setIsSearching(false);
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput]);

  const handleSelectPlace = (description: string) => {
    const name = description.split(',')[0].trim();
    onToggle(section.key, name);
    onAddFavourite(name);
    setSearchInput('');
    setSuggestions([]);
  };

  const handleRemovePlace = (name: string) => {
    onToggle(section.key, name);
    onRemoveFavourite(name);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-10">
        {sections.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div className={\`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all \${
              i < step ? 'bg-black border-black text-white' :
              i === step ? 'border-black text-black' :
              'border-neutral-300 text-neutral-300'
            }\`}>
              {i < step ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : i + 1}
            </div>
            {i < sections.length - 1 && (
              <div className={\`w-12 h-0.5 \${i < step ? 'bg-black' : 'bg-neutral-200'} transition-all\`} />
            )}
          </div>
        ))}
      </div>

      {/* Section header */}
      <div className="text-center mb-8">
        <span className="text-3xl mb-3 block">{section.icon}</span>
        <h2 className="text-headline text-black mb-2">
          Your favourite {section.label.toLowerCase()}
        </h2>
        <p className="text-caption text-muted">
          Search and add places you love \u2014 helps us find better spots
        </p>
      </div>

      {/* Search input */}
      <div className="w-full max-w-md mb-4 relative">
        <div className="relative">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder={section.placeholder}
            className="w-full pl-11 pr-4 py-3 text-[0.9rem] border-2 border-neutral-300 rounded-xl focus:border-black focus:outline-none transition-colors"
          />
          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Autocomplete dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-neutral-200 rounded-xl shadow-lg z-10 overflow-hidden">
            {suggestions.map(s => (
              <button
                key={s.placeId}
                onClick={() => handleSelectPlace(s.description)}
                className="w-full text-left px-4 py-3 text-[0.85rem] text-neutral-700 hover:bg-neutral-50 border-b border-neutral-100 last:border-0 transition-colors"
              >
                {s.description}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected places chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2.5 max-w-lg mb-8">
          {selected.map(name => (
            <span
              key={name}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[0.85rem] bg-black text-white rounded-full"
            >
              {name}
              <button
                onClick={() => handleRemovePlace(name)}
                className="ml-1 hover:text-neutral-300 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {selected.length === 0 && (
        <p className="text-micro text-muted mb-8">No places added yet</p>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-4">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="px-6 py-3 text-[0.85rem] font-medium text-neutral-500 hover:text-black transition-colors"
          >
            Back
          </button>
        )}
        {isLast ? (
          <button
            onClick={onComplete}
            className="px-8 py-3 text-[0.85rem] font-medium bg-black text-white rounded-full hover:bg-neutral-800 transition-colors"
          >
            Done \u2014 let's go
          </button>
        ) : (
          <button
            onClick={() => setStep(step + 1)}
            className="px-8 py-3 text-[0.85rem] font-medium bg-black text-white rounded-full hover:bg-neutral-800 transition-colors"
          >
            Next
          </button>
        )}
      </div>

      {/* Skip */}
      <button
        onClick={onSkip}
        className="mt-6 text-caption text-muted hover:text-black transition-colors"
      >
        Skip for now
      </button>
    </div>
  );
}
`);

console.log('\n  All files written! (v2 with images + search onboarding)\n');
console.log('  Next steps:');
console.log('  1. Make sure server/.env has your API keys');
console.log('  2. Install & run server:');
console.log('     cd server && npm install && npm run dev');
console.log('');
console.log('  3. Install & run client (new terminal):');
console.log('     cd client && npm install && npm run dev');
console.log('');
console.log('  4. Clear localStorage in browser console:');
console.log('     localStorage.clear()');
console.log('');
console.log('  5. Open http://localhost:5173');
console.log('');
