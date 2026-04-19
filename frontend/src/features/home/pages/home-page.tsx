import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { homeSearchSchema, type HomeSearchSchema } from '../schemas/home.schema';
import { useSearchLyrics } from '../hooks/use-search-lyrics';
import { SearchResults } from '../components/search-results';
import { homeService } from '../services/home.service';
import type { SearchLyricsSong, SearchLyricsSuccessResponse } from '../types/home.types';

export default function HomePage() {
  const queryClient = useQueryClient();
  const [highlightedSongKey, setHighlightedSongKey] = useState<string | null>(null);
  const [recoveredSongs, setRecoveredSongs] = useState<SearchLyricsSong[]>([]);
  const [resolvedSkippedPages, setResolvedSkippedPages] = useState<number[]>([]);
  const [isRetryingSkippedPages, setIsRetryingSkippedPages] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = (searchParams.get('q') ?? '').trim();
  const resolvedSkippedStorageKey = useMemo(() => {
    if (!searchQuery) {
      return null;
    }

    return `home:resolved-skipped-pages:${encodeURIComponent(searchQuery.toLowerCase())}`;
  }, [searchQuery]);
  const { data, isLoading, isFetchingNextPage, isFetchNextPageError, hasNextPage, fetchNextPage } = useSearchLyrics(searchQuery);

  const removeResolvedSkippedPagesFromCache = useCallback((resolvedPages: number[]) => {
    if (!searchQuery || resolvedPages.length === 0) {
      return;
    }

    const resolvedSet = new Set(resolvedPages);

    queryClient.setQueryData<InfiniteData<SearchLyricsSuccessResponse>>(
      ['search-lyrics', searchQuery.trim()],
      (cached) => {
        if (!cached) {
          return cached;
        }

        return {
          ...cached,
          pages: cached.pages.map((page) => ({
            ...page,
            pagination: {
              ...page.pagination,
              skipped: page.pagination.skipped.filter((skippedPage) => !resolvedSet.has(skippedPage))
            }
          }))
        };
      }
    );
  }, [queryClient, searchQuery]);

  const skippedPages = useMemo(() => {
    const pagesFromResponses = data?.pages.flatMap((page) => page.pagination.skipped) ?? [];
    const uniquePages = Array.from(new Set(pagesFromResponses)).sort((a, b) => a - b);

    return uniquePages.filter((page) => !resolvedSkippedPages.includes(page));
  }, [data?.pages, resolvedSkippedPages]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<HomeSearchSchema>({
    resolver: zodResolver(homeSearchSchema),
    defaultValues: {
      query: searchQuery
    }
  });

  useEffect(() => {
    setValue('query', searchQuery, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false
    });
  }, [searchQuery, setValue]);

  useEffect(() => {
    setRecoveredSongs([]);
    setIsRetryingSkippedPages(false);
  }, [searchQuery]);

  useEffect(() => {
    if (!resolvedSkippedStorageKey) {
      setResolvedSkippedPages([]);
      return;
    }

    const persisted = sessionStorage.getItem(resolvedSkippedStorageKey);
    if (!persisted) {
      setResolvedSkippedPages([]);
      return;
    }

    try {
      const parsed = JSON.parse(persisted) as unknown;
      if (!Array.isArray(parsed)) {
        setResolvedSkippedPages([]);
        return;
      }

      const sanitized = parsed.filter((value): value is number => Number.isInteger(value));
      setResolvedSkippedPages(sanitized);
      removeResolvedSkippedPagesFromCache(sanitized);
    } catch {
      setResolvedSkippedPages([]);
    }
  }, [removeResolvedSkippedPagesFromCache, resolvedSkippedStorageKey]);

  useEffect(() => {
    if (!resolvedSkippedStorageKey) {
      return;
    }

    sessionStorage.setItem(resolvedSkippedStorageKey, JSON.stringify(resolvedSkippedPages));
  }, [resolvedSkippedPages, resolvedSkippedStorageKey]);

  useEffect(() => {
    if (!searchQuery || !data) return;

    const selectedSongKey = sessionStorage.getItem('home:last-selected-song-key');
    if (!selectedSongKey) return;

    const selectedCard = document.querySelector<HTMLElement>(`[data-song-key="${selectedSongKey}"]`);
    if (!selectedCard) return;

    selectedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });       
    const highlightTimeoutId = window.setTimeout(() => {
      setHighlightedSongKey(selectedSongKey);
    }, 0);

    sessionStorage.removeItem('home:last-selected-song-key');
    return () => window.clearTimeout(highlightTimeoutId);
  }, [data, searchQuery]);

  useEffect(() => {
    if (!highlightedSongKey) return;

    const handlePointerDown = () => setHighlightedSongKey(null);
    window.addEventListener('pointerdown', handlePointerDown, { once: true });  

    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [highlightedSongKey]);

  const onSubmit = ({ query }: HomeSearchSchema) => {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length === 0) {
      setSearchParams({});
      return;
    }
    setSearchParams({ q: normalizedQuery });
  };

  const onRetrySkippedPages = async () => {
    if (!searchQuery || skippedPages.length === 0 || isRetryingSkippedPages) {
      return;
    }

    setIsRetryingSkippedPages(true);

    try {
      const baseSongs = data?.pages.flatMap((page) => page.results) ?? [];
      const seenSongUrls = new Set<string>([
        ...baseSongs.map((song) => song.url.toLowerCase()),
        ...recoveredSongs.map((song) => song.url.toLowerCase())
      ]);
      const recoveredPages = new Set<number>();
      const newRecoveredSongs: SearchLyricsSong[] = [];

      for (const skippedPage of skippedPages) {
        try {
          const response = await homeService.searchLyrics(searchQuery, skippedPage);
          const stillSkipped = response.pagination.skipped.includes(skippedPage);

          if (stillSkipped || response.pagination.current !== skippedPage || response.results.length === 0) {
            continue;
          }

          recoveredPages.add(skippedPage);

          for (const song of response.results) {
            const dedupeKey = song.url.toLowerCase();
            if (seenSongUrls.has(dedupeKey)) {
              continue;
            }

            seenSongUrls.add(dedupeKey);
            newRecoveredSongs.push(song);
          }
        } catch {
          continue;
        }
      }

      if (newRecoveredSongs.length > 0) {
        setRecoveredSongs((current) => [...current, ...newRecoveredSongs]);
      }

      if (recoveredPages.size > 0) {
        const resolvedPages = Array.from(recoveredPages);
        removeResolvedSkippedPagesFromCache(resolvedPages);
        setResolvedSkippedPages((current) => [...new Set([...current, ...resolvedPages])]);
      }
    } finally {
      setIsRetryingSkippedPages(false);
    }
  };

  return (
    <>
      {/* Decorative Blobs */}
      <div className="fixed top-[-10%] right-[-5%] w-[400px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>
      <div className="fixed bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-secondary/5 blur-[150px] rounded-full pointer-events-none -z-10"></div>

      <main className="relative z-10 pt-12 md:pt-16 pb-8 px-4 md:px-6 max-w-5xl mx-auto flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.45 }}
          className="text-center w-full"
        >
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-on-surface mb-4">
            Letter <span className="text-primary italic">Music</span>
          </h1>
          <AnimatePresence>
            {!searchQuery && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.3 }}
                className="text-on-surface-variant text-base md:text-lg font-medium max-w-xl mx-auto mb-6"
              >
                Master any language through the pulse of rhythm and lyrics.
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.form
          layout
          onSubmit={handleSubmit(onSubmit)}
          className={`w-full relative group max-w-3xl ${searchQuery ? 'mt-2' : 'mt-1'}`}
        >
           {/* Added inset background layer for style */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary opacity-20 group-focus-within:opacity-40 blur-xl transition duration-500 rounded-full"></div>
          <div className="relative flex items-center bg-surface-container border border-outline-variant/30 rounded-2xl md:rounded-full px-5 py-4 shadow-2xl focus-within:border-primary transition-all duration-300">
            <button type="submit" className="material-symbols-outlined text-primary-fixed mr-3 scale-125 focus:outline-none focus:scale-110 active:scale-95 transition-transform cursor-pointer">search</button>
            <input
              className="bg-transparent border-none focus:ring-0 w-full text-lg md:text-xl font-medium placeholder:text-on-surface-variant/40 outline-none text-on-surface"
              placeholder="Search for a song, artist, or language..."
              type="text"
              autoComplete="off"
              spellCheck="false"
              {...register('query')}
            />
          </div>
        </motion.form>

        {errors.query && <p className="mt-3 text-sm text-error">{String(errors.query.message)}</p>}
      </main>

      {searchQuery ? (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-6xl mx-auto px-4 md:px-6 pb-32 w-full"
        >
          <SearchResults
            key={searchQuery}
            data={data}
            isLoading={isLoading}
            isFetchingNextPage={isFetchingNextPage}
            isFetchNextPageError={isFetchNextPageError}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
            searchQuery={searchQuery}
            highlightedSongKey={highlightedSongKey}
            recoveredSongs={recoveredSongs}
            skippedPages={skippedPages}
            isRetryingSkippedPages={isRetryingSkippedPages}
            onRetrySkippedPages={() => {
              void onRetrySkippedPages();
            }}
          />
        </motion.section>
      ) : null}
    </>
  );
}
