const suggestions = [
  'Dinner tonight at 8pm',
  'Coffee spot to work from this morning',
  'Drinks Friday evening',
  'Saturday brunch for 4 people',
];

export default function EmptyState({ onSuggestion }: { onSuggestion: (s: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
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
