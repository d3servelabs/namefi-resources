import { useEffect, useRef, useState } from 'react';
import type { PendingGalleryItem } from '../gallery-pending-context';
import {
  advanceFinishingProgress,
  computePendingProgress,
  galleryProgressConfig,
} from './gallery-utils';

export const usePendingGenerationProgress = (
  pendingItems: PendingGalleryItem[],
) => {
  const [progressById, setProgressById] = useState<Record<string, number>>({});
  const [finishingById, setFinishingById] = useState<
    Record<string, { startTime: number; startValue: number }>
  >({});

  const progressRef = useRef(progressById);
  const finishingRef = useRef(finishingById);

  useEffect(() => {
    progressRef.current = progressById;
  }, [progressById]);

  useEffect(() => {
    finishingRef.current = finishingById;
  }, [finishingById]);

  useEffect(() => {
    if (pendingItems.length === 0) {
      setProgressById({});
      setFinishingById({});
      return undefined;
    }

    const updateFinishingTargets = () => {
      const now = Date.now();
      // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: reconciles async finishing states while keeping referential stability
      setFinishingById((prevFinishing) => {
        let next = prevFinishing;
        let changed = false;

        for (const pending of pendingItems) {
          if (pending.generation && !next[pending.id]) {
            if (!changed) next = { ...next };
            const currentProgress =
              progressRef.current[pending.id] ??
              computePendingProgress(now - pending.startedAt);
            next[pending.id] = {
              startTime: now,
              startValue: Math.min(99, currentProgress),
            };
            changed = true;
          }
        }

        for (const id of Object.keys(next)) {
          const stillFinishing = pendingItems.some(
            (item) => item.id === id && item.generation,
          );
          if (!stillFinishing) {
            if (!changed) next = { ...next };
            delete next[id];
            changed = true;
          }
        }

        return changed ? next : prevFinishing;
      });
    };

    const runProgressUpdate = () => {
      const now = Date.now();
      const finishedIds: string[] = [];

      // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: combines eased progress values for each pending item
      setProgressById((prevProgress) => {
        const next: Record<string, number> = {};

        for (const pending of pendingItems) {
          const baseProgress = computePendingProgress(now - pending.startedAt);
          const previousValue = prevProgress[pending.id] ?? 0;
          const finishing = finishingRef.current[pending.id];

          let progress = Math.max(baseProgress, previousValue);

          if (finishing) {
            const { value, isComplete } = advanceFinishingProgress(
              finishing,
              now,
            );
            progress = Math.max(progress, value);
            if (isComplete) {
              progress = 100;
              finishedIds.push(pending.id);
            }
          }

          next[pending.id] = Math.min(100, progress);
        }

        return next;
      });

      if (finishedIds.length > 0) {
        // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: cleans up finishing map once items reach 100%
        setFinishingById((prev) => {
          let next = prev;
          let changed = false;
          for (const id of finishedIds) {
            if (next[id]) {
              if (!changed) next = { ...next };
              delete next[id];
              changed = true;
            }
          }
          return changed ? next : prev;
        });
      }
    };

    updateFinishingTargets();
    runProgressUpdate();

    const interval = window.setInterval(() => {
      updateFinishingTargets();
      runProgressUpdate();
    }, galleryProgressConfig.updateIntervalMs);

    return () => {
      window.clearInterval(interval);
    };
  }, [pendingItems]);

  const getProgressValue = (pendingId: string, startedAt?: number) => {
    const fromState = progressRef.current[pendingId];
    if (typeof fromState === 'number') {
      return fromState;
    }
    if (typeof startedAt === 'number') {
      return computePendingProgress(Date.now() - startedAt);
    }
    return 0;
  };

  return { progressById, getProgressValue } as const;
};
