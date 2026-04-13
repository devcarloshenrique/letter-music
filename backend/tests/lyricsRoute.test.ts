import request from 'supertest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { app } from '../src/app';

vi.mock('axios');

const mockedAxios = vi.mocked(axios, true);

describe('GET /api/lyrics', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('retorna a letra quando URL é válida e HTML contém lyric-original', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: `
        <html>
          <body>
            <h1>Porque Ele Vive - 545</h1>
            <a class="title-secondary"><h2>Harpa Cristã</h2></a>
            <div class="lyric-original">
              <p>Deus enviou Seu Filho amado<br/>Pra me salvar e perdoar</p>
              <p>Porque Ele vive, posso crer no amanhã</p>
            </div>
          </body>
        </html>
      `
    });

    const response = await request(app)
      .get('/api/lyrics')
      .query({ url: 'https://www.letras.mus.br/harpa-crista/853769/' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Letra extraída com sucesso.');
    expect(response.body.data.title).toBe('Porque Ele Vive - 545');
    expect(response.body.data.artist).toBe('Harpa Cristã');
    expect(response.body.data.stanzas).toHaveLength(2);
    expect(response.body.data.lyrics).toContain('Deus enviou Seu Filho amado');
    expect(response.body.metadata.path).toBe('/api/lyrics');
  });

  it('retorna 400 para URL inválida', async () => {
    const response = await request(app)
      .get('/api/lyrics')
      .query({ url: 'https://google.com/song/123' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('APP_ERROR');
    expect(response.body.error.message).toContain('domínio letras.mus.br');
  });

  it('retorna 404 quando não encontra bloco de letra', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: '<html><body><h1>Sem letra</h1></body></html>'
    });

    const response = await request(app)
      .get('/api/lyrics')
      .query({ url: 'https://www.letras.mus.br/harpa-crista/853769/' });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('APP_ERROR');
    expect(response.body.error.message).toContain('Letra não encontrada');
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