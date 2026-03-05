import { useState, useCallback, useRef } from 'react';
import { poemsApi } from '../services/poems-api';
import type { PoemResponse } from '../types/poem';

export function usePoemFeed() {
  const [poems, setPoems] = useState<PoemResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  // Ref guard prevents duplicate concurrent fetches (React Strict Mode / scroll debris)
  const isFetchingRef = useRef(false);

  const loadFeed = useCallback(async (refresh = false) => {
    if (isFetchingRef.current) return;
    if (!refresh && !hasMore) return;

    isFetchingRef.current = true;
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
        // Deduplicate by ID — guards against stale cursor producing overlap
        setPoems(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const fresh = newPoems.filter(p => !existingIds.has(p.id));
          return [...prev, ...fresh];
        });
      }

      // Cursor = last poem ID (backend SQL: WHERE id = cursor)
      if (newPoems.length > 0) {
        setCursor(newPoems[newPoems.length - 1].id);
      }

      setHasMore(newPoems.length === 20);
    } catch (err: any) {
      setError(err.message || 'Failed to load poems');
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [cursor, hasMore]);

  const refresh = useCallback(() => {
    loadFeed(true);
  }, [loadFeed]);

  const loadMore = useCallback(() => {
    if (!isFetchingRef.current && hasMore) {
      loadFeed(false);
    }
  }, [hasMore, loadFeed]);

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
                  ? (Number.isFinite(poem.like_count) ? poem.like_count : 0) + 1
                  : Math.max(0, (Number.isFinite(poem.like_count) ? poem.like_count : 0) - 1),
              }
            : poem
        )
      );
    } catch (err: any) {
      console.error('Failed to toggle like:', err);
    }
  }, []);

  const toggleBookmark = useCallback(async (poemId: string) => {
    try {
      const isBookmarked = await poemsApi.toggleBookmark(poemId);
      setPoems(prev =>
        prev.map(poem =>
          poem.id === poemId ? { ...poem, is_bookmarked: isBookmarked } : poem
        )
      );
    } catch (err: any) {
      console.error('Failed to toggle bookmark:', err);
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
    toggleBookmark,
  };
}
