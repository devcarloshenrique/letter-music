import { useMutation } from '@tanstack/react-query';
import { homeService } from '../services/home.service';

export function useHome() {
  const syncedLyricsMutation = useMutation({
    mutationFn: (query: string) => homeService.fetchSyncedLyrics(query)
  });

  return {
    syncedLyricsMutation
  };
}
