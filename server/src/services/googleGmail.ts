import { google } from 'googleapis';
import pg from 'pg';
import { EmailSummary } from '../types/index.js';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const googleGmail = {
  getEmailSummary: async (userId: string): Promise<EmailSummary> => {
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

        // Fetch recent emails
        const gmail = google.gmail('v1');
        const response = await gmail.users.messages.list({
          userId: 'me',
          maxResults: 20,
          auth: {
            access_token,
          },
        });

        const messages = response.data.messages || [];

        // Get message details for subject and sender
        const emailDetails = await Promise.all(
          messages.slice(0, 10).map(async (msg) => {
            const detail = await gmail.users.messages.get({
              userId: 'me',
              id: msg.id!,
              format: 'metadata',
              metadataHeaders: ['From', 'Subject'],
              auth: {
                access_token,
              },
            });

            const headers = detail.data.payload?.headers || [];
            const subject = headers.find((h) => h.name === 'Subject')?.value || '';
            const from = headers.find((h) => h.name === 'From')?.value || '';

            return { subject, from };
          }),
        );

        // Extract unique senders and topics
        const senders = [...new Set(emailDetails.map((e) => e.from))];
        const topics = [...new Set(emailDetails.map((e) => e.subject).filter((s) => s))];

        return {
          senders: senders.slice(0, 5),
          topics: topics.slice(0, 5),
          recentEmails: emailDetails.slice(0, 5),
        };
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching email summary:', error);
      throw error;
    }
  },
};
