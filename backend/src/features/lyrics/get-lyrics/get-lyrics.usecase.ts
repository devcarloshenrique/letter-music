import { AppError } from '../../../shared/errors/app-error';
import type {
  ILyricsSearchProvider,
  ScrapedLyricsSearchResult
} from '../../../shared/providers/scraping/iser-scraping.provider';
import type { GetLyricsInputDto, GetLyricsOutputDto, GetLyricsSongDto } from './get-lyrics.dto';

const ALLOWED_HOSTS = new Set(['www.letras.mus.br', 'letras.mus.br']);
const BLOCKED_PATH_MARKERS = ['/significado', '/aprenda-ingles'];
const MIN_PAGE = 1;
const PAGE_SIZE = 10;

type FilteredSongsOutput = {
  songs: GetLyricsSongDto[];
  hasTechnicalFailures: boolean;
};

export interface ISyncedLyricsAvailabilityProvider {
  hasSyncedLyrics(url: string): Promise<boolean>;
}

export class GetLyricsUseCase {
  constructor(
    private readonly searchProvider: ILyricsSearchProvider,
    private readonly syncedLyricsAvailabilityProvider?: ISyncedLyricsAvailabilityProvider
  ) {}

  async execute(input: GetLyricsInputDto): Promise<GetLyricsOutputDto> {
    const query = input.q?.trim() ?? '';

    if (query.length === 0) {
      throw new AppError(
        'Parâmetro "q" é obrigatório. Ex: /api/lyrics?q=eminem&page=2',
        400
      );
    }

    const page = this.parseAndValidatePage(input.page);
    const { songs, hasTechnicalFailures } = await this.searchWithFallback(query, page);

    if (songs.length === 0) {
      if (hasTechnicalFailures) {
        throw new AppError('Falha ao validar disponibilidade de legendas sincronizadas.', 502);
      }

      if (page > 1) {
        return {
          songs: [],
          page,
          pageSize: PAGE_SIZE,
          totalPages: page - 1
        };
      }

      throw new AppError('Nenhuma música encontrada para a busca informada.', 404);
    }

    const totalPages = songs.length;

    return {
      songs,
      page,
      pageSize: PAGE_SIZE,
      totalPages
    };
  }

  private parseAndValidatePage(rawPage: number | undefined): number {
    if (rawPage === undefined) {
      return MIN_PAGE;
    }

    if (!Number.isInteger(rawPage)) {
      throw new AppError('Parâmetro "page" precisa ser um número inteiro maior ou igual a 1.', 400);
    }

    if (rawPage < MIN_PAGE) {
      throw new AppError('Parâmetro "page" precisa ser maior ou igual a 1.', 400);
    }

    return rawPage;
  }

  private async searchWithFallback(query: string, page: number): Promise<FilteredSongsOutput> {
    try {
      const firstAttempt = await this.searchProvider.searchLyrics({ query, page, fallback: false });
      const firstAttemptFiltered = await this.normalizeAndFilterResults(firstAttempt.results);

      if (firstAttemptFiltered.songs.length > 0) {
        return firstAttemptFiltered;
      }

      const fallbackAttempt = await this.searchProvider.searchLyrics({ query, page, fallback: true });
      const fallbackFiltered = await this.normalizeAndFilterResults(fallbackAttempt.results);

      return {
        songs: fallbackFiltered.songs,
        hasTechnicalFailures:
          firstAttemptFiltered.hasTechnicalFailures || fallbackFiltered.hasTechnicalFailures
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('Falha ao consultar resultados no letras.mus.br.', 502);
    }
  }

  private async normalizeAndFilterResults(
    results: ScrapedLyricsSearchResult[]
  ): Promise<FilteredSongsOutput> {
    const seen = new Set<string>();
    const normalizedResults: GetLyricsSongDto[] = [];

    for (const result of results) {
      const title = result.title.trim();
      const artist = result.artist.trim();
      const preview = result.preview.trim();
      const normalizedUrl = this.normalizeSongUrl(result.url);
      const id = result.id || 'unknown';

      if (!title || !normalizedUrl) {
        continue;
      }

      const dedupeKey = normalizedUrl.toLowerCase();
      if (seen.has(dedupeKey)) {
        continue;
      }

      seen.add(dedupeKey);
      normalizedResults.push({
        id,
        title,
        artist,
        preview,
        url: normalizedUrl
      });
    }

    if (!this.syncedLyricsAvailabilityProvider) {
      return {
        songs: normalizedResults,
        hasTechnicalFailures: false
      };
    }

    return this.filterSongsWithSyncedLyrics(normalizedResults);
  }

  private async filterSongsWithSyncedLyrics(songs: GetLyricsSongDto[]): Promise<FilteredSongsOutput> {
    const syncedLyricsAvailabilityProvider = this.syncedLyricsAvailabilityProvider;
    if (!syncedLyricsAvailabilityProvider) {
      return {
        songs,
        hasTechnicalFailures: false
      };
    }

    const songsWithSyncedLyrics: GetLyricsSongDto[] = [];
    let hasTechnicalFailures = false;

    for (const song of songs) {
      try {
        const hasSyncedLyrics = await syncedLyricsAvailabilityProvider.hasSyncedLyrics(song.url);
        if (hasSyncedLyrics) {
          songsWithSyncedLyrics.push(song);
        }
      } catch (error) {
        if (error instanceof AppError && (error.statusCode === 400 || error.statusCode === 404)) {
          continue;
        }

        hasTechnicalFailures = true;
      }
    }

    return {
      songs: songsWithSyncedLyrics,
      hasTechnicalFailures
    };
  }

  private normalizeSongUrl(rawUrl: string): string | null {
    let parsed: URL;

    try {
      parsed = new URL(rawUrl, 'https://www.letras.mus.br');
    } catch {
      return null;
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    if (!ALLOWED_HOSTS.has(parsed.hostname)) {
      return null;
    }

    const path = parsed.pathname.toLowerCase();
    for (const blockedPathMarker of BLOCKED_PATH_MARKERS) {
      if (path.includes(blockedPathMarker)) {
        return null;
      }
    }

    const pathParts = parsed.pathname.split('/').filter(Boolean);
    if (pathParts.length < 2) {
      return null;
    }

    parsed.search = '';
    parsed.hash = '';

    if (!parsed.pathname.endsWith('/')) {
      parsed.pathname = `${parsed.pathname}/`;
    }

    return parsed.toString();
  }
}
