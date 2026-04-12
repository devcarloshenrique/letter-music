export const LETRAS_BASE_URL = 'https://www.letras.mus.br/';
export const ACCOUNTS_LETRAS_BASE_URL = 'https://accounts.letras.mus.br/';
export const ACCOUNTS_CIFRACLUB_BASE_URL = 'https://accounts.cifraclub.com.br/';
export const ACCOUNTS_GRAPHQL_URL = 'https://accounts.letras.mus.br/v2/graphql';

export const LETRAS_BROWSER_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  Referer: LETRAS_BASE_URL,
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  Origin: LETRAS_BASE_URL,
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
});
