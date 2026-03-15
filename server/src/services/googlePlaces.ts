import { PlaceResult } from '../types/index.js';

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_CLIENT_ID;

export const googlePlaces = {
  searchNearby: async (
    query: string,
    latitude: number,
    longitude: number,
    radius: number = 5000,
  ): Promise<PlaceResult[]> => {
    try {
      // Use Google Places Text Search API
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${latitude},${longitude}&radius=${radius}&key=${PLACES_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('Places API error:', data.status, data.error_message);

        // If API key doesn't work for Places, try Nearby Search
        if (data.status === 'REQUEST_DENIED') {
          console.log('Places API denied — ensure Places API is enabled in Google Cloud Console');
          return getFallbackPlaces(query);
        }
      }

      if (!data.results || data.results.length === 0) {
        return [];
      }

      return data.results.slice(0, 8).map((place: any) => ({
        name: place.name,
        address: place.formatted_address || '',
        rating: place.rating || null,
        priceLevel: priceLevelToString(place.price_level),
        types: place.types || [],
        googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
        placeId: place.place_id,
      }));
    } catch (error) {
      console.error('Error searching places:', error);
      return getFallbackPlaces(query);
    }
  },
};

function priceLevelToString(level: number | undefined): string | null {
  if (level === undefined || level === null) return null;
  const labels: Record<number, string> = {
    0: 'Free',
    1: '$',
    2: '$$',
    3: '$$$',
    4: '$$$$',
  };
  return labels[level] || null;
}

function getFallbackPlaces(query: string): PlaceResult[] {
  // Return empty — Claude will work with calendar/email context alone
  console.log('No places data available for query:', query);
  return [];
}
