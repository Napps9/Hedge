import { Conversation } from '../types';
import RecommendationCard from './RecommendationCard';
import LoadingPulse from './LoadingPulse';

export default function ConversationCard({ conv }: { conv: Conversation }) {
  const time = new Date(conv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="animate-slide-up mb-8">
      <div className="flex items-baseline gap-3 mb-4">
        <p className="text-body font-medium text-black">{conv.query}</p>
        <span className="shrink-0 text-micro text-neutral-400">{time}</span>
      </div>

      {conv.isLoading && <LoadingPulse />}

      {!conv.isLoading && conv.recommendations.length > 0 && (
        <div className="pl-5 border-l-2 border-black">
          {conv.recommendations.map((rec, i) => (
            <RecommendationCard key={i} rec={rec} />
          ))}
        </div>
      )}
    </div>
  );
}
