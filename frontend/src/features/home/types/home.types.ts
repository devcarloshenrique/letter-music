export type SyncedLine = {
  start: string;
  end: string;
  text: string;
};

export type SyncedLyricsData = {
  video_url?: string;
  lines: SyncedLine[];
};

export type SyncedLyricsSuccessResponse = {
  success: true;
  message: string;
  data: SyncedLyricsData;
};

export type ApiErrorResponse = {
  success?: false;
  error?: {
    code?: string;
    message?: string;
  };
  message?: string;
};

export type SearchLyricsSong = {
  id: string;
  title: string;
  artist: string;
  preview: string;
  url: string;
};

export type SearchLyricsPagination = {
  current: number;
  skipped: number[];
  count: number;
  next: number | null;
  prev: number | null;
  hasMore: boolean;
};

export type SearchLyricsRequestInfo = {
  query: string;
  timestamp: string;
};

export type SearchLyricsSuccessResponse = {
  success: true;
  message: string;
  request: SearchLyricsRequestInfo;
  results: SearchLyricsSong[];
  pagination: SearchLyricsPagination;
};
