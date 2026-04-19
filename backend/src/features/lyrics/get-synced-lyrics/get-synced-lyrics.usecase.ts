import { load } from 'cheerio';
import { AppError } from '../../../shared/errors/app-error';
import {
  LETRAS_BASE_URL,
  LETRAS_BROWSER_HEADERS
} from '../../../shared/infra/http/letras-request';
import type { IHttpClient } from '../../../shared/providers/http/ihttp-client';
import type {
  GetSyncedLyricsInputDto,
  GetSyncedLyricsOutputDto,
  SyncedLyricLineDto,
  SyncedLyricsHiddenMetaDto
} from './get-synced-lyrics.dto';

type SyncedLyricsSongMeta = {
  dns: string;
  url: string;
  youtubeId: string;
  musicId?: string;
};

function dedupe(lines: SyncedLyricLineDto[]): SyncedLyricLineDto[] {
  const seen = new Set<string>();
  return lines.filter((line) => {
    const key = `${line.start}::${line.end}::${line.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeLyricText(raw: string | undefined | null): string {
  if (!raw) return '';

  return raw
    .replace(/\\n|\\r/g, ' ')
    .replace(/\\t/g, ' ')
    .replaceAll('\\u003Cbr\\u003E', ' ')
    .replaceAll('\\u003Cbr\\/\\u003E', ' ')
    .replace(/<br\/?\s*>/gi, ' ')
    .replace(/\\"/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeRelTime(raw: string | undefined | null): string {
  return String(raw ?? '')
    .trim()
    .replace(',', '.');
}

function pushLine(lines: SyncedLyricLineDto[], startRaw: string, endRaw: string, textRaw: string): void {
  const start = normalizeRelTime(startRaw);
  const end = normalizeRelTime(endRaw);
  const text = normalizeLyricText(textRaw);

  if (!start || !end || text.length === 0) {
    return;
  }

  lines.push({ start, end, text });
}

function readHiddenMeta($: ReturnType<typeof load>): SyncedLyricsHiddenMetaDto | null {
  const form = $('#leg_sinc');
  if (form.length === 0) {
    return null;
  }

  const songId = normalizeLyricText(form.find('input[type="hidden"][name="song_id"]').attr('value'));
  const videoId = normalizeLyricText(form.find('input[type="hidden"][name="video_id"]').attr('value'));
  const subtitleId = normalizeLyricText(form.find('input[type="hidden"][name="subtitle_id"]').attr('value'));

  if (!songId && !videoId && !subtitleId) {
    return null;
  }

  return {
    song_id: songId,
    video_id: videoId,
    subtitle_id: subtitleId
  };
}

function findArraySlice(source: string, arrayStartIndex: number): string | null {
  let depth = 0;
  let endIndex = -1;

  for (let index = arrayStartIndex; index < source.length; index += 1) {
    const char = source[index];

    if (char === '[') {
      depth += 1;
    } else if (char === ']') {
      depth -= 1;
      if (depth === 0) {
        endIndex = index;
        break;
      }
    }
  }

  if (endIndex < 0) {
    return null;
  }

  return source.slice(arrayStartIndex, endIndex + 1);
}

function findObjectSlice(source: string, objectStartIndex: number): string | null {
  let depth = 0;
  let endIndex = -1;
  let inString: '"' | "'" | null = null;
  let escaped = false;

  for (let index = objectStartIndex; index < source.length; index += 1) {
    const char = source[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (inString) {
      if (char === inString) {
        inString = null;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      inString = char;
      continue;
    }

    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        endIndex = index;
        break;
      }
    }
  }

  if (endIndex < 0) {
    return null;
  }

  return source.slice(objectStartIndex, endIndex + 1);
}

function isLetrasHost(hostname: string): boolean {
  return hostname === 'letras.mus.br' || hostname.endsWith('.letras.mus.br');
}

function normalizeCandidateHref(hrefRaw: string): string {
  return hrefRaw
    .trim()
    .replace(/\\\//g, '/')
    .replace(/&amp;/g, '&');
}

function normalizeMetaValue(raw: unknown): string {
  return normalizeLyricText(String(raw ?? ''));
}

function buildMetaCandidateFromPayload(payload: Record<string, unknown>): SyncedLyricsSongMeta {
  const urlValue = normalizeMetaValue(payload.URL);
  const numericId = normalizeMetaValue(payload.ID);
  return {
    dns: normalizeMetaValue(payload.DNS),
    url: urlValue,
    youtubeId: normalizeMetaValue(payload.YoutubeID ?? payload.youtubeID),
    musicId: /^\d+$/.test(urlValue) ? urlValue : /^\d+$/.test(numericId) ? numericId : undefined
  };
}

function hasCompleteSongMeta(meta: SyncedLyricsSongMeta | null): meta is SyncedLyricsSongMeta {
  return Boolean(meta?.dns && meta.url && meta.youtubeId);
}

function extractMetaFromOmqTag(scriptRaw: string, tag: 'ui/lyric' | 'ui/player'): SyncedLyricsSongMeta | null {
  const tagRegex = new RegExp(`['\"]${tag}['\"]`, 'g');

  let tagMatch = tagRegex.exec(scriptRaw);
  while (tagMatch) {
    const objectStartIndex = scriptRaw.indexOf('{', tagMatch.index);
    if (objectStartIndex >= 0) {
      const payloadRaw = findObjectSlice(scriptRaw, objectStartIndex);
      if (payloadRaw) {
        try {
          const payload = JSON.parse(payloadRaw) as Record<string, unknown>;
          const candidate = buildMetaCandidateFromPayload(payload);
          if (hasCompleteSongMeta(candidate)) {
            return candidate;
          }
        } catch {
          // Ignora payload inválido e continua buscando fallback.
        }
      }
    }

    tagMatch = tagRegex.exec(scriptRaw);
  }

  return null;
}

function extractSongMetaFromPublicPage(html: string): SyncedLyricsSongMeta | null {
  const $ = load(html);

  const scriptContents = $('script')
    .toArray()
    .map((element) => $(element).html() ?? '')
    .filter((scriptRaw) => scriptRaw.includes('_omq.push'));

  for (const scriptRaw of scriptContents) {
    const lyricMeta = extractMetaFromOmqTag(scriptRaw, 'ui/lyric');
    if (hasCompleteSongMeta(lyricMeta)) {
      return lyricMeta;
    }
  }

  for (const scriptRaw of scriptContents) {
    const playerMeta = extractMetaFromOmqTag(scriptRaw, 'ui/player');
    if (hasCompleteSongMeta(playerMeta)) {
      return playerMeta;
    }
  }

  return null;
}

function extractContributionUrlFromPublicPage(pageUrl: URL, html: string): string | null {
  const $ = load(html);

  const anchors = $('a[href*="/contribuicoes/corrigir_legenda/"]');
  for (const anchor of anchors) {
    const hrefRaw = $(anchor).attr('href');
    if (!hrefRaw) continue;

    try {
      const resolved = new URL(normalizeCandidateHref(hrefRaw), pageUrl.toString());
      if (isLetrasHost(resolved.hostname) && resolved.pathname.includes('/contribuicoes/corrigir_legenda/')) {
        return resolved.toString();
      }
    } catch {
      // tenta próximo candidato
    }
  }

  return null;
}

function buildContributionUrlFromMeta(meta: SyncedLyricsSongMeta): string {
  return new URL(
    `/contribuicoes/corrigir_legenda/${meta.dns}/${meta.url}/${meta.youtubeId}/`,
    LETRAS_BASE_URL
  ).toString();
}

function extractSubtitleMetaFromScript(scriptRaw: string): Pick<SyncedLyricsSongMeta, 'musicId' | 'youtubeId'> | null {
  const youtubeMatch = scriptRaw.match(/"YoutubeID"\s*:\s*"([^"]*)"/i);
  const musicIdByUrlMatch = scriptRaw.match(/"URL"\s*:\s*"(\d+)"/i);
  const musicIdByIdMatch = scriptRaw.match(/"ID"\s*:\s*(\d+)/i);

  const youtubeId = normalizeMetaValue(youtubeMatch?.[1]);
  const musicId = normalizeMetaValue(musicIdByUrlMatch?.[1] ?? musicIdByIdMatch?.[1]);

  if (!musicId) {
    return null;
  }

  return {
    musicId,
    youtubeId: youtubeId || undefined
  };
}

function extractSubtitleMetaFromPublicPage(html: string): Pick<SyncedLyricsSongMeta, 'musicId' | 'youtubeId'> | null {
  const $ = load(html);

  const scriptContents = $('script')
    .toArray()
    .map((element) => $(element).html() ?? '');

  for (const scriptRaw of scriptContents) {
    const identifiers = extractSubtitleMetaFromScript(scriptRaw);
    if (identifiers) {
      return identifiers;
    }
  }

  return null;
}

function buildPublicSubtitleEndpoint(musicId: string, youtubeId: string): string {
  return new URL(`/api/v2/subtitle/${musicId}/${youtubeId}/`, LETRAS_BASE_URL).toString();
}

function buildPublicSubtitleCandidatesEndpoint(musicId: string): string {
  return new URL(`/api/v2/subtitle/${musicId}/`, LETRAS_BASE_URL).toString();
}

function extractYoutubeCandidates(payload: unknown): string[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  const candidates = payload
    .map((item) => normalizeMetaValue(item))
    .filter((value) => value.length > 0);

  return Array.from(new Set(candidates));
}

function readStringField(record: Record<string, unknown>, candidates: string[]): string {
  for (const key of candidates) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return normalizeLyricText(value);
    }
  }

  return '';
}

