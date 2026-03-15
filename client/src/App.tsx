import { useState } from 'react';
import './index.css';
import { useGeolocation } from './hooks/useGeolocation';
import { useConversations } from './hooks/useConversations';
import ConversationCard from './components/ConversationCard';
import InputBox from './components/InputBox';
import EmptyState from './components/EmptyState';

export default function App() {
  const geo = useGeolocation();
  const { conversations, isLoading, error, submitQuery, scrollRef } = useConversations();
  const [suggestion, setSuggestion] = useState('');

  const handleSubmit = (query: string) => {
    setSuggestion('');
    submitQuery(query, geo);
  };

  const hasConversations = conversations.length > 0;

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="shrink-0 border-b border-border/60 py-4">
        <div className="max-w-[800px] mx-auto px-6 flex items-baseline gap-3">
          <h1 className="text-xl font-extralight tracking-wide">Hedge</h1>
          {geo.city && <span className="text-micro text-muted">{geo.city}</span>}
        </div>
      </header>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-[800px] mx-auto px-6 py-8">
          {!hasConversations && !isLoading && (
            <EmptyState onSuggestion={setSuggestion} />
          )}

          {hasConversations && (
            <div className="max-w-2xl mx-auto">
              {conversations.map(conv => (
                <ConversationCard key={conv.id} conv={conv} />
              ))}
            </div>
          )}

          {error && (
            <div className="max-w-2xl mx-auto mt-4">
              <p className="text-caption text-red-500/80">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-border/40 bg-white">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <InputBox onSubmit={handleSubmit} isLoading={isLoading} initialValue={suggestion} />
        </div>
      </div>
    </div>
  );
}
