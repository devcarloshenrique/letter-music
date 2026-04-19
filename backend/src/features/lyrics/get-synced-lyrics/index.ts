import {
	createFreshLetrasHttpClient,
	letrasHttpClient
} from '../../../shared/infra/http/letras-http.client';
import { GetSyncedLyricsController } from './get-synced-lyrics.controller';
import { GetSyncedLyricsUseCase } from './get-synced-lyrics.usecase';

const getSyncedLyricsUseCase = new GetSyncedLyricsUseCase(
	letrasHttpClient,
	createFreshLetrasHttpClient
);

export const getSyncedLyricsController = new GetSyncedLyricsController(getSyncedLyricsUseCase);
