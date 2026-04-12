export type SyncedLyricLineDto = {
  start: string;
  end: string;
  text: string;
};

export type SyncedLyricsHiddenMetaDto = {
  song_id: string;
  video_id: string;
  subtitle_id: string;
};

export type GetSyncedLyricsInputDto = {
  url: string;
};

export type GetSyncedLyricsOutputDto = {
  lines: SyncedLyricLineDto[];
  video_url?: string;
  hidden: SyncedLyricsHiddenMetaDto | null;
};
