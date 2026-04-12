/**
 * @deprecated Utilitário legado. A validação principal agora vive no `GetLyricsUseCase`.
 */
export function parseAndValidateLetrasUrl(rawUrl: string): URL {
  return new URL(rawUrl);
}