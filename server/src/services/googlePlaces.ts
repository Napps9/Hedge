import { PlaceResult } from '../types/index.js';

export async function searchPlaces(
  query: string,
  latitude: number,
  longitude: number,
): Promise<PlaceResult[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    console.warn('GOOGLE_PLACES_API_KEY not set — skipping places search');
    return [];
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${latitude},${longitude}&radius=8000&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'REQUEST_DENIED') {
      console.error('Places API denied:', data.error_message);
      return [];
    }

    if (!data.results || data.results.length === 0) {
      return [];
    }

    return data.results.slice(0, 8).map((p: any) => ({
      name: p.name,
      address: p.formatted_address || '',
      rating: p.rating || null,
      priceLevel: priceLevelLabel(p.price_level),
      types: p.types || [],
      googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
    }));
  } catch (error) {
    console.error('Places search error:', error);
    return [];
  }
}

function priceLevelLabel(level?: number): string | null {
  if (level === undefined) return null;
  return ['Free', '$', '$$', '$$$', '$$$$'][level] || null;
}
