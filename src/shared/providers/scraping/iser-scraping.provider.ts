export type ScrapedLyrics = {
  title: string;
  artist: string;
  stanzas: string[];
};

export interface IScrapingProvider {
  scrapeLyrics(url: URL): Promise<ScrapedLyrics>;
}
