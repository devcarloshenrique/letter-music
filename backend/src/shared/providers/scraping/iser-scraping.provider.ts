export type ScrapedLyrics = {
  title: string;
  artist: string;
  stanzas: string[];
};

export type ScrapedLyricsSearchResult = {
  title: string;
  description: string;
  url: string;
};

export type SearchLyricsInput = {
  query: string;
  page: number;
  fallback?: boolean;
};

export type SearchLyricsOutput = {
  results: ScrapedLyricsSearchResult[];
};

export interface IScrapingProvider {
  scrapeLyrics(url: URL): Promise<ScrapedLyrics>;
}

export interface ILyricsSearchProvider {
  searchLyrics(input: SearchLyricsInput): Promise<SearchLyricsOutput>;
}
