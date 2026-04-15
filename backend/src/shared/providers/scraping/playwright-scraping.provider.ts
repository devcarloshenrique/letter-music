import { chromium } from 'playwright';
import type {
  ILyricsSearchProvider,
  ScrapedLyricsSearchResult,
  SearchLyricsOutput,
  SearchLyricsInput
} from './iser-scraping.provider';

const SEARCH_RESULT_SELECTOR = '.gsc-webResult.gsc-result';
const PAGE_BUTTON_SELECTOR = '.gsc-cursor-page';
const SEARCH_WAIT_TIMEOUT_MS = 12000;
const BROWSER_TIMEOUT_MS = 60000;
const MAX_RESULTS_PER_PAGE = 10;
const MAX_NAVIGABLE_PAGES = 10;
const SOLR_BASE_URL = 'https://solr.sscdn.co/letras';
const SOLR_MODELS = ['m1', 'm2', 'm3', 'm4', 'm5'] as const;

type SolrDoc = {
  art?: string;
  dns?: string;
  dnsge?: string;
  extra_txt?: string;
  full_txt?: string;
  ipl?: number;
  score?: number;
  t?: string | number;
  txt?: string;
  url?: string;
  urlal?: string;
};

type SolrPayload = {
  response?: {
    docs?: SolrDoc[];
    numFound?: number;
  };
};

function hasCaptchaOrBotBlock(html: string): boolean {
  const content = html.toLowerCase();
  return (
    content.includes('confirme que você não é um robô') ||
    content.includes('confirme que voce nao e um robo') ||
    content.includes('programmable-search/answer/6001359#captcha') ||
    content.includes('recaptcha') ||
    content.includes('unusual traffic')
  );
}

function buildSearchUrl(query: string): string {
  const encoded = encodeURIComponent(query);
  return `https://www.letras.mus.br/?q=${encoded}#gsc.tab=0&gsc.q=${encoded}&gsc.page=1`;
}

function parseSolrPayload(payload: string): SolrPayload {
  const trimmed = payload.trim();
  const openParen = trimmed.indexOf('(');
  const closeParen = trimmed.lastIndexOf(')');

  const jsonString =
    openParen >= 0 && closeParen > openParen
      ? trimmed.slice(openParen + 1, closeParen)
      : trimmed;

  return JSON.parse(jsonString) as SolrPayload;
}

function mapSolrDocToUrl(doc: SolrDoc): string | null {
  const type = String(doc.t ?? '');

  // Only return URLs for actual songs (Type 2).
  // Artists (1), Albums (3), Playlists (5), etc., are not valid for this endpoint.
  if (type === '2' && doc.dns && doc.url) {
    return `https://www.letras.mus.br/${doc.dns}/${doc.url}/`;
  }

  return null;
}

function mapSolrDocToResult(doc: SolrDoc): (ScrapedLyricsSearchResult & { score: number }) | null {
  const url = mapSolrDocToUrl(doc);
  if (!url) {
    return null;
  }

  const title = String(doc.txt ?? doc.full_txt ?? '').trim();
  if (!title) {
    return null;
  }

  const descriptionParts = [String(doc.art ?? '').trim(), String(doc.extra_txt ?? '').trim()].filter(
    (part) => part.length > 0
  );

  return {
    title,
    description: descriptionParts.join(' - '),
    url,
    score: Number(doc.score ?? 0)
  };
}

export class PlaywrightScrapingProvider implements ILyricsSearchProvider {
  private async searchViaSolr(input: SearchLyricsInput): Promise<SearchLyricsOutput> {
    const encodedQuery = encodeURIComponent(input.query);

    const modelResponses = await Promise.all(
      SOLR_MODELS.map(async (model) => {
        const response = await fetch(`${SOLR_BASE_URL}/${model}/?q=${encodedQuery}&wt=json`, {
          method: 'GET',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
          }
        });

        if (!response.ok) {
          return {
            docs: [] as SolrDoc[],
            numFound: 0
          };
        }

        const text = await response.text();
        const parsed = parseSolrPayload(text);
        return {
          docs: parsed.response?.docs ?? [],
          numFound: Number(parsed.response?.numFound ?? 0)
        };
      })
    );

    const dedupedByUrl = new Map<string, ScrapedLyricsSearchResult & { score: number }>();
    let rawTotalResults = 0;

