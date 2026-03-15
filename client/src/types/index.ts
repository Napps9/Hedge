export interface Recommendation {
  name: string;
  category: string;
  why_recommended: string;
  google_places_link?: string;
  suggested_times?: string;
}

export interface ConversationMessage {
  id: string;
  type: 'query' | 'recommendation';
  content: string | Recommendation[];
  timestamp: Date;
  recommendations?: Recommendation[];
}

export interface User {
  id: string;
  email: string;
  created_at: Date;
}
