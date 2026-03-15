export interface User {
  id: string;
  email: string;
  google_id: string;
  created_at: Date;
}

export interface GoogleTokens {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: Date;
}

export interface Conversation {
  id: string;
  user_id: string;
  query: string;
  created_at: Date;
}

export interface Recommendation {
  id: string;
  conversation_id: string;
  place_name: string;
  place_category: string;
  google_places_id: string;
  recommendation_reason: string;
  suggested_times: string | null;
  created_at: Date;
}

export interface UserPreference {
  id: string;
  user_id: string;
  preference_key: string;
  preference_value: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  startTime: Date;
  endTime: Date;
  description: string | null;
  location: string | null;
}

export interface EmailSummary {
  senders: string[];
  topics: string[];
  recentEmails: Array<{
    subject: string;
    from: string;
  }>;
}

export interface RecommendationRequest {
  query: string;
  userContext?: {
    calendar: CalendarEvent[];
    emailSummary: EmailSummary;
  };
}

export interface RecommendationResponse {
  recommendations: Array<{
    name: string;
    category: string;
    why_recommended: string;
    google_places_link?: string;
    suggested_times?: string;
  }>;
  reasoning: string;
}