    for (const { docs, numFound } of modelResponses) {
      rawTotalResults = Math.max(rawTotalResults, numFound);

      for (const doc of docs) {
        const mapped = mapSolrDocToResult(doc);
        if (!mapped) {
          continue;
        }

        const existing = dedupedByUrl.get(mapped.url);
        if (!existing || mapped.score > existing.score) {
          dedupedByUrl.set(mapped.url, mapped);
        }
      }
    }

    const ordered = Array.from(dedupedByUrl.values()).sort((left, right) => right.score - left.score);

    const start = (input.page - 1) * MAX_RESULTS_PER_PAGE;
    const end = start + MAX_RESULTS_PER_PAGE;

    const totalPages = Math.min(
      MAX_NAVIGABLE_PAGES,
      Math.ceil(rawTotalResults / MAX_RESULTS_PER_PAGE) || 1
    );

    return {
      results: ordered.slice(start, end).map(({ title, description, url }) => ({
        title,
        description,
        url
      })),
    };
  }

  async searchLyrics(input: SearchLyricsInput): Promise<SearchLyricsOutput> {
    // The first attempt uses Solr; explicit fallback skips Solr and forces browser strategy.
    if (!input.fallback) {
      try {
        const solrOutput = await this.searchViaSolr(input);
        if (solrOutput.results.length > 0) {
          return solrOutput;
        }
      } catch {
        // Falls back to Playwright when Solr is temporarily unavailable.
      }
    }

    const browser = await chromium.launch({ headless: true });

    try {
      const browserPage = await browser.newPage({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
      });

      const searchUrl = buildSearchUrl(input.query);
      await browserPage.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: BROWSER_TIMEOUT_MS
      });

      if (input.fallback) {
        await browserPage.reload({
          waitUntil: 'domcontentloaded',
          timeout: BROWSER_TIMEOUT_MS
        });
      }

      await browserPage.waitForTimeout(1500);

      const htmlSnapshot = await browserPage.content();
      if (hasCaptchaOrBotBlock(htmlSnapshot)) {
        throw new Error('LETRAS_SEARCH_BLOCKED_BY_CAPTCHA');
      }

      try {
        await browserPage.waitForSelector(SEARCH_RESULT_SELECTOR, {
          timeout: SEARCH_WAIT_TIMEOUT_MS
        });
      } catch {
        return {
          results: [],
        };
      }

      if (input.page > 1) {
        for (let targetPage = 2; targetPage <= input.page; targetPage += 1) {
          const targetButton = browserPage.locator(PAGE_BUTTON_SELECTOR).getByText(String(targetPage), { exact: true }).first();

          if ((await targetButton.count()) === 0) {
            return { results: [] };
          }

          try {
            await targetButton.click();
          } catch {
            return { results: [] };
          }

          await browserPage.waitForFunction(
            ({ selector, page }) => {
              const current = document.querySelector<HTMLElement>(`${selector}.gsc-cursor-current-page`);
              const currentPage = current?.textContent?.trim();
              const hasResults = document.querySelectorAll('.gsc-webResult.gsc-result').length > 0;
              return currentPage === String(page) && hasResults;
            },
            { selector: PAGE_BUTTON_SELECTOR, page: targetPage },
            { timeout: SEARCH_WAIT_TIMEOUT_MS }
          );
        }
      }

      const [results, maxVisiblePage] = await Promise.all([
        browserPage.$$eval(SEARCH_RESULT_SELECTOR, (nodes, limit) => {
          return nodes
            .slice(0, limit)
            .map((node) => {
              const titleAnchor = node.querySelector<HTMLAnchorElement>('.gs-title a.gs-title[href]');
              const title = (titleAnchor?.textContent ?? '').trim();
              const description =
                (node.querySelector<HTMLElement>('.gs-snippet')?.textContent ?? '').trim();
              const url = titleAnchor?.href?.trim() ?? '';

              return {
                title,
                description,
                url
              };
            })
            .filter((result) => result.title.length > 0 && result.url.length > 0);
        }, MAX_RESULTS_PER_PAGE),
        browserPage.$$eval(PAGE_BUTTON_SELECTOR, (nodes) => {
          const pages = nodes
            .map((node) => Number.parseInt(node.textContent?.trim() ?? '', 10))
            .filter((value) => Number.isInteger(value) && value > 0);

          return pages.length > 0 ? Math.max(...pages) : 1;
        })
      ]);

      return {
        results,
      };
    } finally {
      await browser.close();
    }
  }
}
