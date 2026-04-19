import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '../../../shared/providers/http/ihttp-client';
import { GetSyncedLyricsUseCase } from './get-synced-lyrics.usecase';

function createHttpClientMock(): IHttpClient {
  return {
    postForm: vi.fn(),
    postJson: vi.fn(),
    get: vi.fn(),
    getCookies: vi.fn()
  };
}

function createPublicPageWithSubtitleMeta(): string {
  return `
    <html>
      <body>
        <script>
          _omq.push(['ui/player', {
            "DNS":"casa-worship",
            "URL":"123456",
            "YoutubeID":"5QHF5OQeFOs"
          }]);
        </script>
      </body>
    </html>
  `;
}

function createPublicPageWithSlugUrlAndNumericIdMeta(): string {
  return `
    <html>
      <body>
        <script>
          _omq.push(['ui/lyric', {
            "DNS":"ariana-grande",
            "ID":3074298,
            "URL":"thank-u-next",
            "YoutubeID":"gl1aHhXnN1k"
          }]);
        </script>
      </body>
    </html>
  `;
}

function createPublicPageWithEmptyYoutubeAndNumericSong(): string {
  return `
    <html>
      <body>
        <script>
          _omq.push(['ui/lyric', {
            "DNS":"linkin-park",
            "ID":65985,
            "URL":"65985",
            "YoutubeID":""
          }]);
        </script>
      </body>
    </html>
  `;
}

function createPublicPageWithContributionMeta(): string {
  return `
    <html>
      <body>
        <script>
          _omq.push(['ui/lyric', {
            "DNS":"casa-worship",
            "URL":"a-casa-e-sua",
            "YoutubeID":"5QHF5OQeFOs"
          }]);
        </script>
      </body>
    </html>
  `;
}

function createSubtitlePayload(): Record<string, unknown> {
  return {
    Original: {
      VideoID: '5QHF5OQeFOs',
      Subtitle: JSON.stringify([
        ['Linha 1', '21.8', '31.1'],
        ['Linha 2', '32.2', '40.5']
      ])
    }
  };
}

function createLegSincHtml(linesCount = 2): string {
  const items = Array.from({ length: linesCount }, (_, index) => {
    const start = (21.8 + index).toFixed(1);
    const end = (31.1 + index).toFixed(1);
    const text = `Linha ${index + 1}`;

    return `
      <li class="lineItem">
        <input class="time start" rel="${start}" />
        <input class="time end" rel="${end}" />
        <input class="legenda" value="${text}" />
      </li>
    `;
  }).join('');

  return `
    <html>
      <body>
        <form id="leg_sinc">
          <input type="hidden" name="song_id" value="111" />
          <input type="hidden" name="video_id" value="222" />
          <input type="hidden" name="subtitle_id" value="333" />
          <ul id="lsin_ls">${items}</ul>
        </form>
      </body>
    </html>
  `;
}

