import { YahooScrapingProvider } from '../../../shared/providers/scraping/yahoo-scraping.provider';
import { GetLyricsController } from './get-lyrics.controller';
import { GetLyricsUseCase } from './get-lyrics.usecase';

const searchProvider = new YahooScrapingProvider();
const getLyricsUseCase = new GetLyricsUseCase(searchProvider);

export const getLyricsController = new GetLyricsController(getLyricsUseCase);
