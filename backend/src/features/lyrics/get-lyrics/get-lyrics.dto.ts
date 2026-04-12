export type GetLyricsInputDto = {
  url: string;
};

export type GetLyricsOutputDto = {
  sourceUrl: string;
  title: string;
  artist: string;
  lyrics: string;
  stanzas: string[];
};
