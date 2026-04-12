import axios from 'axios';
import { apiClient } from '../../../shared/lib/api-client';
import type { ApiErrorResponse, SyncedLyricsData, SyncedLyricsSuccessResponse } from '../types/home.types';

function parseErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return (
      error.response?.data?.error?.message ??
      error.response?.data?.message ??
      error.message ??
      'Falha ao buscar legenda sincronizada.'
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Falha ao buscar legenda sincronizada.';
}

export const homeService = {
  fetchSyncedLyrics: async (query: string): Promise<SyncedLyricsData> => {
    try {
      const response = await apiClient.get<SyncedLyricsSuccessResponse>('/api/lyrics/synced', {
        params: {
          url: query
        }
      });

      return response.data.data;
    } catch (error) {
      throw new Error(parseErrorMessage(error));
    }
  }
};
