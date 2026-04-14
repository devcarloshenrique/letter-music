import { PlaywrightScrapingProvider } from '../../../shared/providers/scraping/playwright-scraping.provider';
import { GetLyricsController } from './get-lyrics.controller';
import { GetLyricsUseCase } from './get-lyrics.usecase';

const searchProvider = new PlaywrightScrapingProvider();
const getLyricsUseCase = new GetLyricsUseCase(searchProvider);

export const getLyricsController = new GetLyricsController(getLyricsUseCase);