describe('GetSyncedLyricsUseCase', () => {
  it('retorna linhas públicas sem exigir login (regressão do gate de autenticação)', async () => {
    const httpClient = createHttpClientMock();
    const useCase = new GetSyncedLyricsUseCase(httpClient);

    vi.mocked(httpClient.get)
      .mockResolvedValueOnce({
        status: 200,
        data: createPublicPageWithSubtitleMeta()
      })
      .mockResolvedValueOnce({
        status: 200,
        data: createSubtitlePayload()
      });

    const result = await useCase.execute({
      url: 'https://www.letras.mus.br/casa-worship/a-casa-e-sua/'
    });

    expect(result.lines).toHaveLength(2);
    expect(result.video_url).toBe('https://www.youtube.com/watch?v=5QHF5OQeFOs');
    expect(result.hidden).toBeNull();
    expect(vi.mocked(httpClient.get).mock.calls[1]?.[0]).toBe(
      'https://www.letras.mus.br/api/v2/subtitle/123456/5QHF5OQeFOs/'
    );
    expect(vi.mocked(httpClient.getCookies)).not.toHaveBeenCalled();
    expect(vi.mocked(httpClient.postJson)).not.toHaveBeenCalled();
  });

  it('usa fallback do HTML sincronizado quando metadados públicos de subtitle não existem', async () => {
    const httpClient = createHttpClientMock();
    const useCase = new GetSyncedLyricsUseCase(httpClient);

    vi.mocked(httpClient.get)
      .mockResolvedValueOnce({
        status: 200,
        data: createPublicPageWithContributionMeta()
      })
      .mockResolvedValueOnce({
        status: 200,
        data: createLegSincHtml()
      });

    const result = await useCase.execute({
      url: 'https://www.letras.mus.br/casa-worship/a-casa-e-sua/'
    });

    expect(result.lines).toHaveLength(2);
    expect(result.hidden).toEqual({ song_id: '111', video_id: '222', subtitle_id: '333' });
    expect(vi.mocked(httpClient.get).mock.calls[1]?.[0]).toBe(
      'https://www.letras.mus.br/contribuicoes/corrigir_legenda/casa-worship/a-casa-e-sua/5QHF5OQeFOs/'
    );
  });

  it('usa ID numérico quando URL é slug para consultar subtitle público (regressão ariana-grande)', async () => {
    const httpClient = createHttpClientMock();
    const useCase = new GetSyncedLyricsUseCase(httpClient);

    vi.mocked(httpClient.get)
      .mockResolvedValueOnce({
        status: 200,
        data: createPublicPageWithSlugUrlAndNumericIdMeta()
      })
      .mockResolvedValueOnce({
        status: 200,
        data: {
          Original: {
            VideoID: 'gl1aHhXnN1k',
            Subtitle: JSON.stringify([
              ['Thought I\'d end up with Sean', '46.8', '49.0'],
              ['But he wasn\'t a match', '49.1', '51.2']
            ])
          }
        }
      });

    const result = await useCase.execute({
      url: 'https://www.letras.mus.br/ariana-grande/thank-u-next/'
    });

    expect(result.lines).toHaveLength(2);
    expect(result.video_url).toBe('https://www.youtube.com/watch?v=gl1aHhXnN1k');
    expect(vi.mocked(httpClient.get).mock.calls[1]?.[0]).toBe(
      'https://www.letras.mus.br/api/v2/subtitle/3074298/gl1aHhXnN1k/'
    );
  });

  it('usa lista de vídeos candidatos quando YoutubeID inicial está vazio (regressão linkin-park)', async () => {
    const httpClient = createHttpClientMock();
    const useCase = new GetSyncedLyricsUseCase(httpClient);

    vi.mocked(httpClient.get)
      .mockResolvedValueOnce({
        status: 200,
        data: createPublicPageWithEmptyYoutubeAndNumericSong()
      })
      .mockResolvedValueOnce({
        status: 200,
        data: ['rKdgl8OUKpk', 'SdvWgoWnnQM']
      })
      .mockResolvedValueOnce({
        status: 200,
        data: {
          Original: {
            VideoID: 'rKdgl8OUKpk',
            Subtitle: JSON.stringify([
              ['I watch how the moon sits in the sky', '10.0', '13.0'],
              ['In the dark night, shining with the light from the sun', '13.2', '18.0']
            ])
          }
        }
      });

    const result = await useCase.execute({
      url: 'https://www.letras.mus.br/linkin-park/65985/'
    });

    expect(result.lines).toHaveLength(2);
    expect(result.video_url).toBe('https://www.youtube.com/watch?v=rKdgl8OUKpk');
    expect(vi.mocked(httpClient.get).mock.calls[1]?.[0]).toBe('https://www.letras.mus.br/api/v2/subtitle/65985/');
    expect(vi.mocked(httpClient.get).mock.calls[2]?.[0]).toBe(
      'https://www.letras.mus.br/api/v2/subtitle/65985/rKdgl8OUKpk/'
    );
  });

  it('aceita URL de contribuição e resolve para página pública antes de consultar subtitle público', async () => {
    const httpClient = createHttpClientMock();
    const useCase = new GetSyncedLyricsUseCase(httpClient);

    vi.mocked(httpClient.get)
      .mockResolvedValueOnce({
        status: 200,
        data: createPublicPageWithSubtitleMeta()
      })
      .mockResolvedValueOnce({
        status: 200,
        data: createSubtitlePayload()
      });

    await useCase.execute({
      url: 'https://www.letras.mus.br/contribuicoes/corrigir_legenda/casa-worship/a-casa-e-sua/5QHF5OQeFOs/'
    });

    expect(vi.mocked(httpClient.get).mock.calls[0]?.[0]).toBe(
      'https://www.letras.mus.br/casa-worship/a-casa-e-sua/'
    );
  });

  it('retorna 404 quando endpoint público não possui linhas válidas', async () => {
    const httpClient = createHttpClientMock();
    const useCase = new GetSyncedLyricsUseCase(httpClient);

    vi.mocked(httpClient.get)
      .mockResolvedValueOnce({
        status: 200,
        data: createPublicPageWithSubtitleMeta()
      })
      .mockResolvedValueOnce({
        status: 200,
        data: { data: { subtitles: { editar: [] } } }
      });

    await expect(
      useCase.execute({
        url: 'https://www.letras.mus.br/casa-worship/a-casa-e-sua/'
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('retorna 502 quando endpoint público falha', async () => {
    const httpClient = createHttpClientMock();
    const useCase = new GetSyncedLyricsUseCase(httpClient);

    vi.mocked(httpClient.get)
      .mockResolvedValueOnce({
        status: 200,
        data: createPublicPageWithSubtitleMeta()
      })
      .mockResolvedValueOnce({
        status: 503,
        data: {}
      });

    await expect(
      useCase.execute({
        url: 'https://www.letras.mus.br/casa-worship/a-casa-e-sua/'
      })
    ).rejects.toMatchObject({ statusCode: 502 });
  });

  it('retorna 404 quando fallback de contribuição responde página de login', async () => {
    const httpClient = createHttpClientMock();
    const useCase = new GetSyncedLyricsUseCase(httpClient);

    vi.mocked(httpClient.get)
      .mockResolvedValueOnce({
        status: 200,
        data: createPublicPageWithContributionMeta()
      })
      .mockResolvedValueOnce({
        status: 200,
        data: `
          <html>
            <body>
              <form id="ccid_form" action="/contribuicoes/entrar/">
                <input name="email" />
                <input name="password" type="password" />
                <button type="submit">Entrar</button>
              </form>
            </body>
          </html>
        `
      });

    await expect(
      useCase.execute({
        url: 'https://www.letras.mus.br/casa-worship/a-casa-e-sua/'
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('retorna 404 quando página pública da música não existe', async () => {
    const httpClient = createHttpClientMock();
    const useCase = new GetSyncedLyricsUseCase(httpClient);

    vi.mocked(httpClient.get).mockResolvedValueOnce({
      status: 404,
      data: '<html></html>'
    });

    await expect(
      useCase.execute({
        url: 'https://www.letras.mus.br/casa-worship/a-casa-e-sua/'
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('retorna 400 para URL inválida', async () => {
    const httpClient = createHttpClientMock();
    const useCase = new GetSyncedLyricsUseCase(httpClient);

    await expect(
      useCase.execute({
        url: 'url-invalida'
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
