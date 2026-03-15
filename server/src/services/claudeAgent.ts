import Anthropic from '@anthropic-ai/sdk';
import { CalendarEvent, EmailSummary, PlaceResult, RecommendationResponse } from '../types/index.js';

const hasApiKey = !!process.env.CLAUDE_API_KEY && process.env.CLAUDE_API_KEY !== 'sk-your-key';

const anthropic = hasApiKey
  ? new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })
  : null;

export const claudeAgent = {
  generateRecommendations: async (
    query: string,
    calendar: CalendarEvent[],
    emailSummary: EmailSummary,
    nearbyPlaces: PlaceResult[],
    city: string | null,
  ): Promise<RecommendationResponse> => {
    if (!anthropic) {
      console.log('CLAUDE_API_KEY not set — returning empty recommendations');
      return { recommendations: [], reasoning: 'No API key configured' };
    }

    try {
      // Format calendar context
      const calendarContext = calendar
        .slice(0, 7)
        .map((e) => {
          const day = e.startTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
          const time = e.startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          const endTime = e.endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          return `- ${e.summary}: ${day} ${time}–${endTime}${e.location ? ` at ${e.location}` : ''}`;
        })
        .join('\n');

      // Format email interests
      const emailContext = emailSummary.topics.length > 0
        ? emailSummary.topics.join(', ')
        : 'No specific interests detected';

      // Format nearby places
      const placesContext = nearbyPlaces.length > 0
        ? nearbyPlaces
            .map((p, i) => {
              let line = `${i + 1}. ${p.name} — ${p.address}`;
              if (p.rating) line += ` (${p.rating}/5)`;
              if (p.priceLevel) line += ` [${p.priceLevel}]`;
              line += `\n   Maps: ${p.googleMapsUrl}`;
              return line;
            })
            .join('\n')
        : '(No specific places found — make general recommendations for the area)';

      const systemPrompt = `You are Hedge, a smart lifestyle assistant. You recommend real places to visit based on the user's schedule, interests, and location.

USER'S LOCATION: ${city || 'Unknown'}

UPCOMING CALENDAR:
${calendarContext || '(Calendar is empty — user is free)'}

INTERESTS (from recent emails):
${emailContext}

NEARBY PLACES MATCHING THEIR REQUEST:
${placesContext}

INSTRUCTIONS:
- Pick the 2-3 BEST places from the nearby results above (if available)
- Explain why each place fits their schedule and interests specifically
- If they ask about availability, check their calendar and suggest free time slots
- If no nearby places were found, recommend based on general knowledge of ${city || 'their area'}
- Include the real Google Maps link for each recommendation
- Be conversational and specific — reference their actual calendar events by name

Respond ONLY with valid JSON in this exact format:
{
  "recommendations": [
    {
      "name": "Actual Place Name",
      "category": "restaurant|cafe|museum|park|etc",
      "why_recommended": "Specific reason tied to their schedule/interests",
      "google_places_link": "https://www.google.com/maps/place/?q=place_id:...",
      "suggested_times": "Specific day/time suggestion based on calendar gaps"
    }
  ],
  "reasoning": "Brief summary of why these were chosen"
}`;

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
        throw new Error('No JSON found in response');
      }

      return JSON.parse(jsonMatch[0]) as RecommendationResponse;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  },
};
