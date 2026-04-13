export function parseSyncedTimeToSeconds(rawTime: string): number {
  const normalized = String(rawTime ?? '').trim();

  if (!normalized) {
    return 0;
  }

  // Fast path: API already returns raw seconds as a number string (e.g. "102.4")
  const numericValue = Number(normalized);
  if (Number.isFinite(numericValue) && numericValue >= 0) {
    return numericValue;
  }

  // Fallback: supports "mm:ss" and "hh:mm:ss" (with optional decimals in seconds)
  const parts = normalized.split(':').map((part) => Number(part));
  if (parts.some((part) => !Number.isFinite(part) || part < 0)) {
    return 0;
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }

  return 0;
}

export function formatSecondsLabel(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const minutes = Math.floor(clamped / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (clamped % 60).toFixed(1).padStart(4, '0');

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