function toSubtitleRows(input: unknown): Array<[string, string, string]> {
  if (!Array.isArray(input)) {
    return [];
  }

  const rows: Array<[string, string, string]> = [];

  for (const item of input) {
    if (Array.isArray(item) && item.length >= 3) {
      rows.push([String(item[0] ?? ''), String(item[1] ?? ''), String(item[2] ?? '')]);
      continue;
    }

    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const record = item as Record<string, unknown>;
      const text = readStringField(record, ['text', 'lyric', 'line', 'value']);
      const start = readStringField(record, ['start', 'from', 'startTime', 'initial']);
      const end = readStringField(record, ['end', 'to', 'endTime', 'final']);

      if (text && start && end) {
        rows.push([text, start, end]);
      }
    }
  }

  return rows;
}

function parseSubtitleRowsFromString(raw: string): Array<[string, string, string]> {
  const trimmed = raw.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return toSubtitleRows(parsed);
  } catch {
    return [];
  }
}

function extractSubtitleRowsFromUnknown(payload: unknown, depth = 0): Array<[string, string, string]> {
  if (depth > 5 || payload == null) {
    return [];
  }

  if (typeof payload === 'string') {
    return parseSubtitleRowsFromString(payload);
  }

  const directRows = toSubtitleRows(payload);
  if (directRows.length > 0) {
    return directRows;
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const nestedRows = extractSubtitleRowsFromUnknown(item, depth + 1);
      if (nestedRows.length > 0) {
        return nestedRows;
      }
    }
    return [];
  }

  if (typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const subtitleStringRows = parseSubtitleRowsFromString(readStringField(record, ['Subtitle', 'subtitle']));
    if (subtitleStringRows.length > 0) {
      return subtitleStringRows;
    }

    const prioritizedKeys = ['Original', 'Translation', 'editar', 'subtitles', 'lines', 'lyrics', 'data', 'Subtitle', 'subtitle'];

    for (const key of prioritizedKeys) {
      const nested = record[key];
      const nestedRows = extractSubtitleRowsFromUnknown(nested, depth + 1);
      if (nestedRows.length > 0) {
        return nestedRows;
      }
    }

    for (const nested of Object.values(record)) {
      const nestedRows = extractSubtitleRowsFromUnknown(nested, depth + 1);
      if (nestedRows.length > 0) {
        return nestedRows;
      }
    }
  }

  return [];
}

