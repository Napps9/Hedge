import { PlaceResult } from '../types/index.js';

const getApiKey = () => process.env.GOOGLE_PLACES_API_KEY || '';

export function getPhotoUrl(photoReference: string): string {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${getApiKey()}`;
}

export async function searchPlaces(
  query: string,
  latitude: number,
  longitude: number,
): Promise<PlaceResult[]> {
  const apiKey = getApiKey();

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
      photoUrl: p.photos?.[0]?.photo_reference
        ? getPhotoUrl(p.photos[0].photo_reference)
        : null,
    }));
  } catch (error) {
    console.error('Places search error:', error);
    return [];
  }
}

export async function autocompletePlaces(
  input: string,
  latitude: number,
  longitude: number,
): Promise<{ placeId: string; description: string }[]> {
  const apiKey = getApiKey();
  if (!apiKey || !input.trim()) return [];

  try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&location=${latitude},${longitude}&radius=8000&types=establishment&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.predictions) return [];

    return data.predictions.slice(0, 5).map((p: any) => ({
      placeId: p.place_id,
      description: p.description,
    }));
  } catch (error) {
    console.error('Autocomplete error:', error);
    return [];
  }
}

function priceLevelLabel(level?: number): string | null {
  if (level === undefined) return null;
  return ['Free', '$', '$$', '$$$', '$$$$'][level] || null;
}
