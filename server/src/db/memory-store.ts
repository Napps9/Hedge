import { v4 as uuidv4 } from 'uuid';
import { User, GoogleTokens, Conversation, Recommendation } from '../types/index.js';

// In-memory data stores
const users = new Map<string, User>();
const tokens = new Map<string, GoogleTokens>();
const conversations = new Map<string, Conversation & { recommendations: Recommendation[] }>();

export const memoryStore = {
  // Users
  getUser: (userId: string): User | undefined => {
    return users.get(userId);
  },

  getUserByEmail: (email: string): User | undefined => {
    for (const user of users.values()) {
      if (user.email === email) return user;
    }
    return undefined;
  },

  upsertUser: (email: string, googleId: string): string => {
    const existing = memoryStore.getUserByEmail(email);
    if (existing) return existing.id;

    const id = uuidv4();
    users.set(id, { id, email, google_id: googleId, created_at: new Date() });
    return id;
  },

  // Tokens
  saveTokens: (userId: string, accessToken: string, refreshToken: string | null, expiresAt: Date | null): void => {
    tokens.set(userId, {
      id: uuidv4(),
      user_id: userId,
      access_token: accessToken,
      refresh_token: refreshToken || '',
      expires_at: expiresAt || new Date(),
    });
  },

  getTokens: (userId: string): GoogleTokens | undefined => {
    return tokens.get(userId);
  },

  // Conversations
  saveConversation: (userId: string, query: string, recs: Array<{ name: string; category: string; why_recommended: string; suggested_times?: string }>): string => {
    const id = uuidv4();
    const recommendations: Recommendation[] = recs.map((r) => ({
      id: uuidv4(),
      conversation_id: id,
      place_name: r.name,
      place_category: r.category,
      google_places_id: '',
      recommendation_reason: r.why_recommended,
      suggested_times: r.suggested_times || null,
      created_at: new Date(),
    }));

    conversations.set(id, {
      id,
      user_id: userId,
      query,
      created_at: new Date(),
      recommendations,
    });

    return id;
  },

  getConversations: (userId: string): Array<{ id: string; query: string; created_at: Date; recommendations: any[] }> => {
    const result: Array<{ id: string; query: string; created_at: Date; recommendations: any[] }> = [];

    for (const conv of conversations.values()) {
      if (conv.user_id === userId) {
        result.push({
          id: conv.id,
          query: conv.query,
          created_at: conv.created_at,
          recommendations: conv.recommendations.map((r) => ({
            id: r.id,
            name: r.place_name,
            category: r.place_category,
            why_recommended: r.recommendation_reason,
            suggested_times: r.suggested_times,
          })),
        });
      }
    }

    return result.sort((a, b) => b.created_at.getTime() - a.created_at.getTime()).slice(0, 20);
  },
};
