const PROGRESS_DURATION_MS = 40_000;
const FINISH_DURATION_MS = 900;

const PROGRESS_MESSAGES: Array<{ threshold: number; text: string }> = [
  { threshold: 0, text: 'Gathering inspiration for your brand...' },
  { threshold: 10, text: 'Sketching first strokes and silhouettes...' },
  { threshold: 25, text: 'Blending colors, styles, and fonts...' },
  { threshold: 45, text: 'Adding character and signature details...' },
  { threshold: 65, text: 'Refining lighting and balance...' },
  { threshold: 80, text: 'Polishing highlights and textures...' },
  { threshold: 92, text: 'Framing the final reveal...' },
  { threshold: 99, text: 'Almost ready—hang tight!' },
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

export const getProgressMessage = (value: number) => {
  for (let i = PROGRESS_MESSAGES.length - 1; i >= 0; i -= 1) {
    if (value >= PROGRESS_MESSAGES[i]?.threshold) {
      return PROGRESS_MESSAGES[i]?.text ?? '';
    }
  }
  return PROGRESS_MESSAGES[0]?.text ?? '';
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