function extractVideoUrlFromPayload(payload: unknown): string | undefined {
  if (payload == null) {
    return undefined;
  }

  if (typeof payload === 'object' && !Array.isArray(payload)) {
    const record = payload as Record<string, unknown>;
    const youtubeId = readStringField(record, [
      'youtube_id',
      'youtubeId',
      'YoutubeID',
      'video_id',
      'videoId',
      'VideoID'
    ]);
    if (youtubeId) {
      return `https://www.youtube.com/watch?v=${youtubeId}`;
    }

    const fullVideoUrl = readStringField(record, ['video_url', 'videoUrl', 'youtube_url', 'youtubeUrl']);
    if (fullVideoUrl) {
      return fullVideoUrl;
    }

    for (const nested of Object.values(record)) {
      const fromNested = extractVideoUrlFromPayload(nested);
      if (fromNested) {
        return fromNested;
      }
    }
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const fromNested = extractVideoUrlFromPayload(item);
      if (fromNested) {
        return fromNested;
      }
    }
  }

  return undefined;
}

function extractFromUiSubtitlesPayload(script: string, lines: SyncedLyricLineDto[]): void {
  const editarKeyIndex = script.indexOf('"editar"');
  if (editarKeyIndex < 0) {
    return;
  }

  const arrayStartIndex = script.indexOf('[', editarKeyIndex);
  if (arrayStartIndex < 0) {
    return;
  }

  const editarArrayRaw = findArraySlice(script, arrayStartIndex);
  if (!editarArrayRaw) {
    return;
  }

  try {
    const parsed = JSON.parse(editarArrayRaw) as Array<[string, string, string] | unknown>;
    for (const row of parsed) {
      if (!Array.isArray(row) || row.length < 3) {
        continue;
      }

      const [textRaw, startRaw, endRaw] = row;
      pushLine(lines, String(startRaw ?? ''), String(endRaw ?? ''), String(textRaw ?? ''));
    }
  } catch {
    // Ignora payload inválido; outros fallback parsers continuam.
  }
}

