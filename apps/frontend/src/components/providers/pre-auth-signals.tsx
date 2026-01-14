'use client';

import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
  useCallback,
  useRef,
  useState,
} from 'react';
import {
  type PreAuthSignal,
  PreAuthSignalSchema,
  cryptoRandomId,
  MAX_ITEMS,
} from '@/lib/pre-auth-signals';
import {
  InteractionLoggingEventName,
  type InteractionLoggingEventAugmentation,
  type AugmentationFor,
  type PartialEventFor,
} from '@/lib/analytics-events';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';

interface PreAuthSignalsContextValue {
  signals: PreAuthSignal[];
  addSignal: (
    signal: Omit<PreAuthSignal, 'id' | 'ts'> &
      Partial<Pick<PreAuthSignal, 'id' | 'ts'>>,
  ) => void;
  clear: () => void;
  stageAugmentation: (
    partialEvent: InteractionLoggingEventAugmentation,
  ) => void;
  consumeAugmentation: <T extends InteractionLoggingEventName>(
    eventName: T,
  ) => PartialEventFor<T> | undefined;
  stagePreAuthAugmentations: () => void;
}

type OneTimeAugmentation = {
  [K in InteractionLoggingEventName]?: AugmentationFor<K>;
};

const PreAuthSignalsContext = createContext<
  PreAuthSignalsContextValue | undefined
>(undefined);

export function usePreAuthSignals(): PreAuthSignalsContextValue {
  const ctx = useContext(PreAuthSignalsContext);
  if (!ctx)
    throw new Error(
      'usePreAuthSignals must be used within PreAuthSignalsProvider',
    );
  return ctx;
}

export function PreAuthSignalsProvider({ children }: PropsWithChildren) {
  // Use in-memory storage instead of localStorage
  const [signals, setSignals] = useState<PreAuthSignal[]>([]);

  const addSignal = useCallback(
    (
      signal: Omit<PreAuthSignal, 'id' | 'ts'> &
        Partial<Pick<PreAuthSignal, 'id' | 'ts'>>,
    ) => {
      // Add defaults for id and ts if not provided
      const completeSignal = {
        ...signal,
        id: signal.id ?? cryptoRandomId(),
        ts: signal.ts ?? Date.now(),
      };

      // Validate incoming signal with zod
      const valid = PreAuthSignalSchema.parse(completeSignal);

      setSignals((prev) => [...prev, valid].slice(-MAX_ITEMS));
    },
    [],
  );

  const clear = useCallback(() => {
    setSignals([]);
  }, []);

  const consumeVoteAttemptSummary = useCallback(() => {
    const domains: NamefiNormalizedDomain[] = [];
    const remaining: PreAuthSignal[] = [];

    for (const item of signals) {
      switch (item.type) {
        case 'unauthenticated_vote_attempt': {
          const d = item.data.domainName;
          if (d) domains.push(d);
          break;
        }
        default:
          remaining.push(item);
      }
    }

    setSignals(remaining);
    return {
      hadUnauthVoteAttempt: domains.length > 0,
      attemptDomains: domains,
    };
  }, [signals]);

  const augmentationsRef = useRef<OneTimeAugmentation>({});

  const stageAugmentation = useCallback(
    (partialEvent: InteractionLoggingEventAugmentation) => {
      switch (partialEvent.name) {
        case InteractionLoggingEventName.Vote:
          if (partialEvent.augmentation) {
            augmentationsRef.current[InteractionLoggingEventName.Vote] =
              partialEvent.augmentation;
          }
          break;
        // Add more cases as events become augmentable
      }
    },
    [],
  );

  const consumeAugmentation = useCallback(
    <T extends InteractionLoggingEventName>(
      eventName: T,
    ): PartialEventFor<T> | undefined => {
      switch (eventName) {
        case InteractionLoggingEventName.Vote: {
          const augmentation =
            augmentationsRef.current[InteractionLoggingEventName.Vote];
          if (augmentation) {
            delete augmentationsRef.current[InteractionLoggingEventName.Vote];
            return { name: eventName, augmentation } as PartialEventFor<T>;
          }
          break;
        }
        // Add more cases as events become augmentable
      }
      return undefined;
    },
    [],
  );

  const stagePreAuthAugmentations = useCallback(() => {
    const voteSummary = consumeVoteAttemptSummary();
    if (voteSummary.hadUnauthVoteAttempt) {
      stageAugmentation({
        name: InteractionLoggingEventName.Vote,
        augmentation: {
          had_unauth_vote_attempt: true,
          attempt_domains: voteSummary.attemptDomains,
        },
      });
    }
  }, [consumeVoteAttemptSummary, stageAugmentation]);

  const value = useMemo<PreAuthSignalsContextValue>(
    () => ({
      signals,
      addSignal,
      clear,
      stageAugmentation,
      consumeAugmentation,
      stagePreAuthAugmentations,
    }),
    [
      signals,
      addSignal,
      clear,
      stageAugmentation,
      consumeAugmentation,
      stagePreAuthAugmentations,
    ],
  );

  return (
    <PreAuthSignalsContext.Provider value={value}>
      {children}
    </PreAuthSignalsContext.Provider>
  );
}
