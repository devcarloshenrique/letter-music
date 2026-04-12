import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../../../shared/errors/app-error';
import type { IScrapingProvider } from '../../../shared/providers/scraping/iser-scraping.provider';
import { GetLyricsUseCase } from './get-lyrics.usecase';

function createProviderMock(): IScrapingProvider {
  return {
    scrapeLyrics: vi.fn()
  };
}

describe('GetLyricsUseCase', () => {
  it('retorna letra formatada quando URL é válida', async () => {
    const provider = createProviderMock();
    const useCase = new GetLyricsUseCase(provider);

    vi.mocked(provider.scrapeLyrics).mockResolvedValueOnce({
      title: 'Porque Ele Vive - 545',
      artist: 'Harpa Cristã',
      stanzas: ['Linha 1\nLinha 2', 'Linha 3']
    });

    const output = await useCase.execute({
      url: 'https://www.letras.mus.br/harpa-crista/853769/'
    });

    expect(output.title).toBe('Porque Ele Vive - 545');
    expect(output.artist).toBe('Harpa Cristã');
    expect(output.stanzas).toHaveLength(2);
    expect(output.lyrics).toContain('Linha 1');
  });

  it('lança AppError 400 para domínio inválido', async () => {
    const provider = createProviderMock();
    const useCase = new GetLyricsUseCase(provider);

    await expect(
      useCase.execute({
        url: 'https://google.com/song/123'
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
