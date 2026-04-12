import { GetLyricsUseCase } from '../features/lyrics/get-lyrics/get-lyrics.usecase';
import { CheerioScrapingProvider } from '../shared/providers/scraping/cheerio-scraping.provider';

type LyricsResult = {
  sourceUrl: string;
  title: string;
  artist: string;
  lyrics: string;
  stanzas: string[];
};

/**
 * @deprecated Mantido apenas para compatibilidade legada.
 * Use `GetLyricsUseCase` em `src/features/lyrics/get-lyrics/get-lyrics.usecase.ts`.
 */
export async function scrapeLyricsFromUrl(url: URL): Promise<LyricsResult> {
  const useCase = new GetLyricsUseCase(new CheerioScrapingProvider());
  return useCase.execute({ url: url.toString() });
}