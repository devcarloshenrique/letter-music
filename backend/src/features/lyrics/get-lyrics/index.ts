import { AppError } from '../../../shared/errors/app-error';
import {
	createFreshLetrasHttpClient,
	letrasHttpClient
} from '../../../shared/infra/http/letras-http.client';
import { YahooScrapingProvider } from '../../../shared/providers/scraping/yahoo-scraping.provider';
import { GetSyncedLyricsUseCase } from '../get-synced-lyrics/get-synced-lyrics.usecase';
import { GetLyricsController } from './get-lyrics.controller';
import { GetLyricsUseCase, ISyncedLyricsAvailabilityProvider } from './get-lyrics.usecase';

class SyncedLyricsAvailabilityProvider implements ISyncedLyricsAvailabilityProvider {
	constructor(private readonly syncedLyricsUseCase: GetSyncedLyricsUseCase) {}

	async hasSyncedLyrics(url: string): Promise<boolean> {
		try {
			const result = await this.syncedLyricsUseCase.execute({ url });
			return result.lines.length > 0;
		} catch (error) {
			if (error instanceof AppError && (error.statusCode === 400 || error.statusCode === 404)) {
				return false;
			}

			throw error;
		}
	}
}

const searchProvider = new YahooScrapingProvider();
const syncedLyricsUseCase = new GetSyncedLyricsUseCase(
	letrasHttpClient,
	createFreshLetrasHttpClient
);
const syncedLyricsAvailabilityProvider = new SyncedLyricsAvailabilityProvider(syncedLyricsUseCase);
const getLyricsUseCase = new GetLyricsUseCase(searchProvider, syncedLyricsAvailabilityProvider);

export const getLyricsController = new GetLyricsController(getLyricsUseCase);
