import { useState, useCallback, useRef } from 'react';
import { Recommendation } from '../types';
import { recommendationAPI } from '../services/api';

interface ConversationEntry {
  id: string;
  query: string;
  recommendations: Recommendation[];
  timestamp: Date;
  isLoading: boolean;
}

export function useConversations() {
  const [conversations, setConversations] = useState<ConversationEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }, 100);
  };

  const submitQuery = useCallback(async (query: string, location?: { latitude: number | null; longitude: number | null }) => {
    setError(null);

    // Optimistic: add query card with loading state
    const tempId = `temp-${Date.now()}`;
    const newEntry: ConversationEntry = {
      id: tempId,
      query,
      recommendations: [],
      timestamp: new Date(),
      isLoading: true,
    };

    setConversations((prev) => [...prev, newEntry]);
    scrollToBottom();

    try {
      const response = await recommendationAPI.getRecommendations(
        query,
        location?.latitude,
        location?.longitude,
      );
      const { recommendations } = response.data;

      // Replace loading entry with real data
      setConversations((prev) =>
        prev.map((c) =>
          c.id === tempId
            ? { ...c, recommendations: recommendations || [], isLoading: false }
            : c,
        ),
      );
      scrollToBottom();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      // Remove loading state but keep the query visible
      setConversations((prev) =>
        prev.map((c) => (c.id === tempId ? { ...c, isLoading: false } : c)),
      );
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const response = await recommendationAPI.getConversationHistory();
      const history: ConversationEntry[] = response.data.map((item: any) => ({
        id: item.id,
        query: item.query,
        recommendations: (item.recommendations || [])
          .filter((r: any) => r.name)
          .map((r: any) => ({
            name: r.name,
            category: r.category,
            why_recommended: r.why_recommended,
            suggested_times: r.suggested_times,
          })),
        timestamp: new Date(item.created_at),
        isLoading: false,
      }));

      setConversations(history.reverse());
    } catch {
      // Silently fail on history load — not critical
    }
  }, []);

  const isAnyLoading = conversations.some((c) => c.isLoading);

  return {
    conversations,
    isLoading: isAnyLoading,
    error,
    submitQuery,
    loadHistory,
    scrollRef,
  };
}
