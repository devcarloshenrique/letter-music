import axios from 'axios';
import * as cheerio from 'cheerio';
import {
  ILyricsSearchProvider,
  SearchLyricsInput,
  SearchLyricsOutput,
  ScrapedLyricsSearchResult,
} from './iser-scraping.provider';
import { AppError } from '../../errors/app-error';

const PAGE_SIZE = 10;
const SEARCH_BASE_URL = 'https://search.yahoo.com/search';
const SITE_FILTER = 'site:https://www.letras.mus.br/';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
];

const NON_SONG_SEGMENTS = new Set([
  'traducao',
  'traducoes',
  'significado',
  'video',
  'videos',
  'discografia',
  'biografia',
  'fotos',
  'blog',
  'noticias',
  'noticia',
  'top-musicas',
  'mais-tocadas',
  'lancamentos',
  'albuns',
  'playlists',
  'playlist',
]);

export class YahooScrapingProvider implements ILyricsSearchProvider {
  private userAgentCursor = 0;

  async searchLyrics(input: SearchLyricsInput): Promise<SearchLyricsOutput> {
    const page = input.page || 1;
    const { html } = await this.fetchSearchPage(input.query, page);
    const results = this.parseSearchResults(html);

    const dedupedByUrl = new Map<string, ScrapedLyricsSearchResult>();

    for (const item of results) {
      const normalizedUrl = this.normalizeUrl(item.url);
      if (!normalizedUrl || !this.isLikelySongUrl(normalizedUrl)) {
        continue;
      }

      if (!dedupedByUrl.has(normalizedUrl)) {
        dedupedByUrl.set(normalizedUrl, {
          id: this.extractIdFromUrl(normalizedUrl),
          title: item.title,
          artist: this.inferArtistFromUrl(normalizedUrl),
          preview: item.preview,
          url: normalizedUrl,
        });
      }
    }

    const songs = Array.from(dedupedByUrl.values()).slice(0, PAGE_SIZE);

    return {
      results: songs,
    };
  }

