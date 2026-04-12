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

function createLegSincHtml(linesCount = 22): string {
  const items = Array.from({ length: linesCount }, (_, index) => {
    const start = (21.8 + index).toFixed(1);
    const end = (31.1 + index).toFixed(1);
    const text = `Linha ${index + 1}`;
    const useSpanFallback = index === 0;

    return `
      <li class="lineItem">
        <input class="time start" rel="${start}" />
        <input class="time end" rel="${end}" />
        <input class="legenda" value="${useSpanFallback ? '' : text}" />
        ${useSpanFallback ? `<span class="lsin_c3">${text}</span>` : ''}
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
          <ul id="lsin_ls">
            ${items}
          </ul>
        </form>
      </body>
    </html>
  `;
}

describe('GetSyncedLyricsUseCase', () => {
  it('extrai 22 linhas do #leg_sinc usando rel/value e captura hidden metadata', async () => {
    const httpClient = createHttpClientMock();
    const useCase = new GetSyncedLyricsUseCase(httpClient);

    vi.mocked(httpClient.getCookies)
      .mockResolvedValueOnce(['login=123'])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    vi.mocked(httpClient.postJson).mockResolvedValueOnce({
      status: 200,
      data: {
        data: {
          viewer: {
            isSessionValid: true
          }
        }
      }
    });
    vi.mocked(httpClient.get).mockResolvedValueOnce({
      status: 200,
      data: createLegSincHtml(22)
    });

    const result = await useCase.execute({
      url: 'https://www.letras.mus.br/contribuicoes/corrigir_legenda/felipe-rodrigues/tudo-e-perda/qxzQR5uwWsk/'
    });

    expect(result.lines).toHaveLength(22);
    expect(result.lines[0]).toEqual({ start: '21.8', end: '31.1', text: 'Linha 1' });
    expect(result.lines[21]).toEqual({ start: '42.8', end: '52.1', text: 'Linha 22' });
    expect(result.hidden).toEqual({ song_id: '111', video_id: '222', subtitle_id: '333' });
  });

  it('retorna unauthorized quando HTML indica redirecionamento para login', async () => {
    const httpClient = createHttpClientMock();
    const useCase = new GetSyncedLyricsUseCase(httpClient);

    vi.mocked(httpClient.getCookies)
      .mockResolvedValueOnce(['login=123'])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    vi.mocked(httpClient.postJson).mockResolvedValueOnce({
      status: 200,
      data: {
        data: {
          viewer: {
            isSessionValid: true
          }
        }
      }
    });
    vi.mocked(httpClient.get).mockResolvedValueOnce({
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
        url: 'https://www.letras.mus.br/contribuicoes/corrigir_legenda/felipe-rodrigues/tudo-e-perda/qxzQR5uwWsk/'
      })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('retorna unauthorized quando não há cookies de sessão em nenhum domínio', async () => {
    const httpClient = createHttpClientMock();
    const useCase = new GetSyncedLyricsUseCase(httpClient);

    vi.mocked(httpClient.getCookies)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    await expect(
      useCase.execute({
        url: 'https://www.letras.mus.br/contribuicoes/corrigir_legenda/felipe-rodrigues/tudo-e-perda/qxzQR5uwWsk/'
      })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('retorna 404 quando HTML autenticado não contém o bloco #leg_sinc esperado', async () => {
    const httpClient = createHttpClientMock();
    const useCase = new GetSyncedLyricsUseCase(httpClient);

    vi.mocked(httpClient.getCookies)
      .mockResolvedValueOnce(['login=123'])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    vi.mocked(httpClient.postJson).mockResolvedValueOnce({
      status: 200,
      data: {
        data: {
          viewer: {
            isSessionValid: true
          }
        }
      }
    });

    vi.mocked(httpClient.get).mockResolvedValueOnce({
      status: 200,
      data: `
        <html>
          <body>
            <div>sem bloco de legenda sincronizada</div>
          </body>
        </html>
      `
    });

    await expect(
      useCase.execute({
        url: 'https://www.letras.mus.br/contribuicoes/corrigir_legenda/felipe-rodrigues/tudo-e-perda/qxzQR5uwWsk/'
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('extrai linhas do payload ui/subtitles quando lista do #lsin_ls não está populada', async () => {
    const httpClient = createHttpClientMock();
    const useCase = new GetSyncedLyricsUseCase(httpClient);

    vi.mocked(httpClient.getCookies)
      .mockResolvedValueOnce(['login=123'])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    vi.mocked(httpClient.postJson).mockResolvedValueOnce({
      status: 200,
      data: {
        data: {
          viewer: {
            isSessionValid: true
          }
        }
      }
    });

    vi.mocked(httpClient.get).mockResolvedValueOnce({
      status: 200,
      data: `
        <html>
          <body>
            <form id="leg_sinc">
              <ul id="lsin_ls"><li id="lsin_h">header</li></ul>
            </form>
            <script>
              _omq.push(['ui/subtitles', {"editar":[["Linha 1","21.8","31.1"],["Linha 2","32.2","40.5"]]}]);
            </script>
          </body>
        </html>
      `,
      headers: {
        'content-length': '3200'
      }
    });

    const result = await useCase.execute({
      url: 'https://www.letras.mus.br/contribuicoes/corrigir_legenda/felipe-rodrigues/tudo-e-perda/qxzQR5uwWsk/'
    });

    expect(result.lines).toEqual(
      expect.arrayContaining([
        { start: '21.8', end: '31.1', text: 'Linha 1' },
        { start: '32.2', end: '40.5', text: 'Linha 2' }
      ])
    );
  });

  it('retorna unauthorized quando sessão está inválida no accounts/graphql', async () => {
    const httpClient = createHttpClientMock();
    const useCase = new GetSyncedLyricsUseCase(httpClient);

    vi.mocked(httpClient.getCookies)
      .mockResolvedValueOnce(['login=123'])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    vi.mocked(httpClient.postJson).mockResolvedValueOnce({
      status: 200,
      data: {
        data: {
          viewer: {
            isSessionValid: false
          }
        }
      }
    });

    await expect(
      useCase.execute({
        url: 'https://www.letras.mus.br/contribuicoes/corrigir_legenda/felipe-rodrigues/tudo-e-perda/qxzQR5uwWsk/'
      })
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});
