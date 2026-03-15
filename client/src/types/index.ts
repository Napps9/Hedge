export interface Recommendation {
  name: string;
  category: string;
  why_recommended: string;
  google_places_link: string;
  suggested_times?: string;
  rating?: number | null;
  price?: string | null;
  photo_url?: string | null;
}

export interface Conversation {
  id: string;
  query: string;
  recommendations: Recommendation[];
  timestamp: Date;
  isLoading: boolean;
}

export interface UserPreferences {
  restaurants: string[];
  cafes: string[];
  bars: string[];
  favouritePlaces: string[];
  completed: boolean;
}
