import { Recommendation } from '../types';

export default function RecommendationCard({ rec }: { rec: Recommendation }) {
  return (
    <div className="py-5 border-b border-border/50 last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="text-[1.05rem] font-medium truncate">{rec.name}</h4>
            {rec.category && (
              <span className="shrink-0 px-2.5 py-0.5 text-micro uppercase tracking-wider text-muted bg-surface rounded-full">
                {rec.category}
              </span>
            )}
            {rec.rating && (
              <span className="shrink-0 text-caption text-muted">{rec.rating}/5</span>
            )}
            {rec.price && (
              <span className="shrink-0 text-caption text-muted">{rec.price}</span>
            )}
          </div>

          <p className="text-caption text-muted leading-relaxed">{rec.why_recommended}</p>

          {rec.suggested_times && (
            <div className="flex items-center gap-2 mt-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted/60">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="text-caption text-muted/80">{rec.suggested_times}</span>
            </div>
          )}
        </div>

        {rec.google_places_link && (
          <a
            href={rec.google_places_link}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 p-2 text-muted/40 hover:text-black transition-colors"
            aria-label={`View ${rec.name} on Maps`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M7 17L17 7M17 7H7M17 7v10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
