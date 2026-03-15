import { useState, useEffect } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  loading: boolean;
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>(() => {
    // Try to load cached location
    const cached = localStorage.getItem('hedge_location');
    if (cached) {
      try {
        return { ...JSON.parse(cached), loading: false, error: null };
      } catch {
        // ignore
      }
    }
    return { latitude: null, longitude: null, city: null, loading: true, error: null };
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({ ...prev, loading: false, error: 'Geolocation not supported' }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Reverse geocode to get city name
        let city: string | null = null;
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&result_type=locality&key=${import.meta.env.VITE_GOOGLE_CLIENT_ID ? '' : ''}`,
          );

          // If geocoding API isn't available, try a free alternative
          const geoResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          );
          if (geoResponse.ok) {
            const data = await geoResponse.json();
            city =
              data.address?.city ||
              data.address?.town ||
              data.address?.village ||
              data.address?.county ||
              null;
          }
        } catch {
          // City name is nice to have, not critical
        }

        const locationData = { latitude, longitude, city };
        localStorage.setItem('hedge_location', JSON.stringify(locationData));
        setState({ ...locationData, loading: false, error: null });
      },
      (error) => {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error.code === 1 ? 'Location permission denied' : 'Could not get location',
        }));
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    );
  }, []);

  return state;
}
