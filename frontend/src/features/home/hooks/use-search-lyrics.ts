import { useInfiniteQuery } from '@tanstack/react-query';
import { homeService } from '../services/home.service';

const toPositivePage = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;

  const normalized = Math.trunc(parsed);
  return normalized >= 1 ? normalized : fallback;
};

export const useSearchLyrics = (query: string) => {
  const normalizedQuery = query.trim();

  return useInfiniteQuery({
    queryKey: ['search-lyrics', normalizedQuery],
    queryFn: ({ pageParam = 1 }) => {
      const safePageParam = toPositivePage(pageParam, 1);
      return homeService.searchLyrics(normalizedQuery, safePageParam);
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasMore) {
        return undefined;
      }

      const current = toPositivePage(lastPage.pagination.current, 1);
      return current + 1;
    },
    enabled: normalizedQuery.length > 0,
    initialPageParam: 1,
    retry: 1,
    retryOnMount: false
  });
};