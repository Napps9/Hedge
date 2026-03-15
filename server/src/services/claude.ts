import Anthropic from '@anthropic-ai/sdk';
import { PlaceResult, Recommendation } from '../types/index.js';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY || '',
});

export async function getRecommendations(
  query: string,
  city: string | null,
  places: PlaceResult[],
): Promise<{ recommendations: Recommendation[]; reasoning: string }> {
  const placesContext =
    places.length > 0
      ? places
          .map((p, i) => {
            let line = `${i + 1}. ${p.name} — ${p.address}`;
            if (p.rating) line += ` (${p.rating}/5)`;
            if (p.priceLevel) line += ` [${p.priceLevel}]`;
            line += `\n   Link: ${p.googleMapsUrl}`;
            return line;
          })
          .join('\n')
      : '(No nearby places found — give general recommendations)';

  const systemPrompt = `You are Hedge, a lifestyle assistant that recommends real places to visit.

USER LOCATION: ${city || 'Unknown'}

NEARBY PLACES MATCHING THEIR REQUEST:
${placesContext}

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
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: query }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error: any) {
    console.error('Claude API error:', error?.message || error);
    throw error;
  }
}