function extractLineText(row: any): string {
  const legendaInput = row.find('input.legenda').first();
  const valueText = normalizeLyricText(legendaInput.attr('value') || legendaInput.val()?.toString());
  if (valueText) {
    return valueText;
  }

  const spanText = normalizeLyricText(
    row.find('span.lsin_c3, span[class*="lsin_c3"], .lsin_c3').first().text()
  );
  if (spanText) {
    return spanText;
  }

  const siblingText = normalizeLyricText(
    legendaInput
      .siblings('span, div, p, label')
      .text()
  );
  if (siblingText) {
    return siblingText;
  }

  return normalizeLyricText(row.text());
}

function isLoginPage(html: string): boolean {
  const $ = load(html);

  const hasLoginForm = $('form[action*="/contribuicoes/entrar"], #ccid_form').length > 0;
  const hasLoginInputs = $('input[type="password"], input[name="password"], input[name="senha"]').length > 0;
  const hasLoginSubmit = $('button[type="submit"], input[type="submit"]').length > 0;
  const hasLoginHref = $('a[href*="/contribuicoes/entrar/"]').length > 0;

  return hasLoginForm || (hasLoginInputs && hasLoginSubmit) || (hasLoginHref && hasLoginInputs);
}

export class GetSyncedLyricsUseCase {
  constructor(private readonly httpClient: IHttpClient) {}

