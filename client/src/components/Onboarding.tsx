import { useState, useEffect, useRef } from 'react';
import { UserPreferences } from '../types';

interface Props {
  preferences: UserPreferences;
  onToggle: (category: 'restaurants' | 'cafes' | 'bars', item: string) => void;
  onComplete: () => void;
  onSkip: () => void;
  onAddFavourite: (name: string) => void;
  onRemoveFavourite: (name: string) => void;
}

const sections: { key: 'restaurants' | 'cafes' | 'bars'; label: string; icon: string; placeholder: string }[] = [
  { key: 'restaurants', label: 'Restaurants', icon: '\u{1F37D}', placeholder: 'Search for your favourite restaurants...' },
  { key: 'cafes', label: 'Cafes', icon: '\u2615', placeholder: 'Search for your favourite cafes...' },
  { key: 'bars', label: 'Bars', icon: '\u{1F378}', placeholder: 'Search for your favourite bars...' },
];

const API = 'http://localhost:3000';

export default function Onboarding({ preferences, onToggle, onComplete, onSkip, onAddFavourite, onRemoveFavourite }: Props) {
  const [step, setStep] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<{ placeId: string; description: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const section = sections[step];
  const isLast = step === sections.length - 1;
  const selected = preferences[section.key];

  useEffect(() => {
    setSearchInput('');
    setSuggestions([]);
  }, [step]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (searchInput.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Use geolocation if available, default to London
        const lat = 51.5074;
        const lng = -0.1278;
        const res = await fetch(
          `${API}/api/places/autocomplete?input=${encodeURIComponent(searchInput)}&lat=${lat}&lng=${lng}`
        );
        const data = await res.json();
        setSuggestions(data.predictions || []);
      } catch {
        setSuggestions([]);
      }
      setIsSearching(false);
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput]);

  const handleSelectPlace = (description: string) => {
    // Extract just the place name (before the first comma)
    const name = description.split(',')[0].trim();
    onToggle(section.key, name);
    onAddFavourite(name);
    setSearchInput('');
    setSuggestions([]);
  };

  const handleRemovePlace = (name: string) => {
    onToggle(section.key, name);
    onRemoveFavourite(name);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-10">
        {sections.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all ${
              i < step ? 'bg-black border-black text-white' :
              i === step ? 'border-black text-black' :
              'border-neutral-300 text-neutral-300'
            }`}>
              {i < step ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : i + 1}
            </div>
            {i < sections.length - 1 && (
              <div className={`w-12 h-0.5 ${i < step ? 'bg-black' : 'bg-neutral-200'} transition-all`} />
            )}
          </div>
        ))}
      </div>

      {/* Section header */}
      <div className="text-center mb-8">
        <span className="text-3xl mb-3 block">{section.icon}</span>
        <h2 className="text-headline text-black mb-2">
          Your favourite {section.label.toLowerCase()}
        </h2>
        <p className="text-caption text-muted">
          Search and add places you love — helps us find better spots
        </p>
      </div>

      {/* Search input */}
      <div className="w-full max-w-md mb-4 relative">
        <div className="relative">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder={section.placeholder}
            className="w-full pl-11 pr-4 py-3 text-[0.9rem] border-2 border-neutral-300 rounded-xl focus:border-black focus:outline-none transition-colors"
          />
          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Autocomplete dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-neutral-200 rounded-xl shadow-lg z-10 overflow-hidden">
            {suggestions.map(s => (
              <button
                key={s.placeId}
                onClick={() => handleSelectPlace(s.description)}
                className="w-full text-left px-4 py-3 text-[0.85rem] text-neutral-700 hover:bg-neutral-50 border-b border-neutral-100 last:border-0 transition-colors"
              >
                {s.description}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected places chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2.5 max-w-lg mb-8">
          {selected.map(name => (
            <span
              key={name}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[0.85rem] bg-black text-white rounded-full"
            >
              {name}
              <button
                onClick={() => handleRemovePlace(name)}
                className="ml-1 hover:text-neutral-300 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {selected.length === 0 && (
        <p className="text-micro text-muted mb-8">No places added yet</p>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-4">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="px-6 py-3 text-[0.85rem] font-medium text-neutral-500 hover:text-black transition-colors"
          >
            Back
          </button>
        )}
        {isLast ? (
          <button
            onClick={onComplete}
            className="px-8 py-3 text-[0.85rem] font-medium bg-black text-white rounded-full hover:bg-neutral-800 transition-colors"
          >
            Done — let's go
          </button>
        ) : (
          <button
            onClick={() => setStep(step + 1)}
            className="px-8 py-3 text-[0.85rem] font-medium bg-black text-white rounded-full hover:bg-neutral-800 transition-colors"
          >
            Next
          </button>
        )}
      </div>

      {/* Skip */}
      <button
        onClick={onSkip}
        className="mt-6 text-caption text-muted hover:text-black transition-colors"
      >
        Skip for now
      </button>
    </div>
  );
}
