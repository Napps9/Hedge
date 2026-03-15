import { Recommendation } from '../types';
import RecommendationCard from './RecommendationCard';
import LoadingPulse from './LoadingPulse';

interface ConversationCardProps {
  query: string;
  recommendations: Recommendation[];
  timestamp: Date;
  isLoading?: boolean;
}

function ConversationCard({ query, recommendations, timestamp, isLoading }: ConversationCardProps) {
  const timeString = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="animate-slide-up mb-8">
      {/* User query */}
      <div className="flex items-baseline gap-3 mb-4">
        <p className="text-body text-muted">{query}</p>
        <span className="shrink-0 text-micro text-muted/40">{timeString}</span>
      </div>

      {/* Loading state */}
      {isLoading && <LoadingPulse />}

      {/* Recommendations */}
      {!isLoading && recommendations.length > 0 && (
        <div className="ml-0 pl-4 border-l border-border/60">
          {recommendations.map((rec, index) => (
            <RecommendationCard key={index} recommendation={rec} />
          ))}
        </div>
      )}
    </div>
  );
}

export default ConversationCard;
