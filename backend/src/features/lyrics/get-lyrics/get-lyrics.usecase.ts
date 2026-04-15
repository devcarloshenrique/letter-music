import { AppError } from '../../../shared/errors/app-error';
import type {
  ILyricsSearchProvider,
  SearchLyricsOutput,
  ScrapedLyricsSearchResult
} from '../../../shared/providers/scraping/iser-scraping.provider';
import type { GetLyricsInputDto, GetLyricsOutputDto, GetLyricsSongDto } from './get-lyrics.dto';

const ALLOWED_HOSTS = new Set(['www.letras.mus.br', 'letras.mus.br']);
const BLOCKED_PATH_MARKERS = ['/significado', '/aprenda-ingles'];
const MIN_PAGE = 1;
const MAX_PAGE = 10;
const PAGE_SIZE = 10;

export class GetLyricsUseCase {
  constructor(private readonly searchProvider: ILyricsSearchProvider) {}

  async execute(input: GetLyricsInputDto): Promise<GetLyricsOutputDto> {
    const query = input.q?.trim() ?? '';

    if (query.length === 0) {
      throw new AppError(
        'Parâmetro "q" é obrigatório. Ex: /api/lyrics?q=eminem&page=2',
        400
      );
    }

    const page = this.parseAndValidatePage(input.page);
    const searchOutput = await this.searchWithFallback(query, page);
    const songs = this.normalizeAndFilterResults(searchOutput.results);

    if (songs.length === 0) {
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
      throw new AppError('Parâmetro "page" precisa ser um número inteiro entre 1 e 10.', 400);
    }

    if (rawPage < MIN_PAGE || rawPage > MAX_PAGE) {
      throw new AppError('Parâmetro "page" precisa estar entre 1 e 10.', 400);
    }

    return rawPage;
  }

  private async searchWithFallback(query: string, page: number): Promise<SearchLyricsOutput> {
    try {
      const firstAttempt = await this.searchProvider.searchLyrics({ query, page, fallback: false });
      const firstAttemptNormalized = this.normalizeAndFilterResults(firstAttempt.results);

      if (firstAttemptNormalized.length > 0) {
        return firstAttempt;
      }

      const fallbackAttempt = await this.searchProvider.searchLyrics({ query, page, fallback: true });
      return fallbackAttempt;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('Falha ao consultar resultados no letras.mus.br.', 502);
    }
  }

  private normalizeAndFilterResults(results: ScrapedLyricsSearchResult[]): GetLyricsSongDto[] {
    const seen = new Set<string>();
    const normalizedResults: GetLyricsSongDto[] = [];

    for (const result of results) {
      const title = result.title.trim();
      const description = result.description.trim();
      const normalizedUrl = this.normalizeSongUrl(result.url);

      if (!title || !normalizedUrl) {
        continue;
      }

      const dedupeKey = normalizedUrl.toLowerCase();
      if (seen.has(dedupeKey)) {
        continue;
      }

      seen.add(dedupeKey);
      normalizedResults.push({
        title,
        description,
        url: normalizedUrl
      });
    }

    return normalizedResults;
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
