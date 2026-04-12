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

    mockHttpClient.get.mockResolvedValueOnce({
      status: 200,
      data: createLegSincHtml(22),
      headers: {
        'content-length': '9500'
      }
    });

    const response = await request(app)
      .get('/api/lyrics/synced')
      .query({
        url: 'https://www.letras.mus.br/contribuicoes/corrigir_legenda/felipe-rodrigues/tudo-e-perda/qxzQR5uwWsk/'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data).toHaveLength(22);
    expect(response.body.data[0]).toEqual({ start: '21.8', end: '31.1', text: 'Linha 1' });
    expect(response.body.metadata).toBeDefined();
    expect(response.body.metadata.path).toBe('/api/lyrics/synced');
    expect(response.body.metadata.hidden).toEqual({ song_id: '111', video_id: '222', subtitle_id: '333' });
  });
});
