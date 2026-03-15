import { Recommendation } from '../types';
import ViewedPlaceCard from './ViewedPlaceCard';

const suggestions = [
  'Dinner tonight at 8pm',
  'Coffee spot to work from this morning',
  'Drinks Friday evening',
  'Saturday brunch for 4 people',
];

const recommendedQueries = [
  'Best Italian near me',
  'Cozy cafe with wifi',
  'Rooftop bar for sunset drinks',
  'Brunch with outdoor seating',
];

interface Props {
  onSuggestion: (s: string) => void;
  viewedPlaces: Recommendation[];
  favouritePlaces: string[];
}

export default function EmptyState({ onSuggestion, viewedPlaces, favouritePlaces }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      {/* Previously Viewed */}
      {viewedPlaces.length > 0 && (
        <div className="w-full max-w-lg mb-12">
          <h3 className="text-[0.8rem] font-semibold uppercase tracking-wider text-neutral-400 mb-4">Previously Viewed</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {viewedPlaces.map(rec => (
              <ViewedPlaceCard key={rec.name} rec={rec} />
            ))}
          </div>
        </div>
      )}

      {/* Recommended for you */}
      <div className="w-full max-w-lg mb-12">
        <h3 className="text-[0.8rem] font-semibold uppercase tracking-wider text-neutral-400 mb-4">Recommended for you</h3>
        <div className="flex flex-wrap gap-2.5">
          {favouritePlaces.length > 0 ? (
            favouritePlaces.slice(0, 4).map(place => (
              <button
                key={place}
                onClick={() => onSuggestion(`Something like ${place}`)}
                className="px-5 py-2.5 text-caption text-neutral-600 border-2 border-neutral-300 rounded-full hover:border-black hover:text-black transition-all"
              >
                {place}
              </button>
            ))
          ) : (
            recommendedQueries.map(q => (
              <button
                key={q}
                onClick={() => onSuggestion(q)}
                className="px-5 py-2.5 text-caption text-neutral-600 border-2 border-neutral-300 rounded-full hover:border-black hover:text-black transition-all"
              >
                {q}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main CTA */}
      <div className="mb-8 text-neutral-300">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.75">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4l3 3" strokeLinecap="round" />
        </svg>
      </div>
      <h2 className="text-headline text-black mb-3">When and where?</h2>
      <p className="text-caption text-muted mb-10">Tell me when you're free and I'll find the perfect spot</p>
      <div className="flex flex-wrap justify-center gap-3">
        {suggestions.map(s => (
          <button
            key={s}
            onClick={() => onSuggestion(s)}
            className="px-5 py-2.5 text-caption text-neutral-600 border-2 border-neutral-300 rounded-full hover:border-black hover:text-black transition-all"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
