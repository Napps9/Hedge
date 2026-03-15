interface EmptyStateProps {
  onSuggestionClick: (text: string) => void;
}

const suggestions = [
  'Dinner this weekend',
  'Coffee nearby',
  'Something fun on Saturday',
  'A quiet place to work',
];

function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
      {/* Icon */}
      <div className="mb-8 text-border">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.75">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4l3 3" strokeLinecap="round" />
        </svg>
      </div>

      <h2 className="text-headline text-primary mb-3">
        What are you in the mood for?
      </h2>
      <p className="text-caption text-muted mb-10">
        I'll find the perfect spot based on your schedule
      </p>

      {/* Suggestion chips */}
      <div className="flex flex-wrap justify-center gap-3">
        {suggestions.map((text) => (
          <button
            key={text}
            onClick={() => onSuggestionClick(text)}
            className="px-4 py-2 text-caption text-muted border border-border
                       rounded-full hover:border-primary hover:text-primary
                       transition-all duration-200"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

export default EmptyState;
