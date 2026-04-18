import axios from 'axios';
import { apiClient } from '../../../shared/lib/api-client';
import type { 
  ApiErrorResponse, 
  SyncedLyricsData, 
  SyncedLyricsSuccessResponse,
  SearchLyricsSuccessResponse
} from '../types/home.types';

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
  },

  searchLyrics: async (query: string, page: number = 1): Promise<SearchLyricsSuccessResponse> => {
    try {
      const response = await apiClient.get<SearchLyricsSuccessResponse>('/api/lyrics', {
        params: {
          q: query,
          page
        }
      });

      return {
        ...response.data,
      };
    } catch (error) {
      if (axios.isAxiosError<ApiErrorResponse>(error) && error.response?.status === 404) {
        const pagination = {
          current: page,
          count: 0,
          next: null,
          prev: page > 1 ? page - 1 : null,
          hasMore: false
        };

        return {
          success: true,
          message: 'Sem mais resultados para esta busca.',
          request: { query, timestamp: new Date().toISOString() },
          results: [],
          pagination
        };
      }

      throw new Error(parseErrorMessage(error));
    }
  }
};
