import { CheerioScrapingProvider } from '../../../shared/providers/scraping/cheerio-scraping.provider';
import { GetLyricsController } from './get-lyrics.controller';
import { GetLyricsUseCase } from './get-lyrics.usecase';

const scrapingProvider = new CheerioScrapingProvider();
const getLyricsUseCase = new GetLyricsUseCase(scrapingProvider);

export const getLyricsController = new GetLyricsController(getLyricsUseCase);
