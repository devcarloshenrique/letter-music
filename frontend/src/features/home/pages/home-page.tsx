import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { homeSearchSchema, type HomeSearchSchema } from '../schemas/home.schema';
import { useSearchLyrics } from '../hooks/use-search-lyrics';
import { SearchResults } from '../components/search-results';

export default function HomePage() {
  const [highlightedSongKey, setHighlightedSongKey] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = (searchParams.get('q') ?? '').trim();
  const { data, isLoading, isFetchingNextPage, isFetchNextPageError, hasNextPage, fetchNextPage } = useSearchLyrics(searchQuery);

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
    if (!searchQuery || !data) {
      return;
    }

    const selectedSongKey = sessionStorage.getItem('home:last-selected-song-key');
    if (!selectedSongKey) {
      return;
    }

    const selectedCard = document.querySelector<HTMLElement>(`[data-song-key="${selectedSongKey}"]`);
    if (!selectedCard) {
      return;
    }

    selectedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const highlightTimeoutId = window.setTimeout(() => {
      setHighlightedSongKey(selectedSongKey);
    }, 0);

    sessionStorage.removeItem('home:last-selected-song-key');

    return () => {
      window.clearTimeout(highlightTimeoutId);
    };
  }, [data, searchQuery]);

  useEffect(() => {
    if (!highlightedSongKey) {
      return;
    }

    const handlePointerDown = () => {
      setHighlightedSongKey(null);
    };

    window.addEventListener('pointerdown', handlePointerDown, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [highlightedSongKey]);

  const onSubmit = ({ query }: HomeSearchSchema) => {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length === 0) {
      setSearchParams({});
      return;
    }

    setSearchParams({ q: normalizedQuery });
  };

  return (
    <section
      className={`mx-auto flex w-full max-w-screen-xl flex-col items-center px-8 transition-all duration-500 ease-in-out ${
        searchQuery ? 'pt-8 pb-20 md:pb-12' : 'justify-center min-h-[calc(100dvh-180px)] pt-24 pb-20'
      }`}
    >
      <AnimatePresence>
        {!searchQuery && (
          <motion.h1
            initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, height: 'auto', filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, height: 0, filter: 'blur(4px)', margin: 0 }}
            transition={{ duration: 0.45 }}
            className='mb-8 max-w-4xl text-4xl font-black leading-tight tracking-tighter text-white md:text-7xl text-center'
          >
            Que música você gostaria de aprender hoje?
          </motion.h1>
        )}
      </AnimatePresence>

      <motion.form 
        layout
        onSubmit={handleSubmit(onSubmit)} 
        className='w-full max-w-2xl mt-0'
      >
        <div className='group relative'>
          <button 
            type="submit" 
            className='absolute inset-y-0 left-6 flex items-center text-on-surface-variant transition-colors group-focus-within:text-secondary hover:text-primary z-10'
          >
            <Search size={20} />
          </button>
          <input
            type='text'
            placeholder='Escreva o título, artista ou letra'
            className='w-full rounded-full border-none bg-surface-container-high py-5 pl-16 pr-8 text-lg text-white placeholder:text-on-surface-variant transition-all focus:ring-2 focus:ring-secondary/50 focus:outline-none'
            aria-label='Campo de busca de música'
            {...register('query')}
          />
        </div>
      </motion.form>

      {errors.query && <p className='mt-3 text-sm text-error'>{errors.query.message}</p>}

      {searchQuery && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-4xl mt-4"
        >
          <SearchResults 
            data={data}
            isLoading={isLoading}
            isFetchingNextPage={isFetchingNextPage}
            isFetchNextPageError={isFetchNextPageError}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
            searchQuery={searchQuery}
            highlightedSongKey={highlightedSongKey}
          />
        </motion.div>
      )}
    </section>
  );
}
