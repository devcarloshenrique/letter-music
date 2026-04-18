import { describe, expect, it, vi } from 'vitest';
import type { ILyricsSearchProvider } from '../../../shared/providers/scraping/iser-scraping.provider';
import { GetLyricsUseCase } from './get-lyrics.usecase';

function createProviderMock(): ILyricsSearchProvider {
  return {
    searchLyrics: vi.fn()
  };
}

describe('GetLyricsUseCase', () => {
  it('retorna músicas quando busca é válida', async () => {
    const provider = createProviderMock();
    const useCase = new GetLyricsUseCase(provider);

    vi.mocked(provider.searchLyrics).mockResolvedValueOnce({
      results: [
        {
          id: 'superman',
          title: 'Superman',
          artist: 'Eminem',
          preview: 'Música do Eminem no Letras.',
          url: 'https://www.letras.mus.br/eminem/superman/'
        }
      ],
      
    });

    const output = await useCase.execute({
      q: 'eminem superman',
      page: 2
    });

    expect(output.page).toBe(2);
    expect(output.pageSize).toBe(10);
    expect(output.totalPages).toBe(1);
    
    
    
    expect(output.songs).toHaveLength(1);
    expect(output.songs[0]?.url).toBe('https://www.letras.mus.br/eminem/superman/');
  });

  it('filtra links inválidos e duplicados', async () => {
    const provider = createProviderMock();
    const useCase = new GetLyricsUseCase(provider);

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
      ],
      
    });

    const output = await useCase.execute({ q: 'eminem', page: 1 });

    expect(output.songs).toHaveLength(1);
    expect(output.songs[0]?.title).toBe('Superman');
  });

  it('executa fallback quando primeira tentativa não retorna resultados', async () => {
    const provider = createProviderMock();
    const useCase = new GetLyricsUseCase(provider);

    vi.mocked(provider.searchLyrics)
      .mockResolvedValueOnce({
        results: [],
        
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
        ],
        
      });

    const output = await useCase.execute({ q: 'eminem', page: 3 });

    expect(output.songs).toHaveLength(1);
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

  it('expõe totalPages como quantidade de itens retornados', async () => {
    const provider = createProviderMock();
    const useCase = new GetLyricsUseCase(provider);

    vi.mocked(provider.searchLyrics).mockResolvedValueOnce({
      results: [
        {
          id: 'song',
          title: 'Song',
          artist: 'Eminem',
          preview: 'Desc',
          url: 'https://www.letras.mus.br/eminem/song/'
        }
      ],
      
    });

    const output = await useCase.execute({ q: 'eminem', page: 2 });
    expect(output.totalPages).toBe(1);
  });

  it('lança AppError 400 quando q está ausente', async () => {
    const provider = createProviderMock();
    const useCase = new GetLyricsUseCase(provider);

    await expect(useCase.execute({ q: '' })).rejects.toMatchObject({ statusCode: 400 });
  });

  it('lança AppError 400 para página menor que 1', async () => {
    const provider = createProviderMock();
    const useCase = new GetLyricsUseCase(provider);

    await expect(
      useCase.execute({
        q: 'eminem',
        page: 0
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('não retorna erro para página acima de 10', async () => {
    const provider = createProviderMock();
    const useCase = new GetLyricsUseCase(provider);

    vi.mocked(provider.searchLyrics).mockResolvedValueOnce({
      results: []
    });
    vi.mocked(provider.searchLyrics).mockResolvedValueOnce({
      results: []
    });

    const output = await useCase.execute({
      q: 'eminem',
      page: 11
    });

    expect(output.songs).toHaveLength(0);
    expect(output.page).toBe(11);
  });

  it('retorna página vazia sem erro quando não há mais resultados em páginas posteriores', async () => {
    const provider = createProviderMock();
    const useCase = new GetLyricsUseCase(provider);

    vi.mocked(provider.searchLyrics).mockResolvedValueOnce({
      results: []
    });
    vi.mocked(provider.searchLyrics).mockResolvedValueOnce({
      results: []
    });

    const output = await useCase.execute({
      q: 'eminem',
      page: 2
    });

    expect(output.songs).toHaveLength(0);
    expect(output.page).toBe(2);
    expect(output.pageSize).toBe(10);
  });

  it('retorna 404 quando não encontra resultados nem no fallback', async () => {
    const provider = createProviderMock();
    const useCase = new GetLyricsUseCase(provider);

    vi.mocked(provider.searchLyrics)
      .mockResolvedValueOnce({
        results: [],
        
      })
      .mockResolvedValueOnce({
        results: [],
        
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
    const useCase = new GetLyricsUseCase(provider);

    vi.mocked(provider.searchLyrics).mockRejectedValueOnce(new Error('timeout'));

    await expect(
      useCase.execute({
        q: 'eminem',
        page: 1
      })
    ).rejects.toMatchObject({ statusCode: 502 });
  });
});
