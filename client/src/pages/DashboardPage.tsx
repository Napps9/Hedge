import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authAPI } from '../services/api';
import { useConversations } from '../hooks/useConversations';
import ConversationCard from '../components/ConversationCard';
import InputBox from '../components/InputBox';
import EmptyState from '../components/EmptyState';

function DashboardPage() {
  const navigate = useNavigate();
  const { conversations, isLoading, error, submitQuery, loadHistory, scrollRef } =
    useConversations();
  const [suggestion, setSuggestion] = useState('');

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleLogout = async () => {
    await authAPI.logout();
    navigate('/login');
  };

  const handleSuggestionClick = (text: string) => {
    setSuggestion(text);
  };

  const handleSubmit = (query: string) => {
    setSuggestion('');
    submitQuery(query);
  };

  const hasConversations = conversations.length > 0;

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="shrink-0 border-b border-border/60 py-4">
        <div className="container flex justify-between items-center">
          <h1 className="text-xl font-extralight tracking-wide">Hedge</h1>
          <button
            onClick={handleLogout}
            className="text-caption text-muted hover:text-primary transition-colors duration-200"
          >
            Sign out
          </button>
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
