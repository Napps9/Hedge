const suggestions = [
  'Dinner this weekend',
  'Best coffee nearby',
  'Something fun on Saturday',
  'A quiet place to work',
];

export default function EmptyState({ onSuggestion }: { onSuggestion: (s: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="mb-8 text-border">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.75">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4l3 3" strokeLinecap="round" />
        </svg>
      </div>
      <h2 className="text-headline text-black mb-3">What are you in the mood for?</h2>
      <p className="text-caption text-muted mb-10">I'll find places near you</p>
      <div className="flex flex-wrap justify-center gap-3">
        {suggestions.map(s => (
          <button
            key={s}
            onClick={() => onSuggestion(s)}
            className="px-4 py-2 text-caption text-muted border border-border rounded-full hover:border-black hover:text-black transition-all"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
