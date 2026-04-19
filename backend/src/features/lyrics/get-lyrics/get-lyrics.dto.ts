export type GetLyricsInputDto = {
  q: string;
  page?: number;
};

export type GetLyricsSongDto = {
  id: string;
  title: string;
  artist: string;
  preview: string;
  url: string;
};

export type GetLyricsOutputDto = {
  songs: GetLyricsSongDto[];
  page: number;
  pageSize: number;
  totalPages: number;
  skipped: number[];
};
