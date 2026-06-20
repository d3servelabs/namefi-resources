const PROGRESS_DURATION_MS = 40_000;
const FINISH_DURATION_MS = 900;

export type ProgressMessageKey =
  | 'gathering'
  | 'sketching'
  | 'blending'
  | 'character'
  | 'lighting'
  | 'polishing'
  | 'framing'
  | 'almost';

const PROGRESS_MESSAGES: ReadonlyArray<{
  threshold: number;
  key: ProgressMessageKey;
}> = [
  { threshold: 0, key: 'gathering' },
  { threshold: 10, key: 'sketching' },
  { threshold: 25, key: 'blending' },
  { threshold: 45, key: 'character' },
  { threshold: 65, key: 'lighting' },
  { threshold: 80, key: 'polishing' },
  { threshold: 92, key: 'framing' },
  { threshold: 99, key: 'almost' },
];

const smoothstep = (t: number) =>
  t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);

const easeOutCubic = (t: number) =>
  t <= 0 ? 0 : t >= 1 ? 1 : 1 - (1 - t) ** 3;

export const galleryProgressConfig = {
  progressDurationMs: PROGRESS_DURATION_MS,
  finishDurationMs: FINISH_DURATION_MS,
  updateIntervalMs: 120,
} as const;

export const computePendingProgress = (elapsedMs: number) => {
  if (elapsedMs <= 0) return 0;
  const normalized = elapsedMs / PROGRESS_DURATION_MS;

  if (normalized <= 1) {
    const eased = smoothstep(normalized);
    return Math.min(95, eased * 92 + normalized * 3);
  }

  const extra = normalized - 1;
  const tail = 95 + (1 - Math.exp(-extra * 0.5)) * 4;
  return Math.min(99.2, tail);
};

export const getProgressMessageKey = (value: number): ProgressMessageKey => {
  for (let i = PROGRESS_MESSAGES.length - 1; i >= 0; i -= 1) {
    const entry = PROGRESS_MESSAGES[i];
    if (entry && value >= entry.threshold) {
      return entry.key;
    }
  }
  return PROGRESS_MESSAGES[0]?.key ?? 'gathering';
};

export const buildGenerationShareUrl = (id: string) => {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/studio/${id}`;
};

export const downloadImageFromUrl = async (url: string, filename: string) => {
  if (!url || typeof window === 'undefined') return;

  const response = await fetch(url);
  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.style.display = 'none';
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  window.URL.revokeObjectURL(objectUrl);
  document.body.removeChild(anchor);
};

type FinishingEntry = {
  startTime: number;
  startValue: number;
};

export const advanceFinishingProgress = (
  entry: FinishingEntry,
  now: number,
) => {
  const elapsedFinish = now - entry.startTime;
  const t = Math.min(1, elapsedFinish / FINISH_DURATION_MS);
  const eased = easeOutCubic(t);
  return {
    value: Math.max(
      entry.startValue,
      entry.startValue + (100 - entry.startValue) * eased,
    ),
    isComplete: t >= 1,
  } as const;
};
