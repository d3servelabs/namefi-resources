import type { WatchChapter } from './types';

// Recognises lines that begin with a timestamp (mm:ss or hh:mm:ss) optionally
// followed by a separator and a label. YouTube's own chapter rules require
// the first timestamp to be 0:00 and chapters to appear in ascending order;
// we replicate that contract here and silently drop malformed entries.
const TIMESTAMP_LINE_PATTERN =
  /^\s*(?:[-•*]\s*)?(\d{1,2}):(\d{2})(?::(\d{2}))?\s*[-–—:]?\s*(.+?)\s*$/;

function parseTimestampToSeconds(
  hours: string | undefined,
  minutes: string,
  seconds: string,
): number {
  const h = hours ? Number.parseInt(hours, 10) : 0;
  const m = Number.parseInt(minutes, 10);
  const s = Number.parseInt(seconds, 10);
  return h * 3600 + m * 60 + s;
}

export function parseChaptersFromDescription(
  description: string | undefined,
): WatchChapter[] {
  if (!description) return [];

  const chapters: WatchChapter[] = [];
  const lines = description.split('\n');

  for (const line of lines) {
    const match = TIMESTAMP_LINE_PATTERN.exec(line);
    if (!match) continue;
    // Regex order: [_, partA, partB, partC, label]
    // - mm:ss form  → partA=mm, partB=ss, partC=undefined
    // - hh:mm:ss    → partA=hh, partB=mm,  partC=ss
    const [, partA, partB, partC, rawLabel] = match;
    const startSeconds = partC
      ? parseTimestampToSeconds(partA, partB, partC)
      : parseTimestampToSeconds(undefined, partA, partB);
    const label = rawLabel.trim();
    if (!label) continue;
    chapters.push({ startSeconds, label });
  }

  if (chapters.length < 2) return [];
  if (chapters[0].startSeconds !== 0) return [];
  for (let i = 1; i < chapters.length; i += 1) {
    if (chapters[i].startSeconds <= chapters[i - 1].startSeconds) return [];
  }

  return chapters;
}

export function formatChapterTime(totalSeconds: number): string {
  // Floor each component defensively in case a fractional input ever slips
  // through (e.g. from a future API source) — without it, seconds would
  // render as "12.345" instead of "12".
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const mm = String(minutes).padStart(hours > 0 ? 2 : 1, '0');
  const ss = String(seconds).padStart(2, '0');
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}