  private parseAndValidateInputUrl(rawUrl: string): URL {
    try {
      const parsedUrl = new URL(rawUrl);

      if (!isLetrasHost(parsedUrl.hostname)) {
        throw new AppError('A URL deve ser do domínio letras.mus.br.', 400);
      }

      return parsedUrl;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('URL inválida. Informe uma URL válida do letras.mus.br.', 400);
    }
  }

  private async resolveSyncedLyricsUrl(parsedUrl: URL, prefetchedHtml?: string): Promise<URL> {
    if (parsedUrl.pathname.includes('/contribuicoes/corrigir_legenda/')) {
      return parsedUrl;
    }

    const html = prefetchedHtml ?? (await this.fetchPublicPageHtml(parsedUrl));

    const meta = extractSongMetaFromPublicPage(html);
    if (hasCompleteSongMeta(meta)) {
      return new URL(buildContributionUrlFromMeta(meta));
    }

    const contributionUrl = extractContributionUrlFromPublicPage(parsedUrl, html);
    if (contributionUrl) {
      return new URL(contributionUrl);
    }

    throw new AppError(
      'Não foi possível localizar dados de legenda sincronizada na página da música.',
      404
    );
  }

  private buildSongUrlFromContributionUrl(parsedUrl: URL): URL | null {
    if (!parsedUrl.pathname.includes('/contribuicoes/corrigir_legenda/')) {
      return null;
    }

    const segments = parsedUrl.pathname.split('/').filter(Boolean);
    const markerIndex = segments.findIndex((segment) => segment === 'corrigir_legenda');

    if (markerIndex < 0 || segments.length < markerIndex + 3) {
      return null;
    }

    const dns = segments[markerIndex + 1];
    const songSlug = segments[markerIndex + 2];
    if (!dns || !songSlug) {
      return null;
    }

    return new URL(`/${dns}/${songSlug}/`, LETRAS_BASE_URL);
  }

  private async fetchPublicPageHtml(parsedUrl: URL): Promise<string> {
    const songUrl = this.buildSongUrlFromContributionUrl(parsedUrl) ?? parsedUrl;

    const songPageResponse = await this.httpClient.get<string>(songUrl.toString(), {
      ...LETRAS_BROWSER_HEADERS
    });

    if (songPageResponse.status === 404) {
      throw new AppError('Página da música não encontrada no letras.mus.br.', 404);
    }

    if (songPageResponse.status >= 400) {
      throw new AppError('Falha ao consultar página pública da música.', 502);
    }

    return String(songPageResponse.data ?? '');
  }

  private async fetchPublicSubtitle(
    meta: Pick<SyncedLyricsSongMeta, 'musicId' | 'youtubeId'>
  ): Promise<Pick<GetSyncedLyricsOutputDto, 'lines' | 'video_url'>> {
    const musicId = normalizeMetaValue(meta.musicId);
    const initialYoutubeId = normalizeMetaValue(meta.youtubeId);

    if (!musicId) {
      throw new AppError('Não foi possível identificar dados públicos da legenda sincronizada.', 404);
    }

    const youtubeCandidates: string[] = [];
    if (initialYoutubeId) {
      youtubeCandidates.push(initialYoutubeId);
    }

    if (youtubeCandidates.length === 0) {
      const candidatesResponse = await this.httpClient.get<unknown>(
        buildPublicSubtitleCandidatesEndpoint(musicId),
        {
          ...LETRAS_BROWSER_HEADERS
        }
      );

      if (candidatesResponse.status >= 400 && candidatesResponse.status !== 404) {
        throw new AppError('Falha ao consultar endpoint público de legenda sincronizada.', 502);
      }

      for (const candidate of extractYoutubeCandidates(candidatesResponse.data)) {
        if (!youtubeCandidates.includes(candidate)) {
          youtubeCandidates.push(candidate);
        }
      }
    }

    if (youtubeCandidates.length === 0) {
      throw new AppError('Legenda sincronizada não disponível para esta música.', 404);
    }

    let hasUpstreamFailure = false;

    for (const youtubeId of youtubeCandidates) {
      const subtitleEndpoint = buildPublicSubtitleEndpoint(musicId, youtubeId);
      const subtitleResponse = await this.httpClient.get<unknown>(subtitleEndpoint, {
        ...LETRAS_BROWSER_HEADERS
      });

      if (subtitleResponse.status === 404) {
        continue;
      }

      if (subtitleResponse.status >= 400) {
        hasUpstreamFailure = true;
        continue;
      }

      const parsedRows = extractSubtitleRowsFromUnknown(subtitleResponse.data);
      const lines: SyncedLyricLineDto[] = [];

      for (const [textRaw, startRaw, endRaw] of parsedRows) {
        pushLine(lines, startRaw, endRaw, textRaw);
      }

      const deduped = dedupe(lines);
      if (deduped.length === 0) {
        continue;
      }

      return {
        lines: deduped,
        video_url: extractVideoUrlFromPayload(subtitleResponse.data) ?? `https://www.youtube.com/watch?v=${youtubeId}`
      };
    }

    if (hasUpstreamFailure) {
      throw new AppError('Falha ao consultar endpoint público de legenda sincronizada.', 502);
    }

    throw new AppError('Não foi possível extrair legendas sincronizadas da resposta pública.', 404);
  }

