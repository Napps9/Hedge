import { useState, useEffect } from 'react';

interface Geo {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [geo, setGeo] = useState<Geo>(() => {
    const cached = localStorage.getItem('hedge_geo');
    if (cached) {
      try { return { ...JSON.parse(cached), loading: false }; } catch {}
    }
    return { latitude: null, longitude: null, city: null, loading: true };
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeo(prev => ({ ...prev, loading: false }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude, longitude } = coords;
        let city: string | null = null;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          if (res.ok) {
            const data = await res.json();
            city = data.address?.city || data.address?.town || data.address?.village || null;
          }
        } catch {}

        const result = { latitude, longitude, city, loading: false };
        localStorage.setItem('hedge_geo', JSON.stringify({ latitude, longitude, city }));
        setGeo(result);
      },
      () => setGeo(prev => ({ ...prev, loading: false })),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
  }, []);

  return geo;
}
