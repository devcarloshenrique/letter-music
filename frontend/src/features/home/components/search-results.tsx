import { motion } from 'framer-motion';
import { useState } from 'react';
import type { InfiniteData } from '@tanstack/react-query';
import type { SearchLyricsSong, SearchLyricsSuccessResponse } from '../types/home.types';
import { useInfiniteScroll } from '../../../shared/hooks/use-infinite-scroll';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import type { SyncedLyricsData } from '../types/home.types';

interface SearchResultsProps {
  data: InfiniteData<SearchLyricsSuccessResponse> | undefined;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  hasNextPage: boolean | undefined;
  fetchNextPage: () => void;
  searchQuery: string;
  highlightedSongKey: string | null;
  recoveredSongs: SearchLyricsSong[];
  skippedPages: number[];
  isRetryingSkippedPages: boolean;
  onRetrySkippedPages: () => void;
}

export function SearchResults({
  data,
  isLoading,
  isFetchingNextPage,
  isFetchNextPageError,
  hasNextPage,
  fetchNextPage,
  searchQuery,
  highlightedSongKey,
  recoveredSongs,
  skippedPages,
  isRetryingSkippedPages,
  onRetrySkippedPages
}: SearchResultsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [scrollThreshold, setScrollThreshold] = useState(30);

  const baseSongs = data?.pages.flatMap((page) => page.results) || [];
  const allSongs = (() => {
    const seenUrls = new Set<string>();
    const mergedSongs: SearchLyricsSong[] = [];

    for (const song of [...baseSongs, ...recoveredSongs]) {
      const dedupeKey = song.url.toLowerCase();
      if (seenUrls.has(dedupeKey)) {
        continue;
      }

      seenUrls.add(dedupeKey);
      mergedSongs.push(song);
    }

    return mergedSongs;
  })();
  const isAutoFetchBlocked = allSongs.length >= scrollThreshold;

  const { observerTarget } = useInfiniteScroll({
    isFetchingNextPage,
    hasNextPage: hasNextPage && !isFetchNextPageError && !isAutoFetchBlocked,
    fetchNextPage,
    rootMargin: '200px'
  });

  const persistLastSelectedSong = (songUrl: string) => {
    const songKey = encodeURIComponent(songUrl);
    sessionStorage.setItem('home:last-selected-song-key', songKey);
    return songKey;
  };

  if (isLoading) {
    return (
      <div className="pt-8 flex flex-col items-center gap-4">
        <div className="flex gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse delay-75"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-primary/30 animate-pulse delay-150"></div>
        </div>
        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-on-surface-variant/50">Searching</span>
      </div>
    );
  }

  if (allSongs.length === 0 && searchQuery) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center p-12 text-center glass-panel rounded-[24px] mt-8"
      >
        <span className="material-symbols-outlined text-on-surface-variant/50 opacity-50 mb-4 scale-150" style={{ fontSize: '3rem' }}>search</span>
        <h3 className="text-xl font-bold text-on-surface mb-2">No results found</h3>
        <p className="text-on-surface-variant">We couldn't find any songs matching "{searchQuery}".</p>
      </motion.div>
    );
  }

  if (allSongs.length === 0) return null;

  return (
    <div className="w-full mt-2 flex flex-col gap-3 pb-24 md:pb-20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-on-surface-variant">Results for "{searchQuery}"</h2>
        <div className="flex gap-2 text-primary font-bold text-sm">
          {allSongs.length} found
        </div>
      </div>

      {skippedPages.length > 0 && (
        <div className="glass-panel rounded-[24px] border border-outline-variant/40 bg-surface-container px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-on-surface-variant">
            Páginas puladas detectadas: {skippedPages.join(', ')}
          </p>
          <button
            type="button"
            onClick={onRetrySkippedPages}
            disabled={isRetryingSkippedPages}
            className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRetryingSkippedPages ? 'Recarregando...' : 'Recarregar páginas puladas'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
        {allSongs.map((song, index) => (
          <motion.div
            key={`${song.id || song.url}-${index}`}
            data-song-key={encodeURIComponent(song.url)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => {
              const fullTitle = song.title;
              const author = song.artist || 'Unknown Artist';
              const prefetched = queryClient.getQueryData<SyncedLyricsData>(['synced-lyrics', song.url]);

              navigate(`/lyrics?url=${encodeURIComponent(song.url)}`, {
                state: {
                  from: `${location.pathname}${location.search}`,
                  selectedSongKey: persistLastSelectedSong(song.url),
                  songTitle: fullTitle,
                  artistName: author,
                  prefetchedVideoUrl: prefetched?.video_url
                }
              });
            }}
            className={`glass-panel hover:bg-surface-container-high transition-all duration-200 p-3 md:p-3.5 rounded-lg flex items-start justify-between gap-2.5 group cursor-pointer min-h-[108px] ${
              highlightedSongKey === encodeURIComponent(song.url)
                ? 'border-primary ring-2 ring-primary/35'
                : ''
            }`}
          >
            <div className="min-w-0">
              <h3 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2">
                {song.title}
              </h3>
              <p className="text-on-surface-variant text-sm font-medium mt-1 line-clamp-2">
                {song.artist || 'Unknown Artist'}
              </p>
            </div>
            <button className="w-9 h-9 rounded-lg bg-surface-container-highest flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-colors shrink-0">
              <span className="material-symbols-outlined fill-current" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
            </button>
          </motion.div>
        ))}
      </div>

      <div ref={observerTarget} className="w-full min-h-14 flex flex-col items-center justify-center mt-6 gap-4">
        {isAutoFetchBlocked && hasNextPage && !isFetchingNextPage && !isFetchNextPageError && (
          <button
            type="button"
            onClick={() => {
              setScrollThreshold(prev => prev + 12);
              void fetchNextPage();
            }}
            className="rounded-full bg-primary/10 px-8 py-3 text-sm font-bold text-primary hover:bg-primary/20 transition-colors"
          >
            Carregar mais
          </button>
        )}
        
        {isFetchNextPageError && (
          <button
            type="button"
            onClick={() => void fetchNextPage()}
            className="rounded-full border border-error/40 bg-error/10 px-4 py-2 text-sm font-semibold text-error hover:bg-error/20"
          >
            Tentar carregar mais
          </button>
        )}
        {isFetchingNextPage && (
          <div className="pt-8 flex flex-col items-center gap-4">
            <div className="flex gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse delay-75"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-primary/30 animate-pulse delay-150"></div>
            </div>
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-on-surface-variant/50">Loading more tracks</span>
          </div>
        )}
      </div>
    </div>
  );
}
