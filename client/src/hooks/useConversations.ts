import { useState, useCallback, useRef } from 'react';
import { Conversation, Recommendation } from '../types';

const API = 'http://localhost:3000';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const submitQuery = useCallback(async (
    query: string,
    location: { latitude: number | null; longitude: number | null; city: string | null }
  ) => {
    setError(null);
    const tempId = `q-${Date.now()}`;

    setConversations(prev => [...prev, {
      id: tempId, query, recommendations: [], timestamp: new Date(), isLoading: true,
    }]);
    scrollToBottom();

    try {
      const res = await fetch(`${API}/api/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          latitude: location.latitude,
          longitude: location.longitude,
          city: location.city,
        }),
      });

      if (!res.ok) throw new Error('Request failed');

      const data = await res.json();

      setConversations(prev =>
        prev.map(c => c.id === tempId
          ? { ...c, recommendations: data.recommendations || [], isLoading: false }
          : c
        )
      );
      scrollToBottom();
    } catch (err: any) {
      setError('Something went wrong. Try again.');
      setConversations(prev =>
        prev.map(c => c.id === tempId ? { ...c, isLoading: false } : c)
      );
    }
  }, []);

  return { conversations, isLoading: conversations.some(c => c.isLoading), error, submitQuery, scrollRef };
}
