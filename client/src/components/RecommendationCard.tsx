import { Recommendation } from '../types';

interface RecommendationCardProps {
  recommendation: Recommendation;
}

function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const { name, category, why_recommended, google_places_link, suggested_times } = recommendation;

  return (
    <div className="group py-5 border-b border-border/50 last:border-0 transition-colors duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Name and category */}
          <div className="flex items-center gap-3 mb-2">
            <h4 className="text-title truncate">{name}</h4>
            {category && (
              <span className="shrink-0 px-2.5 py-0.5 text-micro uppercase tracking-wider
                             text-muted bg-subtle rounded-full">
                {category}
              </span>
            )}
          </div>

          {/* Why recommended */}
          <p className="text-caption text-muted leading-relaxed mb-2">
            {why_recommended}
          </p>

          {/* Suggested times */}
          {suggested_times && (
            <div className="flex items-center gap-2 mt-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="1.5" className="text-muted/60">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="text-caption text-muted/80">{suggested_times}</span>
            </div>
          )}
        </div>

        {/* External link */}
        {google_places_link && (
          <a
            href={google_places_link}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 p-2 text-muted/40 hover:text-primary
                       transition-colors duration-200"
            aria-label={`View ${name} on Google Maps`}
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

export default RecommendationCard;
