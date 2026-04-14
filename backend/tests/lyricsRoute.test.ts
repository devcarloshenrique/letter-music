import request from 'supertest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { app } from '../src/app';

const { searchLyricsMock } = vi.hoisted(() => ({
  searchLyricsMock: vi.fn()
}));

vi.mock('../src/shared/providers/scraping/playwright-scraping.provider', () => {
  class PlaywrightScrapingProvider {
    searchLyrics = searchLyricsMock;
  }

  return { PlaywrightScrapingProvider };
});

describe('GET /api/lyrics', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('retorna array de músicas quando q/page são válidos', async () => {
    searchLyricsMock.mockResolvedValueOnce({
      results: [
        {
          title: 'Superman',
          description: 'Música do Eminem no Letras.',
          url: 'https://www.letras.mus.br/eminem/superman/'
        }
      ]
    });

    const response = await request(app)
      .get('/api/lyrics')
      .query({ q: 'eminem', page: 2 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Busca realizada com sucesso.');
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].title).toBe('Superman');
    expect(response.body.data[0].url).toBe('https://www.letras.mus.br/eminem/superman/');
    expect(response.body.metadata.page).toBe(2);
    expect(response.body.metadata.pageSize).toBe(10);
    expect(response.body.metadata.totalPages).toBe(1);
    
    
    
    expect(response.body.metadata.path).toBe('/api/lyrics');
  });

  it('retorna 400 para query vazia', async () => {
    const response = await request(app).get('/api/lyrics').query({ q: '' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('APP_ERROR');
    expect(response.body.error.message).toContain('Parâmetro "q" é obrigatório');
  });

  it('retorna 400 para page fora da faixa', async () => {
    const response = await request(app).get('/api/lyrics').query({ q: 'eminem', page: 11 });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('APP_ERROR');
    expect(response.body.error.message).toContain('entre 1 e 10');
  });

  it('executa fallback quando primeira tentativa não encontra resultados', async () => {
    searchLyricsMock
      .mockResolvedValueOnce({
        results: []
      })
      .mockResolvedValueOnce({
        results: [
          {
            title: 'Not Afraid',
            description: 'Resultado no fallback',
            url: 'https://www.letras.mus.br/eminem/not-afraid/'
          }
        ]
      });

    const response = await request(app)
      .get('/api/lyrics')
      .query({ q: 'eminem', page: 4 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    
    
    expect(searchLyricsMock).toHaveBeenCalledTimes(2);
  });

  it('retorna 404 quando busca não encontra músicas', async () => {
    searchLyricsMock
      .mockResolvedValueOnce({
        results: []
      })
      .mockResolvedValueOnce({
        results: []
      });

    const response = await request(app)
      .get('/api/lyrics')
      .query({ q: 'consulta-inexistente', page: 1 });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('APP_ERROR');
    expect(response.body.error.message).toContain('Nenhuma música encontrada');
  });

  it('retorna 502 em falha técnica de scraping', async () => {
    searchLyricsMock.mockRejectedValueOnce(new Error('navigation timeout'));

    const response = await request(app).get('/api/lyrics').query({ q: 'eminem', page: 1 });

    expect(response.status).toBe(502);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('APP_ERROR');
    expect(response.body.error.message).toContain('Falha ao consultar resultados');
  });
});

describe('Swagger docs', () => {
  it('retorna a especificação OpenAPI em JSON', async () => {
    const response = await request(app).get('/openapi.json');

    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe('3.0.3');
    expect(response.body.paths['/api/lyrics']).toBeDefined();
  });

  it('retorna health no envelope padrao', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('API saudável.');
    expect(response.body.data).toEqual({ ok: true });
    expect(response.body.metadata.path).toBe('/health');
  });
});