  private async fetchSearchPage(query: string, page: number): Promise<{ html: string }> {
    const baseUrl = this.buildSearchUrl(query, page);

    const response = await axios.get(baseUrl, {
      headers: {
        'User-Agent': this.pickUserAgent(),
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
      validateStatus: () => true,
    });

    const statusCode = response.status;
    const html = String(response.data || '');

    if (this.isCaptchaPage(html, statusCode)) {
      throw new AppError('O motor de busca retornou CAPTCHA. Tente novamente mais tarde.', 429);
    }

    if (statusCode < 200 || statusCode >= 300) {
      throw new AppError(`Falha ao buscar no buscador. HTTP ${statusCode}`, 502);
    }

    return { html };
  }

  private buildSearchQuery(query: string): string {
    if (/site\s*:\s*(https?:\/\/)?(www\.)?letras\.mus\.br/i.test(query)) {
      return query;
    }
    return `${query} ${SITE_FILTER}`;
  }

  private buildSearchUrl(query: string, page: number): string {
    const start = (page - 1) * PAGE_SIZE + 1;
    const q = encodeURIComponent(this.buildSearchQuery(query));
    return `${SEARCH_BASE_URL}?p=${q}&b=${start}`;
  }

  private pickUserAgent(): string {
    const selected = USER_AGENTS[this.userAgentCursor % USER_AGENTS.length] ?? USER_AGENTS[0];
    this.userAgentCursor = (this.userAgentCursor + 1) % USER_AGENTS.length;
    return selected;
  }

  private isCaptchaPage(html: string, statusCode: number): boolean {
    if (statusCode === 429 || statusCode === 503) return true;
    const text = html.toLowerCase();
    return (
      text.includes('our systems have detected unusual traffic') ||
      text.includes('nossos sistemas detectaram tráfego incomum') ||
      text.includes('detected unusual traffic from your computer network') ||
      text.includes('g-recaptcha') ||
      text.includes('/sorry/') ||
      text.includes('/httpservice/retry/enablejs')
    );
  }

  private parseSearchResults(html: string) {
    const $ = cheerio.load(html);
    const results: Array<{ title: string; url: string; preview: string }> = [];

    $('.algo-sr').each((_, container) => {
      const el = $(container);
      const linkTag = el.find('.compTitle a');
      const rawTitle = el.find('.compTitle h3.title').text() || linkTag.text();
      const title = this.normalizeTitle(rawTitle.replace(/^Letras de músicas.*?(?=[A-Z])/i, '').trim());

      const proxyUrl = linkTag.attr('href') || '';
      const match = proxyUrl.match(/\/RU=([^/]+)\//);
      let directUrl = match ? decodeURIComponent(match[1]) : proxyUrl;
      directUrl = this.resolveGoogleHref(directUrl) || directUrl;

      const preview = el.find('.compText').first().text().trim();

      if (title && directUrl) {
        results.push({ title, url: directUrl, preview });
      }
    });

    return results;
  }

  private normalizeTitle(rawTitle: string): string {
    const separator = ' - ';

    if (!rawTitle.includes(separator)) {
      return rawTitle;
    }

    const firstSegment = rawTitle.split(separator)[0]?.trim();
    return firstSegment || rawTitle;
  }

  private resolveGoogleHref(href: string): string | null {
    if (!href) return null;
    if (href.startsWith('/url?')) {
      const wrapper = new URL(`https://www.google.com${href}`);
      return wrapper.searchParams.get('q') || null;
    }
    if (href.startsWith('http://') || href.startsWith('https://')) return href;
    return null;
  }

  private normalizeUrl(urlString: string): string | null {
    let parsed: URL;
    try {
      parsed = new URL(urlString);
    } catch {
      return null;
    }

    const host = parsed.hostname.toLowerCase();
    if (host !== 'www.letras.mus.br' && host !== 'letras.mus.br') return null;

    parsed.protocol = 'https:';
    parsed.search = '';
    parsed.hash = '';

    const path = parsed.pathname.replace(/\/+$/, '');
    parsed.pathname = `${path || '/'}`;

    return parsed.toString().replace(/\/$/, '') + '/';
  }

  private isLikelySongUrl(urlString: string): boolean {
    let parsed: URL;
    try {
      parsed = new URL(urlString);
    } catch {
      return false;
    }

    const segments = parsed.pathname.split('/').filter(Boolean).map((s) => s.toLowerCase());
    if (segments.length !== 2) return false;

    const [artistSegment, songSegment] = segments;
    if (!artistSegment || !songSegment) return false;
    if (NON_SONG_SEGMENTS.has(artistSegment) || NON_SONG_SEGMENTS.has(songSegment)) return false;

    return true;
  }

  private inferArtistFromUrl(urlString: string): string {
    try {
      const parsed = new URL(urlString);
      const segments = parsed.pathname.split('/').filter(Boolean);
      if (!segments.length) return '';
      // Retorna o slug formatado
      return segments[0].replace(/-/g, ' ').trim().replace(/\b\w/g, l => l.toUpperCase());
    } catch {
      return '';
    }
  }

  private extractIdFromUrl(urlString: string): string {
    // Generate a pseudo HD ID or fetch from URL if possible. Usually Letras IDs are numbers for songs, but from URL we might just encode the slug.
    // The user requested: "id": "67581". Since Yahoo doesn't give Letras internal IDs, we can hash the URL or extract if available, but let's just make it a hash since we can't get the true ID easily, or just encode the slug.
    // Actually looking at the URL: 'https://www.letras.mus.br/50-cent/67581/'. Ah if it has the ID, Letras URL format is /artist-slug/song-slug/ or /artist-slug/ID/. 
    // Wait, the standard format is /artist/song/. We can just use the path as ID.
    try {
      const parsed = new URL(urlString);
      const segments = parsed.pathname.split('/').filter(Boolean);
      return segments.length === 2 ? segments[1] : Buffer.from(urlString).toString('base64');
    } catch {
      return 'unknown';
    }
  }
}
