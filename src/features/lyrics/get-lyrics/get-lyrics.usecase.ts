import { AppError } from '../../../shared/errors/app-error';
import type { IScrapingProvider } from '../../../shared/providers/scraping/iser-scraping.provider';
import type { GetLyricsInputDto, GetLyricsOutputDto } from './get-lyrics.dto';

const ALLOWED_HOSTS = new Set(['www.letras.mus.br', 'letras.mus.br']);

export class GetLyricsUseCase {
  constructor(private readonly scrapingProvider: IScrapingProvider) {}

  async execute(input: GetLyricsInputDto): Promise<GetLyricsOutputDto> {
    if (!input.url || input.url.trim().length === 0) {
      throw new AppError(
        'Parâmetro "url" é obrigatório. Ex: /api/lyrics?url=https://www.letras.mus.br/harpa-crista/853769/',
        400
      );
    }

    const songUrl = this.parseAndValidateLetrasUrl(input.url);
    const scraped = await this.scrapingProvider.scrapeLyrics(songUrl);

    return {
      sourceUrl: songUrl.toString(),
      title: scraped.title,
      artist: scraped.artist,
      lyrics: scraped.stanzas.join('\n\n'),
      stanzas: scraped.stanzas
    };
  }

  private parseAndValidateLetrasUrl(rawUrl: string): URL {
    let parsed: URL;

    try {
      parsed = new URL(rawUrl);
    } catch {
      throw new AppError('A URL informada é inválida', 400);
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new AppError('A URL precisa usar protocolo http ou https', 400);
    }

    if (!ALLOWED_HOSTS.has(parsed.hostname)) {
      throw new AppError('A URL deve ser do domínio letras.mus.br', 400);
    }

    const pathParts = parsed.pathname.split('/').filter(Boolean);
    if (pathParts.length < 2) {
      throw new AppError(
        'Formato de URL inválido. Exemplo válido: https://www.letras.mus.br/harpa-crista/853769/',
        400
      );
    }

    return parsed;
  }
}
