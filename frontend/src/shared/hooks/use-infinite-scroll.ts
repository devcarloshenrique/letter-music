import { useEffect, useRef, useCallback } from 'react';

type UseInfiniteScrollOptions = {
  isFetchingNextPage: boolean;
  hasNextPage: boolean | undefined;
  fetchNextPage: () => void;
  rootMargin?: string;
  threshold?: number;
};

export const useInfiniteScroll = ({
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  rootMargin = '100px',
  threshold = 1.0,
}: UseInfiniteScrollOptions) => {
  const observerTarget = useRef<HTMLDivElement | null>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin,
      threshold,
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [handleObserver, rootMargin, threshold]);

  return { observerTarget };
};