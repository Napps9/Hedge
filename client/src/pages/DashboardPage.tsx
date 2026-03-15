import { useEffect, useState } from 'react';
import { useConversations } from '../hooks/useConversations';
import { useGeolocation } from '../hooks/useGeolocation';
import ConversationCard from '../components/ConversationCard';
import InputBox from '../components/InputBox';
import EmptyState from '../components/EmptyState';

function DashboardPage() {
  const { conversations, isLoading, error, submitQuery, loadHistory, scrollRef } =
    useConversations();
  const { latitude, longitude, city } = useGeolocation();
  const [suggestion, setSuggestion] = useState('');

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSuggestionClick = (text: string) => {
    setSuggestion(text);
  };

  const handleSubmit = (query: string) => {
    setSuggestion('');
    submitQuery(query, { latitude, longitude });
  };

  const hasConversations = conversations.length > 0;

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="shrink-0 border-b border-border/60 py-4">
        <div className="container flex justify-between items-center">
          <div className="flex items-baseline gap-3">
            <h1 className="text-xl font-extralight tracking-wide">Hedge</h1>
            {city && (
              <span className="text-micro text-muted">{city}</span>
            )}
          </div>
        </div>
      </header>

      {/* Conversation area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scroll">
        <div className="container py-8">
          {!hasConversations && !isLoading && (
            <EmptyState onSuggestionClick={handleSuggestionClick} />
          )}

          {hasConversations && (
            <div className="max-w-2xl mx-auto">
              {conversations.map((conv) => (
                <ConversationCard
                  key={conv.id}
                  query={conv.query}
                  recommendations={conv.recommendations}
                  timestamp={conv.timestamp}
                  isLoading={conv.isLoading}
                />
              ))}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="max-w-2xl mx-auto mt-4">
              <p className="text-caption text-red-500/80">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Input area — fixed at bottom */}
      <div className="shrink-0 border-t border-border/40 bg-white">
        <div className="container py-4 max-w-2xl mx-auto">
          <InputBox
            onSubmit={handleSubmit}
            isLoading={isLoading}
            initialValue={suggestion}
            placeholder="Find a place, ask about your schedule..."
          />
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
