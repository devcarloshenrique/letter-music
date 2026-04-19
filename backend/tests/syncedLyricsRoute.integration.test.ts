import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

function createPublicPageWithSubtitleMeta(): string {
  return `
    <html>
      <body>
        <script>
          _omq.push(['ui/player', {
            "DNS":"felipe-rodrigues",
            "URL":"12772",
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

  it('retorna envelope success/data/metadata sem exigir sessão', async () => {
    mockHttpClient.get
      .mockResolvedValueOnce({
        status: 200,
        data: createPublicPageWithSubtitleMeta(),
        headers: {
          'content-length': '1500'
        }
      })
      .mockResolvedValueOnce({
        status: 200,
        data: {
          Original: {
            VideoID: 'qxzQR5uwWsk',
            Subtitle: JSON.stringify([
              ['Linha 1', '21.8', '31.1'],
              ['Linha 2', '32.2', '40.5']
            ])
          }
        },
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
    expect(response.body.data.lines).toHaveLength(2);
    expect(response.body.data.lines[0]).toEqual({ start: '21.8', end: '31.1', text: 'Linha 1' });
    expect(response.body.data.video_url).toBe('https://www.youtube.com/watch?v=qxzQR5uwWsk');
    expect(response.body.metadata).toBeDefined();
    expect(typeof response.body.metadata.timestamp).toBe('string');
    expect(response.body.metadata.path).toBe('/api/lyrics/synced');
    expect(response.body.metadata.hidden).toBeNull();
    expect(mockHttpClient.getCookies).not.toHaveBeenCalled();
    expect(mockHttpClient.postJson).not.toHaveBeenCalled();
  });

  it('retorna erro estruturado quando query url não é enviada', async () => {
    const response = await request(app)
      .get('/api/lyrics/synced');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('APP_ERROR');
    expect(response.body.error.message).toContain('Parâmetro "url" é obrigatório');
  });

  it('retorna erro estruturado quando subtitle público não existe', async () => {
    mockHttpClient.get
      .mockResolvedValueOnce({
        status: 200,
        data: createPublicPageWithSubtitleMeta(),
        headers: {
          'content-length': '1500'
        }
      })
      .mockResolvedValueOnce({
        status: 404,
        data: {},
        headers: {
          'content-length': '0'
        }
      });

    const response = await request(app)
      .get('/api/lyrics/synced')
      .query({
        url: 'https://www.letras.mus.br/felipe-rodrigues/tudo-e-perda/'
      });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('APP_ERROR');
    expect(response.body.error.message).toContain('Não foi possível extrair legendas sincronizadas da resposta pública');
  });
});
