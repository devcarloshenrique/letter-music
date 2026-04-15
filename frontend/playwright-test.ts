import { PlaywrightScrapingProvider } from './src/shared/providers/scraping/playwright-scraping.provider';
const p = new PlaywrightScrapingProvider();
p.searchLyrics({ query: "eminem", page: 3, fallback: true }).then(r => console.log('success!', r.results.length)).catch(e => console.error('FAILED!', e));
