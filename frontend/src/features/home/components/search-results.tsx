import { motion } from 'framer-motion';
import type { SearchLyricsSuccessResponse } from '../types/home.types';
import { useInfiniteScroll } from '../../../shared/hooks/use-infinite-scroll';
import type { InfiniteData } from '@tanstack/react-query';
import { Search, Music, ArrowRight, Loader2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface SearchResultsProps {
  data: InfiniteData<SearchLyricsSuccessResponse> | undefined;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  hasNextPage: boolean | undefined;
  fetchNextPage: () => void;
  searchQuery: string;
  highlightedSongKey: string | null;
}

export function SearchResults({
  data,
  isLoading,
  isFetchingNextPage,
  isFetchNextPageError,
  hasNextPage,
  fetchNextPage,
  searchQuery,
  highlightedSongKey
}: SearchResultsProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const { observerTarget } = useInfiniteScroll({
    isFetchingNextPage,
    hasNextPage: hasNextPage && !isFetchNextPageError,
    fetchNextPage,
    rootMargin: '200px'
  });

  const allSongs = data?.pages.flatMap((page) => page.data) || [];
  const persistLastSelectedSong = (songUrl: string) => {
    const songKey = encodeURIComponent(songUrl);
    sessionStorage.setItem('home:last-selected-song-key', songKey);
    return songKey;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-on-surface-variant animate-pulse">
        <Loader2 className="w-8 h-8 mb-4 animate-spin text-primary" />
        <p>Buscando resultados...</p>
      </div>
    );
  }

  if (allSongs.length === 0 && searchQuery) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center p-12 text-center bg-surface-variant/30 rounded-2xl border border-outline-variant/30 mt-8"
      >
        <Search className="w-12 h-12 mb-4 text-on-surface-variant opacity-50" />
        <h3 className="text-xl font-bold text-on-surface mb-2">Nenhum resultado encontrado</h3>
        <p className="text-on-surface-variant">Não encontramos nenhuma música correspondente a "{searchQuery}".</p>
      </motion.div>
    );
  }

  if (allSongs.length === 0) {
    return null;
  }

  return (
    <div className="w-full mt-8 flex flex-col gap-4 pb-32 md:pb-24">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-xl font-bold text-on-surface">Resultados para "{searchQuery}"</h2>
        <span className="text-sm px-2.5 py-1 rounded-full bg-primary/20 text-primary font-medium">
          {data?.pages[0]?.metadata?.totalResults || allSongs.length}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allSongs.map((song, index) => (
          <motion.div
            key={`${song.url}-${index}`}
            data-song-key={encodeURIComponent(song.url)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() =>
              navigate(`/lyrics?url=${encodeURIComponent(song.url)}`, {
                state: {
                  from: `${location.pathname}${location.search}`,
                  selectedSongKey: persistLastSelectedSong(song.url)
                }
              })
            }
            className={`group relative flex flex-col p-5 bg-surface rounded-xl border transition-all cursor-pointer hover:shadow-glow-primary overflow-hidden ${
              highlightedSongKey === encodeURIComponent(song.url)
                ? 'border-primary ring-2 ring-primary/35'
                : 'border-outline-variant hover:border-primary/50'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-12 h-12 rounded-full bg-surface-high flex items-center justify-center shrink-0 border border-outline-variant group-hover:border-primary/30 group-hover:bg-primary/10 transition-colors">
                <Music className="w-5 h-5 text-on-surface-variant group-hover:text-primary transition-colors" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                  {song.title.split(' - ')[0]}
                </h3>
                <p className="text-sm text-on-surface-variant truncate mt-1">
                  {song.title.split(' - ')[1] || song.description || 'Artista desconhecido'}
                </p>
              </div>

              <div className="w-8 h-8 rounded-full bg-surface-high flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                <ArrowRight className="w-4 h-4 text-primary" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div 
        ref={observerTarget} 
        className="w-full h-16 flex items-center justify-center mt-4"
      >
        {isFetchNextPageError && (
          <button
            type="button"
            onClick={() => {
              void fetchNextPage();
            }}
            className="rounded-full border border-error/40 bg-error/10 px-4 py-2 text-sm font-semibold text-error hover:bg-error/20"
          >
            Falha ao carregar mais. Tentar novamente
          </button>
        )}
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-primary">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Carregando mais...</span>
          </div>
        )}
      </div>
    </div>
  );
}