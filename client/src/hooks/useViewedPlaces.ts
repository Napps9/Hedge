import { useState } from 'react';
import { Recommendation } from '../types';

const STORAGE_KEY = 'hedge_viewed_places';
const MAX_VIEWED = 6;

export function useViewedPlaces() {
  const [viewedPlaces, setViewedPlaces] = useState<Recommendation[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch {}
    }
    return [];
  });

  const addViewedPlace = (rec: Recommendation) => {
    setViewedPlaces(prev => {
      const filtered = prev.filter(p => p.name !== rec.name);
      const updated = [rec, ...filtered].slice(0, MAX_VIEWED);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return { viewedPlaces, addViewedPlace };
}