  private async fetchFromContributionPage(parsedUrl: URL, prefetchedHtml?: string): Promise<GetSyncedLyricsOutputDto> {
    const syncedLyricsUrl = await this.resolveSyncedLyricsUrl(parsedUrl, prefetchedHtml);
    const response = await this.httpClient.get<string>(syncedLyricsUrl.toString(), {
      ...LETRAS_BROWSER_HEADERS
    });

    if (response.status >= 400) {
      throw new AppError('Falha ao consultar página de legenda sincronizada.', 502);
    }

    const html = String(response.data ?? '');
    if (isLoginPage(html)) {
      throw new AppError('Legendas sincronizadas não estão disponíveis sem autenticação para esta URL.', 404);
    }

    const $ = load(html);
    const hidden = readHiddenMeta($);
    const videoUrl = hidden?.video_id ? `https://www.youtube.com/watch?v=${hidden.video_id}` : undefined;
    const lines: SyncedLyricLineDto[] = [];

    $('#leg_sinc ul#lsin_ls li.lineItem').each((_, element) => {
      const row = $(element);
      const start = row.find('input.time.start').attr('rel');
      const end = row.find('input.time.end').attr('rel');
      const text = extractLineText(row);

      pushLine(lines, start ?? '', end ?? '', text);
    });

    if (lines.length === 0) {
      $('script').each((_, element) => {
        const scriptRaw = $(element).html() ?? '';
        if (!scriptRaw) return;
        extractFromUiSubtitlesPayload(scriptRaw, lines);
      });
    }

    const result = dedupe(lines);
    if (result.length === 0) {
      throw new AppError('Não foi possível extrair legendas sincronizadas da página.', 404);
    }

    return {
      lines: result,
      video_url: videoUrl,
      hidden
    };
  }

  async execute(input: GetSyncedLyricsInputDto): Promise<GetSyncedLyricsOutputDto> {
    if (!input.url || input.url.trim().length === 0) {
      throw new AppError('Parâmetro "url" é obrigatório.', 400);
    }

    const parsedUrl = this.parseAndValidateInputUrl(input.url);

    const publicPageHtml = await this.fetchPublicPageHtml(parsedUrl);
    const subtitleMeta = extractSubtitleMetaFromPublicPage(publicPageHtml);

    if (subtitleMeta) {
      const subtitleResult = await this.fetchPublicSubtitle(subtitleMeta);
      return {
        lines: subtitleResult.lines,
        video_url: subtitleResult.video_url,
        hidden: null
      };
    }

    return this.fetchFromContributionPage(parsedUrl, publicPageHtml);
  }
}
