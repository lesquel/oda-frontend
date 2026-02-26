import { useState, useCallback } from 'react';
import { poemsApi } from '../services/poems-api';
import type { PoemResponse } from '../types/poem';

export function usePoemFeed() {
  const [poems, setPoems] = useState<PoemResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  const loadFeed = useCallback(async (refresh = false) => {
    if (isLoading || (!refresh && !hasMore)) return;

    try {
      if (refresh) {
        setIsRefreshing(true);
        setCursor(undefined);
      } else {
        setIsLoading(true);
      }

      setError(null);

      const newPoems = await poemsApi.getFeed({
        cursor: refresh ? undefined : cursor,
        limit: 20,
      });

      if (refresh) {
        setPoems(newPoems);
      } else {
        setPoems(prev => [...prev, ...newPoems]);
      }

      // Set cursor for next page (use last poem's created_at)
      if (newPoems.length > 0) {
        const lastPoem = newPoems[newPoems.length - 1];
        setCursor(lastPoem.created_at);
      }

      // Check if there are more poems to load
      setHasMore(newPoems.length === 20);
    } catch (err: any) {
      setError(err.message || 'Failed to load poems');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [cursor, hasMore, isLoading]);

  const refresh = useCallback(() => {
    loadFeed(true);
  }, [loadFeed]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      loadFeed(false);
    }
  }, [isLoading, hasMore, loadFeed]);

  const toggleLike = useCallback(async (poemId: string) => {
    try {
      const isLiked = await poemsApi.toggleLike(poemId);
      
      setPoems(prev =>
        prev.map(poem =>
          poem.id === poemId
            ? {
                ...poem,
                is_liked: isLiked,
                like_count: isLiked 
                  ? poem.like_count + 1 
                  : Math.max(0, poem.like_count - 1),
              }
            : poem
        )
      );
    } catch (err: any) {
      console.error('Failed to toggle like:', err);
    }
  }, []);

  return {
    poems,
    isLoading,
    isRefreshing,
    error,
    hasMore,
    loadFeed,
    loadMore,
    refresh,
    toggleLike,
  };
}
