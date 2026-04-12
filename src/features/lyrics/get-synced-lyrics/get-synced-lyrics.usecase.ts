import { load } from 'cheerio';
import { AppError } from '../../../shared/errors/app-error';
import {
  ACCOUNTS_CIFRACLUB_BASE_URL,
  ACCOUNTS_GRAPHQL_URL,
  ACCOUNTS_LETRAS_BASE_URL,
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

type SessionCheckResponse = {
  data?: {
    viewer?: {
      isSessionValid?: boolean;
    };
  };
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

  async execute(input: GetSyncedLyricsInputDto): Promise<GetSyncedLyricsOutputDto> {
    if (!input.url || input.url.trim().length === 0) {
      throw new AppError('Parâmetro "url" é obrigatório.', 400);
    }

    const parsedUrl = new URL(input.url);
    if (!parsedUrl.hostname.endsWith('letras.mus.br') || !parsedUrl.pathname.includes('/contribuicoes/corrigir_legenda/')) {
      throw new AppError('A URL deve ser de corrigir_legenda do letras.mus.br.', 400);
    }

    const cookies = [
      ...(await this.httpClient.getCookies(LETRAS_BASE_URL)),
      ...(await this.httpClient.getCookies(ACCOUNTS_LETRAS_BASE_URL)),
      ...(await this.httpClient.getCookies(ACCOUNTS_CIFRACLUB_BASE_URL))
    ];

    if (cookies.length === 0) {
      throw new AppError('Sessão não autenticada. Realize login antes de consultar legendas.', 401);
    }

    const sessionCheckResponse = await this.httpClient.postJson<SessionCheckResponse>(
      ACCOUNTS_GRAPHQL_URL,
      {
        query: `
          query {
            viewer {
              isSessionValid
            }
          }
        `
      },
      {
        ...LETRAS_BROWSER_HEADERS
      }
    );

    const isSessionValid = sessionCheckResponse.data.data?.viewer?.isSessionValid;
    if (!isSessionValid) {
      throw new AppError('Sessão expirada ou usuário não autenticado.', 401);
    }

    const response = await this.httpClient.get<string>(parsedUrl.toString(), {
      ...LETRAS_BROWSER_HEADERS
    });

    const contentLengthHeaderRaw = response.headers?.['content-length'];
    const contentLengthHeader = Array.isArray(contentLengthHeaderRaw)
      ? contentLengthHeaderRaw[0]
      : contentLengthHeaderRaw;
    const htmlLength = String(response.data ?? '').length;
    // eslint-disable-next-line no-console
    console.log(
      `[get-synced-lyrics] status=${response.status} content-length=${contentLengthHeader ?? 'n/a'} body-length=${htmlLength}`
    );

    if (response.status >= 400) {
      throw new AppError('Falha ao consultar página de legenda sincronizada.', 502);
    }

    const html = String(response.data ?? '');
    if (isLoginPage(html)) {
      throw new AppError('Sessão expirada ou usuário não autenticado.', 401);
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
}
