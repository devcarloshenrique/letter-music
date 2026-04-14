/**
 * @deprecated Este arquivo é mantido apenas para compatibilidade com código legado.
 * Use `GetLyricsUseCase` diretamente em   `src/features/lyrics/get-lyrics/get-lyrics.usecase.ts`.
 */
export async function scrapeLyricsFromUrl(_url: URL): Promise<never> {
  throw new Error('letrasScraper.scrapeLyricsFromUrl is deprecated. Use GetLyricsUseCase instead.');
}