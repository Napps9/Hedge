import { Recommendation } from '../types';

interface Props {
  rec: Recommendation;
  onView?: (rec: Recommendation) => void;
}

export default function RecommendationCard({ rec, onView }: Props) {
  const handleBookClick = () => {
    if (onView) onView(rec);
  };

  return (
    <div className="py-5 border-b-2 border-neutral-200 last:border-0">
      <div className="flex items-start gap-4">
        {/* Image thumbnail */}
        <div className="shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-neutral-100">
          {rec.photo_url ? (
            <img src={rec.photo_url} alt={rec.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-300">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="text-[1.05rem] font-medium truncate">{rec.name}</h4>
            {rec.category && (
              <span className="shrink-0 px-2.5 py-0.5 text-micro uppercase tracking-wider text-white bg-black rounded-full">
                {rec.category}
              </span>
            )}
            {rec.rating && (
              <span className="shrink-0 text-caption font-medium text-black">{rec.rating}/5</span>
            )}
            {rec.price && (
              <span className="shrink-0 text-caption text-muted">{rec.price}</span>
            )}
          </div>

          <p className="text-caption text-neutral-600 leading-relaxed">{rec.why_recommended}</p>

          {rec.suggested_times && (
            <div className="flex items-center gap-2 mt-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-400">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="text-caption text-neutral-500">{rec.suggested_times}</span>
            </div>
          )}
        </div>

        {/* Book button */}
        {rec.google_places_link && (
          <a
            href={rec.google_places_link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleBookClick}
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-black text-white text-caption font-medium rounded-full hover:bg-neutral-800 transition-colors"
            aria-label={`Book ${rec.name}`}
          >
            Book
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17L17 7M17 7H7M17 7v10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
