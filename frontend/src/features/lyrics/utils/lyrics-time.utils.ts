export function parseSyncedTimeToSeconds(rawTime: string): number {
  const value = Number(rawTime);

  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return value;
}

export function formatSecondsLabel(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(clamped / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (clamped % 60).toString().padStart(2, '0');

  return `${minutes}:${seconds}`;
}

export function formatSyncedTimeLabel(rawTime: string): string {
  return formatSecondsLabel(parseSyncedTimeToSeconds(rawTime));
}

export function extractYouTubeVideoId(url?: string): string | null {
  if (!url) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes('youtu.be')) {
      return parsedUrl.pathname.replace('/', '') || null;
    }

    if (parsedUrl.hostname.includes('youtube.com')) {
      return parsedUrl.searchParams.get('v');
    }

    return null;
  } catch {
    return null;
  }
}