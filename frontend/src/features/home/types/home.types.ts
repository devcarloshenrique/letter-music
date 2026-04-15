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
  title: string;
  description: string;
  url: string;
};

export type SearchLyricsMetadata = {
  page: number;
  pageSize: number;
  totalPages: number;
  totalResults?: number | null;
  hasMore?: boolean;
  isEstimated?: boolean;
  timestamp?: string;
  path?: string;
};

export type SearchLyricsSuccessResponse = {
  success: true;
  message: string;
  data: SearchLyricsSong[];
  metadata: SearchLyricsMetadata;
};
