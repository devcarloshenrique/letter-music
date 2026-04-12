import axios from 'axios';
import { load, type Cheerio } from 'cheerio';
import type { AnyNode } from 'domhandler';
import { AppError } from '../../errors/app-error';
import type { IScrapingProvider, ScrapedLyrics } from './iser-scraping.provider';

function extractParagraphText(paragraph: Cheerio<AnyNode>): string {
  const lines: string[] = [];
  let currentLine = '';

  paragraph.contents().each((_, node) => {
    if (node.type === 'tag' && node.name === 'br') {
      lines.push(currentLine.trim());
      currentLine = '';
      return;
    }

    if (node.type === 'text' && node.data) {
      currentLine += node.data;
    }
  });

  if (currentLine.trim().length > 0) {
    lines.push(currentLine.trim());
  }

  return lines.filter((line) => line.length > 0).join('\n');
}

export class CheerioScrapingProvider implements IScrapingProvider {
  async scrapeLyrics(url: URL): Promise<ScrapedLyrics> {
    const response = await axios.get<string>(url.toString(), {
      timeout: 15_000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
      }
    });

    const $ = load(response.data);
    const title = $('h1').first().text().trim();
    const artist = $('.title-secondary h2').first().text().trim();

    const stanzas = $('.lyric-original p')
      .toArray()
      .map((node) => extractParagraphText($(node)))
      .map((stanza) => stanza.trim())
      .filter((stanza) => stanza.length > 0);

    if (stanzas.length === 0) {
      throw new AppError('Letra não encontrada no HTML da página', 404);
    }

    return {
      title,
      artist,
      stanzas
    };
  }
}
