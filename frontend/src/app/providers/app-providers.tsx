import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { LyricsPlayerProvider } from '../../features/lyrics/context/lyrics-player-context';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000,
      gcTime: 60 * 60 * 1000,
      refetchOnWindowFocus: false
    }
  }
});

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <LyricsPlayerProvider>{children}</LyricsPlayerProvider>
    </QueryClientProvider>
  );
}
