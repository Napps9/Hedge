import Anthropic from '@anthropic-ai/sdk';
import { CalendarEvent, EmailSummary, RecommendationResponse } from '../types/index.js';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

export const claudeAgent = {
  generateRecommendations: async (
    query: string,
    calendar: CalendarEvent[],
    emailSummary: EmailSummary,
  ): Promise<RecommendationResponse> => {
    try {
      // Format user context
      const calendarContext = calendar
        .slice(0, 5)
        .map(
          (e) =>
            `- ${e.summary} on ${e.startTime.toDateString()} at ${e.startTime.toLocaleTimeString()} ${e.location ? `(${e.location})` : ''}`,
        )
        .join('\n');

      const emailContext = `
Interested in: ${emailSummary.topics.slice(0, 3).join(', ')}
Recent contacts: ${emailSummary.senders.slice(0, 3).join(', ')}
      `.trim();

      const systemPrompt = `You are Hedge, an AI lifestyle assistant. You help users discover and book places based on their schedule, interests, and preferences.

User Context:
Calendar Events (upcoming):
${calendarContext || '(No upcoming events)'}

Interests from emails:
${emailContext}

Your task:
1. When asked about places to visit, recommend 2-3 specific places that match their interests and schedule
2. For each recommendation, explain WHY it matches their interests/schedule
3. If they ask about availability/booking, suggest specific times that work with their calendar
4. Format your response as JSON with this structure:
{
  "recommendations": [
    {
      "name": "Place Name",
      "category": "restaurant|museum|park|etc",
      "why_recommended": "Why this matches their interests/schedule",
      "google_places_link": "https://maps.google.com/?q=...",
      "suggested_times": "Suggested times if applicable"
    }
  ],
  "reasoning": "Brief overall reasoning"
}

Be concise, specific, and helpful. Focus on genuine recommendations based on their schedule and interests.`;

      const response = await anthropic.messages.create({
        model: 'claude-opus-4-1',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: query,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      try {
        // Extract JSON from response
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }

        const result = JSON.parse(jsonMatch[0]) as RecommendationResponse;
        return result;
      } catch (parseError) {
        console.error('Failed to parse AI response:', content.text);
        throw new Error('Failed to parse AI recommendations');
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  },
};
