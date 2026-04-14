export type GetLyricsInputDto = {
  q: string;
  page?: number;
};

export type GetLyricsSongDto = {
  title: string;
  description: string;
  url: string;
};

export type GetLyricsOutputDto = {
  songs: GetLyricsSongDto[];
  page: number;
  hasMore: boolean;
  total: number | null;
};
