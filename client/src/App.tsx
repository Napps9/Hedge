import { useState } from 'react';
import './index.css';
import { useGeolocation } from './hooks/useGeolocation';
import { useConversations } from './hooks/useConversations';
import { usePreferences } from './hooks/usePreferences';
import { useViewedPlaces } from './hooks/useViewedPlaces';
import ConversationCard from './components/ConversationCard';
import InputBox from './components/InputBox';
import EmptyState from './components/EmptyState';
import Onboarding from './components/Onboarding';

export default function App() {
  const geo = useGeolocation();
  const { conversations, isLoading, error, submitQuery, scrollRef } = useConversations();
  const { preferences, toggleItem, addFavourite, removeFavourite, completeOnboarding } = usePreferences();
  const { viewedPlaces, addViewedPlace } = useViewedPlaces();
  const [suggestion, setSuggestion] = useState('');
  const [showHome, setShowHome] = useState(true);

  const handleSubmit = (query: string) => {
    setSuggestion('');
    setShowHome(false);
    submitQuery(query, geo);
  };

  const hasConversations = conversations.length > 0;
  const showOnboarding = !preferences.completed;
  const showEmptyState = showHome || (!hasConversations && !isLoading);

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="shrink-0 border-b-2 border-neutral-800 py-4">
        <div className="max-w-[800px] mx-auto px-6 flex items-center gap-3">
          {/* Home button */}
          {!showOnboarding && (
            <button
              onClick={() => setShowHome(true)}
              className="p-1.5 -ml-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
              aria-label="Go home"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <h1 className="text-xl font-semibold tracking-wide">Hedge</h1>
          {geo.city && <span className="text-micro text-muted">{geo.city}</span>}
        </div>
      </header>

      {showOnboarding ? (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[800px] mx-auto px-6 py-8">
            <Onboarding
              preferences={preferences}
              onToggle={toggleItem}
              onComplete={completeOnboarding}
              onSkip={completeOnboarding}
              onAddFavourite={addFavourite}
              onRemoveFavourite={removeFavourite}
            />
          </div>
        </div>
      ) : (
        <>
          {/* Content */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="max-w-[800px] mx-auto px-6 py-8">
              {showEmptyState && (
                <EmptyState
                  onSuggestion={(s) => { setSuggestion(s); setShowHome(false); }}
                  viewedPlaces={viewedPlaces}
                  favouritePlaces={preferences.favouritePlaces}
                />
              )}

              {!showHome && hasConversations && (
                <div className="max-w-2xl mx-auto">
                  {conversations.map(conv => (
                    <ConversationCard key={conv.id} conv={conv} onViewPlace={addViewedPlace} />
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
          <div className="shrink-0 border-t-2 border-neutral-800 bg-white">
            <div className="max-w-2xl mx-auto px-6 py-4">
              <InputBox onSubmit={handleSubmit} isLoading={isLoading} initialValue={suggestion} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
