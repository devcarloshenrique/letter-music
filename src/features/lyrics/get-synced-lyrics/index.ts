import { letrasHttpClient } from '../../../shared/infra/http/letras-http.client';
import { GetSyncedLyricsController } from './get-synced-lyrics.controller';
import { GetSyncedLyricsUseCase } from './get-synced-lyrics.usecase';

const getSyncedLyricsUseCase = new GetSyncedLyricsUseCase(letrasHttpClient);

export const getSyncedLyricsController = new GetSyncedLyricsController(getSyncedLyricsUseCase);
