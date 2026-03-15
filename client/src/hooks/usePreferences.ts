import { useState } from 'react';
import { UserPreferences } from '../types';

const STORAGE_KEY = 'hedge_preferences';

const defaultPreferences: UserPreferences = {
  restaurants: [],
  cafes: [],
  bars: [],
  favouritePlaces: [],
  completed: false,
};

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return { ...defaultPreferences, ...parsed };
      } catch {}
    }
    return defaultPreferences;
  });

  const save = (updated: UserPreferences) => {
    setPreferences(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const toggleItem = (category: 'restaurants' | 'cafes' | 'bars', item: string) => {
    const list = preferences[category];
    const updated = list.includes(item)
      ? list.filter(i => i !== item)
      : [...list, item];
    save({ ...preferences, [category]: updated });
  };

  const addFavourite = (name: string) => {
    if (!preferences.favouritePlaces.includes(name)) {
      save({ ...preferences, favouritePlaces: [...preferences.favouritePlaces, name] });
    }
  };

  const removeFavourite = (name: string) => {
    save({ ...preferences, favouritePlaces: preferences.favouritePlaces.filter(n => n !== name) });
  };

  const completeOnboarding = () => {
    save({ ...preferences, completed: true });
  };

  const resetOnboarding = () => {
    save(defaultPreferences);
  };

  return { preferences, toggleItem, addFavourite, removeFavourite, completeOnboarding, resetOnboarding };
}
