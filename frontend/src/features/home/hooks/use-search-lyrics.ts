import { useInfiniteQuery } from '@tanstack/react-query';
import { homeService } from '../services/home.service';

const MAX_LYRICS_PAGE = 10;

export const useSearchLyrics = (query: string) => {
  const normalizedQuery = query.trim();

  return useInfiniteQuery({
    queryKey: ['search-lyrics', normalizedQuery],
    queryFn: ({ pageParam = 1 }) => homeService.searchLyrics(normalizedQuery, pageParam),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.data.length === 0) {
        return undefined;
      }

      const currentPage = lastPage.metadata?.page ?? allPages.length;

      if (lastPage.metadata?.hasMore === false) {
        return undefined;
      }

      if (currentPage >= MAX_LYRICS_PAGE) {
        return undefined;
      }

      return currentPage + 1;
    },
    enabled: normalizedQuery.length > 0,
    initialPageParam: 1,
    retry: 1,
    retryOnMount: false
  });
};