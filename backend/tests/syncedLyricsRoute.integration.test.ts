import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

function createLegSincHtml(linesCount = 22): string {
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

function createPublicPageWithUiLyricScript(): string {
  return `
    <html>
      <body>
        <script>
          _omq.push(['ui/lyric', {
            "DNS":"felipe-rodrigues",
            "URL":"tudo-e-perda",
            "YoutubeID":"qxzQR5uwWsk"
          }]);
        </script>
      </body>
    </html>
  `;
}

const { mockHttpClient } = vi.hoisted(() => ({
  mockHttpClient: {
    postForm: vi.fn(),
    postJson: vi.fn(),
    get: vi.fn(),
    getCookies: vi.fn()
  }
}));

vi.mock('../src/shared/infra/http/letras-http.client', () => ({
  letrasHttpClient: mockHttpClient
}));

import { app } from '../src/app';

describe('GET /api/lyrics/synced (integration)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('retorna envelope success/data/metadata com 22 linhas extraídas', async () => {
    mockHttpClient.getCookies
      .mockResolvedValueOnce(['session=abc'])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    mockHttpClient.postJson.mockResolvedValueOnce({
      status: 200,
      data: {
        data: {
          viewer: {
            isSessionValid: true
          }
        }
      },
      headers: {}
    });

    mockHttpClient.get
      .mockResolvedValueOnce({
        status: 200,
        data: createPublicPageWithUiLyricScript(),
        headers: {
          'content-length': '1500'
        }
      })
      .mockResolvedValueOnce({
        status: 200,
        data: createLegSincHtml(22),
        headers: {
          'content-length': '9500'
        }
      });

    const response = await request(app)
      .get('/api/lyrics/synced')
      .query({
        url: 'https://www.letras.mus.br/felipe-rodrigues/tudo-e-perda/'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Legenda sincronizada extraída com sucesso.');
    expect(Array.isArray(response.body.data.lines)).toBe(true);
    expect(response.body.data.lines).toHaveLength(22);
    expect(response.body.data.lines[0]).toEqual({ start: '21.8', end: '31.1', text: 'Linha 1' });
    expect(response.body.data.video_url).toBe('https://www.youtube.com/watch?v=222');
    expect(response.body.metadata).toBeDefined();
    expect(typeof response.body.metadata.timestamp).toBe('string');
    expect(response.body.metadata.path).toBe('/api/lyrics/synced');
    expect(response.body.metadata.hidden).toEqual({ song_id: '111', video_id: '222', subtitle_id: '333' });
  });

  it('retorna erro estruturado quando query url não é enviada', async () => {
    const response = await request(app)
      .get('/api/lyrics/synced');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('APP_ERROR');
    expect(response.body.error.message).toContain('Parâmetro "url" é obrigatório');
  });

  it('retorna erro estruturado quando sessão não está autenticada', async () => {
    mockHttpClient.getCookies
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    mockHttpClient.get.mockResolvedValueOnce({
      status: 200,
      data: createPublicPageWithUiLyricScript(),
      headers: {
        'content-length': '1500'
      }
    });

    const response = await request(app)
      .get('/api/lyrics/synced')
      .query({
        url: 'https://www.letras.mus.br/felipe-rodrigues/tudo-e-perda/'
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('AUTH_SESSION_EXPIRED');
    expect(response.body.error.message).toContain('Sessão não autenticada');
  });
});
