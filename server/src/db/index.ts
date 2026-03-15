import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { memoryStore } from './memory-store.js';

const { Pool } = pg;

const usePostgres = !!process.env.DATABASE_URL;
let pool: pg.Pool | null = null;

if (usePostgres) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
}

export function getStorageMode(): string {
  return usePostgres ? 'postgresql' : 'memory';
}

export const db = {
  getUser: async (userId: string) => {
    if (!usePostgres) return memoryStore.getUser(userId);

    const client = await pool!.connect();
    try {
      const result = await client.query('SELECT id, email, created_at FROM users WHERE id = $1', [userId]);
      return result.rows[0] || undefined;
    } finally {
      client.release();
    }
  },

  upsertUser: async (email: string, googleId: string): Promise<string> => {
    if (!usePostgres) return memoryStore.upsertUser(email, googleId);

    const client = await pool!.connect();
    try {
      const result = await client.query('SELECT id FROM users WHERE email = $1', [email]);
      if (result.rows.length > 0) return result.rows[0].id;

      const userId = uuidv4();
      await client.query('INSERT INTO users (id, email, google_id) VALUES ($1, $2, $3)', [userId, email, googleId]);
      return userId;
    } finally {
      client.release();
    }
  },

  saveTokens: async (userId: string, accessToken: string, refreshToken: string | null, expiresAt: Date | null) => {
    if (!usePostgres) {
      memoryStore.saveTokens(userId, accessToken, refreshToken, expiresAt);
      return;
    }

    const client = await pool!.connect();
    try {
      await client.query(
        'INSERT INTO google_tokens (id, user_id, access_token, refresh_token, expires_at) VALUES ($1, $2, $3, $4, $5)',
        [uuidv4(), userId, accessToken, refreshToken, expiresAt],
      );
    } finally {
      client.release();
    }
  },

  saveConversation: async (
    userId: string,
    query: string,
    recommendations: Array<{ name: string; category: string; why_recommended: string; suggested_times?: string }>,
  ): Promise<string> => {
    if (!usePostgres) {
      return memoryStore.saveConversation(userId, query, recommendations);
    }

    const client = await pool!.connect();
    try {
      const conversationId = uuidv4();
      await client.query(
        'INSERT INTO conversations (id, user_id, query) VALUES ($1, $2, $3)',
        [conversationId, userId, query],
      );

      for (const rec of recommendations) {
        await client.query(
          'INSERT INTO recommendations (id, conversation_id, place_name, place_category, recommendation_reason, suggested_times) VALUES ($1, $2, $3, $4, $5, $6)',
          [uuidv4(), conversationId, rec.name, rec.category, rec.why_recommended, rec.suggested_times || null],
        );
      }

      return conversationId;
    } finally {
      client.release();
    }
  },

  getConversations: async (userId: string) => {
    if (!usePostgres) return memoryStore.getConversations(userId);

    const client = await pool!.connect();
    try {
      const result = await client.query(
        `SELECT c.id, c.query, c.created_at, json_agg(
          json_build_object(
            'id', r.id,
            'name', r.place_name,
            'category', r.place_category,
            'why_recommended', r.recommendation_reason,
            'suggested_times', r.suggested_times
          )
        ) as recommendations
        FROM conversations c
        LEFT JOIN recommendations r ON c.id = r.conversation_id
        WHERE c.user_id = $1
        GROUP BY c.id, c.query, c.created_at
        ORDER BY c.created_at DESC
        LIMIT 20`,
        [userId],
      );
      return result.rows;
    } finally {
      client.release();
    }
  },
};
