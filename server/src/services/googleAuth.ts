import { google } from 'googleapis';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const { Pool } = pg;

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL,
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const googleAuth = {
  getAuthUrl: () => {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });

    return url;
  },

  handleCallback: async (code: string) => {
    try {
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      // Get user info
      const oauth2 = google.oauth2('v2');
      const userInfo = await oauth2.userinfo.get({ auth: oauth2Client });
      const { email, id: google_id } = userInfo.data;

      if (!email || !google_id) {
        throw new Error('Could not get user info from Google');
      }

      // Save or update user in database
      const userId = await upsertUser(email, google_id);

      // Save tokens
      await saveGoogleTokens(
        userId,
        tokens.access_token!,
        tokens.refresh_token || null,
        tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      );

      // Generate JWT token
      const jwtToken = jwt.sign(
        { userId, email },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' },
      );

      return { jwtToken, userId, email };
    } catch (error) {
      console.error('OAuth callback error:', error);
      throw error;
    }
  },

  getOAuth2Client: () => oauth2Client,
};

async function upsertUser(email: string, google_id: string): Promise<string> {
  const client = await pool.connect();
  try {
    // Check if user exists
    const result = await client.query('SELECT id FROM users WHERE email = $1', [email]);

    if (result.rows.length > 0) {
      return result.rows[0].id;
    }

    // Create new user
    const userId = uuidv4();
    await client.query(
      'INSERT INTO users (id, email, google_id) VALUES ($1, $2, $3)',
      [userId, email, google_id],
    );

    return userId;
  } finally {
    client.release();
  }
}

async function saveGoogleTokens(
  userId: string,
  accessToken: string,
  refreshToken: string | null,
  expiresAt: Date | null,
): Promise<void> {
  const client = await pool.connect();
  try {
    const id = uuidv4();
    await client.query(
      'INSERT INTO google_tokens (id, user_id, access_token, refresh_token, expires_at) VALUES ($1, $2, $3, $4, $5)',
      [id, userId, accessToken, refreshToken, expiresAt],
    );
  } finally {
    client.release();
  }
}
