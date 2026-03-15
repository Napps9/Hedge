import { Recommendation } from '../types';

export default function ViewedPlaceCard({ rec }: { rec: Recommendation }) {
  return (
    <a
      href={rec.google_places_link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-xl border-2 border-neutral-200 hover:border-black transition-all group"
    >
      {/* Thumbnail */}
      <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-neutral-100">
        {rec.photo_url ? (
          <img src={rec.photo_url} alt={rec.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[0.85rem] font-medium text-black truncate group-hover:underline">{rec.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {rec.category && (
            <span className="text-micro text-neutral-500 uppercase tracking-wider">{rec.category}</span>
          )}
          {rec.rating && (
            <span className="text-micro text-neutral-400">{rec.rating}/5</span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-neutral-300 group-hover:text-black transition-colors">
        <path d="M7 17L17 7M17 7H7M17 7v10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  );
}
