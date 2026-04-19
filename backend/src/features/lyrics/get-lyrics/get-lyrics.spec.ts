import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../../../shared/errors/app-error';
import type { ILyricsSearchProvider } from '../../../shared/providers/scraping/iser-scraping.provider';
import { GetLyricsUseCase, type ISyncedLyricsAvailabilityProvider } from './get-lyrics.usecase';

function createProviderMock(): ILyricsSearchProvider {
  return {
    searchLyrics: vi.fn()
  };
}

function createSyncedLyricsAvailabilityProviderMock(): ISyncedLyricsAvailabilityProvider {
  return {
    hasSyncedLyrics: vi.fn()
  };
}

function createUseCase(
  provider: ILyricsSearchProvider,
  syncedLyricsAvailabilityProvider?: ISyncedLyricsAvailabilityProvider
): GetLyricsUseCase {
  const useCase = new GetLyricsUseCase(provider, syncedLyricsAvailabilityProvider);
  vi.spyOn(useCase as any, 'waitRetryDelay').mockResolvedValue(undefined);
  return useCase;
}

describe('GetLyricsUseCase', () => {
  it('retorna músicas quando busca é válida', async () => {
    const provider = createProviderMock();
    const useCase = createUseCase(provider);

    vi.mocked(provider.searchLyrics).mockResolvedValueOnce({
      results: [
        {
          id: 'superman',
          title: 'Superman',
          artist: 'Eminem',
          preview: 'Música do Eminem no Letras.',
          url: 'https://www.letras.mus.br/eminem/superman/'
        }
      ]
    });

    const output = await useCase.execute({
      q: 'eminem superman',
      page: 2
    });

    expect(output.page).toBe(2);
    expect(output.pageSize).toBe(10);
    expect(output.totalPages).toBe(1);
    expect(output.skipped).toEqual([]);
    expect(output.songs).toHaveLength(1);
    expect(output.songs[0]?.url).toBe('https://www.letras.mus.br/eminem/superman/');
  });

  it('filtra links inválidos e duplicados', async () => {
    const provider = createProviderMock();
    const useCase = createUseCase(provider);

    vi.mocked(provider.searchLyrics).mockResolvedValueOnce({
      results: [
        {
          id: 'superman',
          title: 'Superman',
          artist: 'Eminem',
          preview: 'Música do Eminem no Letras.',
          url: 'https://www.letras.mus.br/eminem/superman/'
        },
        {
          id: 'superman-duplicada',
          title: 'Superman duplicada',
          artist: 'Eminem',
          preview: 'Mesmo link com hash',
          url: 'https://www.letras.mus.br/eminem/superman/#trecho'
        },
        {
          id: 'significado',
          title: 'Significado',
          artist: 'Eminem',
          preview: 'Página de significado',
          url: 'https://www.letras.mus.br/eminem/significado.html'
        },
        {
          id: 'artista',
          title: 'Artista',
          artist: 'Eminem',
          preview: 'Página de artista',
          url: 'https://www.letras.mus.br/eminem/'
        }
      ]
    });

    const output = await useCase.execute({ q: 'eminem', page: 1 });

    expect(output.songs).toHaveLength(1);
    expect(output.songs[0]?.title).toBe('Superman');
    expect(output.skipped).toEqual([]);
  });

  it('executa fallback quando primeira tentativa não retorna resultados', async () => {
    const provider = createProviderMock();
    const useCase = createUseCase(provider);

    vi.mocked(provider.searchLyrics)
      .mockResolvedValueOnce({
        results: []
      })
      .mockResolvedValueOnce({
        results: [
          {
            id: 'not-afraid',
            title: 'Not Afraid',
            artist: 'Eminem',
            preview: 'Resultado no fallback',
            url: 'https://www.letras.mus.br/eminem/not-afraid/'
          }
        ]
      });

    const output = await useCase.execute({ q: 'eminem', page: 3 });

    expect(output.songs).toHaveLength(1);
    expect(output.page).toBe(3);
    expect(output.skipped).toEqual([]);
    expect(provider.searchLyrics).toHaveBeenCalledTimes(2);
    expect(provider.searchLyrics).toHaveBeenNthCalledWith(1, {
      query: 'eminem',
      page: 3,
      fallback: false
    });
    expect(provider.searchLyrics).toHaveBeenNthCalledWith(2, {
      query: 'eminem',
      page: 3,
      fallback: true
    });
  });

  it('Cenário A: recupera na segunda tentativa da mesma página após erro 5xx', async () => {
    const provider = createProviderMock();
    const useCase = createUseCase(provider);

    vi.mocked(provider.searchLyrics)
      .mockRejectedValueOnce(new AppError('Falha temporária', 502))
      .mockResolvedValueOnce({
        results: [
          {
            id: 'without-me',
            title: 'Without Me',
            artist: 'Eminem',
            preview: 'Recuperado na segunda tentativa',
            url: 'https://www.letras.mus.br/eminem/without-me/'
          }
        ]
      });

    const output = await useCase.execute({ q: 'eminem', page: 4 });

    expect(output.page).toBe(4);
    expect(output.skipped).toEqual([]);
    expect(output.songs).toHaveLength(1);
    expect(provider.searchLyrics).toHaveBeenCalledTimes(2);
  });

  it('Cenário B: após 3 falhas 5xx pula para a próxima página com sucesso', async () => {
    const provider = createProviderMock();
    const useCase = createUseCase(provider);

    vi.mocked(provider.searchLyrics)
      .mockRejectedValueOnce(new AppError('Falha página 4 tentativa 1', 502))
      .mockRejectedValueOnce(new AppError('Falha página 4 tentativa 2', 502))
      .mockRejectedValueOnce(new AppError('Falha página 4 tentativa 3', 502))
      .mockResolvedValueOnce({
        results: [
          {
            id: 'cleanin-out-my-closet',
            title: "Cleanin' Out My Closet",
            artist: 'Eminem',
            preview: 'Resultado da página seguinte',
            url: 'https://www.letras.mus.br/eminem/cleanin-out-my-closet/'
          }
        ]
      });

    const output = await useCase.execute({ q: 'eminem', page: 4 });

    expect(output.page).toBe(5);
    expect(output.skipped).toEqual([4]);
    expect(output.songs).toHaveLength(1);
    expect(provider.searchLyrics).toHaveBeenCalledTimes(4);
  });

  it('Cenário C: retry em vazio falso recupera dados sem pular página', async () => {
    const provider = createProviderMock();
    const useCase = createUseCase(provider);

    vi.mocked(provider.searchLyrics)
      .mockResolvedValueOnce({
        results: []
      })
      .mockResolvedValueOnce({
        results: []
      })
      .mockResolvedValueOnce({
        results: [
          {
            id: 'real-slim-shady',
            title: 'The Real Slim Shady',
            artist: 'Eminem',
            preview: 'Recuperado após vazio falso',
            url: 'https://www.letras.mus.br/eminem/the-real-slim-shady/'
          }
        ]
      });

    const output = await useCase.execute({ q: 'eminem', page: 4 });

    expect(output.page).toBe(4);
    expect(output.skipped).toEqual([]);
    expect(output.songs).toHaveLength(1);
    expect(provider.searchLyrics).toHaveBeenCalledTimes(3);
  });

  it('retorna apenas músicas com legenda sincronizada disponível', async () => {
    const provider = createProviderMock();
    const syncedLyricsAvailabilityProvider = createSyncedLyricsAvailabilityProviderMock();
    const useCase = createUseCase(provider, syncedLyricsAvailabilityProvider);

    vi.mocked(provider.searchLyrics).mockResolvedValueOnce({
      results: [
        {
          id: 'superman',
          title: 'Superman',
          artist: 'Eminem',
          preview: 'Música do Eminem no Letras.',
          url: 'https://www.letras.mus.br/eminem/superman/'
        },
        {
          id: 'not-afraid',
          title: 'Not Afraid',
          artist: 'Eminem',
          preview: 'Outra música do Eminem no Letras.',
          url: 'https://www.letras.mus.br/eminem/not-afraid/'
        }
      ]
    });

    vi.mocked(syncedLyricsAvailabilityProvider.hasSyncedLyrics)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const output = await useCase.execute({ q: 'eminem', page: 1 });

    expect(output.songs).toHaveLength(1);
    expect(output.songs[0]?.title).toBe('Superman');
    expect(syncedLyricsAvailabilityProvider.hasSyncedLyrics).toHaveBeenNthCalledWith(
      1,
      'https://www.letras.mus.br/eminem/superman/'
    );
    expect(syncedLyricsAvailabilityProvider.hasSyncedLyrics).toHaveBeenNthCalledWith(
      2,
      'https://www.letras.mus.br/eminem/not-afraid/'
    );
  });

  it('executa fallback quando primeira tentativa só contém músicas sem legenda sincronizada', async () => {
    const provider = createProviderMock();
    const syncedLyricsAvailabilityProvider = createSyncedLyricsAvailabilityProviderMock();
    const useCase = createUseCase(provider, syncedLyricsAvailabilityProvider);

    vi.mocked(provider.searchLyrics)
      .mockResolvedValueOnce({
        results: [
          {
            id: 'superman',
            title: 'Superman',
            artist: 'Eminem',
            preview: 'Sem legenda sincronizada.',
            url: 'https://www.letras.mus.br/eminem/superman/'
          }
        ]
      })
      .mockResolvedValueOnce({
        results: [
          {
            id: 'not-afraid',
            title: 'Not Afraid',
            artist: 'Eminem',
            preview: 'Com legenda sincronizada.',
            url: 'https://www.letras.mus.br/eminem/not-afraid/'
          }
        ]
      });

    vi.mocked(syncedLyricsAvailabilityProvider.hasSyncedLyrics)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    const output = await useCase.execute({ q: 'eminem', page: 1 });

    expect(output.songs).toHaveLength(1);
    expect(output.songs[0]?.title).toBe('Not Afraid');
    expect(provider.searchLyrics).toHaveBeenCalledTimes(2);
    expect(provider.searchLyrics).toHaveBeenNthCalledWith(1, {
      query: 'eminem',
      page: 1,
      fallback: false
    });
    expect(provider.searchLyrics).toHaveBeenNthCalledWith(2, {
      query: 'eminem',
      page: 1,
      fallback: true
    });
  });

  it('retorna 502 quando a validação de legendas falha tecnicamente sem alternativas', async () => {
    const provider = createProviderMock();
    const syncedLyricsAvailabilityProvider = createSyncedLyricsAvailabilityProviderMock();
    const useCase = createUseCase(provider, syncedLyricsAvailabilityProvider);

    vi.mocked(provider.searchLyrics)
      .mockResolvedValueOnce({
        results: [
          {
            id: 'superman',
            title: 'Superman',
            artist: 'Eminem',
            preview: 'Falha técnica ao validar legenda.',
            url: 'https://www.letras.mus.br/eminem/superman/'
          }
        ]
      })
      .mockResolvedValueOnce({
        results: []
      });

    vi.mocked(syncedLyricsAvailabilityProvider.hasSyncedLyrics).mockRejectedValueOnce(
      new AppError('Falha técnica no provider de legenda.', 502)
    );

    await expect(useCase.execute({ q: 'eminem', page: 1 })).rejects.toMatchObject({
      statusCode: 502,
      message: 'Falha ao validar disponibilidade de legendas sincronizadas.'
    });
  });

  it('expõe totalPages como quantidade de itens retornados', async () => {
    const provider = createProviderMock();
    const useCase = createUseCase(provider);

    vi.mocked(provider.searchLyrics).mockResolvedValueOnce({
      results: [
        {
          id: 'song',
          title: 'Song',
          artist: 'Eminem',
          preview: 'Desc',
          url: 'https://www.letras.mus.br/eminem/song/'
        }
      ]
    });

    const output = await useCase.execute({ q: 'eminem', page: 2 });
    expect(output.totalPages).toBe(1);
    expect(output.skipped).toEqual([]);
  });

  it('lança AppError 400 quando q está ausente', async () => {
    const provider = createProviderMock();
    const useCase = createUseCase(provider);

    await expect(useCase.execute({ q: '' })).rejects.toMatchObject({ statusCode: 400 });
  });

  it('lança AppError 400 para página menor que 1', async () => {
    const provider = createProviderMock();
    const useCase = createUseCase(provider);

    await expect(
      useCase.execute({
        q: 'eminem',
        page: 0
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('não retorna erro para página acima de 10', async () => {
    const provider = createProviderMock();
    const useCase = createUseCase(provider);

    vi.mocked(provider.searchLyrics).mockResolvedValue({
      results: []
    });

    const output = await useCase.execute({
      q: 'eminem',
      page: 11
    });

    expect(output.songs).toHaveLength(0);
    expect(output.page).toBe(11);
    expect(output.skipped).toEqual([]);
  });

  it('retorna página vazia sem erro quando não há mais resultados em páginas posteriores', async () => {
    const provider = createProviderMock();
    const useCase = createUseCase(provider);

    vi.mocked(provider.searchLyrics).mockResolvedValue({
      results: []
    });

    const output = await useCase.execute({
      q: 'eminem',
      page: 2
    });

    expect(output.songs).toHaveLength(0);
    expect(output.page).toBe(5);
    expect(output.pageSize).toBe(10);
    expect(output.skipped).toEqual([2, 3, 4]);
  });

  it('retorna 404 quando não encontra resultados nem no fallback', async () => {
    const provider = createProviderMock();
    const useCase = createUseCase(provider);

    vi.mocked(provider.searchLyrics).mockResolvedValue({
      results: []
    });

    await expect(
      useCase.execute({
        q: 'consulta-inexistente',
        page: 1
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('lança AppError 502 quando provider falha tecnicamente', async () => {
    const provider = createProviderMock();
    const useCase = createUseCase(provider);

    vi.mocked(provider.searchLyrics).mockRejectedValue(new Error('timeout'));

    await expect(
      useCase.execute({
        q: 'eminem',
        page: 1
      })
    ).rejects.toMatchObject({ statusCode: 502 });
  });

  it('respeita o limite de 3 páginas extras por requisição em falhas técnicas', async () => {
    const provider = createProviderMock();
    const useCase = createUseCase(provider);

    vi.mocked(provider.searchLyrics).mockRejectedValue(new AppError('Falha técnica', 502));

    await expect(
      useCase.execute({
        q: 'eminem',
        page: 1
      })
    ).rejects.toMatchObject({ statusCode: 502 });

    expect(provider.searchLyrics).toHaveBeenCalledTimes(12);
  });

  it('interrompe no hard stop da página 7 sem tentar página 8', async () => {
    const provider = createProviderMock();
    const useCase = createUseCase(provider);

    vi.mocked(provider.searchLyrics).mockRejectedValue(new AppError('Falha técnica', 502));

    const output = await useCase.execute({
      q: 'eminem',
      page: 6
    });

    expect(output.songs).toHaveLength(0);
    expect(output.page).toBe(7);
    expect(output.skipped).toEqual([6]);
    expect(provider.searchLyrics).toHaveBeenCalledTimes(6);
  });
});
