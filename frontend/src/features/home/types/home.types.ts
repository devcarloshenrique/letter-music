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
