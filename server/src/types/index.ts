export interface PlaceResult {
  name: string;
  address: string;
  rating: number | null;
  priceLevel: string | null;
  types: string[];
  googleMapsUrl: string;
}

export interface Recommendation {
  name: string;
  category: string;
  why_recommended: string;
  google_places_link: string;
  suggested_times?: string;
  rating?: number | null;
  price?: string | null;
}

export interface ConversationEntry {
  id: string;
  query: string;
  recommendations: Recommendation[];
  timestamp: string;
}
