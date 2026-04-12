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
    expect(response.body.title).toBe('Porque Ele Vive - 545');
    expect(response.body.artist).toBe('Harpa Cristã');
    expect(response.body.stanzas).toHaveLength(2);
    expect(response.body.lyrics).toContain('Deus enviou Seu Filho amado');
  });

  it('retorna 400 para URL inválida', async () => {
    const response = await request(app)
      .get('/api/lyrics')
      .query({ url: 'https://google.com/song/123' });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('domínio letras.mus.br');
  });

  it('retorna 404 quando não encontra bloco de letra', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: '<html><body><h1>Sem letra</h1></body></html>'
    });

    const response = await request(app)
      .get('/api/lyrics')
      .query({ url: 'https://www.letras.mus.br/harpa-crista/853769/' });

    expect(response.status).toBe(404);
    expect(response.body.error).toContain('Letra não encontrada');
  });
});

describe('Swagger docs', () => {
  it('retorna a especificação OpenAPI em JSON', async () => {
    const response = await request(app).get('/openapi.json');

    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe('3.0.3');
    expect(response.body.paths['/api/lyrics']).toBeDefined();
  });
});