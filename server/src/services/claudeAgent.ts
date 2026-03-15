import Anthropic from '@anthropic-ai/sdk';
import { CalendarEvent, EmailSummary, RecommendationResponse } from '../types/index.js';

const hasApiKey = !!process.env.CLAUDE_API_KEY && process.env.CLAUDE_API_KEY !== 'sk-your-key';

const anthropic = hasApiKey
  ? new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })
  : null;

function getMockRecommendations(query: string): RecommendationResponse {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('dinner') || lowerQuery.includes('restaurant') || lowerQuery.includes('eat')) {
    return {
      recommendations: [
        {
          name: 'Osteria Francescana',
          category: 'restaurant',
          why_recommended: 'Highly rated Italian fine dining. Your Saturday evening is free, making it perfect for a leisurely dinner.',
          google_places_link: 'https://maps.google.com/?q=Osteria+Francescana',
          suggested_times: 'Saturday 7:30 PM or Sunday 8:00 PM',
        },
        {
          name: 'Blue Hill',
          category: 'restaurant',
          why_recommended: 'Farm-to-table dining with seasonal menus. Based on your email interests in sustainable food, this is a great match.',
          google_places_link: 'https://maps.google.com/?q=Blue+Hill+Restaurant',
          suggested_times: 'Friday 7:00 PM',
        },
      ],
      reasoning: 'Based on your free evenings this weekend and interest in quality dining.',
    };
  }

  if (lowerQuery.includes('coffee') || lowerQuery.includes('cafe') || lowerQuery.includes('work')) {
    return {
      recommendations: [
        {
          name: 'Intelligentsia Coffee',
          category: 'cafe',
          why_recommended: 'Quiet atmosphere with excellent wifi. Great for focused work sessions between your meetings.',
          google_places_link: 'https://maps.google.com/?q=Intelligentsia+Coffee',
          suggested_times: 'Weekday mornings before 10 AM',
        },
        {
          name: 'Stumptown Coffee Roasters',
          category: 'cafe',
          why_recommended: 'Known for their single-origin pour-overs. A 10-minute walk from your afternoon meeting location.',
          google_places_link: 'https://maps.google.com/?q=Stumptown+Coffee',
        },
      ],
      reasoning: 'Selected cafes near your usual locations with good work environments.',
    };
  }

  // Default recommendations
  return {
    recommendations: [
      {
        name: 'The High Line',
        category: 'park',
        why_recommended: 'An elevated park perfect for a midday break. You have a 2-hour gap on Wednesday afternoon.',
        google_places_link: 'https://maps.google.com/?q=The+High+Line',
        suggested_times: 'Wednesday 2:00 PM - 4:00 PM',
      },
      {
        name: 'MoMA',
        category: 'museum',
        why_recommended: 'The new contemporary exhibit opened this week. Your Saturday morning is completely free.',
        google_places_link: 'https://maps.google.com/?q=MoMA+Museum',
        suggested_times: 'Saturday 10:00 AM',
      },
      {
        name: 'Eataly',
        category: 'market',
        why_recommended: 'Italian food market and dining. Based on your recent emails about cooking, you might enjoy exploring their fresh ingredients.',
        google_places_link: 'https://maps.google.com/?q=Eataly',
      },
    ],
    reasoning: 'A mix of activities based on your available free time and interests.',
  };
}

export const claudeAgent = {
  generateRecommendations: async (
    query: string,
    calendar: CalendarEvent[],
    emailSummary: EmailSummary,
  ): Promise<RecommendationResponse> => {
    // Mock fallback when no API key
    if (!anthropic) {
      console.log('CLAUDE_API_KEY not set — using mock recommendations');
      return getMockRecommendations(query);
    }

    try {
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
