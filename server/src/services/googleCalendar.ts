import { google } from 'googleapis';
import pg from 'pg';
import { CalendarEvent } from '../types/index.js';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const googleCalendar = {
  getUpcomingEvents: async (userId: string): Promise<CalendarEvent[]> => {
    try {
      // Get user's access token
      const client = await pool.connect();
      try {
        const tokenResult = await client.query(
          'SELECT access_token FROM google_tokens WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
          [userId],
        );

        if (tokenResult.rows.length === 0) {
          throw new Error('No Google tokens found for user');
        }

        const { access_token } = tokenResult.rows[0];

        // Fetch calendar events
        const calendar = google.calendar('v3');
        const response = await calendar.events.list({
          calendarId: 'primary',
          timeMin: new Date().toISOString(),
          maxResults: 10,
          singleEvents: true,
          orderBy: 'startTime',
          auth: {
            access_token,
          },
        });

        // Parse events
        const events: CalendarEvent[] = (response.data.items || []).map((item) => ({
          id: item.id || '',
          summary: item.summary || '',
          startTime: new Date(item.start?.dateTime || item.start?.date || ''),
          endTime: new Date(item.end?.dateTime || item.end?.date || ''),
          description: item.description || null,
          location: item.location || null,
        }));

        return events;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw error;
    }
  },
};
